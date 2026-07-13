import { describe, expect, it } from "vitest";

import {
  DomainEventType,
  InvariantViolationError,
  MINUTES_PER_TICK,
  SimulationSpeed,
  assertDomainEventInvariant,
  assertDomainExecutionInvariant,
  assertGameStateInvariant,
  assertRandomStateInvariant,
  assertSimulationClockInvariant,
  createAdvanceSimulationTickCommand,
  createDomainExecution,
  createInitialGameState,
  createResumeSimulationCommand,
  dispatchCommand,
  parseSimulationMinute,
  parseSimulationTick,
} from "../src/index";
import type {
  DomainEvent,
  DomainExecution,
  GameState,
  RandomState,
  SimulationClockState,
} from "../src/index";

function createTestGameState() {
  return createInitialGameState({
    campaignId: "campaign:invariants",
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

function createTickExecution() {
  const result = dispatchCommand(createRunningGameState(), createAdvanceSimulationTickCommand());

  if (!result.ok) {
    throw new Error("expected tick command to succeed");
  }

  return result.value;
}

describe("invariant validation helpers", () => {
  it("accepts a valid simulation clock", () => {
    expect(() => assertSimulationClockInvariant(createTestGameState().clock)).not.toThrow();
  });

  it("rejects a broken minute/tick relation", () => {
    const clock = {
      ...createTestGameState().clock,
      currentMinute: parseSimulationMinute(10),
    };

    expect(() => assertSimulationClockInvariant(clock)).toThrow(InvariantViolationError);
  });

  it("rejects negative minute and tick values", () => {
    const validClock = createTestGameState().clock;
    const negativeMinuteClock = {
      ...validClock,
      currentMinute: -1,
    } as unknown as SimulationClockState;
    const negativeTickClock = {
      ...validClock,
      currentTick: -1,
    } as unknown as SimulationClockState;

    expect(() => assertSimulationClockInvariant(negativeMinuteClock)).toThrow(
      InvariantViolationError,
    );
    expect(() => assertSimulationClockInvariant(negativeTickClock)).toThrow(
      InvariantViolationError,
    );
  });

  it("rejects invalid speed values", () => {
    const clock = {
      ...createTestGameState().clock,
      speed: "Paused",
    } as unknown as SimulationClockState;

    expect(() => assertSimulationClockInvariant(clock)).toThrow(InvariantViolationError);
  });

  it("rejects broken RandomState values, NaN, and Infinity", () => {
    const randomState = createTestGameState().randomState;
    const brokenRandomState = {
      ...randomState,
      incrementLow: 2,
    } as RandomState;
    const nanRandomState = {
      ...randomState,
      stateHigh: Number.NaN,
    } as RandomState;
    const infiniteRandomState = {
      ...randomState,
      stateLow: Number.POSITIVE_INFINITY,
    } as RandomState;

    expect(() => assertRandomStateInvariant(brokenRandomState)).toThrow(InvariantViolationError);
    expect(() => assertRandomStateInvariant(nanRandomState)).toThrow(InvariantViolationError);
    expect(() => assertRandomStateInvariant(infiniteRandomState)).toThrow(InvariantViolationError);
  });

  it("accepts valid GameState and rejects broken GameState", () => {
    const gameState = createTestGameState();
    const brokenGameState = {
      ...gameState,
      campaignId: "campaign invariant",
    } as GameState;

    expect(() => assertGameStateInvariant(gameState)).not.toThrow();
    expect(() => assertGameStateInvariant(brokenGameState)).toThrow(InvariantViolationError);
  });

  it("accepts valid DomainExecution", () => {
    expect(() => assertDomainExecutionInvariant(createTickExecution())).not.toThrow();
  });

  it("rejects broken DomainExecution events", () => {
    const execution = createTickExecution();
    const brokenExecution = createDomainExecution(execution.gameState, [
      {
        type: "UnsupportedEvent",
      } as unknown as DomainEvent,
    ]);

    expect(() => assertDomainExecutionInvariant(brokenExecution)).toThrow(InvariantViolationError);
  });

  it("rejects non-frozen event arrays and non-frozen events", () => {
    const execution = createTickExecution();
    const nonFrozenEventArrayExecution = {
      ...execution,
      events: [...execution.events],
    } as DomainExecution;
    const nonFrozenEventExecution = {
      ...execution,
      events: Object.freeze([{ ...execution.events[0] } as DomainEvent]),
    } as DomainExecution;

    expect(() => assertDomainExecutionInvariant(nonFrozenEventArrayExecution)).toThrow(
      InvariantViolationError,
    );
    expect(() => assertDomainExecutionInvariant(nonFrozenEventExecution)).toThrow(
      InvariantViolationError,
    );
  });

  it("rejects SimulationTickAdvanced events with invalid progression", () => {
    const invalidEvent = Object.freeze({
      type: DomainEventType.SimulationTickAdvanced,
      previousTick: parseSimulationTick(1),
      currentTick: parseSimulationTick(3),
      previousMinute: parseSimulationMinute(10),
      currentMinute: parseSimulationMinute(30),
    }) as DomainEvent;

    expect(() => assertDomainEventInvariant(invalidEvent)).toThrow(InvariantViolationError);
  });

  it("rejects SimulationResumed events with invalid values", () => {
    const invalidEvent = Object.freeze({
      type: DomainEventType.SimulationResumed,
      tick: -1,
      minute: parseSimulationMinute(0),
    }) as unknown as DomainEvent;

    expect(() => assertDomainEventInvariant(invalidEvent)).toThrow(InvariantViolationError);
  });

  it("includes readable invariant information in errors", () => {
    const clock = {
      ...createTestGameState().clock,
      speed: "Turbo",
    } as unknown as SimulationClockState;

    try {
      assertSimulationClockInvariant(clock);
      throw new Error("expected invariant violation");
    } catch (error) {
      expect(error).toBeInstanceOf(InvariantViolationError);
      expect((error as InvariantViolationError).invariantName).toBe("SimulationClock.speed");
      expect((error as InvariantViolationError).description).toContain("speed");
      expect((error as Error).message).toContain("SimulationClock.speed");
    }
  });

  it("never mutates input values", () => {
    const gameState = createRunningGameState();
    const execution = createDomainExecution(gameState, [
      Object.freeze({
        type: DomainEventType.SimulationTickAdvanced,
        previousTick: parseSimulationTick(0),
        currentTick: parseSimulationTick(1),
        previousMinute: parseSimulationMinute(0),
        currentMinute: parseSimulationMinute(MINUTES_PER_TICK),
      }) as DomainEvent,
    ]);
    const gameStateSnapshot = JSON.parse(JSON.stringify(gameState));
    const executionSnapshot = JSON.parse(JSON.stringify(execution));

    assertGameStateInvariant(gameState);
    assertDomainExecutionInvariant(execution);

    expect(JSON.parse(JSON.stringify(gameState))).toEqual(gameStateSnapshot);
    expect(JSON.parse(JSON.stringify(execution))).toEqual(executionSnapshot);
    expect(gameState.clock.speed).toBe(SimulationSpeed.Normal);
  });
});
