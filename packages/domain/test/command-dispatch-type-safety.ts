import {
  createAdvanceSimulationTickCommand,
  createInitialGameState,
  createResumeSimulationCommand,
  dispatchCommand,
  success,
} from "../src/index";
import type {
  AdvanceSimulationTickCommand,
  DomainCommand,
  DomainResult,
  GameState,
  ResumeSimulationCommand,
} from "../src/index";

const gameState = createInitialGameState({
  campaignId: "campaign:test",
  randomSeed: 123,
});
const resumeCommand = createResumeSimulationCommand();
const advanceCommand = createAdvanceSimulationTickCommand();

const domainCommand: DomainCommand = resumeCommand;
const advanceDomainCommand: DomainCommand = advanceCommand;
const result: DomainResult<GameState> = success(gameState);

dispatchCommand(gameState, resumeCommand);
dispatchCommand(gameState, advanceCommand);

// @ts-expect-error ResumeSimulationCommand cannot be assigned from arbitrary objects.
const invalidResumeCommand: ResumeSimulationCommand = {
  type: "ResumeSimulation",
};

// @ts-expect-error AdvanceSimulationTickCommand cannot be assigned from arbitrary objects.
const invalidAdvanceCommand: AdvanceSimulationTickCommand = {
  type: "AdvanceSimulationTick",
};

// @ts-expect-error Dispatcher cannot receive arbitrary strings.
dispatchCommand(gameState, "ResumeSimulation");

// @ts-expect-error Dispatcher cannot receive arbitrary objects.
dispatchCommand(gameState, { type: "AdvanceSimulationTick" });

// @ts-expect-error DomainResult<GameState> cannot be confused with GameState.
const invalidGameState: GameState = result;

void domainCommand;
void advanceDomainCommand;
void invalidResumeCommand;
void invalidAdvanceCommand;
void invalidGameState;
