import {
  DomainEventType,
  type CharacterAssignmentReleasedEvent,
  type CharacterAssignedToOperationEvent,
  type CharacterHealthChangedEvent,
  type CharacterPersonalExposureChangedEvent,
  type DomainEvent,
  type DomainExecution,
  type OperationConsequencesAppliedEvent,
  type OperationLifecycleCompletedEvent,
  type OperationOutcomeClassifiedEvent,
  type OperationOutcomeRolledEvent,
  type OperationPlannedEvent,
  type OperationStartedEvent,
  type OrganizationMoneyChangedEvent,
  type OrganizationOperationalCapacityReleasedEvent,
  type OrganizationOperationalCapacityReservedEvent,
  type SimulationResumedEvent,
  type SimulationTickAdvancedEvent,
} from "./domainEvents";
import type { GameState } from "./gameState";
import {
  parseCampaignId,
  parseCharacterId,
  parseLocationId,
  parseOperationId,
  parseOperationTemplateId,
  parseOrganizationId,
} from "./entityIds";
import { parseSchemaVersion } from "./gameState";
import { isOperationOutcomeCategory } from "./operationOutcomeClassification";
import { OperationStatus } from "./operationState";
import { parseRandomState, type RandomState } from "./randomService";
import {
  MINUTES_PER_TICK,
  SimulationSpeed,
  parseSimulationMinute,
  parseSimulationTick,
  type SimulationClockState,
} from "./simulationClock";

export class InvariantViolationError extends Error {
  public constructor(
    public readonly invariantName: string,
    public readonly description: string,
    public readonly value?: unknown,
  ) {
    super(`Invariant violation [${invariantName}]: ${description}.`);
    this.name = "InvariantViolationError";
  }
}

export function assertSimulationClockInvariant(clock: SimulationClockState): void {
  assertObject("SimulationClock", clock);
  assertInvariant(
    "SimulationClock.currentMinute",
    () => parseSimulationMinute(clock.currentMinute),
    clock,
  );
  assertInvariant(
    "SimulationClock.currentTick",
    () => parseSimulationTick(clock.currentTick),
    clock,
  );

  if (typeof clock.paused !== "boolean") {
    throw new InvariantViolationError("SimulationClock.paused", "paused must be a boolean", clock);
  }

  if (!isSimulationSpeed(clock.speed)) {
    throw new InvariantViolationError(
      "SimulationClock.speed",
      "speed must be one of the supported SimulationSpeed values",
      clock,
    );
  }

  if (clock.currentMinute !== clock.currentTick * MINUTES_PER_TICK) {
    throw new InvariantViolationError(
      "SimulationClock.minuteTickRelation",
      `currentMinute must equal currentTick * ${MINUTES_PER_TICK}`,
      clock,
    );
  }
}

export function assertRandomStateInvariant(randomState: RandomState): void {
  assertObject("RandomState", randomState);

  for (const fieldName of ["stateHigh", "stateLow", "incrementHigh", "incrementLow"] as const) {
    const value = randomState[fieldName];

    if (typeof value !== "number") {
      throw new InvariantViolationError(
        "RandomState",
        `${fieldName} must be a number`,
        randomState,
      );
    }

    if (!Number.isFinite(value)) {
      throw new InvariantViolationError("RandomState", `${fieldName} must be finite`, randomState);
    }

    if (!Number.isSafeInteger(value)) {
      throw new InvariantViolationError(
        "RandomState",
        `${fieldName} must be a safe integer`,
        randomState,
      );
    }
  }

  assertInvariant("RandomState.structure", () => parseRandomState(randomState), randomState);
}

export function assertGameStateInvariant(gameState: GameState): void {
  assertObject("GameState", gameState);
  assertInvariant(
    "GameState.schemaVersion",
    () => parseSchemaVersion(gameState.schemaVersion),
    gameState,
  );
  assertInvariant("GameState.campaignId", () => parseCampaignId(gameState.campaignId), gameState);
  assertSimulationClockInvariant(gameState.clock);
  assertRandomStateInvariant(gameState.randomState);
}

