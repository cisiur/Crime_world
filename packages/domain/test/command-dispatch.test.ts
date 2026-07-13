import { describe, expect, it } from "vitest";

import {
  DomainErrorCode,
  DomainCommandType,
  createInitialGameState,
  createDomainExecution,
  createResumeSimulationCommand,
  dispatchCommand,
  failure,
  parseGameState,
  resumeSimulationClock,
  success,
} from "../src/index";
import type { DomainCommand } from "../src/index";

function createTestGameState() {
  return createInitialGameState({
    campaignId: "campaign:test",
    randomSeed: 123,
  });
}

describe("domain result", () => {
  it("creates success results", () => {
    const state = createTestGameState();

    expect(success(state)).toEqual({
      ok: true,
      value: state,
    });
  });

  it("creates failure results", () => {
    const error = {
      code: DomainErrorCode.UnsupportedCommand,
      message: "Unsupported command: Unknown.",
    };

    expect(failure(error)).toEqual({
      ok: false,
      error,
    });
  });
});

describe("command dispatch", () => {
  it("creates immutable ResumeSimulationCommand DTOs", () => {
    const command = createResumeSimulationCommand();

    expect(command).toEqual({
      type: DomainCommandType.ResumeSimulation,
    });
    expect(Object.isFrozen(command)).toBe(true);
  });

  it("dispatches ResumeSimulationCommand and returns success", () => {
    const state = createTestGameState();
    const result = dispatchCommand(state, createResumeSimulationCommand());

    expect(result.ok).toBe(true);
  });

  it("resumes a paused GameState without mutating input", () => {
    const state = createTestGameState();
    const result = dispatchCommand(state, createResumeSimulationCommand());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected success");
    }

    expect(state.clock.paused).toBe(true);
    expect(result.value.gameState.clock.paused).toBe(false);
    expect(result.value.gameState.clock).toEqual(resumeSimulationClock(state.clock));
    expect(result.value.gameState.randomState).toEqual(state.randomState);
    expect(result.value.gameState).not.toBe(state);
    expect(Object.isFrozen(result.value.gameState)).toBe(true);
    expect(Object.isFrozen(result.value.gameState.clock)).toBe(true);
    expect(Object.isFrozen(result.value.gameState.randomState)).toBe(true);
  });

  it("returns unchanged GameState when already running", () => {
    const pausedState = createTestGameState();
    const runningState = parseGameState({
      ...pausedState,
      clock: resumeSimulationClock(pausedState.clock),
    });
    const result = dispatchCommand(runningState, createResumeSimulationCommand());

    expect(result).toEqual(success(createDomainExecution(runningState, [])));
    if (!result.ok) {
      throw new Error("expected success");
    }
    expect(result.value.gameState).toBe(runningState);
    expect(result.value.events).toEqual([]);
  });

  it("returns failure for unsupported runtime command objects", () => {
    const state = createTestGameState();
    const unsupportedCommand = {
      type: "UnsupportedCommand",
    } as unknown as DomainCommand;
    const result = dispatchCommand(state, unsupportedCommand);

    expect(result).toEqual({
      ok: false,
      error: {
        code: DomainErrorCode.UnsupportedCommand,
        message: "Unsupported command: UnsupportedCommand.",
      },
    });
  });

  it("keeps the dispatcher switch exhaustive for the current command union", () => {
    function expectKnownCommand(command: DomainCommand) {
      const commandType = command.type;

      switch (commandType) {
        case DomainCommandType.AdvanceSimulationTick:
          expect(command.type).toBe(DomainCommandType.AdvanceSimulationTick);
          break;
        case DomainCommandType.ResumeSimulation:
          expect(command).toEqual(createResumeSimulationCommand());
          break;
        default: {
          const exhaustiveCommandType: never = commandType;
          void exhaustiveCommandType;
        }
      }
    }

    expectKnownCommand(createResumeSimulationCommand());
  });
});
