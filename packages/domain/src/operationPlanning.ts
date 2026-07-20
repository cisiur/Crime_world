import type { BusinessState } from "./businessState";
import { createCharacterState, type CharacterState } from "./characterState";
import type { LocationState } from "./cityState";
import {
  createCharacterAssignedToOperationEvent,
  createOperationPlannedEvent,
  createOrganizationMoneyChangedEvent,
  createOrganizationOperationalCapacityReservedEvent,
  type DomainEvent,
} from "./domainEvents";
import {
  DomainErrorCode,
  failure,
  success,
  type DomainError,
  type DomainResult,
} from "./domainResult";
import type {
  CharacterId,
  LocationId,
  OperationId,
  OperationTemplateId,
  OrganizationId,
} from "./entityIds";
import { createOperationState, OperationStatus, type OperationState } from "./operationState";
import {
  evaluateOperationAvailability,
  type OperationAvailabilityLocationDefinitionInput,
  type OperationAvailabilityReason,
  type OperationAvailabilityTemplateInput,
} from "./operationAvailability";
import { createOrganizationState, type OrganizationState } from "./organizationState";
import { MINUTES_PER_TICK, parseSimulationTick, type SimulationTick } from "./simulationClock";

declare const planOperationCommandBrand: unique symbol;

export const OperationPlanningCommandType = {
  PlanOperation: "PlanOperation",
} as const;

export type OperationPlanningCommandType =
  (typeof OperationPlanningCommandType)[keyof typeof OperationPlanningCommandType];

export interface PlanOperationCommand {
  readonly type: typeof OperationPlanningCommandType.PlanOperation;
  readonly operationId: OperationId;
  readonly operationTemplateId: OperationTemplateId;
  readonly organizationId: OrganizationId;
  readonly targetLocationId: LocationId;
  readonly assignedCharacterId: CharacterId;
  readonly [planOperationCommandBrand]: "PlanOperationCommand";
}

export interface CreatePlanOperationCommandInput {
  readonly operationId: OperationId;
  readonly operationTemplateId: OperationTemplateId;
  readonly organizationId: OrganizationId;
  readonly targetLocationId: LocationId;
  readonly assignedCharacterId: CharacterId;
}

export interface OperationPlanningTemplateInput extends OperationAvailabilityTemplateInput {
  readonly durationMinutes: number;
}

export interface PlanOperationInput {
  readonly command: PlanOperationCommand;
  readonly currentTick: SimulationTick;
  readonly operationTemplates: readonly OperationPlanningTemplateInput[];
  readonly organizations: readonly OrganizationState[];
  readonly characters: readonly CharacterState[];
  readonly locationStates: readonly LocationState[];
  readonly locationDefinitions: readonly OperationAvailabilityLocationDefinitionInput[];
  readonly businessStates: readonly BusinessState[];
  readonly operations: readonly OperationState[];
}

export interface PlanOperationSuccess {
  readonly organization: OrganizationState;
  readonly organizations: readonly OrganizationState[];
  readonly assignedCharacter: CharacterState;
  readonly characters: readonly CharacterState[];
  readonly operation: OperationState;
  readonly operations: readonly OperationState[];
  readonly events: readonly DomainEvent[];
}

export interface OperationPlanningAvailabilityRejectedError extends DomainError {
  readonly code: typeof DomainErrorCode.OperationPlanningAvailabilityRejected;
  readonly reasons: readonly OperationAvailabilityReason[];
}

export interface OperationPlanningDuplicateOperationIdError extends DomainError {
  readonly code: typeof DomainErrorCode.OperationPlanningDuplicateOperationId;
  readonly operationId: OperationId;
}

export interface OperationPlanningInvalidDataError extends DomainError {
  readonly code: typeof DomainErrorCode.OperationPlanningInvalidData;
  readonly field: "durationMinutes" | "plannedCompletionTick";
}

export type OperationPlanningError =
  | OperationPlanningAvailabilityRejectedError
  | OperationPlanningDuplicateOperationIdError
  | OperationPlanningInvalidDataError;

export type PlanOperationResult = DomainResult<PlanOperationSuccess, OperationPlanningError>;

export function createPlanOperationCommand(
  input: CreatePlanOperationCommandInput,
): PlanOperationCommand {
  return Object.freeze({
    type: OperationPlanningCommandType.PlanOperation,
    operationId: input.operationId,
    operationTemplateId: input.operationTemplateId,
    organizationId: input.organizationId,
    targetLocationId: input.targetLocationId,
    assignedCharacterId: input.assignedCharacterId,
  }) as PlanOperationCommand;
}