export function assertDomainExecutionInvariant(execution: DomainExecution): void {
  assertObject("DomainExecution", execution);
  assertGameStateInvariant(execution.gameState);

  if (!Array.isArray(execution.events)) {
    throw new InvariantViolationError(
      "DomainExecution.events",
      "events must be an array",
      execution,
    );
  }

  if (!Object.isFrozen(execution.events)) {
    throw new InvariantViolationError(
      "DomainExecution.events",
      "events array must be frozen",
      execution.events,
    );
  }

  for (const event of execution.events) {
    if (!Object.isFrozen(event)) {
      throw new InvariantViolationError(
        "DomainExecution.event",
        "each event object must be frozen",
        event,
      );
    }

    assertDomainEventInvariant(event);
  }
}

export function assertDomainEventInvariant(event: DomainEvent): void {
  assertObject("DomainEvent", event);

  switch (event.type) {
    case DomainEventType.CharacterAssignedToOperation:
      assertCharacterAssignedToOperationEventInvariant(event);
      return;
    case DomainEventType.CharacterAssignmentReleased:
      assertCharacterAssignmentReleasedEventInvariant(event);
      return;
    case DomainEventType.CharacterHealthChanged:
      assertCharacterHealthChangedEventInvariant(event);
      return;
    case DomainEventType.CharacterPersonalExposureChanged:
      assertCharacterPersonalExposureChangedEventInvariant(event);
      return;
    case DomainEventType.OperationConsequencesApplied:
      assertOperationConsequencesAppliedEventInvariant(event);
      return;
    case DomainEventType.OperationLifecycleCompleted:
      assertOperationLifecycleCompletedEventInvariant(event);
      return;
    case DomainEventType.OperationOutcomeClassified:
      assertOperationOutcomeClassifiedEventInvariant(event);
      return;
    case DomainEventType.OperationOutcomeRolled:
      assertOperationOutcomeRolledEventInvariant(event);
      return;
    case DomainEventType.OperationPlanned:
      assertOperationPlannedEventInvariant(event);
      return;
    case DomainEventType.OperationStarted:
      assertOperationStartedEventInvariant(event);
      return;
    case DomainEventType.OrganizationMoneyChanged:
      assertOrganizationMoneyChangedEventInvariant(event);
      return;
    case DomainEventType.OrganizationOperationalCapacityReleased:
      assertOrganizationOperationalCapacityReleasedEventInvariant(event);
      return;
    case DomainEventType.OrganizationOperationalCapacityReserved:
      assertOrganizationOperationalCapacityReservedEventInvariant(event);
      return;
    case DomainEventType.SimulationResumed:
      assertSimulationResumedEventInvariant(event);
      return;
    case DomainEventType.SimulationTickAdvanced:
      assertSimulationTickAdvancedEventInvariant(event);
      return;
    default:
      throw new InvariantViolationError("DomainEvent.type", "event type must be supported", event);
  }
}

function assertOperationOutcomeRolledEventInvariant(event: OperationOutcomeRolledEvent): void {
  assertOperationOutcomeEventFields("OperationOutcomeRolled", event);

  if (event.selectedBandKey.trim().length === 0) {
    throw new InvariantViolationError(
      "OperationOutcomeRolled.selectedBandKey",
      "selectedBandKey must be non-empty",
      event,
    );
  }
}

function assertOperationOutcomeClassifiedEventInvariant(
  event: OperationOutcomeClassifiedEvent,
): void {
  assertOperationOutcomeEventFields("OperationOutcomeClassified", event);

  if (!isOperationOutcomeCategory(event.category)) {
    throw new InvariantViolationError(
      "OperationOutcomeClassified.category",
      "category must be a supported operation outcome category",
      event,
    );
  }
}

