import {
  DomainEventType,
  createCharacterAssignmentReleasedEvent,
  createCharacterAssignedToOperationEvent,
  createCharacterHealthChangedEvent,
  createCharacterPersonalExposureChangedEvent,
  createDomainExecution,
  createInitialGameState,
  createOperationConsequencesAppliedEvent,
  createOperationLifecycleCompletedEvent,
  createOperationOutcomeClassifiedEvent,
  createOperationOutcomeRolledEvent,
  createOperationPlannedEvent,
  createOperationStartedEvent,
  createOrganizationMoneyChangedEvent,
  createOrganizationOperationalCapacityReleasedEvent,
  createOrganizationOperationalCapacityReservedEvent,
  parseCharacterId,
  parseLocationId,
  parseOperationId,
  parseOperationTemplateId,
  parseOrganizationId,
  createRandomState,
  createSimulationResumedEvent,
  createSimulationTickAdvancedEvent,
  nextInt,
  OperationOutcomeCategory,
  parseRandomSeed,
  parseSimulationMinute,
  parseSimulationTick,
} from "../src/index";
import type {
  CharacterAssignmentReleasedEvent,
  CharacterAssignedToOperationEvent,
  CharacterHealthChangedEvent,
  CharacterPersonalExposureChangedEvent,
  DomainEvent,
  DomainExecution,
  OperationConsequencesAppliedEvent,
  OperationLifecycleCompletedEvent,
  OperationOutcomeClassifiedEvent,
  OperationOutcomeRolledEvent,
  OperationPlannedEvent,
  OperationStartedEvent,
  OrganizationMoneyChangedEvent,
  OrganizationOperationalCapacityReleasedEvent,
  OrganizationOperationalCapacityReservedEvent,
  SimulationResumedEvent,
  SimulationTickAdvancedEvent,
} from "../src/index";

