import { describe, expect, it } from "vitest";

import {
  DomainErrorCode,
  DomainEventType,
  OperationOutcomeCategory,
  OperationStatus,
  assertDomainEventInvariant,
  classifyOperationOutcome,
  createOperationState,
  createRandomState,
  isOperationOutcomeCategory,
  nextInt,
  parseCharacterId,
  parseLocationId,
  parseOperationId,
  parseOperationTemplateId,
  parseOrganizationId,
  parseRandomSeed,
  parseSimulationTick,
  resolveOperationOutcome,
  type OperationOutcomeClassificationBandInput,
  type OperationOutcomeModifierContributions,
  type OperationState,
  type RandomState,
} from "./index";

describe("operation outcome classification", () => {
  it("defines exactly the accepted runtime outcome categories", () => {
    expect(Object.values(OperationOutcomeCategory)).toEqual([
      "success",
      "partial-success",
      "failure",
      "critical-failure",
    ]);
    expect(Object.values(OperationOutcomeCategory)).toHaveLength(4);
    expect(isOperationOutcomeCategory("success")).toBe(true);
    expect(isOperationOutcomeCategory("partial-success")).toBe(true);
    expect(isOperationOutcomeCategory("failure")).toBe(true);
    expect(isOperationOutcomeCategory("critical-failure")).toBe(true);
    expect(isOperationOutcomeCategory("unsupported")).toBe(false);
  });

  it("rejects invalid classification definitions without advancing caller random state", () => {
    const cases: readonly [
      string,
      readonly OperationOutcomeClassificationBandInput[],
      DomainErrorCode,
      Record<string, unknown>,
    ][] = [
      ["empty", [], DomainErrorCode.OperationOutcomeResolutionEmptyBands, {}],
      [
        "unsupported category",
        [{ category: "unsupported" as OperationOutcomeCategory, weight: 100 }],
        DomainErrorCode.OperationOutcomeClassificationCategoryUnsupported,
        { index: 0, category: "unsupported" },
      ],
      [
        "duplicate category",
        [
          { category: OperationOutcomeCategory.Success, weight: 50 },
          { category: OperationOutcomeCategory.Success, weight: 50 },
        ],
        DomainErrorCode.OperationOutcomeClassificationCategoryDuplicated,
        { category: OperationOutcomeCategory.Success, firstIndex: 0, duplicateIndex: 1 },
      ],
      [
        "missing category",
        [{ category: OperationOutcomeCategory.Success, weight: 100 }],
        DomainErrorCode.OperationOutcomeClassificationCategoryMissing,
        { category: OperationOutcomeCategory.PartialSuccess },
      ],
      [
        "wrong canonical order",
        [
          { category: OperationOutcomeCategory.PartialSuccess, weight: 30 },
          { category: OperationOutcomeCategory.Success, weight: 45 },
          { category: OperationOutcomeCategory.Failure, weight: 20 },
          { category: OperationOutcomeCategory.CriticalFailure, weight: 5 },
        ],
        DomainErrorCode.OperationOutcomeClassificationCanonicalOrderInvalid,
        {
          index: 0,
          expectedCategory: OperationOutcomeCategory.Success,
          actualCategory: OperationOutcomeCategory.PartialSuccess,
        },
      ],
      [
        "zero weight",
        [
          { category: OperationOutcomeCategory.Success, weight: 0 },
          { category: OperationOutcomeCategory.PartialSuccess, weight: 75 },
          { category: OperationOutcomeCategory.Failure, weight: 20 },
          { category: OperationOutcomeCategory.CriticalFailure, weight: 5 },
        ],
        DomainErrorCode.OperationOutcomeResolutionBandWeightInvalid,
        { index: 0, key: OperationOutcomeCategory.Success, weight: 0 },
      ],
      [
        "negative weight",
        [
          { category: OperationOutcomeCategory.Success, weight: -1 },
          { category: OperationOutcomeCategory.PartialSuccess, weight: 76 },
          { category: OperationOutcomeCategory.Failure, weight: 20 },
          { category: OperationOutcomeCategory.CriticalFailure, weight: 5 },
        ],
        DomainErrorCode.OperationOutcomeResolutionBandWeightInvalid,
        { index: 0, key: OperationOutcomeCategory.Success, weight: -1 },
      ],
      [
        "fractional weight",
        [
          { category: OperationOutcomeCategory.Success, weight: 44.5 },
          { category: OperationOutcomeCategory.PartialSuccess, weight: 30.5 },
          { category: OperationOutcomeCategory.Failure, weight: 20 },
          { category: OperationOutcomeCategory.CriticalFailure, weight: 5 },
        ],
        DomainErrorCode.OperationOutcomeResolutionBandWeightInvalid,
        { index: 0, key: OperationOutcomeCategory.Success, weight: 44.5 },
      ],
      [
        "non-finite weight",
        [
          { category: OperationOutcomeCategory.Success, weight: Number.NaN },
          { category: OperationOutcomeCategory.PartialSuccess, weight: 75 },
          { category: OperationOutcomeCategory.Failure, weight: 20 },
          { category: OperationOutcomeCategory.CriticalFailure, weight: 5 },
        ],
        DomainErrorCode.OperationOutcomeResolutionBandWeightInvalid,
        { index: 0, key: OperationOutcomeCategory.Success, weight: Number.NaN },
      ],
      [
        "unsafe weight",
        [
          { category: OperationOutcomeCategory.Success, weight: Number.MAX_SAFE_INTEGER + 1 },
          { category: OperationOutcomeCategory.PartialSuccess, weight: 75 },
          { category: OperationOutcomeCategory.Failure, weight: 20 },
          { category: OperationOutcomeCategory.CriticalFailure, weight: 5 },
        ],
        DomainErrorCode.OperationOutcomeResolutionBandWeightInvalid,
        {
          index: 0,
          key: OperationOutcomeCategory.Success,
          weight: Number.MAX_SAFE_INTEGER + 1,
        },
      ],
      [
        "total below 100",
        [
          { category: OperationOutcomeCategory.Success, weight: 44 },
          { category: OperationOutcomeCategory.PartialSuccess, weight: 30 },
          { category: OperationOutcomeCategory.Failure, weight: 20 },
          { category: OperationOutcomeCategory.CriticalFailure, weight: 5 },
        ],
        DomainErrorCode.OperationOutcomeResolutionTotalWeightInvalid,
        { totalWeight: 99, expectedTotalWeight: 100 },
      ],
      [
        "total above 100",
        [
          { category: OperationOutcomeCategory.Success, weight: 46 },
          { category: OperationOutcomeCategory.PartialSuccess, weight: 30 },
          { category: OperationOutcomeCategory.Failure, weight: 20 },
          { category: OperationOutcomeCategory.CriticalFailure, weight: 5 },
        ],
        DomainErrorCode.OperationOutcomeResolutionTotalWeightInvalid,
        { totalWeight: 101, expectedTotalWeight: 100 },
      ],
    ];

    for (const [caseName, outcomeBands, expectedCode, expectedFields] of cases) {
      const randomState = createTestRandomState(153);
      const result = classifyOperationOutcome({
        operation: createTestOperation({ status: OperationStatus.Resolved }),
        randomState,
        outcomeBands,
        modifierContributions: MODIFIER_CONTRIBUTIONS,
      });

      expect(result.ok, caseName).toBe(false);
      if (result.ok) {
        throw new Error("expected classification to fail");
      }
      expect(result.error).toMatchObject({
        code: expectedCode,
        ...expectedFields,
      });
      expect(randomState).toEqual(createTestRandomState(153));
      expect("events" in result.error).toBe(false);
      expect("nextRandomState" in result.error).toBe(false);
    }
  });

  it("classifies a resolved operation by delegating roll selection to the E4-06 resolver", () => {
    const randomState = createTestRandomState(153);
    const resolverResult = resolveOperationOutcome({
      operation: createTestOperation({ status: OperationStatus.Resolved }),
      randomState,
      weightedBands: CANONICAL_LOCAL_COLLECTION_BANDS.map((band) => ({
        key: band.category,
        weight: band.weight,
      })),
      modifierContributions: MODIFIER_CONTRIBUTIONS,
    });
    const classificationResult = classifyOperationOutcome({
      operation: createTestOperation({ status: OperationStatus.Resolved }),
      randomState,
      outcomeBands: CANONICAL_LOCAL_COLLECTION_BANDS,
      modifierContributions: MODIFIER_CONTRIBUTIONS,
    });

    expect(resolverResult.ok).toBe(true);
    expect(classificationResult.ok).toBe(true);
    if (!resolverResult.ok || !classificationResult.ok) {
      throw new Error("expected resolver and classifier to succeed");
    }
    expect(classificationResult.value.category).toBe(OperationOutcomeCategory.PartialSuccess);
    expect(classificationResult.value.percentileRoll).toBe(resolverResult.value.percentileRoll);
    expect(classificationResult.value.selectedBandLowerBound).toBe(
      resolverResult.value.selectedBandLowerBound,
    );
    expect(classificationResult.value.selectedBandUpperBound).toBe(
      resolverResult.value.selectedBandUpperBound,
    );
    expect(classificationResult.value.nextRandomState).toEqual(
      resolverResult.value.nextRandomState,
    );
    expect(classificationResult.value.previousRandomState).toBe(randomState);
    expect(randomState).toEqual(createTestRandomState(153));
  });

  it("rejects planned and running operations through the existing resolver path", () => {
    for (const status of [OperationStatus.Planned, OperationStatus.Running]) {
      const randomState = createTestRandomState();
      const result = classifyOperationOutcome({
        operation: createTestOperation({ status }),
        randomState,
        outcomeBands: CANONICAL_LOCAL_COLLECTION_BANDS,
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
    }
  });

  it("classifies accepted Local Collection roll boundaries", () => {
    const cases = [
      {
        roll: 1,
        seed: 32,
        category: OperationOutcomeCategory.Success,
        lowerBound: 1,
        upperBound: 45,
      },
      {
        roll: 45,
        seed: 157,
        category: OperationOutcomeCategory.Success,
        lowerBound: 1,
        upperBound: 45,
      },
      {
        roll: 46,
        seed: 153,
        category: OperationOutcomeCategory.PartialSuccess,
        lowerBound: 46,
        upperBound: 75,
      },
      {
        roll: 75,
        seed: 135,
        category: OperationOutcomeCategory.PartialSuccess,
        lowerBound: 46,
        upperBound: 75,
      },
      {
        roll: 76,
        seed: 20,
        category: OperationOutcomeCategory.Failure,
        lowerBound: 76,
        upperBound: 95,
      },
      {
        roll: 95,
        seed: 355,
        category: OperationOutcomeCategory.Failure,
        lowerBound: 76,
        upperBound: 95,
      },
      {
        roll: 96,
        seed: 64,
        category: OperationOutcomeCategory.CriticalFailure,
        lowerBound: 96,
        upperBound: 100,
      },
      {
        roll: 100,
        seed: 15,
        category: OperationOutcomeCategory.CriticalFailure,
        lowerBound: 96,
        upperBound: 100,
      },
    ];

    for (const { roll, seed, category, lowerBound, upperBound } of cases) {
      const result = createSuccessfulClassification(seed);

      expect(result.percentileRoll).toBe(roll);
      expect(result.category).toBe(category);
      expect(result.selectedBandLowerBound).toBe(lowerBound);
      expect(result.selectedBandUpperBound).toBe(upperBound);
    }
  });

  it("preserves diagnostics, order, and modifier contributions without applying formulas", () => {
    const modifierContributions = {
      base: 10,
      competence: -2,
      capability: 0,
      district: 7,
      exposure: -5,
    };
    const result = createSuccessfulClassification(153, modifierContributions);

    expect(result.outcomeBands).toEqual([
      { category: OperationOutcomeCategory.Success, weight: 45, lowerBound: 1, upperBound: 45 },
      {
        category: OperationOutcomeCategory.PartialSuccess,
        weight: 30,
        lowerBound: 46,
        upperBound: 75,
      },
      { category: OperationOutcomeCategory.Failure, weight: 20, lowerBound: 76, upperBound: 95 },
      {
        category: OperationOutcomeCategory.CriticalFailure,
        weight: 5,
        lowerBound: 96,
        upperBound: 100,
      },
    ]);
    expect(result.resolverBands.map((band) => band.key)).toEqual([
      "success",
      "partial-success",
      "failure",
      "critical-failure",
    ]);
    expect(result.modifierContributions).toEqual(modifierContributions);
    expect(result.events[1]).toMatchObject({ modifierContributions });
    expect("formattedText" in result).toBe(false);
    expect("displayText" in result).toBe(false);
  });

  it("returns identical results for identical input and matches one percentile RNG call", () => {
    const randomState = createTestRandomState(20);
    const expectedRoll = nextInt(randomState, 1, 100);

    expect(createSuccessfulClassification(20)).toEqual(createSuccessfulClassification(20));
    expect(createSuccessfulClassification(20).percentileRoll).toBe(expectedRoll.value);
    expect(createSuccessfulClassification(20).nextRandomState).toEqual(expectedRoll.state);
  });

  it("emits roll then classification events with immutable payloads and valid invariants", () => {
    const result = createSuccessfulClassification(153);

    expect(result.events.map((event) => event.type)).toEqual([
      DomainEventType.OperationOutcomeRolled,
      DomainEventType.OperationOutcomeClassified,
    ]);
    expect(result.events[1]).toEqual({
      type: DomainEventType.OperationOutcomeClassified,
      operationId: LOCAL_COLLECTION_OPERATION_ID,
      operationTemplateId: LOCAL_COLLECTION_TEMPLATE_ID,
      organizationId: STARTER_ORGANIZATION_ID,
      targetLocationId: CORNER_STORE_LOCATION_ID,
      assignedCharacterIds: [BOSS_ID],
      category: result.category,
      percentileRoll: result.percentileRoll,
      selectedBandLowerBound: result.selectedBandLowerBound,
      selectedBandUpperBound: result.selectedBandUpperBound,
      modifierContributions: result.modifierContributions,
      previousRandomState: result.previousRandomState,
      nextRandomState: result.nextRandomState,
    });

    const classifiedEvent = result.events[1];
    if (classifiedEvent?.type !== DomainEventType.OperationOutcomeClassified) {
      throw new Error("expected OperationOutcomeClassified event");
    }
    expect(Object.isFrozen(classifiedEvent)).toBe(true);
    expect(Object.isFrozen(classifiedEvent.assignedCharacterIds)).toBe(true);
    expect(Object.isFrozen(classifiedEvent.modifierContributions)).toBe(true);
    expect(Object.isFrozen(classifiedEvent.previousRandomState)).toBe(true);
    expect(Object.isFrozen(classifiedEvent.nextRandomState)).toBe(true);
    expect(() => assertDomainEventInvariant(classifiedEvent)).not.toThrow();
  });

  it("does not mutate operation state or return consequence state", () => {
    const operation = createTestOperation({ status: OperationStatus.Resolved });
    const snapshot = JSON.stringify(operation);
    const result = classifyOperationOutcome({
      operation,
      randomState: createTestRandomState(153),
      outcomeBands: CANONICAL_LOCAL_COLLECTION_BANDS,
      modifierContributions: MODIFIER_CONTRIBUTIONS,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected classification to succeed");
    }
    expect(JSON.stringify(operation)).toBe(snapshot);
    expect(operation.status).toBe(OperationStatus.Resolved);
    expect(Object.keys(result.value).sort()).toEqual([
      "category",
      "events",
      "modifierContributions",
      "nextRandomState",
      "operationId",
      "outcomeBands",
      "percentileRoll",
      "previousRandomState",
      "resolverBands",
      "selectedBandLowerBound",
      "selectedBandUpperBound",
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
const CANONICAL_LOCAL_COLLECTION_BANDS: readonly OperationOutcomeClassificationBandInput[] =
  Object.freeze([
    Object.freeze({ category: OperationOutcomeCategory.Success, weight: 45 }),
    Object.freeze({ category: OperationOutcomeCategory.PartialSuccess, weight: 30 }),
    Object.freeze({ category: OperationOutcomeCategory.Failure, weight: 20 }),
    Object.freeze({ category: OperationOutcomeCategory.CriticalFailure, weight: 5 }),
  ]);
const MODIFIER_CONTRIBUTIONS: OperationOutcomeModifierContributions = Object.freeze({
  base: 0,
  competence: 0,
  capability: 0,
  district: 0,
  exposure: 0,
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

function createSuccessfulClassification(
  seed: number,
  modifierContributions: OperationOutcomeModifierContributions = MODIFIER_CONTRIBUTIONS,
) {
  const result = classifyOperationOutcome({
    operation: createTestOperation({ status: OperationStatus.Resolved }),
    randomState: createTestRandomState(seed),
    outcomeBands: CANONICAL_LOCAL_COLLECTION_BANDS,
    modifierContributions,
  });

  if (!result.ok) {
    throw new Error("expected classification to succeed");
  }

  return result.value;
}