function assertOperationOutcomeEventFields(
  eventName: "OperationOutcomeRolled" | "OperationOutcomeClassified",
  event: OperationOutcomeRolledEvent | OperationOutcomeClassifiedEvent,
): void {
  assertInvariant(`${eventName}.operationId`, () => parseOperationId(event.operationId), event);
  assertInvariant(
    `${eventName}.operationTemplateId`,
    () => parseOperationTemplateId(event.operationTemplateId),
    event,
  );
  assertInvariant(
    `${eventName}.organizationId`,
    () => parseOrganizationId(event.organizationId),
    event,
  );
  assertInvariant(
    `${eventName}.targetLocationId`,
    () => parseLocationId(event.targetLocationId),
    event,
  );

  if (!Array.isArray(event.assignedCharacterIds) || event.assignedCharacterIds.length === 0) {
    throw new InvariantViolationError(
      `${eventName}.assignedCharacterIds`,
      "assignedCharacterIds must be a non-empty array",
      event,
    );
  }

  for (const characterId of event.assignedCharacterIds) {
    assertInvariant(
      `${eventName}.assignedCharacterIds`,
      () => parseCharacterId(characterId),
      event,
    );
  }

  assertFiniteInteger(`${eventName}.percentileRoll`, event.percentileRoll, event);
  assertFiniteInteger(`${eventName}.selectedBandLowerBound`, event.selectedBandLowerBound, event);
  assertFiniteInteger(`${eventName}.selectedBandUpperBound`, event.selectedBandUpperBound, event);

  if (event.percentileRoll < 1 || event.percentileRoll > 100) {
    throw new InvariantViolationError(
      `${eventName}.percentileRoll`,
      "percentileRoll must be within 1..100",
      event,
    );
  }

  if (
    event.selectedBandLowerBound < 1 ||
    event.selectedBandUpperBound > 100 ||
    event.selectedBandLowerBound > event.selectedBandUpperBound
  ) {
    throw new InvariantViolationError(
      `${eventName}.selectedBandRange`,
      "selected range must be within 1..100 and lowerBound <= upperBound",
      event,
    );
  }

  if (
    event.percentileRoll < event.selectedBandLowerBound ||
    event.percentileRoll > event.selectedBandUpperBound
  ) {
    throw new InvariantViolationError(
      `${eventName}.rollRange`,
      "percentileRoll must be contained by the selected band range",
      event,
    );
  }

  assertObject(`${eventName}.modifierContributions`, event.modifierContributions);
  for (const field of ["base", "competence", "capability", "district", "exposure"] as const) {
    assertFiniteInteger(
      `${eventName}.modifierContributions.${field}`,
      event.modifierContributions[field],
      event,
    );
  }

  assertRandomStateInvariant(event.previousRandomState);
  assertRandomStateInvariant(event.nextRandomState);
}

function assertOperationStartedEventInvariant(event: OperationStartedEvent): void {
  assertOperationLifecycleEventFields("OperationStarted", event);

  if (
    event.previousStatus !== OperationStatus.Planned ||
    event.currentStatus !== OperationStatus.Running
  ) {
    throw new InvariantViolationError(
      "OperationStarted.statusTransition",
      "status transition must be planned -> running",
      event,
    );
  }
}

function assertOperationLifecycleCompletedEventInvariant(
  event: OperationLifecycleCompletedEvent,
): void {
  assertOperationLifecycleEventFields("OperationLifecycleCompleted", event);

  if (
    event.previousStatus !== OperationStatus.Running ||
    event.currentStatus !== OperationStatus.Resolved
  ) {
    throw new InvariantViolationError(
      "OperationLifecycleCompleted.statusTransition",
      "status transition must be running -> resolved",
      event,
    );
  }
}

