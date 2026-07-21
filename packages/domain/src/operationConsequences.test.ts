import { describe, expect, it } from "vitest";

import {
  DomainErrorCode,
  DomainEventType,
  OperationOutcomeCategory,
  OperationStatus,
  assertDomainEventInvariant,
  applyLocalCollectionConsequences,
  createCharacterState,
  createOperationState,
  createOrganizationState,
  createRandomState,
  parseCharacterId,
  parseLocationId,
  parseOperationId,
  parseOperationTemplateId,
  parseOrganizationId,
  parseRandomSeed,
  parseSimulationTick,
  type AppliedOperationConsequences,
  type CharacterState,
  type ClassifiedOperationOutcome,
  type LocalCollectionConsequenceDefinitionEntry,
  type OperationState,
  type OrganizationState,
} from "./index";

describe("local collection consequence application", () => {
  it("rejects invalid consequence definitions before changing state", () => {
    const cases: readonly [
      string,
      readonly LocalCollectionConsequenceDefinitionEntry[],
      DomainErrorCode,
      Record<string, unknown>,
    ][] = [
      ["empty", [], DomainErrorCode.LocalCollectionConsequenceDefinitionEmpty, {}],
      [
        "unsupported category",
        [
          {
            category: "unsupported" as OperationOutcomeCategory,
            grossReward: 80,
            personalExposureDelta: 4,
            healthConsequence: "none",
            operationalCapacityRelease: 1,
          },
        ],
        DomainErrorCode.LocalCollectionConsequenceDefinitionCategoryUnsupported,
        { index: 0, category: "unsupported" },
      ],
      [
        "duplicate category",
        [
          canonicalConsequence(OperationOutcomeCategory.Success),
          canonicalConsequence(OperationOutcomeCategory.Success),
        ],
        DomainErrorCode.LocalCollectionConsequenceDefinitionCategoryDuplicated,
        { category: OperationOutcomeCategory.Success, firstIndex: 0, duplicateIndex: 1 },
      ],
      [
        "missing category",
        [canonicalConsequence(OperationOutcomeCategory.Success)],
        DomainErrorCode.LocalCollectionConsequenceDefinitionCategoryMissing,
        { category: OperationOutcomeCategory.PartialSuccess },
      ],
      [
        "negative reward",
        replaceConsequence(0, { grossReward: -1 }),
        DomainErrorCode.LocalCollectionConsequenceDefinitionValueInvalid,
        { index: 0, field: "grossReward", actual: -1 },
      ],
      [
        "fractional reward",
        replaceConsequence(0, { grossReward: 80.5 }),
        DomainErrorCode.LocalCollectionConsequenceDefinitionValueInvalid,
        { index: 0, field: "grossReward", actual: 80.5 },
      ],
      [
        "non-finite reward",
        replaceConsequence(0, { grossReward: Number.NaN }),
        DomainErrorCode.LocalCollectionConsequenceDefinitionValueInvalid,
        { index: 0, field: "grossReward", actual: Number.NaN },
      ],
      [
        "unsafe reward",
        replaceConsequence(0, { grossReward: Number.MAX_SAFE_INTEGER + 1 }),
        DomainErrorCode.LocalCollectionConsequenceDefinitionValueInvalid,
        { index: 0, field: "grossReward", actual: Number.MAX_SAFE_INTEGER + 1 },
      ],
      [
        "negative exposure",
        replaceConsequence(1, { personalExposureDelta: -1 }),
        DomainErrorCode.LocalCollectionConsequenceDefinitionValueInvalid,
        { index: 1, field: "personalExposureDelta", actual: -1 },
      ],
      [
        "fractional exposure",
        replaceConsequence(1, { personalExposureDelta: 10.5 }),
        DomainErrorCode.LocalCollectionConsequenceDefinitionValueInvalid,
        { index: 1, field: "personalExposureDelta", actual: 10.5 },
      ],
      [
        "non-finite exposure",
        replaceConsequence(1, { personalExposureDelta: Number.POSITIVE_INFINITY }),
        DomainErrorCode.LocalCollectionConsequenceDefinitionValueInvalid,
        { index: 1, field: "personalExposureDelta", actual: Number.POSITIVE_INFINITY },
      ],
      [
        "unsafe exposure",
        replaceConsequence(1, { personalExposureDelta: Number.MAX_SAFE_INTEGER + 1 }),
        DomainErrorCode.LocalCollectionConsequenceDefinitionValueInvalid,
        { index: 1, field: "personalExposureDelta", actual: Number.MAX_SAFE_INTEGER + 1 },
      ],
      [
        "zero capacity release",
        replaceConsequence(2, { operationalCapacityRelease: 0 }),
        DomainErrorCode.LocalCollectionConsequenceDefinitionValueInvalid,
        { index: 2, field: "operationalCapacityRelease", actual: 0 },
      ],
      [
        "negative capacity release",
        replaceConsequence(2, { operationalCapacityRelease: -1 }),
        DomainErrorCode.LocalCollectionConsequenceDefinitionValueInvalid,
        { index: 2, field: "operationalCapacityRelease", actual: -1 },
      ],
      [
        "fractional capacity release",
        replaceConsequence(2, { operationalCapacityRelease: 1.5 }),
        DomainErrorCode.LocalCollectionConsequenceDefinitionValueInvalid,
        { index: 2, field: "operationalCapacityRelease", actual: 1.5 },
      ],
      [
        "non-finite capacity release",
        replaceConsequence(2, { operationalCapacityRelease: Number.NaN }),
        DomainErrorCode.LocalCollectionConsequenceDefinitionValueInvalid,
        { index: 2, field: "operationalCapacityRelease", actual: Number.NaN },
      ],
      [
        "unsafe capacity release",
        replaceConsequence(2, { operationalCapacityRelease: Number.MAX_SAFE_INTEGER + 1 }),
        DomainErrorCode.LocalCollectionConsequenceDefinitionValueInvalid,
        { index: 2, field: "operationalCapacityRelease", actual: Number.MAX_SAFE_INTEGER + 1 },
      ],
      [
        "non-canonical capacity release",
        replaceConsequence(3, { operationalCapacityRelease: 2 }),
        DomainErrorCode.LocalCollectionConsequenceDefinitionValueInvalid,
        { index: 3, field: "operationalCapacityRelease", expected: 1, actual: 2 },
      ],
      [
        "injury on non-critical",
        replaceConsequence(0, { healthConsequence: "injured" }),
        DomainErrorCode.LocalCollectionConsequenceDefinitionHealthInvalid,
        { index: 0, category: OperationOutcomeCategory.Success, expected: "none" },
      ],
      [
        "missing critical injury",
        replaceConsequence(3, { healthConsequence: "none" }),
        DomainErrorCode.LocalCollectionConsequenceDefinitionHealthInvalid,
        { index: 3, category: OperationOutcomeCategory.CriticalFailure, expected: "injured" },
      ],
      [
        "altered canonical reward",
        replaceConsequence(0, { grossReward: 79 }),
        DomainErrorCode.LocalCollectionConsequenceDefinitionValueInvalid,
        { index: 0, field: "grossReward", expected: 80, actual: 79 },
      ],
      [
        "altered canonical exposure",
        replaceConsequence(3, { personalExposureDelta: 24 }),
        DomainErrorCode.LocalCollectionConsequenceDefinitionValueInvalid,
        { index: 3, field: "personalExposureDelta", expected: 25, actual: 24 },
      ],
    ];

    for (const [caseName, consequenceDefinition, expectedCode, expectedFields] of cases) {
      const input = createApplicationInput({ consequenceDefinition });
      const result = applyLocalCollectionConsequences(input);

      expect(result.ok, caseName).toBe(false);
      if (result.ok) {
        throw new Error("expected consequence application to fail");
      }
      expect(result.error).toMatchObject({ code: expectedCode, ...expectedFields });
      expect(input.organizations).toEqual([createTestOrganization()]);
      expect(input.characters).toEqual([createTestCharacter()]);
      expect(input.appliedConsequences).toEqual([]);
      expect("events" in result.error).toBe(false);
      expect("appliedConsequences" in result.error).toBe(false);
    }
  });

  it("rejects invalid operation and classified-outcome consistency", () => {
    const cases: readonly [
      string,
      Partial<ApplyOverrides>,
      DomainErrorCode,
      Record<string, unknown>,
    ][] = [
      [
        "planned operation",
        { operation: createTestOperation({ status: OperationStatus.Planned }) },
        DomainErrorCode.LocalCollectionConsequenceApplicationOperationNotResolved,
        { status: OperationStatus.Planned },
      ],
      [
        "running operation",
        { operation: createTestOperation({ status: OperationStatus.Running }) },
        DomainErrorCode.LocalCollectionConsequenceApplicationOperationNotResolved,
        { status: OperationStatus.Running },
      ],
      [
        "classification mismatch",
        {
          classifiedOutcome: createClassifiedOutcome({
            operationId: parseOperationId("operation:other"),
          }),
        },
        DomainErrorCode.LocalCollectionConsequenceApplicationOutcomeMismatch,
        { classifiedOutcomeOperationId: parseOperationId("operation:other") },
      ],
      [
        "missing organization",
        { organizations: [] },
        DomainErrorCode.LocalCollectionConsequenceApplicationMissingOrganization,
        { organizationId: STARTER_ORGANIZATION_ID },
      ],
      [
        "zero assigned characters",
        { operation: { ...createTestOperation(), assignedCharacterIds: [] } as OperationState },
        DomainErrorCode.LocalCollectionConsequenceApplicationInvalidAssignedCharacterCount,
        { expected: 1, actual: 0 },
      ],
      [
        "multiple assigned characters",
        {
          operation: createTestOperation({
            assignedCharacterIds: [BOSS_ID, HELPER_ID],
          }),
        },
        DomainErrorCode.LocalCollectionConsequenceApplicationInvalidAssignedCharacterCount,
        { expected: 1, actual: 2 },
      ],
      [
        "missing assigned character",
        { characters: [] },
        DomainErrorCode.LocalCollectionConsequenceApplicationMissingAssignedCharacter,
        { characterId: BOSS_ID },
      ],
      [
        "character not member",
        {
          organizations: [
            createTestOrganization({
              leaderCharacterId: HELPER_ID,
              memberCharacterIds: [HELPER_ID],
            }),
          ],
        },
        DomainErrorCode.LocalCollectionConsequenceApplicationCharacterNotMember,
        { organizationId: STARTER_ORGANIZATION_ID, characterId: BOSS_ID },
      ],
      [
        "character not assigned",
        { characters: [createTestCharacter({ assignmentState: "idle" })] },
        DomainErrorCode.LocalCollectionConsequenceApplicationCharacterNotAssigned,
        { characterId: BOSS_ID, expected: "assigned", actual: "idle" },
      ],
      [
        "already recorded",
        { appliedConsequences: [createAppliedRecord()] },
        DomainErrorCode.LocalCollectionConsequenceApplicationAlreadyRecorded,
        { operationId: LOCAL_COLLECTION_OPERATION_ID, existingRecordIndex: 0 },
      ],
    ];

    for (const [caseName, overrides, expectedCode, expectedFields] of cases) {
      const input = createApplicationInput(overrides);
      const result = applyLocalCollectionConsequences(input);

      expect(result.ok, caseName).toBe(false);
      if (result.ok) {
        throw new Error("expected consequence application to fail");
      }
      expect(result.error).toMatchObject({ code: expectedCode, ...expectedFields });
      expect("events" in result.error).toBe(false);
    }
  });

  it("applies success and partial success without charging the start cost again", () => {
    const cases = [
      {
        category: OperationOutcomeCategory.Success,
        expectedMoney: 160,
        expectedExposure: 14,
        expectedEvents: [
          DomainEventType.OrganizationMoneyChanged,
          DomainEventType.CharacterPersonalExposureChanged,
          DomainEventType.CharacterAssignmentReleased,
          DomainEventType.OrganizationOperationalCapacityReleased,
          DomainEventType.OperationConsequencesApplied,
        ],
      },
      {
        category: OperationOutcomeCategory.PartialSuccess,
        expectedMoney: 120,
        expectedExposure: 20,
        expectedEvents: [
          DomainEventType.OrganizationMoneyChanged,
          DomainEventType.CharacterPersonalExposureChanged,
          DomainEventType.CharacterAssignmentReleased,
          DomainEventType.OrganizationOperationalCapacityReleased,
          DomainEventType.OperationConsequencesApplied,
        ],
      },
    ];

    for (const { category, expectedMoney, expectedExposure, expectedEvents } of cases) {
      const result = applySuccessfully({ category });

      expect(result.organization.money).toBe(expectedMoney);
      expect(result.appliedConsequence.moneyDelta).toBe(expectedMoney - 80);
      expect(result.assignedCharacter.personalExposure).toBe(expectedExposure);
      expect(result.assignedCharacter.healthState).toBe("healthy");
      expect(result.assignedCharacter.assignmentState).toBe("idle");
      expect(result.organization.operationalCapacity).toBe(1);
      expect(result.appliedConsequences).toHaveLength(1);
      expect(result.events.map((event) => event.type)).toEqual(expectedEvents);
      expect(result.events[0]).toMatchObject({
        type: DomainEventType.OrganizationMoneyChanged,
        reason: "operation-gross-reward-paid",
        previousMoney: 80,
        currentMoney: expectedMoney,
        delta: expectedMoney - 80,
      });
    }
  });

  it("applies failure without money or health events", () => {
    const result = applySuccessfully({ category: OperationOutcomeCategory.Failure });

    expect(result.organization.money).toBe(80);
    expect(result.assignedCharacter.personalExposure).toBe(24);
    expect(result.assignedCharacter.healthState).toBe("healthy");
    expect(result.assignedCharacter.assignmentState).toBe("idle");
    expect(result.organization.operationalCapacity).toBe(1);
    expect(result.events.map((event) => event.type)).toEqual([
      DomainEventType.CharacterPersonalExposureChanged,
      DomainEventType.CharacterAssignmentReleased,
      DomainEventType.OrganizationOperationalCapacityReleased,
      DomainEventType.OperationConsequencesApplied,
    ]);
    expect(result.appliedConsequence.grossReward).toBe(0);
  });

  it("applies critical failure as recoverable injury without legal-state changes", () => {
    const result = applySuccessfully({ category: OperationOutcomeCategory.CriticalFailure });

    expect(result.organization.money).toBe(80);
    expect(result.assignedCharacter.personalExposure).toBe(35);
    expect(result.assignedCharacter.healthState).toBe("injured");
    expect(result.assignedCharacter.healthState).not.toBe("critical");
    expect(result.assignedCharacter.healthState).not.toBe("dead");
    expect(result.assignedCharacter.legalState).toBe("free");
    expect(result.assignedCharacter.assignmentState).toBe("idle");
    expect(result.organization.operationalCapacity).toBe(1);
    expect(result.events.map((event) => event.type)).toEqual([
      DomainEventType.CharacterPersonalExposureChanged,
      DomainEventType.CharacterHealthChanged,
      DomainEventType.CharacterAssignmentReleased,
      DomainEventType.OrganizationOperationalCapacityReleased,
      DomainEventType.OperationConsequencesApplied,
    ]);
  });

  it("clamps exposure while retaining requested and actual deltas", () => {
    const result = applySuccessfully({
      category: OperationOutcomeCategory.PartialSuccess,
      characters: [createTestCharacter({ personalExposure: 96 })],
    });

    expect(result.assignedCharacter.personalExposure).toBe(100);
    expect(result.appliedConsequence.requestedPersonalExposureDelta).toBe(10);
    expect(result.appliedConsequence.actualPersonalExposureDelta).toBe(4);
    expect(result.appliedConsequence.personalExposureClamped).toBe(true);
    expect(() => createCharacterState(result.assignedCharacter)).not.toThrow();
    expect(result.events[1]).toMatchObject({
      requestedDelta: 10,
      actualDelta: 4,
      currentPersonalExposure: 100,
      clamped: true,
    });
  });

  it("enforces exactly once through the applied-record collection", () => {
    const existingRecord = createAppliedRecord({
      operationId: parseOperationId("operation:existing"),
    });
    const first = applyLocalCollectionConsequences(
      createApplicationInput({ appliedConsequences: [existingRecord] }),
    );

    expect(first.ok).toBe(true);
    if (!first.ok) {
      throw new Error("expected first application to succeed");
    }
    expect(first.value.appliedConsequences).toHaveLength(2);
    expect(first.value.appliedConsequences[0]).toBe(existingRecord);
    expect(first.value.appliedConsequences[1]).toBe(first.value.appliedConsequence);

    const second = applyLocalCollectionConsequences(
      createApplicationInput({
        organizations: first.value.organizations,
        characters: first.value.characters,
        appliedConsequences: first.value.appliedConsequences,
      }),
    );

    expect(second.ok).toBe(false);
    if (second.ok) {
      throw new Error("expected second application to fail");
    }
    expect(second.error.code).toBe(
      DomainErrorCode.LocalCollectionConsequenceApplicationAlreadyRecorded,
    );
    expect(first.value.organizations[0]?.money).toBe(160);
    expect(first.value.characters[0]?.personalExposure).toBe(14);
    expect(first.value.organizations[0]?.operationalCapacity).toBe(1);
    expect("events" in second.error).toBe(false);
  });

  it("rejects unsafe money, capacity, and current health before events", () => {
    const cases: readonly [
      string,
      Partial<ApplyOverrides>,
      DomainErrorCode,
      Record<string, unknown>,
    ][] = [
      [
        "money overflow",
        {
          organizations: [
            createTestOrganization({
              money: Number.MAX_SAFE_INTEGER,
            }),
          ],
        },
        DomainErrorCode.LocalCollectionConsequenceApplicationArithmeticInvalid,
        { field: "money", previousValue: Number.MAX_SAFE_INTEGER, delta: 80 },
      ],
      [
        "capacity overflow",
        {
          organizations: [
            createTestOrganization({
              operationalCapacity: Number.MAX_SAFE_INTEGER,
            }),
          ],
          classifiedOutcome: createClassifiedOutcome({
            category: OperationOutcomeCategory.Failure,
          }),
        },
        DomainErrorCode.LocalCollectionConsequenceApplicationArithmeticInvalid,
        { field: "operationalCapacity", previousValue: Number.MAX_SAFE_INTEGER, delta: 1 },
      ],
      [
        "invalid health",
        { characters: [createTestCharacter({ healthState: "injured" })] },
        DomainErrorCode.LocalCollectionConsequenceApplicationInvalidHealth,
        { expected: "healthy", actual: "injured" },
      ],
    ];

    for (const [caseName, overrides, expectedCode, expectedFields] of cases) {
      const result = applyLocalCollectionConsequences(createApplicationInput(overrides));

      expect(result.ok, caseName).toBe(false);
      if (result.ok) {
        throw new Error("expected consequence application to fail");
      }
      expect(result.error).toMatchObject({ code: expectedCode, ...expectedFields });
      expect("events" in result.error).toBe(false);
    }
  });

  it("preserves inputs, collection order, unrelated identities, and excludes orchestration state", () => {
    const organization = createTestOrganization();
    const rivalOrganization = createTestOrganization({
      organizationId: parseOrganizationId("organization:rival"),
      displayName: "Rival Crew",
      leaderCharacterId: HELPER_ID,
      memberCharacterIds: [HELPER_ID],
    });
    const character = createTestCharacter();
    const helper = createTestCharacter({
      characterId: HELPER_ID,
      displayName: "Helper",
      assignmentState: "idle",
    });
    const operation = createTestOperation();
    const classifiedOutcome = createClassifiedOutcome();
    const input = createApplicationInput({
      operation,
      classifiedOutcome,
      organizations: [rivalOrganization, organization],
      characters: [helper, character],
    });
    const organizationSnapshot = JSON.stringify(organization);
    const characterSnapshot = JSON.stringify(character);
    const operationSnapshot = JSON.stringify(operation);
    const classificationSnapshot = JSON.stringify(classifiedOutcome);
    const result = applyLocalCollectionConsequences(input);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected consequence application to succeed");
    }
    expect(JSON.stringify(organization)).toBe(organizationSnapshot);
    expect(JSON.stringify(character)).toBe(characterSnapshot);
    expect(JSON.stringify(operation)).toBe(operationSnapshot);
    expect(JSON.stringify(classifiedOutcome)).toBe(classificationSnapshot);
    expect(result.value.organizations[0]).toBe(rivalOrganization);
    expect(result.value.organizations[1]).toBe(result.value.organization);
    expect(result.value.characters[0]).toBe(helper);
    expect(result.value.characters[1]).toBe(result.value.assignedCharacter);
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.organizations)).toBe(true);
    expect(Object.isFrozen(result.value.characters)).toBe(true);
    expect(Object.isFrozen(result.value.appliedConsequence)).toBe(true);
    expect(Object.isFrozen(result.value.appliedConsequence.releasedCharacterIds)).toBe(true);
    expect(Object.isFrozen(result.value.appliedConsequences)).toBe(true);
    expect(Object.isFrozen(result.value.events)).toBe(true);
    expect("gameState" in result.value).toBe(false);
    expect("operations" in result.value).toBe(false);
    expect("randomState" in result.value).toBe(false);
  });

  it("emits valid immutable consequence events and supports both money-change reasons", () => {
    const result = applySuccessfully();

    for (const event of result.events) {
      expect(Object.isFrozen(event)).toBe(true);
      expect(() => assertDomainEventInvariant(event)).not.toThrow();
    }
    expect(() =>
      assertDomainEventInvariant({
        ...result.events[1],
        category: "unsupported",
      } as never),
    ).toThrow();
    expect(() =>
      assertDomainEventInvariant({
        ...result.events[1],
        requestedDelta: -1,
      } as never),
    ).toThrow();
    expect(() =>
      assertDomainEventInvariant({
        type: DomainEventType.OrganizationMoneyChanged,
        organizationId: STARTER_ORGANIZATION_ID,
        operationId: LOCAL_COLLECTION_OPERATION_ID,
        reason: "operation-start-cost-paid",
        previousMoney: 100,
        currentMoney: 80,
        delta: -20,
      } as never),
    ).not.toThrow();
    expect(result.events.at(-1)).toMatchObject({
      type: DomainEventType.OperationConsequencesApplied,
      operationId: LOCAL_COLLECTION_OPERATION_ID,
      operationTemplateId: LOCAL_COLLECTION_TEMPLATE_ID,
      organizationId: STARTER_ORGANIZATION_ID,
      targetLocationId: CORNER_STORE_LOCATION_ID,
      releasedCharacterIds: [BOSS_ID],
      category: OperationOutcomeCategory.Success,
      grossReward: 80,
      requestedPersonalExposureDelta: 4,
      actualPersonalExposureDelta: 4,
      healthConsequence: "none",
      operationalCapacityReleased: 1,
    });
  });
});

