import { describe, expect, it } from "vitest";

import {
  canonicalMvpCityDefinition,
  localCollectionConsequenceDefinition,
  localCollectionOperationTemplateDefinition,
  localCollectionOutcomeBands,
} from "@crimeworld/content";
import {
  DomainErrorCode,
  DomainEventType,
  MoneyTransactionCategory,
  MoneyTransactionSourceType,
  OperationOutcomeCategory,
  OperationStatus,
  applyLocalCollectionConsequences,
  assertDomainEventInvariant,
  classifyOperationOutcome,
  createBusinessState,
  createCharacterState,
  createCityState,
  createOrganizationState,
  createPlanOperationCommand,
  createRandomState,
  evaluateOperationAvailability,
  nextInt,
  parseBusinessId,
  parseCharacterId,
  parseOperationId,
  parseOrganizationId,
  parseRandomSeed,
  parseSimulationTick,
  parseTransactionId,
  planOperation,
  advanceOperationLifecycles,
  type AppliedOperationConsequences,
  type ApplyLocalCollectionConsequencesSuccess,
  type CharacterState,
  type ClassifiedOperationOutcome,
  type DomainError,
  type DomainEvent,
  type DomainResult,
  type LocationState,
  type MoneyTransaction,
  type OperationState,
  type OperationOutcomeModifierContributions,
  type OrganizationState,
  type PlanOperationSuccess,
  type RandomState,
  type SimulationTick,
} from "@crimeworld/domain";