function assertOperationLifecycleEventFields(
  eventName: "OperationStarted" | "OperationLifecycleCompleted",
  event: OperationStartedEvent | OperationLifecycleCompletedEvent,
): void {
  assertInvariant(`${eventName}.operationId`, () => parseOperationId(event.operationId), event);
  assertInvariant(
    `${eventName}.operationTemplateId`,
    () => parseOperationTemplateId(event.operationTemplateId),
    event,
  );
  assertInvariant(
    `${eventName}.organizationId`,
    () => parseOrganizationId(event.organizationId),
    event,
  );
  assertInvariant(
    `${eventName}.targetLocationId`,
    () => parseLocationId(event.targetLocationId),
    event,
  );

  if (!Array.isArray(event.assignedCharacterIds) || event.assignedCharacterIds.length === 0) {
    throw new InvariantViolationError(
      `${eventName}.assignedCharacterIds`,
      "assignedCharacterIds must be a non-empty array",
      event,
    );
  }

  for (const characterId of event.assignedCharacterIds) {
    assertInvariant(
      `${eventName}.assignedCharacterIds`,
      () => parseCharacterId(characterId),
      event,
    );
  }

  assertInvariant(
    `${eventName}.transitionTick`,
    () => parseSimulationTick(event.transitionTick),
    event,
  );
  assertInvariant(
    `${eventName}.plannedCompletionTick`,
    () => parseSimulationTick(event.plannedCompletionTick),
    event,
  );
}

function assertOperationPlannedEventInvariant(event: OperationPlannedEvent): void {
  assertInvariant("OperationPlanned.operationId", () => parseOperationId(event.operationId), event);
  assertInvariant(
    "OperationPlanned.operationTemplateId",
    () => parseOperationTemplateId(event.operationTemplateId),
    event,
  );
  assertInvariant(
    "OperationPlanned.organizationId",
    () => parseOrganizationId(event.organizationId),
    event,
  );
  assertInvariant(
    "OperationPlanned.targetLocationId",
    () => parseLocationId(event.targetLocationId),
    event,
  );

  if (!Array.isArray(event.assignedCharacterIds) || event.assignedCharacterIds.length === 0) {
    throw new InvariantViolationError(
      "OperationPlanned.assignedCharacterIds",
      "assignedCharacterIds must be a non-empty array",
      event,
    );
  }

  for (const characterId of event.assignedCharacterIds) {
    assertInvariant(
      "OperationPlanned.assignedCharacterIds",
      () => parseCharacterId(characterId),
      event,
    );
  }

  assertInvariant(
    "OperationPlanned.plannedAtTick",
    () => parseSimulationTick(event.plannedAtTick),
    event,
  );
  assertInvariant(
    "OperationPlanned.plannedCompletionTick",
    () => parseSimulationTick(event.plannedCompletionTick),
    event,
  );

  if (event.plannedCompletionTick < event.plannedAtTick) {
    throw new InvariantViolationError(
      "OperationPlanned.tickOrder",
      "plannedCompletionTick must be greater than or equal to plannedAtTick",
      event,
    );
  }
}

function assertCharacterAssignedToOperationEventInvariant(
  event: CharacterAssignedToOperationEvent,
): void {
  assertInvariant(
    "CharacterAssignedToOperation.characterId",
    () => parseCharacterId(event.characterId),
    event,
  );
  assertInvariant(
    "CharacterAssignedToOperation.operationId",
    () => parseOperationId(event.operationId),
    event,
  );

  if (event.previousAssignmentState !== "idle" || event.currentAssignmentState !== "assigned") {
    throw new InvariantViolationError(
      "CharacterAssignedToOperation.assignmentTransition",
      "assignment transition must be idle -> assigned",
      event,
    );
  }
}

function assertCharacterAssignmentReleasedEventInvariant(
  event: CharacterAssignmentReleasedEvent,
): void {
  assertInvariant(
    "CharacterAssignmentReleased.characterId",
    () => parseCharacterId(event.characterId),
    event,
  );
  assertInvariant(
    "CharacterAssignmentReleased.operationId",
    () => parseOperationId(event.operationId),
    event,
  );

  if (event.previousAssignmentState !== "assigned" || event.currentAssignmentState !== "idle") {
    throw new InvariantViolationError(
      "CharacterAssignmentReleased.assignmentTransition",
      "assignment transition must be assigned -> idle",
      event,
    );
  }
}