const gameState = createInitialGameState({
  campaignId: "campaign:test",
  randomSeed: 123,
});
const tick = parseSimulationTick(1);
const minute = parseSimulationMinute(10);
const characterId = parseCharacterId("character:boss_001");
const operationId = parseOperationId("operation:local_collection_001");
const operationTemplateId = parseOperationTemplateId("operation-template:local_collection");
const organizationId = parseOrganizationId("organization:starter_crew");
const targetLocationId = parseLocationId("location:corner_store");
const operationPlannedEvent = createOperationPlannedEvent({
  operationId,
  operationTemplateId,
  organizationId,
  targetLocationId,
  assignedCharacterIds: [characterId],
  plannedAtTick: tick,
  plannedCompletionTick: parseSimulationTick(7),
});
const operationStartedEvent = createOperationStartedEvent({
  operationId,
  operationTemplateId,
  organizationId,
  targetLocationId,
  assignedCharacterIds: [characterId],
  previousStatus: "planned",
  currentStatus: "running",
  transitionTick: parseSimulationTick(2),
  plannedCompletionTick: parseSimulationTick(7),
});
const operationLifecycleCompletedEvent = createOperationLifecycleCompletedEvent({
  operationId,
  operationTemplateId,
  organizationId,
  targetLocationId,
  assignedCharacterIds: [characterId],
  previousStatus: "running",
  currentStatus: "resolved",
  transitionTick: parseSimulationTick(7),
  plannedCompletionTick: parseSimulationTick(7),
});
const randomState = createRandomState(parseRandomSeed(123));
const nextRandomResult = nextInt(randomState, 1, 100);
const operationOutcomeRolledEvent = createOperationOutcomeRolledEvent({
  operationId,
  operationTemplateId,
  organizationId,
  targetLocationId,
  assignedCharacterIds: [characterId],
  selectedBandKey: "band-a",
  percentileRoll: nextRandomResult.value,
  selectedBandLowerBound: 1,
  selectedBandUpperBound: 100,
  modifierContributions: {
    base: 0,
    competence: 1,
    capability: 2,
    district: -1,
    exposure: -2,
  },
  previousRandomState: randomState,
  nextRandomState: nextRandomResult.state,
});
const operationOutcomeClassifiedEvent = createOperationOutcomeClassifiedEvent({
  operationId,
  operationTemplateId,
  organizationId,
  targetLocationId,
  assignedCharacterIds: [characterId],
  category: OperationOutcomeCategory.Success,
  percentileRoll: nextRandomResult.value,
  selectedBandLowerBound: 1,
  selectedBandUpperBound: 100,
  modifierContributions: {
    base: 0,
    competence: 1,
    capability: 2,
    district: -1,
    exposure: -2,
  },
  previousRandomState: randomState,
  nextRandomState: nextRandomResult.state,
});
const characterAssignedEvent = createCharacterAssignedToOperationEvent({
  characterId,
  operationId,
  previousAssignmentState: "idle",
  currentAssignmentState: "assigned",
});
const characterAssignmentReleasedEvent = createCharacterAssignmentReleasedEvent({
  characterId,
  operationId,
  previousAssignmentState: "assigned",
  currentAssignmentState: "idle",
});
const characterPersonalExposureChangedEvent = createCharacterPersonalExposureChangedEvent({
  characterId,
  operationId,
  category: OperationOutcomeCategory.Success,
  previousPersonalExposure: 10,
  requestedDelta: 4,
  actualDelta: 4,
  currentPersonalExposure: 14,
  clamped: false,
});
const characterHealthChangedEvent = createCharacterHealthChangedEvent({
  characterId,
  operationId,
  category: OperationOutcomeCategory.CriticalFailure,
  previousHealthState: "healthy",
  currentHealthState: "injured",
});
const capacityReservedEvent = createOrganizationOperationalCapacityReservedEvent({
  organizationId,
  operationId,
  previousOperationalCapacity: 1,
  currentOperationalCapacity: 0,
  delta: -1,
});
const capacityReleasedEvent = createOrganizationOperationalCapacityReleasedEvent({
  organizationId,
  operationId,
  previousOperationalCapacity: 0,
  currentOperationalCapacity: 1,
  delta: 1,
});
const moneyChangedEvent = createOrganizationMoneyChangedEvent({
  organizationId,
  operationId,
  reason: "operation-start-cost-paid",
  previousMoney: 100,
  currentMoney: 80,
  delta: -20,
});
const grossRewardMoneyChangedEvent = createOrganizationMoneyChangedEvent({
  organizationId,
  operationId,
  reason: "operation-gross-reward-paid",
  previousMoney: 80,
  currentMoney: 160,
  delta: 80,
});
const operationConsequencesAppliedEvent = createOperationConsequencesAppliedEvent({
  operationId,
  operationTemplateId,
  organizationId,
  targetLocationId,
  releasedCharacterIds: [characterId],
  category: OperationOutcomeCategory.Success,
  grossReward: 80,
  requestedPersonalExposureDelta: 4,
  actualPersonalExposureDelta: 4,
  healthConsequence: "none",
  operationalCapacityReleased: 1,
});
const resumedEvent = createSimulationResumedEvent(tick, minute);
const tickAdvancedEvent = createSimulationTickAdvancedEvent({
  previousTick: parseSimulationTick(0),
  currentTick: tick,
  previousMinute: parseSimulationMinute(0),
  currentMinute: minute,
});
const eventUnionA: DomainEvent = resumedEvent;
const eventUnionB: DomainEvent = tickAdvancedEvent;
const eventUnionC: DomainEvent = operationPlannedEvent;
const eventUnionD: DomainEvent = characterAssignedEvent;
const eventUnionE: DomainEvent = capacityReservedEvent;
const eventUnionF: DomainEvent = moneyChangedEvent;
const eventUnionG: DomainEvent = operationStartedEvent;
const eventUnionH: DomainEvent = operationLifecycleCompletedEvent;
const eventUnionI: DomainEvent = operationOutcomeRolledEvent;
const eventUnionJ: DomainEvent = operationOutcomeClassifiedEvent;
const eventUnionK: DomainEvent = characterAssignmentReleasedEvent;
const eventUnionL: DomainEvent = characterPersonalExposureChangedEvent;
const eventUnionM: DomainEvent = characterHealthChangedEvent;
const eventUnionN: DomainEvent = capacityReleasedEvent;
const eventUnionO: DomainEvent = grossRewardMoneyChangedEvent;
const eventUnionP: DomainEvent = operationConsequencesAppliedEvent;
const execution = createDomainExecution(gameState, [resumedEvent, tickAdvancedEvent]);
const typedExecution: DomainExecution = execution;

// @ts-expect-error Arbitrary objects cannot be OperationPlannedEvent.
const invalidOperationPlannedEvent: OperationPlannedEvent = {
  type: DomainEventType.OperationPlanned,
  operationId,
  operationTemplateId,
  organizationId,
  targetLocationId,
  assignedCharacterIds: [characterId],
  plannedAtTick: tick,
  plannedCompletionTick: parseSimulationTick(7),
};

// @ts-expect-error Arbitrary objects cannot be OperationStartedEvent.
const invalidOperationStartedEvent: OperationStartedEvent = {
  type: DomainEventType.OperationStarted,
  operationId,
  operationTemplateId,
  organizationId,
  targetLocationId,
  assignedCharacterIds: [characterId],
  previousStatus: "planned",
  currentStatus: "running",
  transitionTick: parseSimulationTick(2),
  plannedCompletionTick: parseSimulationTick(7),
};