describe("Local Collection vertical-slice integration", () => {
  it("composes availability, planning, lifecycle, classification, and consequences for success", () => {
    const result = runLocalCollectionVerticalSlice({
      seed: 32,
      initialOrganizationMoney: 100,
      initialOperationalCapacity: 1,
      initialCharacterExposure: 0,
      planningTick: parseSimulationTick(4),
      operationId: LOCAL_COLLECTION_OPERATION_ID,
    });

    expect(result.availability.available).toBe(true);
    expect(result.availability.reasons).toEqual([]);
    expect(result.planning.operation).toBe(result.planning.operations[0]);
    expect(result.planning.operation.status).toBe(OperationStatus.Planned);
    expect(result.planning.operation.plannedAtTick).toBe(parseSimulationTick(4));
    expect(result.planning.operation.plannedCompletionTick).toBe(parseSimulationTick(10));
    expect(result.planning.assignedCharacter.assignmentState).toBe("assigned");
    expect(result.planning.organization.operationalCapacity).toBe(0);
    expect(result.planning.organization.money).toBe(80);
    expect(result.planning.transactions).toHaveLength(1);
    expect(result.planning.startCostTransaction).toMatchObject({
      transactionId: START_COST_TRANSACTION_ID,
      amount: -20,
      balanceBefore: 100,
      balanceAfter: 80,
      category: MoneyTransactionCategory.OperationCost,
      source: {
        type: MoneyTransactionSourceType.OperationStartCost,
        operationId: LOCAL_COLLECTION_OPERATION_ID,
      },
    });
    expect(result.planning.events.map((event) => event.type)).toEqual([
      DomainEventType.OperationPlanned,
      DomainEventType.CharacterAssignedToOperation,
      DomainEventType.OrganizationOperationalCapacityReserved,
      DomainEventType.OrganizationMoneyTransactionRecorded,
    ]);
    expect(result.planning.events.at(-1)).toMatchObject({
      transactionId: START_COST_TRANSACTION_ID,
      amount: -20,
      previousMoney: 100,
      currentMoney: 80,
    });
    expect(result.initial.locationStates).toEqual(result.locationStatesAfterFlow);
    expect(result.initial.businessStates).toEqual(result.businessStatesAfterFlow);

    expect(result.lifecycle.atPlanningTick.operations[0]).toBe(result.planning.operation);
    expect(result.lifecycle.atPlanningTick.events).toEqual([]);
    expect(result.lifecycle.runningOperation.status).toBe(OperationStatus.Running);
    expect(result.lifecycle.resolvedOperation.status).toBe(OperationStatus.Resolved);
    expect(result.lifecycle.afterResolvedAgain.operations[0]).toBe(
      result.lifecycle.resolvedOperation,
    );
    expect(result.lifecycle.afterResolvedAgain.events).toEqual([]);
    expect(result.lifecycle.start.events.map((event) => event.type)).toEqual([
      DomainEventType.OperationStarted,
    ]);
    expect(result.lifecycle.complete.events.map((event) => event.type)).toEqual([
      DomainEventType.OperationLifecycleCompleted,
    ]);
    expect(result.planning.organizations).toEqual([result.planning.organization]);
    expect(result.planning.characters).toEqual([result.planning.assignedCharacter]);

    expect(result.classification.operationId).toBe(result.lifecycle.resolvedOperation.operationId);
    expect(result.classification.category).toBe(OperationOutcomeCategory.Success);
    expect(result.classification.percentileRoll).toBe(1);
    expect(result.classification.previousRandomState).toBe(result.initial.randomState);
    expect(result.classification.nextRandomState).toEqual(
      nextInt(result.initial.randomState, 1, 100).state,
    );
    expect(result.classification.events.map((event) => event.type)).toEqual([
      DomainEventType.OperationOutcomeRolled,
      DomainEventType.OperationOutcomeClassified,
    ]);
    expect(result.classification.selectedBandLowerBound).toBe(1);
    expect(result.classification.selectedBandUpperBound).toBe(45);
    expect(result.classification.outcomeBands).toContainEqual({
      category: OperationOutcomeCategory.Success,
      weight: 45,
      lowerBound: 1,
      upperBound: 45,
    });

    expect(result.consequences.appliedConsequence.operationId).toBe(
      result.classification.operationId,
    );
    expect(result.consequences.appliedConsequence.category).toBe(result.classification.category);
    expect(result.finalRandomState).toEqual(result.classification.nextRandomState);
    expect(result.consequences.organization.money).toBe(160);
    expect(result.consequences.transactions).toHaveLength(2);
    expect(result.consequences.grossRewardTransaction).toMatchObject({
      transactionId: GROSS_REWARD_TRANSACTION_ID,
      amount: 80,
      balanceBefore: 80,
      balanceAfter: 160,
      category: MoneyTransactionCategory.OperationReward,
      source: {
        type: MoneyTransactionSourceType.OperationGrossReward,
        operationId: LOCAL_COLLECTION_OPERATION_ID,
      },
    });
    expect(result.consequences.organization.operationalCapacity).toBe(1);
    expect(result.consequences.assignedCharacter.personalExposure).toBe(4);
    expect(result.consequences.assignedCharacter.healthState).toBe("healthy");
    expect(result.consequences.assignedCharacter.legalState).toBe("free");
    expect(result.consequences.assignedCharacter.assignmentState).toBe("idle");
    expect(result.consequences.appliedConsequences).toHaveLength(1);
    expect(result.lifecycle.resolvedOperation.status).toBe(OperationStatus.Resolved);
    expect(result.combinedEvents.map((event) => event.type)).toEqual(SUCCESS_EVENT_SEQUENCE);
    expect(result.combinedEvents.filter(isLegacyMoneyEvent)).toEqual([]);
    expect(
      result.combinedEvents.filter(isMoneyTransactionEvent).map((event) => event.amount),
    ).toEqual([-20, 80]);
    for (const event of result.combinedEvents) {
      expect(() => assertDomainEventInvariant(event)).not.toThrow();
    }
  });

  it("reaches all four deterministic outcome categories and final states from fixed seeds", () => {
    const cases: readonly OutcomeCase[] = [
      {
        seed: 32,
        category: OperationOutcomeCategory.Success,
        roll: 1,
        grossReward: 80,
        finalMoney: 160,
        exposureDelta: 4,
        healthState: "healthy",
      },
      {
        seed: 153,
        category: OperationOutcomeCategory.PartialSuccess,
        roll: 46,
        grossReward: 40,
        finalMoney: 120,
        exposureDelta: 10,
        healthState: "healthy",
      },
      {
        seed: 20,
        category: OperationOutcomeCategory.Failure,
        roll: 76,
        grossReward: 0,
        finalMoney: 80,
        exposureDelta: 14,
        healthState: "healthy",
      },
      {
        seed: 64,
        category: OperationOutcomeCategory.CriticalFailure,
        roll: 96,
        grossReward: 0,
        finalMoney: 80,
        exposureDelta: 25,
        healthState: "injured",
      },
    ];

    for (const testCase of cases) {
      const result = runLocalCollectionVerticalSlice({
        seed: testCase.seed,
        initialOrganizationMoney: 100,
        initialOperationalCapacity: 1,
        initialCharacterExposure: 0,
        planningTick: parseSimulationTick(4),
        operationId: parseOperationId(`operation:local_collection_${testCase.seed}`),
      });

      expect(result.classification.category).toBe(testCase.category);
      expect(result.classification.percentileRoll).toBe(testCase.roll);
      expect(result.consequences.appliedConsequence.grossReward).toBe(testCase.grossReward);
      expect(result.consequences.organization.money).toBe(testCase.finalMoney);
      expect(result.consequences.transactions).toHaveLength(testCase.grossReward > 0 ? 2 : 1);
      expect(
        testCase.grossReward > 0
          ? result.consequences.grossRewardTransaction?.transactionId
          : result.consequences.grossRewardTransaction,
      ).toBe(testCase.grossReward > 0 ? result.expectedRewardTransactionId : undefined);
      expect(
        100 +
          result.consequences.transactions.reduce(
            (sum, transaction) => sum + transaction.amount,
            0,
          ),
      ).toBe(testCase.finalMoney);
      expect(result.consequences.organization.operationalCapacity).toBe(1);
      expect(result.consequences.assignedCharacter.assignmentState).toBe("idle");
      expect(result.consequences.assignedCharacter.personalExposure).toBe(testCase.exposureDelta);
      expect(result.consequences.assignedCharacter.healthState).toBe(testCase.healthState);
      expect(result.consequences.assignedCharacter.healthState).not.toBe("critical");
      expect(result.consequences.assignedCharacter.healthState).not.toBe("dead");
      expect(result.consequences.assignedCharacter.legalState).toBe("free");
      expect(result.lifecycle.resolvedOperation.status).toBe(OperationStatus.Resolved);
      expect(result.consequences.appliedConsequences).toHaveLength(1);
      expect(result.consequences.appliedConsequence).toMatchObject({
        category: testCase.category,
        previousOrganizationMoney: 80,
        currentOrganizationMoney: testCase.finalMoney,
        moneyDelta: testCase.grossReward,
        requestedPersonalExposureDelta: testCase.exposureDelta,
        actualPersonalExposureDelta: testCase.exposureDelta,
        previousPersonalExposure: 0,
        currentPersonalExposure: testCase.exposureDelta,
        personalExposureClamped: false,
        previousAssignmentState: "assigned",
        currentAssignmentState: "idle",
        previousOperationalCapacity: 0,
        currentOperationalCapacity: 1,
      });
    }
  });

  it("preserves clamped exposure diagnostics through the full critical-failure flow", () => {
    const result = runLocalCollectionVerticalSlice({
      seed: 64,
      initialOrganizationMoney: 100,
      initialOperationalCapacity: 1,
      initialCharacterExposure: 90,
      planningTick: parseSimulationTick(4),
      operationId: parseOperationId("operation:local_collection_clamped"),
    });

    expect(result.classification.category).toBe(OperationOutcomeCategory.CriticalFailure);
    expect(result.consequences.assignedCharacter.personalExposure).toBe(100);
    expect(result.consequences.appliedConsequence).toMatchObject({
      requestedPersonalExposureDelta: 25,
      actualPersonalExposureDelta: 10,
      previousPersonalExposure: 90,
      currentPersonalExposure: 100,
      personalExposureClamped: true,
    });
    expect(result.combinedEvents.map((event) => event.type).slice(-5)).toEqual([
      DomainEventType.CharacterPersonalExposureChanged,
      DomainEventType.CharacterHealthChanged,
      DomainEventType.CharacterAssignmentReleased,
      DomainEventType.OrganizationOperationalCapacityReleased,
      DomainEventType.OperationConsequencesApplied,
    ]);
    expect(result.consequences.events[0]).toMatchObject({
      requestedDelta: 25,
      actualDelta: 10,
      previousPersonalExposure: 90,
      currentPersonalExposure: 100,
      clamped: true,
    });
  });

  it("deeply replays identical observable results and leaves caller-owned inputs unchanged", () => {
    const initialState = createInitialRuntimeState({
      initialOrganizationMoney: 100,
      initialOperationalCapacity: 1,
      initialCharacterExposure: 0,
      seed: 153,
    });
    const snapshot = JSON.stringify(initialState);
    const input = {
      seed: 153,
      planningTick: parseSimulationTick(4),
      operationId: parseOperationId("operation:local_collection_replay"),
      initialState,
    };

    const first = runLocalCollectionVerticalSlice(input);
    const second = runLocalCollectionVerticalSlice(input);

    expect(first.observable).toEqual(second.observable);
    expect(first.classification.category).toBe(OperationOutcomeCategory.PartialSuccess);
    expect(JSON.stringify(initialState)).toBe(snapshot);
    expect(initialState.organizations[0]?.money).toBe(100);
    expect(initialState.characters[0]?.assignmentState).toBe("idle");
    expect(initialState.characters[0]?.personalExposure).toBe(0);
    expect(initialState.operations).toEqual([]);
    expect(initialState.appliedConsequences).toEqual([]);
  });

  it("rejects duplicate consequence application without changing settled state", () => {
    const result = runLocalCollectionVerticalSlice({
      seed: 32,
      initialOrganizationMoney: 100,
      initialOperationalCapacity: 1,
      initialCharacterExposure: 0,
      planningTick: parseSimulationTick(4),
      operationId: parseOperationId("operation:local_collection_exactly_once"),
    });
    const organizations = result.consequences.organizations;
    const characters = result.consequences.characters;
    const appliedConsequences = result.consequences.appliedConsequences;
    const second = applyLocalCollectionConsequences({
      operation: result.lifecycle.resolvedOperation,
      classifiedOutcome: result.classification,
      consequenceDefinition: localCollectionConsequenceDefinition,
      organizations,
      characters,
      appliedConsequences,
      transactions: result.consequences.transactions,
      recordedAtTick: result.lifecycle.resolvedOperation.plannedCompletionTick,
      grossRewardTransactionId: result.expectedRewardTransactionId,
    });

    expect(second.ok).toBe(false);
    if (second.ok) {
      throw new Error("expected duplicate application to fail");
    }
    expect(second.error.code).toBe(
      DomainErrorCode.LocalCollectionConsequenceApplicationAlreadyRecorded,
    );
    expect(organizations[0]?.money).toBe(160);
    expect(organizations[0]?.operationalCapacity).toBe(1);
    expect(characters[0]?.personalExposure).toBe(4);
    expect(characters[0]?.healthState).toBe("healthy");
    expect(characters[0]?.assignmentState).toBe("idle");
    expect(appliedConsequences).toHaveLength(1);
    expect(result.consequences.transactions).toHaveLength(2);
    expect("events" in second.error).toBe(false);
    expect("appliedConsequences" in second.error).toBe(false);
  });

  it("omits the gross-reward money event for failure consequence timelines", () => {
    const failure = runLocalCollectionVerticalSlice({
      seed: 20,
      initialOrganizationMoney: 100,
      initialOperationalCapacity: 1,
      initialCharacterExposure: 0,
      planningTick: parseSimulationTick(4),
      operationId: parseOperationId("operation:local_collection_failure_timeline"),
    });

    expect(failure.classification.category).toBe(OperationOutcomeCategory.Failure);
    expect(failure.consequences.events.map((event) => event.type)).toEqual([
      DomainEventType.CharacterPersonalExposureChanged,
      DomainEventType.CharacterAssignmentReleased,
      DomainEventType.OrganizationOperationalCapacityReleased,
      DomainEventType.OperationConsequencesApplied,
    ]);
    expect(failure.combinedEvents.filter(isLegacyMoneyEvent)).toEqual([]);
    expect(
      failure.combinedEvents.filter(isMoneyTransactionEvent).map((event) => event.amount),
    ).toEqual([-20]);
    expect(failure.consequences.transactions).toHaveLength(1);
  });
});