export function planOperation(input: PlanOperationInput): PlanOperationResult {
  if (input.operations.some((operation) => operation.operationId === input.command.operationId)) {
    return failure({
      code: DomainErrorCode.OperationPlanningDuplicateOperationId,
      message: `Operation "${input.command.operationId}" already exists.`,
      operationId: input.command.operationId,
    });
  }

  const availability = evaluateOperationAvailability({
    operationTemplateId: input.command.operationTemplateId,
    organizationId: input.command.organizationId,
    targetLocationId: input.command.targetLocationId,
    assignedCharacterIds: [input.command.assignedCharacterId],
    operationTemplates: input.operationTemplates,
    organizations: input.organizations,
    characters: input.characters,
    locationStates: input.locationStates,
    locationDefinitions: input.locationDefinitions,
    businessStates: input.businessStates,
  });

  if (!availability.available) {
    return failure({
      code: DomainErrorCode.OperationPlanningAvailabilityRejected,
      message: "Operation planning prerequisites were not satisfied.",
      reasons: availability.reasons,
    });
  }

  const template = input.operationTemplates.find(
    (candidate) => candidate.id === input.command.operationTemplateId,
  );
  const organization = input.organizations.find(
    (candidate) => candidate.organizationId === input.command.organizationId,
  );
  const assignedCharacter = input.characters.find(
    (candidate) => candidate.characterId === input.command.assignedCharacterId,
  );

  if (!template || !organization || !assignedCharacter) {
    return failure({
      code: DomainErrorCode.OperationPlanningInvalidData,
      message: "Valid availability did not resolve required planning data.",
      field: "durationMinutes",
    });
  }

  const completionTickResult = deriveCompletionTick(input.currentTick, template.durationMinutes);
  if (!completionTickResult.ok) {
    return completionTickResult;
  }

  const operation = createOperationState({
    operationId: input.command.operationId,
    operationTemplateId: input.command.operationTemplateId,
    organizationId: input.command.organizationId,
    targetLocationId: input.command.targetLocationId,
    assignedCharacterIds: [input.command.assignedCharacterId],
    status: OperationStatus.Planned,
    plannedAtTick: input.currentTick,
    plannedCompletionTick: completionTickResult.value,
  });
  const nextAssignedCharacter = createCharacterState({
    ...assignedCharacter,
    assignmentState: "assigned",
  });
  const nextOrganization = createOrganizationState({
    ...organization,
    operationalCapacity: organization.operationalCapacity - template.operationalCapacityCost,
    money: organization.money - template.startCost,
  });
  const nextCharacters = replaceById(
    input.characters,
    "characterId",
    nextAssignedCharacter.characterId,
    nextAssignedCharacter,
  );
  const nextOrganizations = replaceById(
    input.organizations,
    "organizationId",
    nextOrganization.organizationId,
    nextOrganization,
  );
  const nextOperations = Object.freeze([...input.operations, operation]);
  const events = Object.freeze([
    createOperationPlannedEvent({
      operationId: operation.operationId,
      operationTemplateId: operation.operationTemplateId,
      organizationId: operation.organizationId,
      targetLocationId: operation.targetLocationId,
      assignedCharacterIds: operation.assignedCharacterIds,
      plannedAtTick: operation.plannedAtTick,
      plannedCompletionTick: operation.plannedCompletionTick,
    }),
    createCharacterAssignedToOperationEvent({
      characterId: nextAssignedCharacter.characterId,
      operationId: operation.operationId,
      previousAssignmentState: assignedCharacter.assignmentState,
      currentAssignmentState: nextAssignedCharacter.assignmentState,
    }),
    createOrganizationOperationalCapacityReservedEvent({
      organizationId: nextOrganization.organizationId,
      operationId: operation.operationId,
      previousOperationalCapacity: organization.operationalCapacity,
      currentOperationalCapacity: nextOrganization.operationalCapacity,
      delta: -template.operationalCapacityCost,
    }),
    createOrganizationMoneyChangedEvent({
      organizationId: nextOrganization.organizationId,
      operationId: operation.operationId,
      reason: "operation-start-cost-paid",
      previousMoney: organization.money,
      currentMoney: nextOrganization.money,
      delta: -template.startCost,
    }),
  ]);

  return success(
    Object.freeze({
      organization: nextOrganization,
      organizations: nextOrganizations,
      assignedCharacter: nextAssignedCharacter,
      characters: nextCharacters,
      operation,
      operations: nextOperations,
      events,
    }),
  );
}

function deriveCompletionTick(
  currentTick: SimulationTick,
  durationMinutes: number,
): DomainResult<SimulationTick, OperationPlanningInvalidDataError> {
  if (
    !Number.isFinite(durationMinutes) ||
    !Number.isSafeInteger(durationMinutes) ||
    durationMinutes <= 0 ||
    durationMinutes % MINUTES_PER_TICK !== 0
  ) {
    return failure({
      code: DomainErrorCode.OperationPlanningInvalidData,
      message: `Operation duration must be a positive safe integer divisible by ${MINUTES_PER_TICK} minutes per tick.`,
      field: "durationMinutes",
    });
  }

  const plannedCompletionTick = currentTick + durationMinutes / MINUTES_PER_TICK;
  if (!Number.isSafeInteger(plannedCompletionTick)) {
    return failure({
      code: DomainErrorCode.OperationPlanningInvalidData,
      message: "Planned completion tick would exceed Number.MAX_SAFE_INTEGER.",
      field: "plannedCompletionTick",
    });
  }

  return success(parseSimulationTick(plannedCompletionTick));
}

function replaceById<TItem, TKey extends keyof TItem>(
  items: readonly TItem[],
  key: TKey,
  id: TItem[TKey],
  replacement: TItem,
): readonly TItem[] {
  return Object.freeze(items.map((item) => (item[key] === id ? replacement : item)));
}
