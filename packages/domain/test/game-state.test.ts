import { describe, expect, it } from "vitest";

import {
  CURRENT_GAME_STATE_SCHEMA_VERSION,
  InvalidEntityIdError,
  InvalidGameStateError,
  SimulationSpeed,
  createInitialGameState,
  createInitialSimulationClock,
  createRandomState,
  parseCampaignId,
  parseGameState,
  parseRandomSeed,
  parseSchemaVersion,
} from "../src/index";

function createTestGameState() {
  return createInitialGameState({
    campaignId: "campaign:test",
    randomSeed: 123,
  });
}

describe("game state", () => {
  it("creates the initial immutable root state with exactly the accepted fields", () => {
    const state = createTestGameState();

    expect(Object.keys(state)).toEqual(["schemaVersion", "campaignId", "clock", "randomState"]);
    expect(state.schemaVersion).toBe(CURRENT_GAME_STATE_SCHEMA_VERSION);
    expect(state.campaignId).toBe("campaign:test");
    expect(state.clock).toEqual(createInitialSimulationClock());
    expect(state.randomState).toEqual(createRandomState(parseRandomSeed(123)));
    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(state.clock)).toBe(true);
    expect(Object.isFrozen(state.randomState)).toBe(true);
  });

  it("validates and preserves schema version values", () => {
    expect(CURRENT_GAME_STATE_SCHEMA_VERSION).toBe(1);
    expect(parseSchemaVersion(1)).toBe(1);
    expect(parseSchemaVersion(2)).toBe(2);
  });

  it("rejects invalid schema versions", () => {
    expect(() => parseSchemaVersion(0)).toThrow(InvalidGameStateError);
    expect(() => parseSchemaVersion(-1)).toThrow(InvalidGameStateError);
    expect(() => parseSchemaVersion(1.5)).toThrow(InvalidGameStateError);
    expect(() => parseSchemaVersion(Number.NaN)).toThrow(InvalidGameStateError);
    expect(() => parseSchemaVersion(Number.POSITIVE_INFINITY)).toThrow(InvalidGameStateError);
    expect(() => parseSchemaVersion(Number.MAX_SAFE_INTEGER + 1)).toThrow(InvalidGameStateError);
    expect(() => parseSchemaVersion("1")).toThrow(InvalidGameStateError);
  });

  it("uses the CampaignId parser and rejects invalid campaign IDs", () => {
    expect(parseCampaignId("campaign:test")).toBe("campaign:test");
    expect(() =>
      createInitialGameState({
        campaignId: "campaign test",
        randomSeed: 123,
      }),
    ).toThrow(InvalidEntityIdError);
  });

  it("serializes as plain JSON and round-trips through parseGameState", () => {
    const state = createTestGameState();
    const serialized = JSON.stringify(state);
    const parsedState = parseGameState(JSON.parse(serialized));

    expect(serialized).toBe(
      '{"schemaVersion":1,"campaignId":"campaign:test","clock":{"currentMinute":0,"currentTick":0,"paused":true,"speed":"Normal"},"randomState":{"stateHigh":3049483542,"stateLow":472860493,"incrementHigh":3028054935,"incrementLow":695383873}}',
    );
    expect(parsedState).toEqual(state);
    expect(Object.isFrozen(parsedState)).toBe(true);
    expect(Object.isFrozen(parsedState.clock)).toBe(true);
    expect(Object.isFrozen(parsedState.randomState)).toBe(true);
  });

  it("parses valid untrusted game state input", () => {
    const state = createTestGameState();

    expect(parseGameState(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });

  it("rejects missing required fields", () => {
    const state = JSON.parse(JSON.stringify(createTestGameState())) as Record<string, unknown>;

    delete state.schemaVersion;
    expect(() => parseGameState(state)).toThrow(InvalidGameStateError);
  });

  it("rejects extra fields consistently", () => {
    const state = JSON.parse(JSON.stringify(createTestGameState())) as Record<string, unknown>;
    state.city = {};

    expect(() => parseGameState(state)).toThrow('unsupported field "city"');
  });

  it("rejects invalid nested schema version", () => {
    const state = JSON.parse(JSON.stringify(createTestGameState())) as Record<string, unknown>;
    state.schemaVersion = 0;

    expect(() => parseGameState(state)).toThrow(InvalidGameStateError);
  });

  it("rejects invalid nested campaign ID", () => {
    const state = JSON.parse(JSON.stringify(createTestGameState())) as Record<string, unknown>;
    state.campaignId = "campaign test";

    expect(() => parseGameState(state)).toThrow(InvalidGameStateError);
  });

  it("rejects invalid nested clock state", () => {
    const state = JSON.parse(JSON.stringify(createTestGameState())) as {
      clock: { currentMinute: number; speed: string };
    };
    state.clock.currentMinute = 10;

    expect(() => parseGameState(state)).toThrow(InvalidGameStateError);

    state.clock.currentMinute = 0;
    state.clock.speed = "Slow";

    expect(() => parseGameState(state)).toThrow(InvalidGameStateError);
  });

  it("rejects invalid nested random state", () => {
    const state = JSON.parse(JSON.stringify(createTestGameState())) as {
      randomState: { incrementLow: number };
    };
    state.randomState.incrementLow = 2;

    expect(() => parseGameState(state)).toThrow(InvalidGameStateError);
    expect(() => parseGameState({ ...state, randomState: null })).toThrow(InvalidGameStateError);
  });

  it("preserves clock and random state values supplied through the parser", () => {
    const state = createTestGameState();
    const rawState = JSON.parse(JSON.stringify(state)) as {
      clock: { paused: boolean; speed: string };
    };
    rawState.clock.paused = false;
    rawState.clock.speed = SimulationSpeed.Fast;

    const parsedState = parseGameState(rawState);

    expect(parsedState.clock.paused).toBe(false);
    expect(parsedState.clock.speed).toBe(SimulationSpeed.Fast);
    expect(parsedState.randomState).toEqual(state.randomState);
  });
});