interface OutcomeCase {
  readonly seed: number;
  readonly category: OperationOutcomeCategory;
  readonly roll: number;
  readonly grossReward: number;
  readonly finalMoney: number;
  readonly exposureDelta: number;
  readonly healthState: CharacterState["healthState"];
}

interface LocalCollectionInitialRuntimeState {
  readonly organizations: readonly OrganizationState[];
  readonly characters: readonly CharacterState[];
  readonly locationStates: readonly LocationState[];
  readonly businessStates: readonly ReturnType<typeof createBusinessState>[];
  readonly operations: readonly OperationState[];
  readonly appliedConsequences: readonly AppliedOperationConsequences[];
  readonly transactions: readonly MoneyTransaction[];
  readonly randomState: RandomState;
}

interface RunLocalCollectionVerticalSliceInput {
  readonly seed: number;
  readonly planningTick: SimulationTick;
  readonly operationId: ReturnType<typeof parseOperationId>;
  readonly initialOrganizationMoney?: number;
  readonly initialOperationalCapacity?: number;
  readonly initialCharacterExposure?: number;
  readonly startTick?: SimulationTick;
  readonly completionTick?: SimulationTick;
  readonly initialState?: LocalCollectionInitialRuntimeState;
}

interface LocalCollectionVerticalSliceResult {
  readonly initial: LocalCollectionInitialRuntimeState;
  readonly availability: ReturnType<typeof evaluateOperationAvailability>;
  readonly planning: PlanOperationSuccess;
  readonly lifecycle: {
    readonly atPlanningTick: ReturnType<typeof advanceOperationLifecycles>;
    readonly start: ReturnType<typeof advanceOperationLifecycles>;
    readonly complete: ReturnType<typeof advanceOperationLifecycles>;
    readonly afterResolvedAgain: ReturnType<typeof advanceOperationLifecycles>;
    readonly runningOperation: OperationState;
    readonly resolvedOperation: OperationState;
  };
  readonly classification: ClassifiedOperationOutcome;
  readonly consequences: ApplyLocalCollectionConsequencesSuccess;
  readonly finalRandomState: RandomState;
  readonly combinedEvents: readonly DomainEvent[];
  readonly locationStatesAfterFlow: readonly LocationState[];
  readonly businessStatesAfterFlow: readonly ReturnType<typeof createBusinessState>[];
  readonly expectedRewardTransactionId: ReturnType<typeof parseTransactionId>;
  readonly observable: unknown;
}

