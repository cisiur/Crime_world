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
  runAfterClockAdvanceStage,
  runAfterSystemsStage,
  runBeforeTickStage,
  runSimulationTickPipeline,
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
      tickNumber: state.clock.currentTick,
    });

    expect(runBeforeTickStage(state, context)).toBe(state);
    expect(runAfterClockAdvanceStage(state, context)).toBe(state);
    expect(runAfterSystemsStage(state, context)).toBe(state);
    expect(runSimulationTickPipeline(context)).toBe(state);
  });

  it("creates immutable SimulationTickContext values", () => {
    const state = createRunningGameState();
    const command = createAdvanceSimulationTickCommand();
    const context = createSimulationTickContext({
      gameState: state,
      command,
      tickNumber: state.clock.currentTick,
    });

    expect(context).toEqual({
      gameState: state,
      command,
      tickNumber: state.clock.currentTick,
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