interface ApplyOverrides {
  readonly operation: OperationState;
  readonly classifiedOutcome: ClassifiedOperationOutcome;
  readonly consequenceDefinition: readonly LocalCollectionConsequenceDefinitionEntry[];
  readonly organizations: readonly OrganizationState[];
  readonly characters: readonly CharacterState[];
  readonly appliedConsequences: readonly AppliedOperationConsequences[];
}

const STARTER_ORGANIZATION_ID = parseOrganizationId("organization:starter_crew");
const BOSS_ID = parseCharacterId("character:boss_001");
const HELPER_ID = parseCharacterId("character:helper_001");
const CORNER_STORE_LOCATION_ID = parseLocationId("location:corner_store");
const LOCAL_COLLECTION_TEMPLATE_ID = parseOperationTemplateId(
  "operation-template:local_collection",
);
const LOCAL_COLLECTION_OPERATION_ID = parseOperationId("operation:local_collection_001");
const PLANNED_AT_TICK = parseSimulationTick(4);
const COMPLETION_TICK = parseSimulationTick(10);

const LOCAL_COLLECTION_CONSEQUENCE_DEFINITION: readonly LocalCollectionConsequenceDefinitionEntry[] =
  Object.freeze([
    canonicalConsequence(OperationOutcomeCategory.Success),
    canonicalConsequence(OperationOutcomeCategory.PartialSuccess),
    canonicalConsequence(OperationOutcomeCategory.Failure),
    canonicalConsequence(OperationOutcomeCategory.CriticalFailure),
  ]);

