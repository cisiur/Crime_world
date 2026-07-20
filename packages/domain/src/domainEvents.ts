import type { GameState } from "./gameState";
import type { AssignmentState } from "./characterState";
import type {
  CharacterId,
  LocationId,
  OperationId,
  OperationTemplateId,
  OrganizationId,
} from "./entityIds";
import type { SimulationMinute, SimulationTick } from "./simulationClock";

declare const domainEventBrand: unique symbol;
declare const domainExecutionBrand: unique symbol;

export const DomainEventType = {
  CharacterAssignedToOperation: "CharacterAssignedToOperation",
  OperationPlanned: "OperationPlanned",
  OrganizationMoneyChanged: "OrganizationMoneyChanged",
  OrganizationOperationalCapacityReserved: "OrganizationOperationalCapacityReserved",
  SimulationResumed: "SimulationResumed",
  SimulationTickAdvanced: "SimulationTickAdvanced",
} as const;

export type DomainEventType = (typeof DomainEventType)[keyof typeof DomainEventType];

export interface SimulationResumedEvent {
  readonly type: typeof DomainEventType.SimulationResumed;
  readonly tick: SimulationTick;
  readonly minute: SimulationMinute;
  readonly [domainEventBrand]: "SimulationResumedEvent";
}

export interface SimulationTickAdvancedEvent {
  readonly type: typeof DomainEventType.SimulationTickAdvanced;
  readonly previousTick: SimulationTick;
  readonly currentTick: SimulationTick;
  readonly previousMinute: SimulationMinute;
  readonly currentMinute: SimulationMinute;
  readonly [domainEventBrand]: "SimulationTickAdvancedEvent";
}

export interface OperationPlannedEvent {
  readonly type: typeof DomainEventType.OperationPlanned;
  readonly operationId: OperationId;
  readonly operationTemplateId: OperationTemplateId;
  readonly organizationId: OrganizationId;
  readonly targetLocationId: LocationId;
  readonly assignedCharacterIds: readonly CharacterId[];
  readonly plannedAtTick: SimulationTick;
  readonly plannedCompletionTick: SimulationTick;
  readonly [domainEventBrand]: "OperationPlannedEvent";
}

export interface CharacterAssignedToOperationEvent {
  readonly type: typeof DomainEventType.CharacterAssignedToOperation;
  readonly characterId: CharacterId;
  readonly operationId: OperationId;
  readonly previousAssignmentState: AssignmentState;
  readonly currentAssignmentState: AssignmentState;
  readonly [domainEventBrand]: "CharacterAssignedToOperationEvent";
}

export interface OrganizationOperationalCapacityReservedEvent {
  readonly type: typeof DomainEventType.OrganizationOperationalCapacityReserved;
  readonly organizationId: OrganizationId;
  readonly operationId: OperationId;
  readonly previousOperationalCapacity: number;
  readonly currentOperationalCapacity: number;
  readonly delta: number;
  readonly [domainEventBrand]: "OrganizationOperationalCapacityReservedEvent";
}

export interface OrganizationMoneyChangedEvent {
  readonly type: typeof DomainEventType.OrganizationMoneyChanged;
  readonly organizationId: OrganizationId;
  readonly operationId: OperationId;
  readonly reason: "operation-start-cost-paid";
  readonly previousMoney: number;
  readonly currentMoney: number;
  readonly delta: number;
  readonly [domainEventBrand]: "OrganizationMoneyChangedEvent";
}

export type DomainEvent =
  | CharacterAssignedToOperationEvent
  | OperationPlannedEvent
  | OrganizationMoneyChangedEvent
  | OrganizationOperationalCapacityReservedEvent
  | SimulationResumedEvent
  | SimulationTickAdvancedEvent;

export interface DomainExecutionData {
  readonly gameState: GameState;
  readonly events: readonly DomainEvent[];
}

export type DomainExecution = DomainExecutionData & {
  readonly [domainExecutionBrand]: "DomainExecution";
};

export interface CreateSimulationTickAdvancedEventInput {
  readonly previousTick: SimulationTick;
  readonly currentTick: SimulationTick;
  readonly previousMinute: SimulationMinute;
  readonly currentMinute: SimulationMinute;
}