// @ts-expect-error Arbitrary objects cannot be OperationLifecycleCompletedEvent.
const invalidOperationLifecycleCompletedEvent: OperationLifecycleCompletedEvent = {
  type: DomainEventType.OperationLifecycleCompleted,
  operationId,
  operationTemplateId,
  organizationId,
  targetLocationId,
  assignedCharacterIds: [characterId],
  previousStatus: "running",
  currentStatus: "resolved",
  transitionTick: parseSimulationTick(7),
  plannedCompletionTick: parseSimulationTick(7),
};

// @ts-expect-error Arbitrary objects cannot be OperationOutcomeRolledEvent.
const invalidOperationOutcomeRolledEvent: OperationOutcomeRolledEvent = {
  type: DomainEventType.OperationOutcomeRolled,
  operationId,
  operationTemplateId,
  organizationId,
  targetLocationId,
  assignedCharacterIds: [characterId],
  selectedBandKey: "band-a",
  percentileRoll: nextRandomResult.value,
  selectedBandLowerBound: 1,
  selectedBandUpperBound: 100,
  modifierContributions: {
    base: 0,
    competence: 1,
    capability: 2,
    district: -1,
    exposure: -2,
  },
  previousRandomState: randomState,
  nextRandomState: nextRandomResult.state,
};

// @ts-expect-error Arbitrary objects cannot be OperationOutcomeClassifiedEvent.
const invalidOperationOutcomeClassifiedEvent: OperationOutcomeClassifiedEvent = {
  type: DomainEventType.OperationOutcomeClassified,
  operationId,
  operationTemplateId,
  organizationId,
  targetLocationId,
  assignedCharacterIds: [characterId],
  category: OperationOutcomeCategory.Success,
  percentileRoll: nextRandomResult.value,
  selectedBandLowerBound: 1,
  selectedBandUpperBound: 100,
  modifierContributions: {
    base: 0,
    competence: 1,
    capability: 2,
    district: -1,
    exposure: -2,
  },
  previousRandomState: randomState,
  nextRandomState: nextRandomResult.state,
};

// @ts-expect-error Arbitrary objects cannot be CharacterAssignedToOperationEvent.
const invalidCharacterAssignedEvent: CharacterAssignedToOperationEvent = {
  type: DomainEventType.CharacterAssignedToOperation,
  characterId,
  operationId,
  previousAssignmentState: "idle",
  currentAssignmentState: "assigned",
};

// @ts-expect-error Arbitrary objects cannot be CharacterAssignmentReleasedEvent.
const invalidCharacterAssignmentReleasedEvent: CharacterAssignmentReleasedEvent = {
  type: DomainEventType.CharacterAssignmentReleased,
  characterId,
  operationId,
  previousAssignmentState: "assigned",
  currentAssignmentState: "idle",
};

// @ts-expect-error Arbitrary objects cannot be CharacterPersonalExposureChangedEvent.
const invalidCharacterPersonalExposureChangedEvent: CharacterPersonalExposureChangedEvent = {
  type: DomainEventType.CharacterPersonalExposureChanged,
  characterId,
  operationId,
  category: OperationOutcomeCategory.Success,
  previousPersonalExposure: 10,
  requestedDelta: 4,
  actualDelta: 4,
  currentPersonalExposure: 14,
  clamped: false,
};

// @ts-expect-error Arbitrary objects cannot be CharacterHealthChangedEvent.
const invalidCharacterHealthChangedEvent: CharacterHealthChangedEvent = {
  type: DomainEventType.CharacterHealthChanged,
  characterId,
  operationId,
  category: OperationOutcomeCategory.CriticalFailure,
  previousHealthState: "healthy",
  currentHealthState: "injured",
};

// @ts-expect-error Arbitrary objects cannot be OrganizationOperationalCapacityReservedEvent.
const invalidCapacityReservedEvent: OrganizationOperationalCapacityReservedEvent = {
  type: DomainEventType.OrganizationOperationalCapacityReserved,
  organizationId,
  operationId,
  previousOperationalCapacity: 1,
  currentOperationalCapacity: 0,
  delta: -1,
};

// @ts-expect-error Arbitrary objects cannot be OrganizationOperationalCapacityReleasedEvent.
const invalidCapacityReleasedEvent: OrganizationOperationalCapacityReleasedEvent = {
  type: DomainEventType.OrganizationOperationalCapacityReleased,
  organizationId,
  operationId,
  previousOperationalCapacity: 0,
  currentOperationalCapacity: 1,
  delta: 1,
};

