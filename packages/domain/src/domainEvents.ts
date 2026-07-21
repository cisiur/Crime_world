import type { GameState } from "./gameState";
import type { AssignmentState, CharacterHealthState } from "./characterState";
import type {
  CharacterId,
  LocationId,
  OperationId,
  OperationTemplateId,
  OrganizationId,
} from "./entityIds";
import type { OperationOutcomeCategory } from "./operationOutcomeClassification";
import type { OperationOutcomeModifierContributions } from "./operationOutcomeResolver";
import type { OperationStatus } from "./operationState";
import type { RandomState } from "./randomService";
import type { SimulationMinute, SimulationTick } from "./simulationClock";

declare const domainEventBrand: unique symbol;
declare const domainExecutionBrand: unique symbol;

export const DomainEventType = {
  CharacterAssignedToOperation: "CharacterAssignedToOperation",
  CharacterAssignmentReleased: "CharacterAssignmentReleased",
  CharacterHealthChanged: "CharacterHealthChanged",
  CharacterPersonalExposureChanged: "CharacterPersonalExposureChanged",
  OperationConsequencesApplied: "OperationConsequencesApplied",
  OperationLifecycleCompleted: "OperationLifecycleCompleted",
  OperationOutcomeClassified: "OperationOutcomeClassified",
  OperationOutcomeRolled: "OperationOutcomeRolled",
  OperationPlanned: "OperationPlanned",
  OperationStarted: "OperationStarted",
  OrganizationMoneyChanged: "OrganizationMoneyChanged",
  OrganizationOperationalCapacityReleased: "OrganizationOperationalCapacityReleased",
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

export interface OperationStartedEvent {
  readonly type: typeof DomainEventType.OperationStarted;
  readonly operationId: OperationId;
  readonly operationTemplateId: OperationTemplateId;
  readonly organizationId: OrganizationId;
  readonly targetLocationId: LocationId;
  readonly assignedCharacterIds: readonly CharacterId[];
  readonly previousStatus: OperationStatus;
  readonly currentStatus: OperationStatus;
  readonly transitionTick: SimulationTick;
  readonly plannedCompletionTick: SimulationTick;
  readonly [domainEventBrand]: "OperationStartedEvent";
}

export interface OperationLifecycleCompletedEvent {
  readonly type: typeof DomainEventType.OperationLifecycleCompleted;
  readonly operationId: OperationId;
  readonly operationTemplateId: OperationTemplateId;
  readonly organizationId: OrganizationId;
  readonly targetLocationId: LocationId;
  readonly assignedCharacterIds: readonly CharacterId[];
  readonly previousStatus: OperationStatus;
  readonly currentStatus: OperationStatus;
  readonly transitionTick: SimulationTick;
  readonly plannedCompletionTick: SimulationTick;
  readonly [domainEventBrand]: "OperationLifecycleCompletedEvent";
}

export interface OperationOutcomeRolledEvent {
  readonly type: typeof DomainEventType.OperationOutcomeRolled;
  readonly operationId: OperationId;
  readonly operationTemplateId: OperationTemplateId;
  readonly organizationId: OrganizationId;
  readonly targetLocationId: LocationId;
  readonly assignedCharacterIds: readonly CharacterId[];
  readonly selectedBandKey: string;
  readonly percentileRoll: number;
  readonly selectedBandLowerBound: number;
  readonly selectedBandUpperBound: number;
  readonly modifierContributions: OperationOutcomeModifierContributions;
  readonly previousRandomState: RandomState;
  readonly nextRandomState: RandomState;
  readonly [domainEventBrand]: "OperationOutcomeRolledEvent";
}

export interface OperationOutcomeClassifiedEvent {
  readonly type: typeof DomainEventType.OperationOutcomeClassified;
  readonly operationId: OperationId;
  readonly operationTemplateId: OperationTemplateId;
  readonly organizationId: OrganizationId;
  readonly targetLocationId: LocationId;
  readonly assignedCharacterIds: readonly CharacterId[];
  readonly category: OperationOutcomeCategory;
  readonly percentileRoll: number;
  readonly selectedBandLowerBound: number;
  readonly selectedBandUpperBound: number;
  readonly modifierContributions: OperationOutcomeModifierContributions;
  readonly previousRandomState: RandomState;
  readonly nextRandomState: RandomState;
  readonly [domainEventBrand]: "OperationOutcomeClassifiedEvent";
}

export interface CharacterAssignedToOperationEvent {
  readonly type: typeof DomainEventType.CharacterAssignedToOperation;
  readonly characterId: CharacterId;
  readonly operationId: OperationId;
  readonly previousAssignmentState: AssignmentState;
  readonly currentAssignmentState: AssignmentState;
  readonly [domainEventBrand]: "CharacterAssignedToOperationEvent";
}

export interface CharacterAssignmentReleasedEvent {
  readonly type: typeof DomainEventType.CharacterAssignmentReleased;
  readonly characterId: CharacterId;
  readonly operationId: OperationId;
  readonly previousAssignmentState: AssignmentState;
  readonly currentAssignmentState: AssignmentState;
  readonly [domainEventBrand]: "CharacterAssignmentReleasedEvent";
}

export interface CharacterPersonalExposureChangedEvent {
  readonly type: typeof DomainEventType.CharacterPersonalExposureChanged;
  readonly characterId: CharacterId;
  readonly operationId: OperationId;
  readonly category: OperationOutcomeCategory;
  readonly previousPersonalExposure: number;
  readonly requestedDelta: number;
  readonly actualDelta: number;
  readonly currentPersonalExposure: number;
  readonly clamped: boolean;
  readonly [domainEventBrand]: "CharacterPersonalExposureChangedEvent";
}

export interface CharacterHealthChangedEvent {
  readonly type: typeof DomainEventType.CharacterHealthChanged;
  readonly characterId: CharacterId;
  readonly operationId: OperationId;
  readonly category: OperationOutcomeCategory;
  readonly previousHealthState: CharacterHealthState;
  readonly currentHealthState: CharacterHealthState;
  readonly [domainEventBrand]: "CharacterHealthChangedEvent";
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

export interface OrganizationOperationalCapacityReleasedEvent {
  readonly type: typeof DomainEventType.OrganizationOperationalCapacityReleased;
  readonly organizationId: OrganizationId;
  readonly operationId: OperationId;
  readonly previousOperationalCapacity: number;
  readonly currentOperationalCapacity: number;
  readonly delta: number;
  readonly [domainEventBrand]: "OrganizationOperationalCapacityReleasedEvent";
}

export interface OrganizationMoneyChangedEvent {
  readonly type: typeof DomainEventType.OrganizationMoneyChanged;
  readonly organizationId: OrganizationId;
  readonly operationId: OperationId;
  readonly reason: "operation-start-cost-paid" | "operation-gross-reward-paid";
  readonly previousMoney: number;
  readonly currentMoney: number;
  readonly delta: number;
  readonly [domainEventBrand]: "OrganizationMoneyChangedEvent";
}

export interface OperationConsequencesAppliedEvent {
  readonly type: typeof DomainEventType.OperationConsequencesApplied;
  readonly operationId: OperationId;
  readonly operationTemplateId: OperationTemplateId;
  readonly organizationId: OrganizationId;
  readonly targetLocationId: LocationId;
  readonly releasedCharacterIds: readonly CharacterId[];
  readonly category: OperationOutcomeCategory;
  readonly grossReward: number;
  readonly requestedPersonalExposureDelta: number;
  readonly actualPersonalExposureDelta: number;
  readonly healthConsequence: "none" | "injured";
  readonly operationalCapacityReleased: number;
  readonly [domainEventBrand]: "OperationConsequencesAppliedEvent";
}

export type DomainEvent =
  | CharacterAssignmentReleasedEvent
  | CharacterAssignedToOperationEvent
  | CharacterHealthChangedEvent
  | CharacterPersonalExposureChangedEvent
  | OperationConsequencesAppliedEvent
  | OperationLifecycleCompletedEvent
  | OperationOutcomeClassifiedEvent
  | OperationOutcomeRolledEvent
  | OperationPlannedEvent
  | OperationStartedEvent
  | OrganizationMoneyChangedEvent
  | OrganizationOperationalCapacityReleasedEvent
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

export interface CreateOperationLifecycleTransitionEventInput {
  readonly operationId: OperationId;
  readonly operationTemplateId: OperationTemplateId;
  readonly organizationId: OrganizationId;
  readonly targetLocationId: LocationId;
  readonly assignedCharacterIds: readonly CharacterId[];
  readonly previousStatus: OperationStatus;
  readonly currentStatus: OperationStatus;
  readonly transitionTick: SimulationTick;
  readonly plannedCompletionTick: SimulationTick;
}

export interface CreateOperationOutcomeRolledEventInput {
  readonly operationId: OperationId;
  readonly operationTemplateId: OperationTemplateId;
  readonly organizationId: OrganizationId;
  readonly targetLocationId: LocationId;
  readonly assignedCharacterIds: readonly CharacterId[];
  readonly selectedBandKey: string;
  readonly percentileRoll: number;
  readonly selectedBandLowerBound: number;
  readonly selectedBandUpperBound: number;
  readonly modifierContributions: OperationOutcomeModifierContributions;
  readonly previousRandomState: RandomState;
  readonly nextRandomState: RandomState;
}

export interface CreateOperationOutcomeClassifiedEventInput {
  readonly operationId: OperationId;
  readonly operationTemplateId: OperationTemplateId;
  readonly organizationId: OrganizationId;
  readonly targetLocationId: LocationId;
  readonly assignedCharacterIds: readonly CharacterId[];
  readonly category: OperationOutcomeCategory;
  readonly percentileRoll: number;
  readonly selectedBandLowerBound: number;
  readonly selectedBandUpperBound: number;
  readonly modifierContributions: OperationOutcomeModifierContributions;
  readonly previousRandomState: RandomState;
  readonly nextRandomState: RandomState;
}

export interface CreateCharacterAssignedToOperationEventInput {
  readonly characterId: CharacterId;
  readonly operationId: OperationId;
  readonly previousAssignmentState: AssignmentState;
  readonly currentAssignmentState: AssignmentState;
}

export interface CreateCharacterAssignmentReleasedEventInput {
  readonly characterId: CharacterId;
  readonly operationId: OperationId;
  readonly previousAssignmentState: AssignmentState;
  readonly currentAssignmentState: AssignmentState;
}

export interface CreateCharacterPersonalExposureChangedEventInput {
  readonly characterId: CharacterId;
  readonly operationId: OperationId;
  readonly category: OperationOutcomeCategory;
  readonly previousPersonalExposure: number;
  readonly requestedDelta: number;
  readonly actualDelta: number;
  readonly currentPersonalExposure: number;
  readonly clamped: boolean;
}

export interface CreateCharacterHealthChangedEventInput {
  readonly characterId: CharacterId;
  readonly operationId: OperationId;
  readonly category: OperationOutcomeCategory;
  readonly previousHealthState: CharacterHealthState;
  readonly currentHealthState: CharacterHealthState;
}

export interface CreateOrganizationOperationalCapacityReservedEventInput {
  readonly organizationId: OrganizationId;
  readonly operationId: OperationId;
  readonly previousOperationalCapacity: number;
  readonly currentOperationalCapacity: number;
  readonly delta: number;
}

export interface CreateOrganizationOperationalCapacityReleasedEventInput {
  readonly organizationId: OrganizationId;
  readonly operationId: OperationId;
  readonly previousOperationalCapacity: number;
  readonly currentOperationalCapacity: number;
  readonly delta: number;
}

export interface CreateOrganizationMoneyChangedEventInput {
  readonly organizationId: OrganizationId;
  readonly operationId: OperationId;
  readonly reason: "operation-start-cost-paid" | "operation-gross-reward-paid";
  readonly previousMoney: number;
  readonly currentMoney: number;
  readonly delta: number;
}

export interface CreateOperationConsequencesAppliedEventInput {
  readonly operationId: OperationId;
  readonly operationTemplateId: OperationTemplateId;
  readonly organizationId: OrganizationId;
  readonly targetLocationId: LocationId;
  readonly releasedCharacterIds: readonly CharacterId[];
  readonly category: OperationOutcomeCategory;
  readonly grossReward: number;
  readonly requestedPersonalExposureDelta: number;
  readonly actualPersonalExposureDelta: number;
  readonly healthConsequence: "none" | "injured";
  readonly operationalCapacityReleased: number;
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

export function createOperationStartedEvent(
  input: CreateOperationLifecycleTransitionEventInput,
): OperationStartedEvent {
  return Object.freeze({
    type: DomainEventType.OperationStarted,
    operationId: input.operationId,
    operationTemplateId: input.operationTemplateId,
    organizationId: input.organizationId,
    targetLocationId: input.targetLocationId,
    assignedCharacterIds: Object.freeze([...input.assignedCharacterIds]),
    previousStatus: input.previousStatus,
    currentStatus: input.currentStatus,
    transitionTick: input.transitionTick,
    plannedCompletionTick: input.plannedCompletionTick,
  }) as OperationStartedEvent;
}

export function createOperationLifecycleCompletedEvent(
  input: CreateOperationLifecycleTransitionEventInput,
): OperationLifecycleCompletedEvent {
  return Object.freeze({
    type: DomainEventType.OperationLifecycleCompleted,
    operationId: input.operationId,
    operationTemplateId: input.operationTemplateId,
    organizationId: input.organizationId,
    targetLocationId: input.targetLocationId,
    assignedCharacterIds: Object.freeze([...input.assignedCharacterIds]),
    previousStatus: input.previousStatus,
    currentStatus: input.currentStatus,
    transitionTick: input.transitionTick,
    plannedCompletionTick: input.plannedCompletionTick,
  }) as OperationLifecycleCompletedEvent;
}

export function createOperationOutcomeRolledEvent(
  input: CreateOperationOutcomeRolledEventInput,
): OperationOutcomeRolledEvent {
  return Object.freeze({
    type: DomainEventType.OperationOutcomeRolled,
    operationId: input.operationId,
    operationTemplateId: input.operationTemplateId,
    organizationId: input.organizationId,
    targetLocationId: input.targetLocationId,
    assignedCharacterIds: Object.freeze([...input.assignedCharacterIds]),
    selectedBandKey: input.selectedBandKey,
    percentileRoll: input.percentileRoll,
    selectedBandLowerBound: input.selectedBandLowerBound,
    selectedBandUpperBound: input.selectedBandUpperBound,
    modifierContributions: Object.freeze({
      base: input.modifierContributions.base,
      competence: input.modifierContributions.competence,
      capability: input.modifierContributions.capability,
      district: input.modifierContributions.district,
      exposure: input.modifierContributions.exposure,
    }),
    previousRandomState: Object.freeze({ ...input.previousRandomState }) as RandomState,
    nextRandomState: Object.freeze({ ...input.nextRandomState }) as RandomState,
  }) as OperationOutcomeRolledEvent;
}

export function createOperationOutcomeClassifiedEvent(
  input: CreateOperationOutcomeClassifiedEventInput,
): OperationOutcomeClassifiedEvent {
  return Object.freeze({
    type: DomainEventType.OperationOutcomeClassified,
    operationId: input.operationId,
    operationTemplateId: input.operationTemplateId,
    organizationId: input.organizationId,
    targetLocationId: input.targetLocationId,
    assignedCharacterIds: Object.freeze([...input.assignedCharacterIds]),
    category: input.category,
    percentileRoll: input.percentileRoll,
    selectedBandLowerBound: input.selectedBandLowerBound,
    selectedBandUpperBound: input.selectedBandUpperBound,
    modifierContributions: Object.freeze({
      base: input.modifierContributions.base,
      competence: input.modifierContributions.competence,
      capability: input.modifierContributions.capability,
      district: input.modifierContributions.district,
      exposure: input.modifierContributions.exposure,
    }),
    previousRandomState: Object.freeze({ ...input.previousRandomState }) as RandomState,
    nextRandomState: Object.freeze({ ...input.nextRandomState }) as RandomState,
  }) as OperationOutcomeClassifiedEvent;
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

export function createCharacterAssignmentReleasedEvent(
  input: CreateCharacterAssignmentReleasedEventInput,
): CharacterAssignmentReleasedEvent {
  return Object.freeze({
    type: DomainEventType.CharacterAssignmentReleased,
    characterId: input.characterId,
    operationId: input.operationId,
    previousAssignmentState: input.previousAssignmentState,
    currentAssignmentState: input.currentAssignmentState,
  }) as CharacterAssignmentReleasedEvent;
}

export function createCharacterPersonalExposureChangedEvent(
  input: CreateCharacterPersonalExposureChangedEventInput,
): CharacterPersonalExposureChangedEvent {
  return Object.freeze({
    type: DomainEventType.CharacterPersonalExposureChanged,
    characterId: input.characterId,
    operationId: input.operationId,
    category: input.category,
    previousPersonalExposure: input.previousPersonalExposure,
    requestedDelta: input.requestedDelta,
    actualDelta: input.actualDelta,
    currentPersonalExposure: input.currentPersonalExposure,
    clamped: input.clamped,
  }) as CharacterPersonalExposureChangedEvent;
}

export function createCharacterHealthChangedEvent(
  input: CreateCharacterHealthChangedEventInput,
): CharacterHealthChangedEvent {
  return Object.freeze({
    type: DomainEventType.CharacterHealthChanged,
    characterId: input.characterId,
    operationId: input.operationId,
    category: input.category,
    previousHealthState: input.previousHealthState,
    currentHealthState: input.currentHealthState,
  }) as CharacterHealthChangedEvent;
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

export function createOrganizationOperationalCapacityReleasedEvent(
  input: CreateOrganizationOperationalCapacityReleasedEventInput,
): OrganizationOperationalCapacityReleasedEvent {
  return Object.freeze({
    type: DomainEventType.OrganizationOperationalCapacityReleased,
    organizationId: input.organizationId,
    operationId: input.operationId,
    previousOperationalCapacity: input.previousOperationalCapacity,
    currentOperationalCapacity: input.currentOperationalCapacity,
    delta: input.delta,
  }) as OrganizationOperationalCapacityReleasedEvent;
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

export function createOperationConsequencesAppliedEvent(
  input: CreateOperationConsequencesAppliedEventInput,
): OperationConsequencesAppliedEvent {
  return Object.freeze({
    type: DomainEventType.OperationConsequencesApplied,
    operationId: input.operationId,
    operationTemplateId: input.operationTemplateId,
    organizationId: input.organizationId,
    targetLocationId: input.targetLocationId,
    releasedCharacterIds: Object.freeze([...input.releasedCharacterIds]),
    category: input.category,
    grossReward: input.grossReward,
    requestedPersonalExposureDelta: input.requestedPersonalExposureDelta,
    actualPersonalExposureDelta: input.actualPersonalExposureDelta,
    healthConsequence: input.healthConsequence,
    operationalCapacityReleased: input.operationalCapacityReleased,
  }) as OperationConsequencesAppliedEvent;
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
