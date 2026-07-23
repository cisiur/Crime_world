import { describe, expect, it } from "vitest";

import {
  DomainErrorCode,
  DomainEventType,
  MINUTES_PER_TICK,
  MoneyTransactionCategory,
  MoneyTransactionSourceType,
  OperationAvailabilityReason,
  OperationStatus,
  createBusinessState,
  createCharacterState,
  createOperationState,
  createOrganizationState,
  createPlanOperationCommand,
  parseBusinessId,
  parseCharacterId,
  parseLocationId,
  parseOperationId,
  parseOperationTemplateId,
  parseOrganizationId,
  parseSimulationTick,
  parseTransactionId,
  planOperation,
  type BusinessState,
  type CharacterId,
  type CharacterState,
  type LocationState,
  type OperationAvailabilityLocationDefinitionInput,
  type OperationPlanningTemplateInput,
  type OperationPlanningAvailabilityRejectedError,
  type OperationState,
  type OrganizationState,
  type PlanOperationInput,
} from "./index";

describe("operation planning", () => {
  it("plans a valid Local Collection operation and atomically reserves crew and resources", () => {
    const input = createValidPlanningInput();
    const snapshot = JSON.stringify(input);
    const result = planOperation(input);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected planning to succeed");
    }

    expect(JSON.stringify(input)).toBe(snapshot);
    expect(result.value.operations).toHaveLength(1);
    expect(result.value.operation).toEqual({
      operationId: LOCAL_COLLECTION_OPERATION_ID,
      operationTemplateId: LOCAL_COLLECTION_TEMPLATE_ID,
      organizationId: STARTER_ORGANIZATION_ID,
      targetLocationId: CORNER_STORE_LOCATION_ID,
      assignedCharacterIds: [BOSS_ID],
      status: OperationStatus.Planned,
      plannedAtTick: CURRENT_TICK,
      plannedCompletionTick: parseSimulationTick(10),
    });
    expect(result.value.operation.plannedCompletionTick).toBe(
      CURRENT_TICK + LOCAL_COLLECTION_DURATION_MINUTES / MINUTES_PER_TICK,
    );
    expect(result.value.operation.status).not.toBe(OperationStatus.Running);
    expect(result.value.operation.status).not.toBe(OperationStatus.Resolved);

    expect(result.value.assignedCharacter.assignmentState).toBe("assigned");
    expect(result.value.characters).toEqual([
      { ...input.characters[0], assignmentState: "assigned" },
      input.characters[1],
    ]);
    expect(result.value.characters[1]).toBe(input.characters[1]);
    expect(result.value.organization.operationalCapacity).toBe(0);
    expect(result.value.organization.money).toBe(80);
    expect(result.value.organization.money).toBe(input.organizations[0]!.money - 20);
    expect(result.value.organizations).toEqual([result.value.organization]);
    expect(result.value.transactions).toHaveLength(1);
    expect(result.value.startCostTransaction).toEqual({
      transactionId: START_COST_TRANSACTION_ID,
      organizationId: STARTER_ORGANIZATION_ID,
      recordedAtTick: CURRENT_TICK,
      amount: -20,
      balanceBefore: 100,
      balanceAfter: 80,
      category: MoneyTransactionCategory.OperationCost,
      source: {
        type: MoneyTransactionSourceType.OperationStartCost,
        operationId: LOCAL_COLLECTION_OPERATION_ID,
      },
    });
    expect(result.value.transactions[0]).toBe(result.value.startCostTransaction);
  });

  it("emits deterministic semantic planning events with resource-change payloads", () => {
    const result = planOperation(createValidPlanningInput());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected planning to succeed");
    }

    expect(result.value.events.map((event) => event.type)).toEqual([
      DomainEventType.OperationPlanned,
      DomainEventType.CharacterAssignedToOperation,
      DomainEventType.OrganizationOperationalCapacityReserved,
      DomainEventType.OrganizationMoneyTransactionRecorded,
    ]);
    expect(result.value.events).toEqual([
      {
        type: DomainEventType.OperationPlanned,
        operationId: LOCAL_COLLECTION_OPERATION_ID,
        operationTemplateId: LOCAL_COLLECTION_TEMPLATE_ID,
        organizationId: STARTER_ORGANIZATION_ID,
        targetLocationId: CORNER_STORE_LOCATION_ID,
        assignedCharacterIds: [BOSS_ID],
        plannedAtTick: CURRENT_TICK,
        plannedCompletionTick: parseSimulationTick(10),
      },
      {
        type: DomainEventType.CharacterAssignedToOperation,
        characterId: BOSS_ID,
        operationId: LOCAL_COLLECTION_OPERATION_ID,
        previousAssignmentState: "idle",
        currentAssignmentState: "assigned",
      },
      {
        type: DomainEventType.OrganizationOperationalCapacityReserved,
        organizationId: STARTER_ORGANIZATION_ID,
        operationId: LOCAL_COLLECTION_OPERATION_ID,
        previousOperationalCapacity: 1,
        currentOperationalCapacity: 0,
        delta: -1,
      },
      {
        type: DomainEventType.OrganizationMoneyTransactionRecorded,
        transactionId: START_COST_TRANSACTION_ID,
        organizationId: STARTER_ORGANIZATION_ID,
        category: MoneyTransactionCategory.OperationCost,
        source: {
          type: MoneyTransactionSourceType.OperationStartCost,
          operationId: LOCAL_COLLECTION_OPERATION_ID,
        },
        amount: -20,
        previousMoney: 100,
        currentMoney: 80,
        recordedAtTick: CURRENT_TICK,
      },
    ]);
    expect(
      result.value.events.some((event) => event.type === DomainEventType.OrganizationMoneyChanged),
    ).toBe(false);
  });

  it("returns identical results for repeated execution with structurally identical input", () => {
    expect(planOperation(createValidPlanningInput())).toEqual(
      planOperation(createValidPlanningInput()),
    );
  });

  it("rejects every relevant availability failure and retains typed reasons", () => {
    const cases: readonly [
      string,
      Partial<PlanOperationInput>,
      readonly OperationAvailabilityReason[],
    ][] = [
      [
        "template mismatch",
        { operationTemplates: [] },
        [OperationAvailabilityReason.TemplateMismatch],
      ],
      [
        "organization missing",
        { organizations: [] },
        [OperationAvailabilityReason.OrganizationMissing],
      ],
      ["character missing", { characters: [] }, [OperationAvailabilityReason.CharacterMissing]],
      [
        "character not member",
        {
          command: createCommand({ assignedCharacterId: OUTSIDER_ID }),
          characters: [createAvailableCharacter(OUTSIDER_ID)],
        },
        [OperationAvailabilityReason.CharacterNotMember],
      ],
      [
        "character unavailable",
        { characters: [createAvailableCharacter(BOSS_ID, { assignmentState: "assigned" })] },
        [OperationAvailabilityReason.CharacterUnavailable],
      ],
      [
        "insufficient money",
        { organizations: [createStarterOrganization({ money: 19 })] },
        [OperationAvailabilityReason.InsufficientMoney],
      ],
      [
        "insufficient operational capacity",
        { organizations: [createStarterOrganization({ operationalCapacity: 0 })] },
        [OperationAvailabilityReason.InsufficientOperationalCapacity],
      ],
      [
        "invalid runtime target",
        { locationStates: [] },
        [OperationAvailabilityReason.InvalidTarget],
      ],
      [
        "invalid authored target",
        { locationDefinitions: [] },
        [OperationAvailabilityReason.InvalidTarget],
      ],
      [
        "invalid target kind",
        { locationDefinitions: [createLocationDefinition({ kind: "hideout" })] },
        [OperationAvailabilityReason.InvalidTargetKind],
      ],
      [
        "explicit target mismatch",
        {
          operationTemplates: [
            createLocalCollectionTemplate({
              allowedTargetIds: [parseLocationId("location:small_garage")],
            }),
          ],
        },
        [OperationAvailabilityReason.TemplateMismatch],
      ],
      [
        "target already owned",
        { locationStates: [createLocationState({ ownerOrganizationId: STARTER_ORGANIZATION_ID })] },
        [OperationAvailabilityReason.TargetAlreadyOwned],
      ],
      [
        "business already owned",
        {
          businessStates: [
            createCornerStoreBusiness({ ownerOrganizationId: STARTER_ORGANIZATION_ID }),
          ],
        },
        [OperationAvailabilityReason.BusinessAlreadyOwned],
      ],
    ];

    for (const [caseName, overrides, expectedReasons] of cases) {
      const result = planOperation(createValidPlanningInput(overrides));

      expect(result.ok, caseName).toBe(false);
      if (result.ok) {
        throw new Error("expected planning to fail");
      }
      const error = expectAvailabilityRejected(result.error);
      expect(error.reasons).toEqual(expectedReasons);
      for (const reason of error.reasons) {
        expect(Object.values(OperationAvailabilityReason)).toContain(reason);
      }
    }
  });

  it("rejects duplicate operation IDs separately from availability", () => {
    const input = createValidPlanningInput({
      operations: [createExistingOperation(LOCAL_COLLECTION_OPERATION_ID)],
    });
    const result = planOperation(input);

    expect(result).toEqual({
      ok: false,
      error: {
        code: DomainErrorCode.OperationPlanningDuplicateOperationId,
        message: `Operation "${LOCAL_COLLECTION_OPERATION_ID}" already exists.`,
        operationId: LOCAL_COLLECTION_OPERATION_ID,
      },
    });
  });

  it("leaves supplied state unchanged and emits no events on failure", () => {
    const input = createValidPlanningInput({
      organizations: [createStarterOrganization({ money: 19 })],
    });
    const snapshot = JSON.stringify(input);
    const result = planOperation(input);

    expect(result.ok).toBe(false);
    expect(JSON.stringify(input)).toBe(snapshot);
    expect(input.organizations[0]!.money).toBe(19);
    expect(input.characters[0]!.assignmentState).toBe("idle");
    expect(input.operations).toEqual([]);
    expect(input.transactions).toEqual([]);
    if (!result.ok) {
      expect("events" in result.error).toBe(false);
    }
  });

  it("uses returned state for later availability checks", () => {
    const firstResult = planOperation(createValidPlanningInput());

    expect(firstResult.ok).toBe(true);
    if (!firstResult.ok) {
      throw new Error("expected first planning attempt to succeed");
    }

    const secondResult = planOperation(
      createValidPlanningInput({
        command: createCommand({ operationId: parseOperationId("operation:local_collection_002") }),
        organizations: firstResult.value.organizations,
        characters: firstResult.value.characters,
        operations: firstResult.value.operations,
        transactions: firstResult.value.transactions,
      }),
    );

    expect(secondResult.ok).toBe(false);
    if (secondResult.ok) {
      throw new Error("expected second planning attempt to fail");
    }
    expect(expectAvailabilityRejected(secondResult.error).reasons).toEqual([
      OperationAvailabilityReason.InsufficientOperationalCapacity,
      OperationAvailabilityReason.CharacterUnavailable,
    ]);
  });

  it("charges the start cost only once when planning succeeds", () => {
    const firstResult = planOperation(
      createValidPlanningInput({
        organizations: [createStarterOrganization({ money: 20, operationalCapacity: 2 })],
      }),
    );

    expect(firstResult.ok).toBe(true);
    if (!firstResult.ok) {
      throw new Error("expected first planning attempt to succeed");
    }
    expect(firstResult.value.organization.money).toBe(0);
    expect(firstResult.value.transactions).toHaveLength(1);

    const secondResult = planOperation(
      createValidPlanningInput({
        command: createCommand({
          operationId: parseOperationId("operation:local_collection_002"),
          assignedCharacterId: HELPER_ID,
        }),
        organizations: firstResult.value.organizations,
        characters: firstResult.value.characters,
        operations: firstResult.value.operations,
        transactions: firstResult.value.transactions,
      }),
    );

    expect(secondResult.ok).toBe(false);
    expect(firstResult.value.organization.money).toBe(0);
    if (!secondResult.ok) {
      expect(expectAvailabilityRejected(secondResult.error).reasons).toEqual([
        OperationAvailabilityReason.InsufficientMoney,
      ]);
    }
  });

  it("rejects duplicate start-cost transaction IDs atomically", () => {
    const firstResult = planOperation(createValidPlanningInput());

    expect(firstResult.ok).toBe(true);
    if (!firstResult.ok) {
      throw new Error("expected first planning attempt to succeed");
    }

    const input = createValidPlanningInput({
      command: createCommand({
        operationId: parseOperationId("operation:local_collection_duplicate_transaction"),
      }),
      transactions: firstResult.value.transactions,
    });
    const snapshot = JSON.stringify(input);
    const result = planOperation(input);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.MoneyTransactionDuplicateTransactionId);
    }
    expect(JSON.stringify(input)).toBe(snapshot);
    expect(input.organizations[0]?.money).toBe(100);
    expect(input.characters[0]?.assignmentState).toBe("idle");
    expect(input.operations).toEqual([]);
    expect(input.transactions).toHaveLength(1);
  });

  it("rejects planning data with a duration that cannot map to whole ticks", () => {
    const result = planOperation(
      createValidPlanningInput({
        operationTemplates: [createLocalCollectionTemplate({ durationMinutes: 55 })],
      }),
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: DomainErrorCode.OperationPlanningInvalidData,
        message: `Operation duration must be a positive safe integer divisible by ${MINUTES_PER_TICK} minutes per tick.`,
        field: "durationMinutes",
      },
    });
  });
});

