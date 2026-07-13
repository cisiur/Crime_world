import { describe, expect, it } from "vitest";

import {
  DomainCommandType,
  DomainErrorCode,
  MINUTES_PER_TICK,
  SIMULATION_TICK_PIPELINE_STAGES,
  SimulationTickPipelineStage,
  createAdvanceSimulationTickCommand,
  createInitialGameState,
  createResumeSimulationCommand,
  createSimulationTickContext,
  dispatchCommand,
  parseSimulationTick,
  runAfterClockAdvanceStage,
  runAfterSystemsStage,
  runBeforeTickStage,
  runSimulationTickPipeline,
} from "../src/index";
import type {
  GameState,
  SimulationTickPipelineStage as SimulationTickPipelineStageName,
} from "../src/index";

function createTestGameState() {
  return createInitialGameState({
    campaignId: "campaign:test",
    randomSeed: 123,
  });
}

function createRunningGameState() {
  const resumeResult = dispatchCommand(createTestGameState(), createResumeSimulationCommand());

  if (!resumeResult.ok) {
    throw new Error("expected resume command to succeed");
  }

  return resumeResult.value;
}

describe("simulation tick pipeline", () => {
  it("creates immutable AdvanceSimulationTickCommand DTOs", () => {
    const command = createAdvanceSimulationTickCommand();

    expect(command).toEqual({
      type: DomainCommandType.AdvanceSimulationTick,
    });
    expect(Object.isFrozen(command)).toBe(true);
  });

  it("dispatches AdvanceSimulationTickCommand", () => {
    const result = dispatchCommand(createRunningGameState(), createAdvanceSimulationTickCommand());

    expect(result.ok).toBe(true);
  });

  it("returns SIMULATION_PAUSED failure for paused simulations", () => {
    const result = dispatchCommand(createTestGameState(), createAdvanceSimulationTickCommand());

    expect(result).toEqual({
      ok: false,
      error: {
        code: DomainErrorCode.SimulationPaused,
        message: "Cannot advance simulation while the clock is paused.",
      },
    });
  });

  it("advances a running simulation by exactly one tick and ten minutes", () => {
    const state = createRunningGameState();
    const result = dispatchCommand(state, createAdvanceSimulationTickCommand());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected success");
    }

    expect(result.value.clock.currentTick).toBe(state.clock.currentTick + 1);
    expect(result.value.clock.currentMinute).toBe(state.clock.currentMinute + MINUTES_PER_TICK);
    expect(result.value.clock.paused).toBe(false);
    expect(result.value.clock.speed).toBe(state.clock.speed);
    expect(result.value.randomState).toEqual(state.randomState);
    expect(result.value).not.toBe(state);
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.clock)).toBe(true);
    expect(Object.isFrozen(result.value.randomState)).toBe(true);
  });

  it("executes pipeline stages in the exact accepted order", () => {
    expect([...SIMULATION_TICK_PIPELINE_STAGES]).toEqual([
      SimulationTickPipelineStage.BeforeTick,
      SimulationTickPipelineStage.AfterClockAdvance,
      SimulationTickPipelineStage.AfterSystems,
    ]);
  });

  it("keeps current no-op stages from changing GameState", () => {
    const state = createRunningGameState();
    const command = createAdvanceSimulationTickCommand();
    const context = createSimulationTickContext({
      gameState: state,
      command,
      tickNumber: parseSimulationTick(state.clock.currentTick + 1),
    });

    expect(runBeforeTickStage(state, context)).toBe(state);
    expect(runAfterClockAdvanceStage(state, context)).toBe(state);
    expect(runAfterSystemsStage(state, context)).toBe(state);
  });

  it("runs stages around exactly one clock advance using the real pipeline behavior", () => {
    const state = createRunningGameState();
    const command = createAdvanceSimulationTickCommand();
    const context = createSimulationTickContext({
      gameState: state,
      command,
      tickNumber: parseSimulationTick(state.clock.currentTick + 1),
    });
    const observations: Array<{
      readonly stage: SimulationTickPipelineStageName;
      readonly gameState: GameState;
    }> = [];

    const result = runSimulationTickPipeline(context, {
      observeStage: (stage, observedState) => {
        observations.push({
          stage,
          gameState: observedState,
        });
      },
    });

    expect(observations.map((observation) => observation.stage)).toEqual([
      SimulationTickPipelineStage.BeforeTick,
      SimulationTickPipelineStage.AfterClockAdvance,
      SimulationTickPipelineStage.AfterSystems,
    ]);

    const beforeTickObservation = observations[0];
    const afterClockAdvanceObservation = observations[1];
    const afterSystemsObservation = observations[2];

    expect(beforeTickObservation?.gameState).toBe(state);
    expect(beforeTickObservation?.gameState.clock.currentTick).toBe(state.clock.currentTick);
    expect(beforeTickObservation?.gameState.clock.currentMinute).toBe(state.clock.currentMinute);

    expect(afterClockAdvanceObservation?.gameState).not.toBe(state);
    expect(afterClockAdvanceObservation?.gameState.clock.currentTick).toBe(
      state.clock.currentTick + 1,
    );
    expect(afterClockAdvanceObservation?.gameState.clock.currentMinute).toBe(
      state.clock.currentMinute + MINUTES_PER_TICK,
    );

    expect(afterSystemsObservation?.gameState).toBe(afterClockAdvanceObservation?.gameState);
    expect(result).toBe(afterSystemsObservation?.gameState);
    expect(result.clock.currentTick).toBe(state.clock.currentTick + 1);
    expect(result.clock.currentMinute).toBe(state.clock.currentMinute + MINUTES_PER_TICK);
    expect(result.clock.paused).toBe(false);
    expect(result.clock.speed).toBe(state.clock.speed);
    expect(result.randomState).toEqual(state.randomState);

    expect(state.clock.currentTick).toBe(0);
    expect(state.clock.currentMinute).toBe(0);
    expect(state.clock.paused).toBe(false);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.clock)).toBe(true);
    expect(Object.isFrozen(result.randomState)).toBe(true);
  });

  it("creates immutable SimulationTickContext values", () => {
    const state = createRunningGameState();
    const command = createAdvanceSimulationTickCommand();
    const context = createSimulationTickContext({
      gameState: state,
      command,
      tickNumber: parseSimulationTick(state.clock.currentTick + 1),
    });

    expect(context).toEqual({
      gameState: state,
      command,
      tickNumber: parseSimulationTick(state.clock.currentTick + 1),
    });
    expect(Object.isFrozen(context)).toBe(true);
  });

  it("still supports ResumeSimulationCommand", () => {
    const state = createTestGameState();
    const result = dispatchCommand(state, createResumeSimulationCommand());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected success");
    }
    expect(result.value.clock.paused).toBe(false);
  });
});
