import { describe, expect, it } from "vitest";

import {
  DomainErrorCode,
  DomainEventType,
  OperationStatus,
  assertDomainEventInvariant,
  createOperationState,
  createRandomState,
  nextInt,
  parseCharacterId,
  parseLocationId,
  parseOperationId,
  parseOperationTemplateId,
  parseOrganizationId,
  parseRandomSeed,
  parseSimulationTick,
  resolveOperationOutcome,
  type OperationOutcomeBandInput,
  type OperationOutcomeModifierContributions,
  type OperationState,
  type RandomState,
} from "./index";

describe("operation outcome resolver", () => {
  it("accepts a lifecycle-resolved operation and returns explainable deterministic diagnostics", () => {
    const randomState = createTestRandomState(153);
    const expectedRandomResult = nextInt(randomState, 1, 100);
    const operation = createTestOperation({ status: OperationStatus.Resolved });
    const result = resolveOperationOutcome({
      operation,
      randomState,
      weightedBands: DEFAULT_BANDS,
      modifierContributions: MODIFIER_CONTRIBUTIONS,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected outcome resolution to succeed");
    }

    expect(result.value).toEqual({
      operationId: LOCAL_COLLECTION_OPERATION_ID,
      selectedBandKey: "band-b",
      percentileRoll: 46,
      selectedBandLowerBound: 46,
      selectedBandUpperBound: 75,
      weightedBands: [
        { key: "band-a", weight: 45, lowerBound: 1, upperBound: 45 },
        { key: "band-b", weight: 30, lowerBound: 46, upperBound: 75 },
        { key: "band-c", weight: 20, lowerBound: 76, upperBound: 95 },
        { key: "band-d", weight: 5, lowerBound: 96, upperBound: 100 },
      ],
      modifierContributions: MODIFIER_CONTRIBUTIONS,
      previousRandomState: randomState,
      nextRandomState: expectedRandomResult.state,
      events: [
        {
          type: DomainEventType.OperationOutcomeRolled,
          operationId: LOCAL_COLLECTION_OPERATION_ID,
          operationTemplateId: LOCAL_COLLECTION_TEMPLATE_ID,
          organizationId: STARTER_ORGANIZATION_ID,
          targetLocationId: CORNER_STORE_LOCATION_ID,
          assignedCharacterIds: [BOSS_ID],
          selectedBandKey: "band-b",
          percentileRoll: 46,
          selectedBandLowerBound: 46,
          selectedBandUpperBound: 75,
          modifierContributions: MODIFIER_CONTRIBUTIONS,
          previousRandomState: randomState,
          nextRandomState: expectedRandomResult.state,
        },
      ],
    });
    expect(DEFAULT_BANDS.map((band) => band.key)).toContain(result.value.selectedBandKey);
    expect(result.value.operationId).toBe(operation.operationId);
    expect(operation.status).toBe(OperationStatus.Resolved);
  });

  it("rejects planned and running operations without advancing random state or emitting events", () => {
    for (const status of [OperationStatus.Planned, OperationStatus.Running]) {
      const randomState = createTestRandomState();
      const result = resolveOperationOutcome({
        operation: createTestOperation({ status }),
        randomState,
        weightedBands: DEFAULT_BANDS,
        modifierContributions: MODIFIER_CONTRIBUTIONS,
      });

      expect(result).toEqual({
        ok: false,
        error: {
          code: DomainErrorCode.OperationOutcomeResolutionOperationNotResolved,
          message: `Operation "${LOCAL_COLLECTION_OPERATION_ID}" must be lifecycle-resolved before outcome resolution.`,
          operationId: LOCAL_COLLECTION_OPERATION_ID,
          status,
        },
      });
      expect(randomState).toEqual(createTestRandomState());
      if (!result.ok) {
        expect("events" in result.error).toBe(false);
        expect("nextRandomState" in result.error).toBe(false);
      }
    }
  });

  it("rejects invalid weighted-band definitions before consuming random state", () => {
    const cases: readonly [
      string,
      readonly OperationOutcomeBandInput[],
      DomainErrorCode,
      Record<string, unknown>,
    ][] = [
      ["empty bands", [], DomainErrorCode.OperationOutcomeResolutionEmptyBands, {}],
      [
        "empty key",
        [{ key: "", weight: 100 }],
        DomainErrorCode.OperationOutcomeResolutionBandKeyInvalid,
        { index: 0, key: "" },
      ],
      [
        "whitespace key",
        [{ key: "   ", weight: 100 }],
        DomainErrorCode.OperationOutcomeResolutionBandKeyInvalid,
        { index: 0, key: "   " },
      ],
      [
        "duplicate key",
        [
          { key: "band-a", weight: 50 },
          { key: "band-a", weight: 50 },
        ],
        DomainErrorCode.OperationOutcomeResolutionBandKeyDuplicated,
        { key: "band-a", firstIndex: 0, duplicateIndex: 1 },
      ],
      [
        "zero weight",
        [{ key: "band-a", weight: 0 }],
        DomainErrorCode.OperationOutcomeResolutionBandWeightInvalid,
        { index: 0, key: "band-a", weight: 0 },
      ],
      [
        "negative weight",
        [{ key: "band-a", weight: -1 }],
        DomainErrorCode.OperationOutcomeResolutionBandWeightInvalid,
        { index: 0, key: "band-a", weight: -1 },
      ],
      [
        "non-integer weight",
        [{ key: "band-a", weight: 99.5 }],
        DomainErrorCode.OperationOutcomeResolutionBandWeightInvalid,
        { index: 0, key: "band-a", weight: 99.5 },
      ],
      [
        "non-finite weight",
        [{ key: "band-a", weight: Number.POSITIVE_INFINITY }],
        DomainErrorCode.OperationOutcomeResolutionBandWeightInvalid,
        { index: 0, key: "band-a", weight: Number.POSITIVE_INFINITY },
      ],
      [
        "unsafe integer weight",
        [{ key: "band-a", weight: Number.MAX_SAFE_INTEGER + 1 }],
        DomainErrorCode.OperationOutcomeResolutionBandWeightInvalid,
        { index: 0, key: "band-a", weight: Number.MAX_SAFE_INTEGER + 1 },
      ],
      [
        "total below 100",
        [{ key: "band-a", weight: 99 }],
        DomainErrorCode.OperationOutcomeResolutionTotalWeightInvalid,
        { totalWeight: 99, expectedTotalWeight: 100 },
      ],
      [
        "total above 100",
        [{ key: "band-a", weight: 101 }],
        DomainErrorCode.OperationOutcomeResolutionTotalWeightInvalid,
        { totalWeight: 101, expectedTotalWeight: 100 },
      ],
      [
        "total overflow",
        [
          { key: "band-a", weight: Number.MAX_SAFE_INTEGER },
          { key: "band-b", weight: 1 },
        ],
        DomainErrorCode.OperationOutcomeResolutionTotalWeightInvalid,
        { totalWeight: Number.MAX_SAFE_INTEGER + 1, expectedTotalWeight: 100 },
      ],
    ];

    for (const [caseName, weightedBands, expectedCode, expectedFields] of cases) {
      const randomState = createTestRandomState();
      const result = resolveOperationOutcome({
        operation: createTestOperation({ status: OperationStatus.Resolved }),
        randomState,
        weightedBands,
        modifierContributions: MODIFIER_CONTRIBUTIONS,
      });

      expect(result.ok, caseName).toBe(false);
      if (result.ok) {
        throw new Error("expected outcome resolution to fail");
      }
      expect(result.error).toMatchObject({
        code: expectedCode,
        ...expectedFields,
      });
      expect(randomState).toEqual(createTestRandomState());
      expect("events" in result.error).toBe(false);
      expect("nextRandomState" in result.error).toBe(false);
    }
  });

  it("rejects invalid modifier diagnostics before consuming random state", () => {
    const randomState = createTestRandomState();
    const result = resolveOperationOutcome({
      operation: createTestOperation({ status: OperationStatus.Resolved }),
      randomState,
      weightedBands: DEFAULT_BANDS,
      modifierContributions: {
        ...MODIFIER_CONTRIBUTIONS,
        competence: 1.5,
      },
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: DomainErrorCode.OperationOutcomeResolutionInvalidModifierContribution,
        message:
          'Operation outcome modifier contribution "competence" must be a finite safe integer.',
        field: "competence",
        value: 1.5,
      },
    });
    expect(randomState).toEqual(createTestRandomState());
  });

  it("selects the correct ordered weighted band at percentile boundaries", () => {
    const cases = [
      { roll: 1, seed: 32, key: "band-a", lowerBound: 1, upperBound: 45 },
      { roll: 45, seed: 157, key: "band-a", lowerBound: 1, upperBound: 45 },
      { roll: 46, seed: 153, key: "band-b", lowerBound: 46, upperBound: 75 },
      { roll: 75, seed: 135, key: "band-b", lowerBound: 46, upperBound: 75 },
      { roll: 76, seed: 20, key: "band-c", lowerBound: 76, upperBound: 95 },
      { roll: 100, seed: 15, key: "band-d", lowerBound: 96, upperBound: 100 },
    ];

    for (const { roll, seed, key, lowerBound, upperBound } of cases) {
      const result = resolveOperationOutcome({
        operation: createTestOperation({ status: OperationStatus.Resolved }),
        randomState: createTestRandomState(seed),
        weightedBands: DEFAULT_BANDS,
        modifierContributions: MODIFIER_CONTRIBUTIONS,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) {
        throw new Error("expected outcome resolution to succeed");
      }
      expect(result.value.percentileRoll).toBe(roll);
      expect(result.value.selectedBandKey).toBe(key);
      expect(result.value.selectedBandLowerBound).toBe(lowerBound);
      expect(result.value.selectedBandUpperBound).toBe(upperBound);
    }
  });

  it("preserves caller-supplied band order as the authoritative cumulative order", () => {
    const weightedBands = [
      { key: "band-c", weight: 20 },
      { key: "band-a", weight: 45 },
      { key: "band-b", weight: 30 },
      { key: "band-d", weight: 5 },
    ];
    const result = resolveOperationOutcome({
      operation: createTestOperation({ status: OperationStatus.Resolved }),
      randomState: createTestRandomState(157),
      weightedBands,
      modifierContributions: MODIFIER_CONTRIBUTIONS,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected outcome resolution to succeed");
    }
    expect(result.value.percentileRoll).toBe(45);
    expect(result.value.selectedBandKey).toBe("band-a");
    expect(result.value.weightedBands.map((band) => band.key)).toEqual([
      "band-c",
      "band-a",
      "band-b",
      "band-d",
    ]);
    expect(result.value.weightedBands).toEqual([
      { key: "band-c", weight: 20, lowerBound: 1, upperBound: 20 },
      { key: "band-a", weight: 45, lowerBound: 21, upperBound: 65 },
      { key: "band-b", weight: 30, lowerBound: 66, upperBound: 95 },
      { key: "band-d", weight: 5, lowerBound: 96, upperBound: 100 },
    ]);
  });

  it("uses exactly one successful nextInt percentile call and returns the advanced random state", () => {
    const randomState = createTestRandomState(20);
    const expectedFirstRoll = nextInt(randomState, 1, 100);
    const expectedSecondRoll = nextInt(expectedFirstRoll.state, 1, 100);
    const firstResult = resolveOperationOutcome({
      operation: createTestOperation({ status: OperationStatus.Resolved }),
      randomState,
      weightedBands: DEFAULT_BANDS,
      modifierContributions: MODIFIER_CONTRIBUTIONS,
    });

    expect(firstResult.ok).toBe(true);
    if (!firstResult.ok) {
      throw new Error("expected outcome resolution to succeed");
    }
    expect(firstResult.value.percentileRoll).toBe(expectedFirstRoll.value);
    expect(firstResult.value.nextRandomState).toEqual(expectedFirstRoll.state);
    expect(randomState).toEqual(createTestRandomState(20));

    const secondResult = resolveOperationOutcome({
      operation: createTestOperation({ status: OperationStatus.Resolved }),
      randomState: firstResult.value.nextRandomState,
      weightedBands: DEFAULT_BANDS,
      modifierContributions: MODIFIER_CONTRIBUTIONS,
    });

    expect(secondResult.ok).toBe(true);
    if (!secondResult.ok) {
      throw new Error("expected second outcome resolution to succeed");
    }
    expect(secondResult.value.percentileRoll).toBe(expectedSecondRoll.value);
    expect(secondResult.value.nextRandomState).toEqual(expectedSecondRoll.state);
  });

  it("returns identical results for structurally identical input", () => {
    expect(createSuccessfulResult(32)).toEqual(createSuccessfulResult(32));
  });

  it("retains supplied modifier diagnostics exactly without calculating or altering them", () => {
    const modifierContributions = {
      base: 10,
      competence: -2,
      capability: 0,
      district: 7,
      exposure: -5,
    };
    const result = resolveOperationOutcome({
      operation: createTestOperation({ status: OperationStatus.Resolved }),
      randomState: createTestRandomState(32),
      weightedBands: DEFAULT_BANDS,
      modifierContributions,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected outcome resolution to succeed");
    }
    expect(result.value.modifierContributions).toEqual(modifierContributions);
    expect(result.value.events[0]).toMatchObject({ modifierContributions });
    expect("formattedText" in result.value).toBe(false);
    expect("displayText" in result.value).toBe(false);
  });

  it("emits one immutable outcome-roll event matching the resolver result", () => {
    const result = createSuccessfulResult(153);

    expect(result.events).toHaveLength(1);
    expect(result.events.map((event) => event.type)).toEqual([
      DomainEventType.OperationOutcomeRolled,
    ]);
    expect(result.events[0]).toEqual({
      type: DomainEventType.OperationOutcomeRolled,
      operationId: LOCAL_COLLECTION_OPERATION_ID,
      operationTemplateId: LOCAL_COLLECTION_TEMPLATE_ID,
      organizationId: STARTER_ORGANIZATION_ID,
      targetLocationId: CORNER_STORE_LOCATION_ID,
      assignedCharacterIds: [BOSS_ID],
      selectedBandKey: result.selectedBandKey,
      percentileRoll: result.percentileRoll,
      selectedBandLowerBound: result.selectedBandLowerBound,
      selectedBandUpperBound: result.selectedBandUpperBound,
      modifierContributions: result.modifierContributions,
      previousRandomState: result.previousRandomState,
      nextRandomState: result.nextRandomState,
    });
    const event = result.events[0];

    if (event?.type !== DomainEventType.OperationOutcomeRolled) {
      throw new Error("expected OperationOutcomeRolled event");
    }
    expect(Object.isFrozen(event)).toBe(true);
    expect(Object.isFrozen(event.assignedCharacterIds)).toBe(true);
    expect(Object.isFrozen(event.modifierContributions)).toBe(true);
    expect(Object.isFrozen(event.previousRandomState)).toBe(true);
    expect(Object.isFrozen(event.nextRandomState)).toBe(true);
    expect(() => assertDomainEventInvariant(event)).not.toThrow();
  });

  it("does not mutate or replace the operation and returns no campaign or consequence state", () => {
    const operation = createTestOperation({ status: OperationStatus.Resolved });
    const snapshot = JSON.stringify(operation);
    const result = resolveOperationOutcome({
      operation,
      randomState: createTestRandomState(153),
      weightedBands: DEFAULT_BANDS,
      modifierContributions: MODIFIER_CONTRIBUTIONS,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected outcome resolution to succeed");
    }
    expect(JSON.stringify(operation)).toBe(snapshot);
    expect(operation.status).toBe(OperationStatus.Resolved);
    expect(Object.keys(result.value).sort()).toEqual([
      "events",
      "modifierContributions",
      "nextRandomState",
      "operationId",
      "percentileRoll",
      "previousRandomState",
      "selectedBandKey",
      "selectedBandLowerBound",
      "selectedBandUpperBound",
      "weightedBands",
    ]);
    expect("gameState" in result.value).toBe(false);
    expect("organizations" in result.value).toBe(false);
    expect("characters" in result.value).toBe(false);
    expect("money" in result.value).toBe(false);
    expect("exposure" in result.value).toBe(false);
    expect("health" in result.value).toBe(false);
    expect("assignmentState" in result.value).toBe(false);
    expect("operationalCapacity" in result.value).toBe(false);
  });
});

const STARTER_ORGANIZATION_ID = parseOrganizationId("organization:starter_crew");
const BOSS_ID = parseCharacterId("character:boss_001");
const CORNER_STORE_LOCATION_ID = parseLocationId("location:corner_store");
const LOCAL_COLLECTION_TEMPLATE_ID = parseOperationTemplateId(
  "operation-template:local_collection",
);
const LOCAL_COLLECTION_OPERATION_ID = parseOperationId("operation:local_collection_001");
const PLANNED_AT_TICK = parseSimulationTick(4);
const COMPLETION_TICK = parseSimulationTick(10);
const DEFAULT_BANDS: readonly OperationOutcomeBandInput[] = Object.freeze([
  Object.freeze({ key: "band-a", weight: 45 }),
  Object.freeze({ key: "band-b", weight: 30 }),
  Object.freeze({ key: "band-c", weight: 20 }),
  Object.freeze({ key: "band-d", weight: 5 }),
]);
const MODIFIER_CONTRIBUTIONS: OperationOutcomeModifierContributions = Object.freeze({
  base: 0,
  competence: 3,
  capability: 2,
  district: -1,
  exposure: -4,
});

function createTestOperation(
  overrides: Partial<Parameters<typeof createOperationState>[0]> = {},
): OperationState {
  return createOperationState({
    operationId: LOCAL_COLLECTION_OPERATION_ID,
    operationTemplateId: LOCAL_COLLECTION_TEMPLATE_ID,
    organizationId: STARTER_ORGANIZATION_ID,
    targetLocationId: CORNER_STORE_LOCATION_ID,
    assignedCharacterIds: [BOSS_ID],
    status: OperationStatus.Resolved,
    plannedAtTick: PLANNED_AT_TICK,
    plannedCompletionTick: COMPLETION_TICK,
    ...overrides,
  });
}

function createTestRandomState(seed = 123): RandomState {
  return createRandomState(parseRandomSeed(seed));
}

function createSuccessfulResult(seed: number) {
  const result = resolveOperationOutcome({
    operation: createTestOperation({ status: OperationStatus.Resolved }),
    randomState: createTestRandomState(seed),
    weightedBands: DEFAULT_BANDS,
    modifierContributions: MODIFIER_CONTRIBUTIONS,
  });

  if (!result.ok) {
    throw new Error("expected outcome resolution to succeed");
  }

  return result.value;
}