const STARTER_ORGANIZATION_ID = parseOrganizationId("organization:starter_crew");
const BOSS_ID = parseCharacterId("character:boss_001");
const HELPER_ID = parseCharacterId("character:helper_001");
const OUTSIDER_ID = parseCharacterId("character:outsider");
const CORNER_STORE_LOCATION_ID = parseLocationId("location:corner_store");
const CORNER_STORE_BUSINESS_ID = parseBusinessId("business:corner_store");
const LOCAL_COLLECTION_TEMPLATE_ID = parseOperationTemplateId(
  "operation-template:local_collection",
);
const LOCAL_COLLECTION_OPERATION_ID = parseOperationId("operation:local_collection_001");
const START_COST_TRANSACTION_ID = parseTransactionId("transaction:local_collection_001:start_cost");
const CURRENT_TICK = parseSimulationTick(4);
const LOCAL_COLLECTION_DURATION_MINUTES = 60;

function createValidPlanningInput(overrides: Partial<PlanOperationInput> = {}): PlanOperationInput {
  return {
    command: createCommand(),
    currentTick: CURRENT_TICK,
    operationTemplates: [createLocalCollectionTemplate()],
    organizations: [createStarterOrganization()],
    characters: [createAvailableCharacter(BOSS_ID), createAvailableCharacter(HELPER_ID)],
    locationStates: [createLocationState()],
    locationDefinitions: [createLocationDefinition()],
    businessStates: [createCornerStoreBusiness()],
    operations: [],
    transactions: [],
    ...overrides,
  };
}

