import {
  createInitialGameState,
  createResumeSimulationCommand,
  dispatchCommand,
  success,
} from "../src/index";
import type { DomainCommand, DomainResult, GameState, ResumeSimulationCommand } from "../src/index";

const gameState = createInitialGameState({
  campaignId: "campaign:test",
  randomSeed: 123,
});
const resumeCommand = createResumeSimulationCommand();

const domainCommand: DomainCommand = resumeCommand;
const result: DomainResult<GameState> = success(gameState);

dispatchCommand(gameState, resumeCommand);

// @ts-expect-error ResumeSimulationCommand cannot be assigned from arbitrary objects.
const invalidResumeCommand: ResumeSimulationCommand = {
  type: "ResumeSimulation",
};

// @ts-expect-error Dispatcher cannot receive arbitrary strings.
dispatchCommand(gameState, "ResumeSimulation");

// @ts-expect-error DomainResult<GameState> cannot be confused with GameState.
const invalidGameState: GameState = result;

void domainCommand;
void invalidResumeCommand;
void invalidGameState;