export interface CreateOperationPlannedEventInput {
  readonly operationId: OperationId;
  readonly operationTemplateId: OperationTemplateId;
  readonly organizationId: OrganizationId;
  readonly targetLocationId: LocationId;
  readonly assignedCharacterIds: readonly CharacterId[];
  readonly plannedAtTick: SimulationTick;
  readonly plannedCompletionTick: SimulationTick;
}

export interface CreateCharacterAssignedToOperationEventInput {
  readonly characterId: CharacterId;
  readonly operationId: OperationId;
  readonly previousAssignmentState: AssignmentState;
  readonly currentAssignmentState: AssignmentState;
}

export interface CreateOrganizationOperationalCapacityReservedEventInput {
  readonly organizationId: OrganizationId;
  readonly operationId: OperationId;
  readonly previousOperationalCapacity: number;
  readonly currentOperationalCapacity: number;
  readonly delta: number;
}

export interface CreateOrganizationMoneyChangedEventInput {
  readonly organizationId: OrganizationId;
  readonly operationId: OperationId;
  readonly reason: "operation-start-cost-paid";
  readonly previousMoney: number;
  readonly currentMoney: number;
  readonly delta: number;
}

export function createSimulationResumedEvent(
  tick: SimulationTick,
  minute: SimulationMinute,
): SimulationResumedEvent {
  return Object.freeze({
    type: DomainEventType.SimulationResumed,
    tick,
    minute,
  }) as SimulationResumedEvent;
}

export function createSimulationTickAdvancedEvent(
  input: CreateSimulationTickAdvancedEventInput,
): SimulationTickAdvancedEvent {
  return Object.freeze({
    type: DomainEventType.SimulationTickAdvanced,
    previousTick: input.previousTick,
    currentTick: input.currentTick,
    previousMinute: input.previousMinute,
    currentMinute: input.currentMinute,
  }) as SimulationTickAdvancedEvent;
}

export function createOperationPlannedEvent(
  input: CreateOperationPlannedEventInput,
): OperationPlannedEvent {
  return Object.freeze({
    type: DomainEventType.OperationPlanned,
    operationId: input.operationId,
    operationTemplateId: input.operationTemplateId,
    organizationId: input.organizationId,
    targetLocationId: input.targetLocationId,
    assignedCharacterIds: Object.freeze([...input.assignedCharacterIds]),
    plannedAtTick: input.plannedAtTick,
    plannedCompletionTick: input.plannedCompletionTick,
  }) as OperationPlannedEvent;
}

export function createCharacterAssignedToOperationEvent(
  input: CreateCharacterAssignedToOperationEventInput,
): CharacterAssignedToOperationEvent {
  return Object.freeze({
    type: DomainEventType.CharacterAssignedToOperation,
    characterId: input.characterId,
    operationId: input.operationId,
    previousAssignmentState: input.previousAssignmentState,
    currentAssignmentState: input.currentAssignmentState,
  }) as CharacterAssignedToOperationEvent;
}

export function createOrganizationOperationalCapacityReservedEvent(
  input: CreateOrganizationOperationalCapacityReservedEventInput,
): OrganizationOperationalCapacityReservedEvent {
  return Object.freeze({
    type: DomainEventType.OrganizationOperationalCapacityReserved,
    organizationId: input.organizationId,
    operationId: input.operationId,
    previousOperationalCapacity: input.previousOperationalCapacity,
    currentOperationalCapacity: input.currentOperationalCapacity,
    delta: input.delta,
  }) as OrganizationOperationalCapacityReservedEvent;
}

export function createOrganizationMoneyChangedEvent(
  input: CreateOrganizationMoneyChangedEventInput,
): OrganizationMoneyChangedEvent {
  return Object.freeze({
    type: DomainEventType.OrganizationMoneyChanged,
    organizationId: input.organizationId,
    operationId: input.operationId,
    reason: input.reason,
    previousMoney: input.previousMoney,
    currentMoney: input.currentMoney,
    delta: input.delta,
  }) as OrganizationMoneyChangedEvent;
}

export function createDomainExecution(
  gameState: GameState,
  events: readonly DomainEvent[],
): DomainExecution {
  return Object.freeze({
    gameState,
    events: Object.freeze(events.map((event) => Object.freeze({ ...event }) as DomainEvent)),
  }) as DomainExecution;
}