function createCommand(overrides: Partial<Parameters<typeof createPlanOperationCommand>[0]> = {}) {
  return createPlanOperationCommand({
    operationId: LOCAL_COLLECTION_OPERATION_ID,
    operationTemplateId: LOCAL_COLLECTION_TEMPLATE_ID,
    organizationId: STARTER_ORGANIZATION_ID,
    targetLocationId: CORNER_STORE_LOCATION_ID,
    assignedCharacterId: BOSS_ID,
    startCostTransactionId: START_COST_TRANSACTION_ID,
    ...overrides,
  });
}

function createLocalCollectionTemplate(
  overrides: Partial<OperationPlanningTemplateInput> = {},
): OperationPlanningTemplateInput {
  return {
    id: LOCAL_COLLECTION_TEMPLATE_ID,
    allowedTargetKinds: ["shop-or-service"],
    allowedTargetIds: [CORNER_STORE_LOCATION_ID],
    durationMinutes: LOCAL_COLLECTION_DURATION_MINUTES,
    startCost: 20,
    operationalCapacityCost: 1,
    ...overrides,
  };
}

function createStarterOrganization(
  overrides: Partial<Parameters<typeof createOrganizationState>[0]> = {},
): OrganizationState {
  return createOrganizationState({
    organizationId: STARTER_ORGANIZATION_ID,
    displayName: "Starter Crew",
    leaderCharacterId: BOSS_ID,
    memberCharacterIds: [BOSS_ID, HELPER_ID],
    money: 100,
    operationalCapacity: 1,
    ...overrides,
  });
}

