import {
  parseCharacterId,
  parseLocationId,
  parseOperationId,
  parseOperationTemplateId,
  parseOrganizationId,
  type CharacterId,
  type LocationId,
  type OperationId,
  type OperationTemplateId,
  type OrganizationId,
} from "./entityIds";
import { parseSimulationTick, type SimulationTick } from "./simulationClock";

export const OperationStatus = {
  Planned: "planned",
  Running: "running",
  Resolved: "resolved",
} as const;

export type OperationStatus = (typeof OperationStatus)[keyof typeof OperationStatus];

export interface OperationState {
  readonly operationId: OperationId;
  readonly operationTemplateId: OperationTemplateId;
  readonly organizationId: OrganizationId;
  readonly targetLocationId: LocationId;
  readonly assignedCharacterIds: readonly CharacterId[];
  readonly status: OperationStatus;
  readonly plannedAtTick: SimulationTick;
  readonly plannedCompletionTick: SimulationTick;
}

export interface CreateOperationStateInput {
  readonly operationId: OperationId;
  readonly operationTemplateId: OperationTemplateId;
  readonly organizationId: OrganizationId;
  readonly targetLocationId: LocationId;
  readonly assignedCharacterIds: readonly CharacterId[];
  readonly status: OperationStatus;
  readonly plannedAtTick: SimulationTick;
  readonly plannedCompletionTick: SimulationTick;
}

export type InvalidOperationStateField =
  | "operationId"
  | "operationTemplateId"
  | "organizationId"
  | "targetLocationId"
  | "assignedCharacterIds"
  | "status"
  | "plannedAtTick"
  | "plannedCompletionTick";

export class InvalidOperationStateError extends Error {
  public constructor(
    public readonly field: InvalidOperationStateField,
    public readonly reason: string,
    public readonly value: unknown,
  ) {
    super(`Invalid operation state field "${field}": ${reason}.`);
    this.name = "InvalidOperationStateError";
  }
}

const VALID_OPERATION_STATUSES = new Set<OperationStatus>([
  OperationStatus.Planned,
  OperationStatus.Running,
  OperationStatus.Resolved,
]);

export function createOperationState(input: CreateOperationStateInput): OperationState {
  const operationId = parseOperationIdField(input.operationId);
  const operationTemplateId = parseOperationTemplateIdField(input.operationTemplateId);
  const organizationId = parseOrganizationIdField(input.organizationId);
  const targetLocationId = parseTargetLocationIdField(input.targetLocationId);
  const assignedCharacterIds = parseAssignedCharacterIds(input.assignedCharacterIds);
  const status = parseOperationStatus(input.status);
  const plannedAtTick = parseOperationTick("plannedAtTick", input.plannedAtTick);
  const plannedCompletionTick = parseOperationTick(
    "plannedCompletionTick",
    input.plannedCompletionTick,
  );

  if (plannedCompletionTick < plannedAtTick) {
    throw new InvalidOperationStateError(
      "plannedCompletionTick",
      "expected plannedCompletionTick to be greater than or equal to plannedAtTick",
      plannedCompletionTick,
    );
  }

  return Object.freeze({
    operationId,
    operationTemplateId,
    organizationId,
    targetLocationId,
    assignedCharacterIds: Object.freeze([...assignedCharacterIds]),
    status,
    plannedAtTick,
    plannedCompletionTick,
  });
}

function parseOperationIdField(value: unknown): OperationId {
  try {
    return parseOperationId(value);
  } catch (error) {
    throwOperationStateError("operationId", "expected a valid operation ID", value, error);
  }
}

function parseOperationTemplateIdField(value: unknown): OperationTemplateId {
  try {
    return parseOperationTemplateId(value);
  } catch (error) {
    throwOperationStateError(
      "operationTemplateId",
      "expected a valid operation template ID",
      value,
      error,
    );
  }
}

function parseOrganizationIdField(value: unknown): OrganizationId {
  try {
    return parseOrganizationId(value);
  } catch (error) {
    throwOperationStateError("organizationId", "expected a valid organization ID", value, error);
  }
}

function parseTargetLocationIdField(value: unknown): LocationId {
  try {
    return parseLocationId(value);
  } catch (error) {
    throwOperationStateError("targetLocationId", "expected a valid location ID", value, error);
  }
}

function parseAssignedCharacterIds(value: unknown): readonly CharacterId[] {
  if (!Array.isArray(value)) {
    throw new InvalidOperationStateError(
      "assignedCharacterIds",
      `expected an array, received ${describeValueType(value)}`,
      value,
    );
  }

  if (value.length === 0) {
    throw new InvalidOperationStateError(
      "assignedCharacterIds",
      "expected at least one assigned character",
      value,
    );
  }

  const characterIds: CharacterId[] = [];
  const seenCharacterIds = new Set<CharacterId>();

  for (const characterIdInput of value) {
    let characterId: CharacterId;

    try {
      characterId = parseCharacterId(characterIdInput);
    } catch (error) {
      throwOperationStateError(
        "assignedCharacterIds",
        "expected valid character IDs",
        characterIdInput,
        error,
      );
    }

    if (seenCharacterIds.has(characterId)) {
      throw new InvalidOperationStateError(
        "assignedCharacterIds",
        `duplicate assigned character id "${characterId}"`,
        characterId,
      );
    }

    seenCharacterIds.add(characterId);
    characterIds.push(characterId);
  }

  return characterIds;
}

function parseOperationStatus(value: unknown): OperationStatus {
  if (typeof value !== "string" || !VALID_OPERATION_STATUSES.has(value as OperationStatus)) {
    throw new InvalidOperationStateError(
      "status",
      `unsupported lifecycle value "${String(value)}"`,
      value,
    );
  }

  return value as OperationStatus;
}

function parseOperationTick(
  field: "plannedAtTick" | "plannedCompletionTick",
  value: unknown,
): SimulationTick {
  try {
    return parseSimulationTick(value);
  } catch (error) {
    throwOperationStateError(field, "expected a non-negative simulation tick", value, error);
  }
}

function throwOperationStateError(
  field: InvalidOperationStateField,
  reason: string,
  value: unknown,
  error: unknown,
): never {
  void error;
  throw new InvalidOperationStateError(field, reason, value);
}

function describeValueType(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    return "an array";
  }

  return `a ${typeof value}`;
}
