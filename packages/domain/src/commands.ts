import { parseGameState, type GameState } from "./gameState";
import { advanceSimulationClockOneTick, resumeSimulationClock } from "./simulationClock";
import { createSimulationTickContext, runSimulationTickPipeline } from "./simulationTickPipeline";
import {
  DomainErrorCode,
  failure,
  success,
  type DomainError,
  type DomainResult,
} from "./domainResult";

declare const commandBrand: unique symbol;

export const DomainCommandType = {
  AdvanceSimulationTick: "AdvanceSimulationTick",
  ResumeSimulation: "ResumeSimulation",
} as const;

export type DomainCommandType = (typeof DomainCommandType)[keyof typeof DomainCommandType];

export interface ResumeSimulationCommand {
  readonly type: typeof DomainCommandType.ResumeSimulation;
  readonly [commandBrand]: "ResumeSimulationCommand";
}

export interface AdvanceSimulationTickCommand {
  readonly type: typeof DomainCommandType.AdvanceSimulationTick;
  readonly [commandBrand]: "AdvanceSimulationTickCommand";
}

export type DomainCommand = AdvanceSimulationTickCommand | ResumeSimulationCommand;

export function createAdvanceSimulationTickCommand(): AdvanceSimulationTickCommand {
  return Object.freeze({
    type: DomainCommandType.AdvanceSimulationTick,
  }) as AdvanceSimulationTickCommand;
}

export function createResumeSimulationCommand(): ResumeSimulationCommand {
  return Object.freeze({
    type: DomainCommandType.ResumeSimulation,
  }) as ResumeSimulationCommand;
}

export function dispatchCommand(state: GameState, command: DomainCommand): DomainResult<GameState> {
  const commandType = command.type;

  switch (commandType) {
    case DomainCommandType.AdvanceSimulationTick:
      return handleAdvanceSimulationTickCommand(state, command);
    case DomainCommandType.ResumeSimulation:
      return handleResumeSimulationCommand(state, command);
    default: {
      const exhaustiveCommandType: never = commandType;
      void exhaustiveCommandType;

      return failure(createUnsupportedCommandError(getCommandType(command)));
    }
  }
}

function handleAdvanceSimulationTickCommand(
  state: GameState,
  command: AdvanceSimulationTickCommand,
): DomainResult<GameState> {
  if (state.clock.paused) {
    return failure({
      code: DomainErrorCode.SimulationPaused,
      message: "Cannot advance simulation while the clock is paused.",
    });
  }

  const gameStateAfterClockAdvance = parseGameState({
    ...state,
    clock: advanceSimulationClockOneTick(state.clock),
  });
  const context = createSimulationTickContext({
    gameState: gameStateAfterClockAdvance,
    command,
    tickNumber: gameStateAfterClockAdvance.clock.currentTick,
  });

  return success(runSimulationTickPipeline(context));
}

function handleResumeSimulationCommand(
  state: GameState,
  command: ResumeSimulationCommand,
): DomainResult<GameState> {
  void command;

  if (!state.clock.paused) {
    return success(state);
  }

  return success(
    parseGameState({
      ...state,
      clock: resumeSimulationClock(state.clock),
    }),
  );
}

function createUnsupportedCommandError(commandType: unknown): DomainError {
  return {
    code: DomainErrorCode.UnsupportedCommand,
    message: `Unsupported command: ${String(commandType)}.`,
  };
}

function getCommandType(command: DomainCommand): unknown {
  return (command as { readonly type?: unknown }).type;
}
