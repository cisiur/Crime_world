import { parseGameState, type GameState } from "./gameState";
import { resumeSimulationClock } from "./simulationClock";
import {
  DomainErrorCode,
  failure,
  success,
  type DomainError,
  type DomainResult,
} from "./domainResult";

declare const commandBrand: unique symbol;

export const DomainCommandType = {
  ResumeSimulation: "ResumeSimulation",
} as const;

export type DomainCommandType = (typeof DomainCommandType)[keyof typeof DomainCommandType];

export interface ResumeSimulationCommand {
  readonly type: typeof DomainCommandType.ResumeSimulation;
  readonly [commandBrand]: "ResumeSimulationCommand";
}

export type DomainCommand = ResumeSimulationCommand;

export function createResumeSimulationCommand(): ResumeSimulationCommand {
  return Object.freeze({
    type: DomainCommandType.ResumeSimulation,
  }) as ResumeSimulationCommand;
}

export function dispatchCommand(state: GameState, command: DomainCommand): DomainResult<GameState> {
  const commandType = command.type;

  switch (commandType) {
    case DomainCommandType.ResumeSimulation:
      return handleResumeSimulationCommand(state, command);
    default: {
      const exhaustiveCommandType: never = commandType;
      void exhaustiveCommandType;

      return failure(createUnsupportedCommandError(getCommandType(command)));
    }
  }
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
