import {
  createAdvanceSimulationTickCommand,
  createInitialGameState,
  createSimulationTickContext,
  dispatchCommand,
} from "../src/index";
import type {
  AdvanceSimulationTickCommand,
  DomainCommand,
  SimulationTickContext,
} from "../src/index";

const gameState = createInitialGameState({
  campaignId: "campaign:test",
  randomSeed: 123,
});
const advanceCommand = createAdvanceSimulationTickCommand();
const context = createSimulationTickContext({
  gameState,
  command: advanceCommand,
  tickNumber: gameState.clock.currentTick,
});

const domainCommand: DomainCommand = advanceCommand;
const typedAdvanceCommand: AdvanceSimulationTickCommand = advanceCommand;
const typedContext: SimulationTickContext = context;

dispatchCommand(gameState, advanceCommand);

// @ts-expect-error Unsupported arbitrary command objects cannot be dispatched.
dispatchCommand(gameState, { type: "AdvanceSimulationTick" });

// @ts-expect-error Unsupported arbitrary objects cannot be AdvanceSimulationTickCommand.
const invalidAdvanceCommand: AdvanceSimulationTickCommand = {
  type: "AdvanceSimulationTick",
};

// @ts-expect-error SimulationTickContext cannot be created from arbitrary objects.
const invalidContext: SimulationTickContext = {
  gameState,
  command: advanceCommand,
  tickNumber: gameState.clock.currentTick,
};

void domainCommand;
void typedAdvanceCommand;
void typedContext;
void invalidAdvanceCommand;
void invalidContext;
