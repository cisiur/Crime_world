import { describe, expect, it } from "vitest";

import {
  DomainErrorCode,
  createAdvanceSimulationTickCommand,
  createInitialGameState,
  createResumeSimulationCommand,
  dispatchCommand,
} from "../src/index";
import type {
  DomainCommand,
  DomainEvent,
  DomainExecution,
  DomainResult,
  GameState,
} from "../src/index";

interface ReplayScenarioResult {
  readonly finalState: GameState;
  readonly results: readonly DomainResult<DomainExecution>[];
  readonly events: readonly DomainEvent[];
}

function executeScenario(
  randomSeed: number,
  commandFactories: readonly (() => DomainCommand)[],
): ReplayScenarioResult {
  let currentState = createInitialGameState({
    campaignId: "campaign:replay_test",
    randomSeed,
  });
  const results: DomainResult<DomainExecution>[] = [];
  const events: DomainEvent[] = [];

  for (const createCommand of commandFactories) {
    const result = dispatchCommand(currentState, createCommand());
    results.push(result);

    if (result.ok) {
      currentState = result.value.gameState;
      events.push(...result.value.events);
    }
  }

  return {
    finalState: currentState,
    results,
    events,
  };
}

function resume(): DomainCommand {
  return createResumeSimulationCommand();
}

function tick(): DomainCommand {
  return createAdvanceSimulationTickCommand();
}

function expectScenariosToMatch(
  firstScenario: ReplayScenarioResult,
  secondScenario: ReplayScenarioResult,
): void {
  expect(firstScenario.finalState).toEqual(secondScenario.finalState);
  expect(firstScenario.finalState.clock).toEqual(secondScenario.finalState.clock);
  expect(firstScenario.finalState.randomState).toEqual(secondScenario.finalState.randomState);
  expect(firstScenario.events).toEqual(secondScenario.events);
  expect(firstScenario.results).toEqual(secondScenario.results);
}

describe("deterministic replay scenarios", () => {
  it("produces identical state, events, and command results for seed 12345", () => {
    const commands = [resume, tick, tick, tick];
    const firstScenario = executeScenario(12345, commands);
    const secondScenario = executeScenario(12345, commands);

    expectScenariosToMatch(firstScenario, secondScenario);
  });

  it("produces identical state, events, and random state for seed 987654", () => {
    const commands = [resume, tick, tick, tick];
    const firstScenario = executeScenario(987654, commands);
    const secondScenario = executeScenario(987654, commands);

    expectScenariosToMatch(firstScenario, secondScenario);
  });

  it("keeps a long 100-tick scenario deterministic", () => {
    const commands = [resume, ...Array.from({ length: 100 }, () => tick)];
    const firstScenario = executeScenario(12345, commands);
    const secondScenario = executeScenario(12345, commands);

    expectScenariosToMatch(firstScenario, secondScenario);
    expect(firstScenario.finalState.clock.currentTick).toBe(100);
    expect(firstScenario.finalState.clock.currentMinute).toBe(1000);
    expect(firstScenario.events).toHaveLength(101);
  });

  it("replays paused tick failure deterministically without events or state changes", () => {
    const commands = [tick];
    const firstScenario = executeScenario(12345, commands);
    const secondScenario = executeScenario(12345, commands);

    expectScenariosToMatch(firstScenario, secondScenario);
    expect(firstScenario.results).toEqual([
      {
        ok: false,
        error: {
          code: DomainErrorCode.SimulationPaused,
          message: "Cannot advance simulation while the clock is paused.",
        },
      },
    ]);
    expect(firstScenario.finalState).toEqual(
      createInitialGameState({
        campaignId: "campaign:replay_test",
        randomSeed: 12345,
      }),
    );
    expect(firstScenario.events).toEqual([]);
  });

  it("keeps mixed resume and tick commands deterministic including a no-op resume", () => {
    const commands = [resume, tick, tick, resume, tick];
    const firstScenario = executeScenario(12345, commands);
    const secondScenario = executeScenario(12345, commands);

    expectScenariosToMatch(firstScenario, secondScenario);
    expect(firstScenario.finalState.clock.currentTick).toBe(3);
    expect(firstScenario.finalState.clock.currentMinute).toBe(30);
    expect(firstScenario.results).toHaveLength(5);
    expect(firstScenario.events).toHaveLength(4);
    expect(firstScenario.results[3]).toEqual({
      ok: true,
      value: {
        gameState: firstScenario.results[2]?.ok
          ? firstScenario.results[2].value.gameState
          : firstScenario.finalState,
        events: [],
      },
    });
  });
});