// @ts-expect-error Arbitrary objects cannot be OrganizationMoneyChangedEvent.
const invalidMoneyChangedEvent: OrganizationMoneyChangedEvent = {
  type: DomainEventType.OrganizationMoneyChanged,
  organizationId,
  operationId,
  reason: "operation-start-cost-paid",
  previousMoney: 100,
  currentMoney: 80,
  delta: -20,
};

// @ts-expect-error Arbitrary objects cannot be OperationConsequencesAppliedEvent.
const invalidOperationConsequencesAppliedEvent: OperationConsequencesAppliedEvent = {
  type: DomainEventType.OperationConsequencesApplied,
  operationId,
  operationTemplateId,
  organizationId,
  targetLocationId,
  releasedCharacterIds: [characterId],
  category: OperationOutcomeCategory.Success,
  grossReward: 80,
  requestedPersonalExposureDelta: 4,
  actualPersonalExposureDelta: 4,
  healthConsequence: "none",
  operationalCapacityReleased: 1,
};

// @ts-expect-error Arbitrary objects cannot be SimulationResumedEvent.
const invalidResumedEvent: SimulationResumedEvent = {
  type: DomainEventType.SimulationResumed,
  tick,
  minute,
};

// @ts-expect-error Arbitrary objects cannot be SimulationTickAdvancedEvent.
const invalidTickAdvancedEvent: SimulationTickAdvancedEvent = {
  type: DomainEventType.SimulationTickAdvanced,
  previousTick: parseSimulationTick(0),
  currentTick: tick,
  previousMinute: parseSimulationMinute(0),
  currentMinute: minute,
};

// @ts-expect-error Arbitrary objects cannot be DomainExecution.
const invalidExecution: DomainExecution = {
  gameState,
  events: [],
};

// @ts-expect-error Event tick fields must use branded SimulationTick.
createSimulationResumedEvent(1, minute);

// @ts-expect-error Event minute fields must use branded SimulationMinute.
createSimulationResumedEvent(tick, 10);

createSimulationTickAdvancedEvent({
  // @ts-expect-error previousTick must use branded SimulationTick.
  previousTick: 0,
  currentTick: tick,
  previousMinute: parseSimulationMinute(0),
  currentMinute: minute,
});

// @ts-expect-error DomainExecution events are readonly.
execution.events.push(resumedEvent);

function assertDomainEventUnion(event: DomainEvent): string {
  switch (event.type) {
    case DomainEventType.CharacterAssignedToOperation:
      return event.type;
    case DomainEventType.CharacterAssignmentReleased:
      return event.type;
    case DomainEventType.CharacterPersonalExposureChanged:
      return event.type;
    case DomainEventType.CharacterHealthChanged:
      return event.type;
    case DomainEventType.OperationPlanned:
      return event.type;
    case DomainEventType.OperationStarted:
      return event.type;
    case DomainEventType.OperationLifecycleCompleted:
      return event.type;
    case DomainEventType.OperationOutcomeRolled:
      return event.type;
    case DomainEventType.OperationOutcomeClassified:
      return event.type;
    case DomainEventType.OperationConsequencesApplied:
      return event.type;
    case DomainEventType.OrganizationMoneyChanged:
      return event.type;
    case DomainEventType.OrganizationMoneyTransactionRecorded:
      return event.type;
    case DomainEventType.OrganizationOperationalCapacityReserved:
      return event.type;
    case DomainEventType.OrganizationOperationalCapacityReleased:
      return event.type;
    case DomainEventType.SimulationResumed:
      return event.type;
    case DomainEventType.SimulationTickAdvanced:
      return event.type;
    default: {
      const exhaustiveEvent: never = event;
      return exhaustiveEvent;
    }
  }
}

void eventUnionA;
void eventUnionB;
void eventUnionC;
void eventUnionD;
void eventUnionE;
void eventUnionF;
void eventUnionG;
void eventUnionH;
void eventUnionI;
void eventUnionJ;
void eventUnionK;
void eventUnionL;
void eventUnionM;
void eventUnionN;
void eventUnionO;
void eventUnionP;
void typedExecution;
void invalidOperationPlannedEvent;
void invalidOperationStartedEvent;
void invalidOperationLifecycleCompletedEvent;
void invalidOperationOutcomeRolledEvent;
void invalidOperationOutcomeClassifiedEvent;
void invalidCharacterAssignedEvent;
void invalidCharacterAssignmentReleasedEvent;
void invalidCharacterPersonalExposureChangedEvent;
void invalidCharacterHealthChangedEvent;
void invalidCapacityReservedEvent;
void invalidCapacityReleasedEvent;
void invalidMoneyChangedEvent;
void invalidOperationConsequencesAppliedEvent;
void invalidResumedEvent;
void invalidTickAdvancedEvent;
void invalidExecution;
void assertDomainEventUnion;
