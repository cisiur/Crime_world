import {
  DomainEventType,
  type CharacterAssignedToOperationEvent,
  type DomainEvent,
  type DomainExecution,
  type OperationPlannedEvent,
  type OrganizationMoneyChangedEvent,
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
    case DomainEventType.OperationPlanned:
      assertOperationPlannedEventInvariant(event);
      return;
    case DomainEventType.OrganizationMoneyChanged:
      assertOrganizationMoneyChangedEventInvariant(event);
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

  if (event.reason !== "operation-start-cost-paid") {
    throw new InvariantViolationError(
      "OrganizationMoneyChanged.reason",
      "reason must be operation-start-cost-paid",
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