const STARTER_ORGANIZATION_ID = parseOrganizationId("organization:starter_crew");
const BOSS_ID = parseCharacterId("character:boss_001");
const CORNER_STORE_BUSINESS_ID = parseBusinessId("business:corner_store");
const LOCAL_COLLECTION_OPERATION_ID = parseOperationId("operation:local_collection_001");
const START_COST_TRANSACTION_ID = parseTransactionId("operation:local_collection_001:start_cost");
const GROSS_REWARD_TRANSACTION_ID = parseTransactionId(
  "operation:local_collection_001:gross_reward",
);
const ZERO_MODIFIERS: OperationOutcomeModifierContributions = Object.freeze({
  base: 0,
  competence: 0,
  capability: 0,
  district: 0,
  exposure: 0,
});
const SUCCESS_EVENT_SEQUENCE = [
  DomainEventType.OperationPlanned,
  DomainEventType.CharacterAssignedToOperation,
  DomainEventType.OrganizationOperationalCapacityReserved,
  DomainEventType.OrganizationMoneyTransactionRecorded,
  DomainEventType.OperationStarted,
  DomainEventType.OperationLifecycleCompleted,
  DomainEventType.OperationOutcomeRolled,
  DomainEventType.OperationOutcomeClassified,
  DomainEventType.OrganizationMoneyTransactionRecorded,
  DomainEventType.CharacterPersonalExposureChanged,
  DomainEventType.CharacterAssignmentReleased,
  DomainEventType.OrganizationOperationalCapacityReleased,
  DomainEventType.OperationConsequencesApplied,
] as const;

