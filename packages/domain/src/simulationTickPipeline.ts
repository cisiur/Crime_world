import type { AdvanceSimulationTickCommand } from "./commands";
import { parseGameState, type GameState } from "./gameState";
import { advanceSimulationClockOneTick, type SimulationTick } from "./simulationClock";

declare const simulationTickContextBrand: unique symbol;

export const SimulationTickPipelineStage = {
  BeforeTick: "BeforeTick",
  AfterClockAdvance: "AfterClockAdvance",
  AfterSystems: "AfterSystems",
} as const;

export type SimulationTickPipelineStage =
  (typeof SimulationTickPipelineStage)[keyof typeof SimulationTickPipelineStage];

export const SIMULATION_TICK_PIPELINE_STAGES = Object.freeze([
  SimulationTickPipelineStage.BeforeTick,
  SimulationTickPipelineStage.AfterClockAdvance,
  SimulationTickPipelineStage.AfterSystems,
] as const);

export interface SimulationTickContextData {
  readonly gameState: GameState;
  readonly command: AdvanceSimulationTickCommand;
  readonly tickNumber: SimulationTick;
}

export type SimulationTickContext = SimulationTickContextData & {
  readonly [simulationTickContextBrand]: "SimulationTickContext";
};

export interface SimulationTickPipelineOptions {
  readonly observeStage?: (
    stage: SimulationTickPipelineStage,
    gameState: GameState,
    context: SimulationTickContext,
  ) => void;
}

export function createSimulationTickContext(
  context: SimulationTickContextData,
): SimulationTickContext {
  return Object.freeze({ ...context }) as SimulationTickContext;
}

export function runSimulationTickPipeline(
  context: SimulationTickContext,
  options: SimulationTickPipelineOptions = {},
): GameState {
  const beforeTickState = executeSimulationTickPipelineStage(
    SimulationTickPipelineStage.BeforeTick,
    context.gameState,
    context,
    options,
  );
  const afterClockAdvanceState = advanceGameStateClockOneTick(beforeTickState);
  const afterClockAdvanceStageState = executeSimulationTickPipelineStage(
    SimulationTickPipelineStage.AfterClockAdvance,
    afterClockAdvanceState,
    context,
    options,
  );
  const afterSystemsPlaceholderState = runSystemsPlaceholder(afterClockAdvanceStageState, context);

  return executeSimulationTickPipelineStage(
    SimulationTickPipelineStage.AfterSystems,
    afterSystemsPlaceholderState,
    context,
    options,
  );
}

export function runBeforeTickStage(
  gameState: GameState,
  context: SimulationTickContext,
): GameState {
  void context;
  return gameState;
}

export function runAfterClockAdvanceStage(
  gameState: GameState,
  context: SimulationTickContext,
): GameState {
  void context;
  return gameState;
}

export function runAfterSystemsStage(
  gameState: GameState,
  context: SimulationTickContext,
): GameState {
  void context;
  return gameState;
}

function executeSimulationTickPipelineStage(
  stage: SimulationTickPipelineStage,
  gameState: GameState,
  context: SimulationTickContext,
  options: SimulationTickPipelineOptions,
): GameState {
  options.observeStage?.(stage, gameState, context);

  switch (stage) {
    case SimulationTickPipelineStage.BeforeTick:
      return runBeforeTickStage(gameState, context);
    case SimulationTickPipelineStage.AfterClockAdvance:
      return runAfterClockAdvanceStage(gameState, context);
    case SimulationTickPipelineStage.AfterSystems:
      return runAfterSystemsStage(gameState, context);
  }
}

function advanceGameStateClockOneTick(gameState: GameState): GameState {
  return parseGameState({
    ...gameState,
    clock: advanceSimulationClockOneTick(gameState.clock),
  });
}

function runSystemsPlaceholder(gameState: GameState, context: SimulationTickContext): GameState {
  void context;
  return gameState;
}