function canonicalConsequence(
  category: OperationOutcomeCategory,
): LocalCollectionConsequenceDefinitionEntry {
  const values = {
    [OperationOutcomeCategory.Success]: {
      grossReward: 80,
      personalExposureDelta: 4,
      healthConsequence: "none",
      operationalCapacityRelease: 1,
    },
    [OperationOutcomeCategory.PartialSuccess]: {
      grossReward: 40,
      personalExposureDelta: 10,
      healthConsequence: "none",
      operationalCapacityRelease: 1,
    },
    [OperationOutcomeCategory.Failure]: {
      grossReward: 0,
      personalExposureDelta: 14,
      healthConsequence: "none",
      operationalCapacityRelease: 1,
    },
    [OperationOutcomeCategory.CriticalFailure]: {
      grossReward: 0,
      personalExposureDelta: 25,
      healthConsequence: "injured",
      operationalCapacityRelease: 1,
    },
  } as const;

  return Object.freeze({
    category,
    ...values[category],
  });
}

function replaceConsequence(
  index: number,
  overrides: Partial<LocalCollectionConsequenceDefinitionEntry>,
): readonly LocalCollectionConsequenceDefinitionEntry[] {
  return Object.freeze(
    LOCAL_COLLECTION_CONSEQUENCE_DEFINITION.map((entry, entryIndex) =>
      Object.freeze(entryIndex === index ? { ...entry, ...overrides } : { ...entry }),
    ),
  );
}