function runLocalCollectionVerticalSlice(
  input: RunLocalCollectionVerticalSliceInput,
): LocalCollectionVerticalSliceResult {
  const initial =
    input.initialState ??
    createInitialRuntimeState({
      initialOrganizationMoney: input.initialOrganizationMoney ?? 100,
      initialOperationalCapacity: input.initialOperationalCapacity ?? 1,
      initialCharacterExposure: input.initialCharacterExposure ?? 0,
      seed: input.seed,
    });
  const targetLocationId = getLocalCollectionTargetLocationId();
  const targetLocationDefinition = getTargetLocationDefinition();
  const command = createPlanOperationCommand({
    operationId: input.operationId,
    operationTemplateId: localCollectionOperationTemplateDefinition.id,
    organizationId: STARTER_ORGANIZATION_ID,
    targetLocationId,
    assignedCharacterId: BOSS_ID,
    startCostTransactionId: parseTransactionId(`${input.operationId}:start_cost`),
  });
  const rewardTransactionId = parseTransactionId(`${input.operationId}:gross_reward`);
  const planningTemplates = [localCollectionOperationTemplateDefinition];
  const locationDefinitions = canonicalMvpCityDefinition.locations.map((location) => ({
    id: location.id,
    kind: location.kind,
  }));
  const availability = evaluateOperationAvailability({
    operationTemplateId: command.operationTemplateId,
    organizationId: command.organizationId,
    targetLocationId: command.targetLocationId,
    assignedCharacterIds: [command.assignedCharacterId],
    operationTemplates: planningTemplates,
    organizations: initial.organizations,
    characters: initial.characters,
    locationStates: initial.locationStates,
    locationDefinitions,
    businessStates: initial.businessStates,
  });

  expect(targetLocationDefinition.kind).toBe("shop-or-service");

  const planning = assertOk(
    planOperation({
      command,
      currentTick: input.planningTick,
      operationTemplates: planningTemplates,
      organizations: initial.organizations,
      characters: initial.characters,
      locationStates: initial.locationStates,
      locationDefinitions,
      businessStates: initial.businessStates,
      operations: initial.operations,
      transactions: initial.transactions,
    }),
  );
  const atPlanningTick = advanceOperationLifecycles({
    currentTick: input.planningTick,
    operations: planning.operations,
  });
  const startTick = input.startTick ?? parseSimulationTick(input.planningTick + 1);
  const start = advanceOperationLifecycles({
    currentTick: startTick,
    operations: atPlanningTick.operations,
  });
  const runningOperation = getOnlyOperation(start.operations);
  const completionTick = input.completionTick ?? planning.operation.plannedCompletionTick;
  const complete = advanceOperationLifecycles({
    currentTick: completionTick,
    operations: start.operations,
  });
  const resolvedOperation = getOnlyOperation(complete.operations);
  const afterResolvedAgain = advanceOperationLifecycles({
    currentTick: parseSimulationTick(completionTick + 1),
    operations: complete.operations,
  });

  expect(planning.operation).toBe(atPlanningTick.operations[0]);
  expect(runningOperation.status).toBe(OperationStatus.Running);
  expect(resolvedOperation.status).toBe(OperationStatus.Resolved);
  expect(planning.organization.money).toBe(80);
  expect(planning.assignedCharacter.assignmentState).toBe("assigned");
  expect(planning.organization.operationalCapacity).toBe(0);

  const classification = assertOk(
    classifyOperationOutcome({
      operation: resolvedOperation,
      randomState: initial.randomState,
      outcomeBands: localCollectionOutcomeBands,
      modifierContributions: ZERO_MODIFIERS,
    }),
  );
  const consequences = assertOk(
    applyLocalCollectionConsequences({
      operation: resolvedOperation,
      classifiedOutcome: classification,
      consequenceDefinition: localCollectionConsequenceDefinition,
      organizations: planning.organizations,
      characters: planning.characters,
      appliedConsequences: initial.appliedConsequences,
      transactions: planning.transactions,
      recordedAtTick: completionTick,
      grossRewardTransactionId: getRewardTransactionId(
        classification.category,
        rewardTransactionId,
      ),
    }),
  );
  const combinedEvents = Object.freeze([
    ...planning.events,
    ...start.events,
    ...complete.events,
    ...classification.events,
    ...consequences.events,
  ]);

  return Object.freeze({
    initial,
    availability,
    planning,
    lifecycle: Object.freeze({
      atPlanningTick,
      start,
      complete,
      afterResolvedAgain,
      runningOperation,
      resolvedOperation,
    }),
    classification,
    consequences,
    finalRandomState: classification.nextRandomState,
    combinedEvents,
    locationStatesAfterFlow: initial.locationStates,
    businessStatesAfterFlow: initial.businessStates,
    expectedRewardTransactionId: rewardTransactionId,
    observable: Object.freeze({
      plannedState: planning.operation,
      lifecycleStates: [
        getOnlyOperation(atPlanningTick.operations),
        runningOperation,
        resolvedOperation,
        getOnlyOperation(afterResolvedAgain.operations),
      ],
      classifiedOutcome: classification,
      percentileRoll: classification.percentileRoll,
      selectedRange: [classification.selectedBandLowerBound, classification.selectedBandUpperBound],
      previousRandomState: classification.previousRandomState,
      nextRandomState: classification.nextRandomState,
      finalOrganizationState: consequences.organization,
      finalCharacterState: consequences.assignedCharacter,
      appliedConsequence: consequences.appliedConsequence,
      transactions: consequences.transactions,
      combinedEvents,
    }),
  });
}