function assertCharacterPersonalExposureChangedEventInvariant(
  event: CharacterPersonalExposureChangedEvent,
): void {
  assertInvariant(
    "CharacterPersonalExposureChanged.characterId",
    () => parseCharacterId(event.characterId),
    event,
  );
  assertInvariant(
    "CharacterPersonalExposureChanged.operationId",
    () => parseOperationId(event.operationId),
    event,
  );

  if (!isOperationOutcomeCategory(event.category)) {
    throw new InvariantViolationError(
      "CharacterPersonalExposureChanged.category",
      "category must be a supported operation outcome category",
      event,
    );
  }

  assertFiniteInteger(
    "CharacterPersonalExposureChanged.previousPersonalExposure",
    event.previousPersonalExposure,
    event,
  );
  assertFiniteInteger(
    "CharacterPersonalExposureChanged.requestedDelta",
    event.requestedDelta,
    event,
  );
  assertFiniteInteger("CharacterPersonalExposureChanged.actualDelta", event.actualDelta, event);
  assertFiniteInteger(
    "CharacterPersonalExposureChanged.currentPersonalExposure",
    event.currentPersonalExposure,
    event,
  );

  if (
    event.previousPersonalExposure < 0 ||
    event.previousPersonalExposure > 100 ||
    event.currentPersonalExposure < 0 ||
    event.currentPersonalExposure > 100
  ) {
    throw new InvariantViolationError(
      "CharacterPersonalExposureChanged.exposureRange",
      "exposure values must be within 0..100",
      event,
    );
  }

  if (event.requestedDelta < 0 || event.actualDelta < 0) {
    throw new InvariantViolationError(
      "CharacterPersonalExposureChanged.delta",
      "exposure deltas must be non-negative",
      event,
    );
  }

  if (event.currentPersonalExposure !== event.previousPersonalExposure + event.actualDelta) {
    throw new InvariantViolationError(
      "CharacterPersonalExposureChanged.actualDelta",
      "currentPersonalExposure must equal previousPersonalExposure + actualDelta",
      event,
    );
  }

  if (typeof event.clamped !== "boolean") {
    throw new InvariantViolationError(
      "CharacterPersonalExposureChanged.clamped",
      "clamped must be a boolean",
      event,
    );
  }
}

function assertCharacterHealthChangedEventInvariant(event: CharacterHealthChangedEvent): void {
  assertInvariant(
    "CharacterHealthChanged.characterId",
    () => parseCharacterId(event.characterId),
    event,
  );
  assertInvariant(
    "CharacterHealthChanged.operationId",
    () => parseOperationId(event.operationId),
    event,
  );

  if (!isOperationOutcomeCategory(event.category)) {
    throw new InvariantViolationError(
      "CharacterHealthChanged.category",
      "category must be a supported operation outcome category",
      event,
    );
  }

  if (event.previousHealthState !== "healthy" || event.currentHealthState !== "injured") {
    throw new InvariantViolationError(
      "CharacterHealthChanged.healthTransition",
      "health transition must be healthy -> injured",
      event,
    );
  }
}

function assertOrganizationOperationalCapacityReservedEventInvariant(
  event: OrganizationOperationalCapacityReservedEvent,
): void {
  assertInvariant(
    "OrganizationOperationalCapacityReserved.organizationId",
    () => parseOrganizationId(event.organizationId),
    event,
  );
  assertInvariant(
    "OrganizationOperationalCapacityReserved.operationId",
    () => parseOperationId(event.operationId),
    event,
  );
  assertFiniteInteger(
    "OrganizationOperationalCapacityReserved.previousOperationalCapacity",
    event.previousOperationalCapacity,
    event,
  );
  assertFiniteInteger(
    "OrganizationOperationalCapacityReserved.currentOperationalCapacity",
    event.currentOperationalCapacity,
    event,
  );
  assertFiniteInteger("OrganizationOperationalCapacityReserved.delta", event.delta, event);

  if (event.currentOperationalCapacity !== event.previousOperationalCapacity + event.delta) {
    throw new InvariantViolationError(
      "OrganizationOperationalCapacityReserved.delta",
      "currentOperationalCapacity must equal previousOperationalCapacity + delta",
      event,
    );
  }
}

