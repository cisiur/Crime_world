import {
  DomainEventType,
  createCharacterAssignedToOperationEvent,
  createDomainExecution,
  createInitialGameState,
  createOperationPlannedEvent,
  createOrganizationMoneyChangedEvent,
  createOrganizationOperationalCapacityReservedEvent,
  parseCharacterId,
  parseLocationId,
  parseOperationId,
  parseOperationTemplateId,
  parseOrganizationId,
  createSimulationResumedEvent,
  createSimulationTickAdvancedEvent,
  parseSimulationMinute,
  parseSimulationTick,
} from "../src/index";
import type {
  CharacterAssignedToOperationEvent,
  DomainEvent,
  DomainExecution,
  OperationPlannedEvent,
  OrganizationMoneyChangedEvent,
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
const characterAssignedEvent = createCharacterAssignedToOperationEvent({
  characterId,
  operationId,
  previousAssignmentState: "idle",
  currentAssignmentState: "assigned",
});
const capacityReservedEvent = createOrganizationOperationalCapacityReservedEvent({
  organizationId,
  operationId,
  previousOperationalCapacity: 1,
  currentOperationalCapacity: 0,
  delta: -1,
});
const moneyChangedEvent = createOrganizationMoneyChangedEvent({
  organizationId,
  operationId,
  reason: "operation-start-cost-paid",
  previousMoney: 100,
  currentMoney: 80,
  delta: -20,
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

// @ts-expect-error Arbitrary objects cannot be CharacterAssignedToOperationEvent.
const invalidCharacterAssignedEvent: CharacterAssignedToOperationEvent = {
  type: DomainEventType.CharacterAssignedToOperation,
  characterId,
  operationId,
  previousAssignmentState: "idle",
  currentAssignmentState: "assigned",
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
    case DomainEventType.OperationPlanned:
      return event.type;
    case DomainEventType.OrganizationMoneyChanged:
      return event.type;
    case DomainEventType.OrganizationOperationalCapacityReserved:
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
void typedExecution;
void invalidOperationPlannedEvent;
void invalidCharacterAssignedEvent;
void invalidCapacityReservedEvent;
void invalidMoneyChangedEvent;
void invalidResumedEvent;
void invalidTickAdvancedEvent;
void invalidExecution;
void assertDomainEventUnion;