function createInitialRuntimeState(input: {
  readonly initialOrganizationMoney: number;
  readonly initialOperationalCapacity: number;
  readonly initialCharacterExposure: number;
  readonly seed: number;
}): LocalCollectionInitialRuntimeState {
  const cityState = createCityState(canonicalMvpCityDefinition);
  const targetLocationId = getLocalCollectionTargetLocationId();
  const locationStates = cityState.locationStates.map((locationState) =>
    locationState.locationId === targetLocationId
      ? Object.freeze({ ...locationState, businessId: CORNER_STORE_BUSINESS_ID })
      : locationState,
  );

  return Object.freeze({
    organizations: Object.freeze([
      createOrganizationState({
        organizationId: STARTER_ORGANIZATION_ID,
        displayName: "Starter Crew",
        leaderCharacterId: BOSS_ID,
        memberCharacterIds: [BOSS_ID],
        money: input.initialOrganizationMoney,
        operationalCapacity: input.initialOperationalCapacity,
      }),
    ]),
    characters: Object.freeze([
      createCharacterState({
        characterId: BOSS_ID,
        displayName: "Mara Voss",
        capabilityTags: ["streetwise"],
        healthState: "healthy",
        legalState: "free",
        assignmentState: "idle",
        competence: 50,
        loyalty: 50,
        personalExposure: input.initialCharacterExposure,
      }),
    ]),
    locationStates: Object.freeze(locationStates),
    businessStates: Object.freeze([
      createBusinessState({
        businessId: CORNER_STORE_BUSINESS_ID,
        locationId: targetLocationId,
        ownerOrganizationId: null,
      }),
    ]),
    operations: Object.freeze([]),
    appliedConsequences: Object.freeze([]),
    transactions: Object.freeze([]),
    randomState: createRandomState(parseRandomSeed(input.seed)),
  });
}