function createAvailableCharacter(
  characterId: CharacterId,
  overrides: Partial<Parameters<typeof createCharacterState>[0]> = {},
): CharacterState {
  return createCharacterState({
    characterId,
    displayName: characterId === BOSS_ID ? "Mara Voss" : "Niko Vale",
    capabilityTags: ["streetwise"],
    healthState: "healthy",
    legalState: "free",
    assignmentState: "idle",
    competence: 50,
    loyalty: 50,
    personalExposure: 0,
    ...overrides,
  });
}

function createLocationState(overrides: Partial<LocationState> = {}): LocationState {
  return {
    locationId: CORNER_STORE_LOCATION_ID,
    enabled: true,
    ownerOrganizationId: null,
    businessId: CORNER_STORE_BUSINESS_ID,
    ...overrides,
  };
}

function createLocationDefinition(
  overrides: Partial<OperationAvailabilityLocationDefinitionInput> = {},
): OperationAvailabilityLocationDefinitionInput {
  return {
    id: CORNER_STORE_LOCATION_ID,
    kind: "shop-or-service",
    ...overrides,
  };
}

function createCornerStoreBusiness(overrides: Partial<BusinessState> = {}): BusinessState {
  return createBusinessState({
    businessId: CORNER_STORE_BUSINESS_ID,
    locationId: CORNER_STORE_LOCATION_ID,
    ownerOrganizationId: null,
    ...overrides,
  });
}

function createExistingOperation(operationId = LOCAL_COLLECTION_OPERATION_ID): OperationState {
  return createOperationState({
    operationId,
    operationTemplateId: LOCAL_COLLECTION_TEMPLATE_ID,
    organizationId: STARTER_ORGANIZATION_ID,
    targetLocationId: CORNER_STORE_LOCATION_ID,
    assignedCharacterIds: [BOSS_ID],
    status: OperationStatus.Planned,
    plannedAtTick: CURRENT_TICK,
    plannedCompletionTick: parseSimulationTick(10),
  });
}

function expectAvailabilityRejected(error: {
  readonly code: string;
}): OperationPlanningAvailabilityRejectedError {
  expect(error.code).toBe(DomainErrorCode.OperationPlanningAvailabilityRejected);
  return error as OperationPlanningAvailabilityRejectedError;
}
