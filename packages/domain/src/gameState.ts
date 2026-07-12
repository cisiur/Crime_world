import {
  createInitialSimulationClock,
  parseSimulationClockState,
  type SimulationClockState,
} from "./simulationClock";
import {
  createRandomState,
  parseRandomSeed,
  parseRandomState,
  type RandomState,
} from "./randomService";
import { parseCampaignId, type CampaignId } from "./entityIds";

declare const schemaVersionBrand: unique symbol;
declare const gameStateBrand: unique symbol;

export type SchemaVersion = number & {
  readonly [schemaVersionBrand]: "SchemaVersion";
};

export interface GameStateData {
  readonly schemaVersion: SchemaVersion;
  readonly campaignId: CampaignId;
  readonly clock: SimulationClockState;
  readonly randomState: RandomState;
}

export type GameState = GameStateData & {
  readonly [gameStateBrand]: "GameState";
};

export interface CreateInitialGameStateInput {
  readonly campaignId: unknown;
  readonly randomSeed: unknown;
}

export const CURRENT_GAME_STATE_SCHEMA_VERSION = parseSchemaVersion(1);

export class InvalidGameStateError extends Error {
  public constructor(
    public readonly reason: string,
    public readonly value: unknown,
  ) {
    super(`Invalid GameState: ${reason}.`);
    this.name = "InvalidGameStateError";
  }
}

export function parseSchemaVersion(value: unknown): SchemaVersion {
  if (typeof value !== "number") {
    throw new InvalidGameStateError(
      `schemaVersion must be a number; received ${describeValueType(value)}`,
      value,
    );
  }

  if (!Number.isFinite(value)) {
    throw new InvalidGameStateError("schemaVersion must be finite", value);
  }

  if (!Number.isSafeInteger(value)) {
    throw new InvalidGameStateError("schemaVersion must be a safe integer", value);
  }

  if (value < 1) {
    throw new InvalidGameStateError("schemaVersion must be greater than or equal to 1", value);
  }

  return value as SchemaVersion;
}

export function createInitialGameState(input: CreateInitialGameStateInput): GameState {
  return createGameState({
    schemaVersion: CURRENT_GAME_STATE_SCHEMA_VERSION,
    campaignId: parseCampaignId(input.campaignId),
    clock: createInitialSimulationClock(),
    randomState: createRandomState(parseRandomSeed(input.randomSeed)),
  });
}

export function parseGameState(value: unknown): GameState {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new InvalidGameStateError(
      `expected an object; received ${describeValueType(value)}`,
      value,
    );
  }

  const candidate = value as Partial<GameStateData>;
  const extraFields = Object.keys(candidate).filter(
    (field) => !["schemaVersion", "campaignId", "clock", "randomState"].includes(field),
  );

  if (extraFields.length > 0) {
    throw new InvalidGameStateError(`received unsupported field "${extraFields[0]}"`, value);
  }

  return createGameState({
    schemaVersion: parseNestedField("schemaVersion", candidate.schemaVersion, parseSchemaVersion),
    campaignId: parseNestedField("campaignId", candidate.campaignId, parseCampaignId),
    clock: parseNestedField("clock", candidate.clock, parseSimulationClockState),
    randomState: parseNestedField("randomState", candidate.randomState, parseRandomState),
  });
}

function createGameState(state: GameStateData): GameState {
  return Object.freeze({
    schemaVersion: state.schemaVersion,
    campaignId: state.campaignId,
    clock: Object.freeze({ ...state.clock }),
    randomState: Object.freeze({ ...state.randomState }),
  }) as GameState;
}

function parseNestedField<TValue>(
  fieldName: string,
  value: unknown,
  parse: (value: unknown) => TValue,
): TValue {
  if (value === undefined) {
    throw new InvalidGameStateError(`missing required field "${fieldName}"`, value);
  }

  try {
    return parse(value);
  } catch (error) {
    if (error instanceof InvalidGameStateError) {
      throw error;
    }

    throw new InvalidGameStateError(`invalid field "${fieldName}"`, value);
  }
}

function describeValueType(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    return "an array";
  }

  return `a ${typeof value}`;
}