function createApplicationInput(
  overrides: Partial<ApplyOverrides> = {},
): ApplyLocalCollectionConsequencesInput {
  return {
    operation: createTestOperation(),
    classifiedOutcome: createClassifiedOutcome(),
    consequenceDefinition: LOCAL_COLLECTION_CONSEQUENCE_DEFINITION,
    organizations: [createTestOrganization()],
    characters: [createTestCharacter()],
    appliedConsequences: [],
    ...overrides,
  };
}

type ApplyLocalCollectionConsequencesInput = Parameters<typeof applyLocalCollectionConsequences>[0];

interface ApplySuccessOverrides extends Partial<ApplyOverrides> {
  readonly category?: OperationOutcomeCategory;
}

function applySuccessfully(overrides: ApplySuccessOverrides = {}) {
  const { category, classifiedOutcome, ...inputOverrides } = overrides;
  const result = applyLocalCollectionConsequences(
    createApplicationInput({
      ...inputOverrides,
      classifiedOutcome:
        classifiedOutcome ?? createClassifiedOutcome(category === undefined ? {} : { category }),
    }),
  );

  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("expected consequence application to succeed");
  }

  return result.value;
}

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

function createTestOrganization(
  overrides: Partial<Parameters<typeof createOrganizationState>[0]> = {},
): OrganizationState {
  return createOrganizationState({
    organizationId: STARTER_ORGANIZATION_ID,
    displayName: "Starter Crew",
    leaderCharacterId: BOSS_ID,
    memberCharacterIds: [BOSS_ID],
    money: 80,
    operationalCapacity: 0,
    ...overrides,
  });
}

