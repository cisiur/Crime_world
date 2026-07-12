import {
  CURRENT_GAME_STATE_SCHEMA_VERSION,
  createInitialGameState,
  parseCampaignId,
  parseCharacterId,
  parseSchemaVersion,
  parseSimulationMinute,
} from "../src/index";
import type {
  CampaignId,
  CharacterId,
  GameState,
  SchemaVersion,
  SimulationMinute,
} from "../src/index";

const campaignId = parseCampaignId("campaign:test");
const characterId = parseCharacterId("character:boss_001");
const schemaVersion = parseSchemaVersion(1);
const simulationMinute = parseSimulationMinute(1);
const gameState = createInitialGameState({
  campaignId,
  randomSeed: 123,
});

const schemaVersionNumber: number = schemaVersion;
const campaignIdString: string = campaignId;

// @ts-expect-error GameState cannot be assigned from arbitrary objects.
const invalidGameState: GameState = {
  schemaVersion: CURRENT_GAME_STATE_SCHEMA_VERSION,
  campaignId,
  clock: gameState.clock,
  randomState: gameState.randomState,
};

// @ts-expect-error CampaignId cannot be replaced by CharacterId.
const invalidCampaignId: CampaignId = characterId;

// @ts-expect-error CharacterId cannot be replaced by CampaignId.
const invalidCharacterId: CharacterId = campaignId;

// @ts-expect-error SchemaVersion cannot be replaced by SimulationMinute.
const invalidSchemaVersion: SchemaVersion = simulationMinute;

// @ts-expect-error SimulationMinute cannot be replaced by SchemaVersion.
const invalidSimulationMinute: SimulationMinute = schemaVersion;

void schemaVersionNumber;
void campaignIdString;
void invalidGameState;
void invalidCampaignId;
void invalidCharacterId;
void invalidSchemaVersion;
void invalidSimulationMinute;