function getLocalCollectionTargetLocationId() {
  const targetLocationId = localCollectionOperationTemplateDefinition.allowedTargetIds[0];
  if (targetLocationId === undefined) {
    throw new Error("Local Collection template must define an eligible target.");
  }

  return targetLocationId;
}

function getTargetLocationDefinition() {
  const targetLocationId = getLocalCollectionTargetLocationId();
  const targetLocationDefinition = canonicalMvpCityDefinition.locations.find(
    (location) => location.id === targetLocationId,
  );
  if (targetLocationDefinition === undefined) {
    throw new Error("Canonical MVP city must contain the Local Collection target.");
  }

  return targetLocationDefinition;
}

function getRewardTransactionId(
  category: OperationOutcomeCategory,
  transactionId: ReturnType<typeof parseTransactionId>,
) {
  const consequence = localCollectionConsequenceDefinition.find(
    (entry) => entry.category === category,
  );
  return consequence === undefined || consequence.grossReward === 0 ? undefined : transactionId;
}

function getOnlyOperation(operations: readonly OperationState[]): OperationState {
  expect(operations).toHaveLength(1);
  const operation = operations[0];
  if (operation === undefined) {
    throw new Error("Expected exactly one operation.");
  }

  return operation;
}

function assertOk<TValue, TError extends DomainError>(
  result: DomainResult<TValue, TError>,
): TValue {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(`Expected success, received ${result.error.code}.`);
  }

  return result.value;
}

function isLegacyMoneyEvent(
  event: DomainEvent,
): event is Extract<
  DomainEvent,
  { readonly type: typeof DomainEventType.OrganizationMoneyChanged }
> {
  return event.type === DomainEventType.OrganizationMoneyChanged;
}

function isMoneyTransactionEvent(
  event: DomainEvent,
): event is Extract<
  DomainEvent,
  { readonly type: typeof DomainEventType.OrganizationMoneyTransactionRecorded }
> {
  return event.type === DomainEventType.OrganizationMoneyTransactionRecorded;
}