function createTestCharacter(
  overrides: Partial<Parameters<typeof createCharacterState>[0]> = {},
): CharacterState {
  return createCharacterState({
    characterId: BOSS_ID,
    displayName: "Boss",
    capabilityTags: ["streetwise"],
    healthState: "healthy",
    legalState: "free",
    assignmentState: "assigned",
    competence: 50,
    loyalty: 50,
    personalExposure: 10,
    ...overrides,
  });
}

function createClassifiedOutcome(
  overrides: Partial<ClassifiedOperationOutcome> = {},
): ClassifiedOperationOutcome {
  const randomState = createRandomState(parseRandomSeed(123));

  return Object.freeze({
    operationId: LOCAL_COLLECTION_OPERATION_ID,
    category: OperationOutcomeCategory.Success,
    percentileRoll: 1,
    selectedBandLowerBound: 1,
    selectedBandUpperBound: 45,
    outcomeBands: [],
    resolverBands: [],
    modifierContributions: Object.freeze({
      base: 0,
      competence: 0,
      capability: 0,
      district: 0,
      exposure: 0,
    }),
    previousRandomState: randomState,
    nextRandomState: randomState,
    events: [],
    ...overrides,
  });
}

function createAppliedRecord(
  overrides: Partial<AppliedOperationConsequences> = {},
): AppliedOperationConsequences {
  return Object.freeze({
    operationId: LOCAL_COLLECTION_OPERATION_ID,
    operationTemplateId: LOCAL_COLLECTION_TEMPLATE_ID,
    organizationId: STARTER_ORGANIZATION_ID,
    assignedCharacterId: BOSS_ID,
    releasedCharacterIds: Object.freeze([BOSS_ID]),
    category: OperationOutcomeCategory.Success,
    grossReward: 80,
    previousOrganizationMoney: 80,
    currentOrganizationMoney: 160,
    moneyDelta: 80,
    requestedPersonalExposureDelta: 4,
    actualPersonalExposureDelta: 4,
    previousPersonalExposure: 10,
    currentPersonalExposure: 14,
    personalExposureClamped: false,
    healthConsequence: "none",
    previousHealthState: "healthy",
    currentHealthState: "healthy",
    previousAssignmentState: "assigned",
    currentAssignmentState: "idle",
    operationalCapacityReleased: 1,
    previousOperationalCapacity: 0,
    currentOperationalCapacity: 1,
    ...overrides,
  });
}