function assertOrganizationOperationalCapacityReleasedEventInvariant(
  event: OrganizationOperationalCapacityReleasedEvent,
): void {
  assertInvariant(
    "OrganizationOperationalCapacityReleased.organizationId",
    () => parseOrganizationId(event.organizationId),
    event,
  );
  assertInvariant(
    "OrganizationOperationalCapacityReleased.operationId",
    () => parseOperationId(event.operationId),
    event,
  );
  assertFiniteInteger(
    "OrganizationOperationalCapacityReleased.previousOperationalCapacity",
    event.previousOperationalCapacity,
    event,
  );
  assertFiniteInteger(
    "OrganizationOperationalCapacityReleased.currentOperationalCapacity",
    event.currentOperationalCapacity,
    event,
  );
  assertFiniteInteger("OrganizationOperationalCapacityReleased.delta", event.delta, event);

  if (event.delta <= 0) {
    throw new InvariantViolationError(
      "OrganizationOperationalCapacityReleased.delta",
      "delta must be positive",
      event,
    );
  }

  if (event.currentOperationalCapacity !== event.previousOperationalCapacity + event.delta) {
    throw new InvariantViolationError(
      "OrganizationOperationalCapacityReleased.delta",
      "currentOperationalCapacity must equal previousOperationalCapacity + delta",
      event,
    );
  }
}

function assertOrganizationMoneyChangedEventInvariant(event: OrganizationMoneyChangedEvent): void {
  assertInvariant(
    "OrganizationMoneyChanged.organizationId",
    () => parseOrganizationId(event.organizationId),
    event,
  );
  assertInvariant(
    "OrganizationMoneyChanged.operationId",
    () => parseOperationId(event.operationId),
    event,
  );
  assertFiniteInteger("OrganizationMoneyChanged.previousMoney", event.previousMoney, event);
  assertFiniteInteger("OrganizationMoneyChanged.currentMoney", event.currentMoney, event);
  assertFiniteInteger("OrganizationMoneyChanged.delta", event.delta, event);

  if (
    event.reason !== "operation-start-cost-paid" &&
    event.reason !== "operation-gross-reward-paid"
  ) {
    throw new InvariantViolationError(
      "OrganizationMoneyChanged.reason",
      "reason must be operation-start-cost-paid or operation-gross-reward-paid",
      event,
    );
  }

  if (event.currentMoney !== event.previousMoney + event.delta) {
    throw new InvariantViolationError(
      "OrganizationMoneyChanged.delta",
      "currentMoney must equal previousMoney + delta",
      event,
    );
  }
}

