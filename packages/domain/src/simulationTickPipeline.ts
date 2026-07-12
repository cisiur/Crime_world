import type { AdvanceSimulationTickCommand } from "./commands";
import type { GameState } from "./gameState";
import type { SimulationTick } from "./simulationClock";

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

export function createSimulationTickContext(
  context: SimulationTickContextData,
): SimulationTickContext {
  return Object.freeze({ ...context }) as SimulationTickContext;
}

export function runSimulationTickPipeline(context: SimulationTickContext): GameState {
  let gameState = context.gameState;

  for (const stage of SIMULATION_TICK_PIPELINE_STAGES) {
    gameState = executeSimulationTickPipelineStage(stage, gameState, context);
  }

  return gameState;
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
): GameState {
  switch (stage) {
    case SimulationTickPipelineStage.BeforeTick:
      return runBeforeTickStage(gameState, context);
    case SimulationTickPipelineStage.AfterClockAdvance:
      return runAfterClockAdvanceStage(gameState, context);
    case SimulationTickPipelineStage.AfterSystems:
      return runAfterSystemsStage(gameState, context);
  }
}
