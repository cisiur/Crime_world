import { describe, expect, it } from "vitest";

import {
  DomainErrorCode,
  DomainEventType,
  MINUTES_PER_TICK,
  createAdvanceSimulationTickCommand,
  createDomainExecution,
  createInitialGameState,
  createResumeSimulationCommand,
  createSimulationResumedEvent,
  createSimulationTickAdvancedEvent,
  dispatchCommand,
} from "../src/index";
import type { DomainEvent } from "../src/index";

function createTestGameState() {
  return createInitialGameState({
    campaignId: "campaign:test",
    randomSeed: 123,
  });
}

function createRunningGameState() {
  const result = dispatchCommand(createTestGameState(), createResumeSimulationCommand());

  if (!result.ok) {
    throw new Error("expected resume command to succeed");
  }

  return result.value.gameState;
}

describe("domain event collection", () => {
  it("returns DomainExecution for paused resume with a SimulationResumed event", () => {
    const state = createTestGameState();
    const result = dispatchCommand(state, createResumeSimulationCommand());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected success");
    }

    expect(result.value.gameState).not.toBe(state);
    expect(result.value.gameState.clock.paused).toBe(false);
    expect(result.value.gameState.randomState).toEqual(state.randomState);
    expect(result.value.events).toEqual([
      {
        type: DomainEventType.SimulationResumed,
        tick: result.value.gameState.clock.currentTick,
        minute: result.value.gameState.clock.currentMinute,
      },
    ]);
    expect(result.value.events).toHaveLength(1);
    expect(result.value.events[0]?.type).toBe(DomainEventType.SimulationResumed);
    expect(result.value.events[0]).toEqual(
      createSimulationResumedEvent(
        result.value.gameState.clock.currentTick,
        result.value.gameState.clock.currentMinute,
      ),
    );
  });

  it("returns the same GameState and no events when resuming an already running simulation", () => {
    const runningState = createRunningGameState();
    const result = dispatchCommand(runningState, createResumeSimulationCommand());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected success");
    }

    expect(result.value.gameState).toBe(runningState);
    expect(result.value.events).toEqual([]);
    expect(Object.isFrozen(result.value.events)).toBe(true);
  });

  it("emits one SimulationTickAdvanced event for a successful tick", () => {
    const state = createRunningGameState();
    const result = dispatchCommand(state, createAdvanceSimulationTickCommand());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected success");
    }

    expect(result.value.events).toHaveLength(1);
    expect(result.value.events[0]).toEqual({
      type: DomainEventType.SimulationTickAdvanced,
      previousTick: state.clock.currentTick,
      currentTick: result.value.gameState.clock.currentTick,
      previousMinute: state.clock.currentMinute,
      currentMinute: result.value.gameState.clock.currentMinute,
    });
    expect(result.value.events[0]).toEqual(
      createSimulationTickAdvancedEvent({
        previousTick: state.clock.currentTick,
        currentTick: result.value.gameState.clock.currentTick,
        previousMinute: state.clock.currentMinute,
        currentMinute: result.value.gameState.clock.currentMinute,
      }),
    );
    expect(result.value.gameState.clock.currentTick).toBe(state.clock.currentTick + 1);
    expect(result.value.gameState.clock.currentMinute).toBe(
      state.clock.currentMinute + MINUTES_PER_TICK,
    );
    expect(result.value.gameState.randomState).toEqual(state.randomState);
  });

  it("keeps tick event values aligned with the actual resulting GameState", () => {
    const state = createRunningGameState();
    const result = dispatchCommand(state, createAdvanceSimulationTickCommand());

    if (!result.ok) {
      throw new Error("expected success");
    }

    const event = result.value.events[0];

    expect(event?.type).toBe(DomainEventType.SimulationTickAdvanced);
    if (event?.type !== DomainEventType.SimulationTickAdvanced) {
      throw new Error("expected SimulationTickAdvanced event");
    }

    expect(event.previousTick).toBe(state.clock.currentTick);
    expect(event.currentTick).toBe(result.value.gameState.clock.currentTick);
    expect(event.previousMinute).toBe(state.clock.currentMinute);
    expect(event.currentMinute).toBe(result.value.gameState.clock.currentMinute);
  });

  it("returns failure without advancing state or emitting events when ticking while paused", () => {
    const state = createTestGameState();
    const result = dispatchCommand(state, createAdvanceSimulationTickCommand());

    expect(result).toEqual({
      ok: false,
      error: {
        code: DomainErrorCode.SimulationPaused,
        message: "Cannot advance simulation while the clock is paused.",
      },
    });
    expect(state.clock.currentTick).toBe(0);
    expect(state.clock.currentMinute).toBe(0);
    expect(state.clock.paused).toBe(true);
  });

  it("returns immutable execution results and immutable event values", () => {
    const result = dispatchCommand(createTestGameState(), createResumeSimulationCommand());

    if (!result.ok) {
      throw new Error("expected success");
    }

    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.events)).toBe(true);
    expect(Object.isFrozen(result.value.events[0])).toBe(true);
  });

  it("copies event arrays without mutating caller-provided arrays and preserves order", () => {
    const state = createRunningGameState();
    const firstEvent = createSimulationResumedEvent(
      state.clock.currentTick,
      state.clock.currentMinute,
    );
    const secondEvent = createSimulationTickAdvancedEvent({
      previousTick: state.clock.currentTick,
      currentTick: state.clock.currentTick,
      previousMinute: state.clock.currentMinute,
      currentMinute: state.clock.currentMinute,
    });
    const events: DomainEvent[] = [firstEvent];
    const execution = createDomainExecution(state, events);

    events.push(secondEvent);

    expect(execution.events).toEqual([firstEvent]);
    expect(events).toEqual([firstEvent, secondEvent]);
    expect(createDomainExecution(state, [firstEvent, secondEvent]).events).toEqual([
      firstEvent,
      secondEvent,
    ]);
  });

  it("serializes DomainExecution and events as plain JSON-safe data", () => {
    const result = dispatchCommand(createRunningGameState(), createAdvanceSimulationTickCommand());

    if (!result.ok) {
      throw new Error("expected success");
    }

    expect(JSON.parse(JSON.stringify(result.value))).toEqual({
      gameState: JSON.parse(JSON.stringify(result.value.gameState)),
      events: JSON.parse(JSON.stringify(result.value.events)),
    });
  });

  it("does not mutate the input GameState while collecting events", () => {
    const state = createRunningGameState();
    const snapshot = JSON.parse(JSON.stringify(state));

    const result = dispatchCommand(state, createAdvanceSimulationTickCommand());

    expect(result.ok).toBe(true);
    expect(JSON.parse(JSON.stringify(state))).toEqual(snapshot);
  });
});