function assertOperationConsequencesAppliedEventInvariant(
  event: OperationConsequencesAppliedEvent,
): void {
  assertInvariant(
    "OperationConsequencesApplied.operationId",
    () => parseOperationId(event.operationId),
    event,
  );
  assertInvariant(
    "OperationConsequencesApplied.operationTemplateId",
    () => parseOperationTemplateId(event.operationTemplateId),
    event,
  );
  assertInvariant(
    "OperationConsequencesApplied.organizationId",
    () => parseOrganizationId(event.organizationId),
    event,
  );
  assertInvariant(
    "OperationConsequencesApplied.targetLocationId",
    () => parseLocationId(event.targetLocationId),
    event,
  );

  if (!Array.isArray(event.releasedCharacterIds) || event.releasedCharacterIds.length === 0) {
    throw new InvariantViolationError(
      "OperationConsequencesApplied.releasedCharacterIds",
      "releasedCharacterIds must be a non-empty array",
      event,
    );
  }

  for (const characterId of event.releasedCharacterIds) {
    assertInvariant(
      "OperationConsequencesApplied.releasedCharacterIds",
      () => parseCharacterId(characterId),
      event,
    );
  }

  if (!isOperationOutcomeCategory(event.category)) {
    throw new InvariantViolationError(
      "OperationConsequencesApplied.category",
      "category must be a supported operation outcome category",
      event,
    );
  }

  assertFiniteInteger("OperationConsequencesApplied.grossReward", event.grossReward, event);
  assertFiniteInteger(
    "OperationConsequencesApplied.requestedPersonalExposureDelta",
    event.requestedPersonalExposureDelta,
    event,
  );
  assertFiniteInteger(
    "OperationConsequencesApplied.actualPersonalExposureDelta",
    event.actualPersonalExposureDelta,
    event,
  );
  assertFiniteInteger(
    "OperationConsequencesApplied.operationalCapacityReleased",
    event.operationalCapacityReleased,
    event,
  );

  if (
    event.grossReward < 0 ||
    event.requestedPersonalExposureDelta < 0 ||
    event.actualPersonalExposureDelta < 0 ||
    event.operationalCapacityReleased <= 0
  ) {
    throw new InvariantViolationError(
      "OperationConsequencesApplied.values",
      "reward and exposure values must be non-negative and capacity release must be positive",
      event,
    );
  }

  if (event.healthConsequence !== "none" && event.healthConsequence !== "injured") {
    throw new InvariantViolationError(
      "OperationConsequencesApplied.healthConsequence",
      "healthConsequence must be none or injured",
      event,
    );
  }
}

function assertSimulationResumedEventInvariant(event: SimulationResumedEvent): void {
  assertInvariant("SimulationResumed.tick", () => parseSimulationTick(event.tick), event);
  assertInvariant("SimulationResumed.minute", () => parseSimulationMinute(event.minute), event);
}

function assertSimulationTickAdvancedEventInvariant(event: SimulationTickAdvancedEvent): void {
  assertInvariant(
    "SimulationTickAdvanced.previousTick",
    () => parseSimulationTick(event.previousTick),
    event,
  );
  assertInvariant(
    "SimulationTickAdvanced.currentTick",
    () => parseSimulationTick(event.currentTick),
    event,
  );
  assertInvariant(
    "SimulationTickAdvanced.previousMinute",
    () => parseSimulationMinute(event.previousMinute),
    event,
  );
  assertInvariant(
    "SimulationTickAdvanced.currentMinute",
    () => parseSimulationMinute(event.currentMinute),
    event,
  );

  if (event.currentTick !== event.previousTick + 1) {
    throw new InvariantViolationError(
      "SimulationTickAdvanced.tickProgression",
      "currentTick must equal previousTick + 1",
      event,
    );
  }

  if (event.currentMinute !== event.previousMinute + MINUTES_PER_TICK) {
    throw new InvariantViolationError(
      "SimulationTickAdvanced.minuteProgression",
      `currentMinute must equal previousMinute + ${MINUTES_PER_TICK}`,
      event,
    );
  }
}

function assertFiniteInteger(invariantName: string, value: unknown, source: unknown): void {
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value)) {
    throw new InvariantViolationError(invariantName, "value must be a finite integer", source);
  }
}

function assertObject(invariantName: string, value: unknown): asserts value is object {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new InvariantViolationError(invariantName, "value must be an object", value);
  }
}

function assertInvariant(invariantName: string, assertion: () => void, value: unknown): void {
  try {
    assertion();
  } catch (error) {
    const description = error instanceof Error ? error.message : "nested invariant failed";
    throw new InvariantViolationError(invariantName, description, value);
  }
}

function isSimulationSpeed(value: unknown): value is SimulationSpeed {
  return (
    value === SimulationSpeed.Normal ||
    value === SimulationSpeed.Fast ||
    value === SimulationSpeed.VeryFast ||
    value === SimulationSpeed.Maximum
  );
}
