import type { LocationId, OperationTemplateId } from "@crimeworld/domain";

import type { LocationKind } from "./cityDefinition";

export type OperationTemplateCategory = "one-off-income";

export interface OperationTemplateDefinition {
  readonly id: OperationTemplateId;
  readonly displayName: string;
  readonly category: OperationTemplateCategory;
  readonly allowedTargetKinds: readonly LocationKind[];
  readonly allowedTargetIds: readonly LocationId[];
  readonly durationMinutes: number;
  readonly startCost: number;
  readonly operationalCapacityCost: number;
}

export interface CreateOperationTemplateDefinitionInput {
  readonly id: OperationTemplateId;
  readonly displayName: string;
  readonly category: OperationTemplateCategory;
  readonly allowedTargetKinds: readonly LocationKind[];
  readonly allowedTargetIds: readonly LocationId[];
  readonly durationMinutes: number;
  readonly startCost: number;
  readonly operationalCapacityCost: number;
}

export type InvalidOperationTemplateDefinitionField =
  | "displayName"
  | "allowedTargetKinds"
  | "allowedTargetIds"
  | "durationMinutes"
  | "startCost"
  | "operationalCapacityCost";

export class InvalidOperationTemplateDefinitionError extends Error {
  public constructor(
    public readonly field: InvalidOperationTemplateDefinitionField,
    public readonly reason: string,
    public readonly value: unknown,
  ) {
    super(`Invalid operation template definition field "${field}": ${reason}.`);
    this.name = "InvalidOperationTemplateDefinitionError";
  }
}

export function createOperationTemplateDefinition(
  input: CreateOperationTemplateDefinitionInput,
): OperationTemplateDefinition {
  validateDisplayName(input.displayName);
  validateTargetKinds(input.allowedTargetKinds);
  validateTargetIds(input.allowedTargetIds);
  validatePositiveInteger("durationMinutes", input.durationMinutes);
  validateNonNegativeInteger("startCost", input.startCost);
  validateNonNegativeInteger("operationalCapacityCost", input.operationalCapacityCost);

  return Object.freeze({
    id: input.id,
    displayName: input.displayName,
    category: input.category,
    allowedTargetKinds: Object.freeze([...input.allowedTargetKinds]),
    allowedTargetIds: Object.freeze([...input.allowedTargetIds]),
    durationMinutes: input.durationMinutes,
    startCost: input.startCost,
    operationalCapacityCost: input.operationalCapacityCost,
  });
}

function validateDisplayName(displayName: unknown): asserts displayName is string {
  if (typeof displayName !== "string") {
    throw new InvalidOperationTemplateDefinitionError(
      "displayName",
      `expected a string, received ${describeValueType(displayName)}`,
      displayName,
    );
  }

  if (displayName.length === 0) {
    throw new InvalidOperationTemplateDefinitionError(
      "displayName",
      "expected a non-empty string",
      displayName,
    );
  }

  if (displayName.trim().length === 0) {
    throw new InvalidOperationTemplateDefinitionError(
      "displayName",
      "expected a name that is not only whitespace",
      displayName,
    );
  }

  if (displayName.trimStart() !== displayName) {
    throw new InvalidOperationTemplateDefinitionError(
      "displayName",
      "expected no leading whitespace",
      displayName,
    );
  }

  if (displayName.trimEnd() !== displayName) {
    throw new InvalidOperationTemplateDefinitionError(
      "displayName",
      "expected no trailing whitespace",
      displayName,
    );
  }
}

function validateTargetKinds(
  allowedTargetKinds: unknown,
): asserts allowedTargetKinds is readonly LocationKind[] {
  if (!Array.isArray(allowedTargetKinds)) {
    throw new InvalidOperationTemplateDefinitionError(
      "allowedTargetKinds",
      `expected an array, received ${describeValueType(allowedTargetKinds)}`,
      allowedTargetKinds,
    );
  }

  const seenTargetKinds = new Set<LocationKind>();

  for (const targetKind of allowedTargetKinds) {
    if (seenTargetKinds.has(targetKind as LocationKind)) {
      throw new InvalidOperationTemplateDefinitionError(
        "allowedTargetKinds",
        `duplicate target kind "${String(targetKind)}"`,
        targetKind,
      );
    }

    seenTargetKinds.add(targetKind as LocationKind);
  }
}

function validateTargetIds(
  allowedTargetIds: unknown,
): asserts allowedTargetIds is readonly LocationId[] {
  if (!Array.isArray(allowedTargetIds)) {
    throw new InvalidOperationTemplateDefinitionError(
      "allowedTargetIds",
      `expected an array, received ${describeValueType(allowedTargetIds)}`,
      allowedTargetIds,
    );
  }

  const seenTargetIds = new Set<LocationId>();

  for (const targetId of allowedTargetIds) {
    if (seenTargetIds.has(targetId as LocationId)) {
      throw new InvalidOperationTemplateDefinitionError(
        "allowedTargetIds",
        `duplicate target id "${String(targetId)}"`,
        targetId,
      );
    }

    seenTargetIds.add(targetId as LocationId);
  }
}

function validatePositiveInteger(
  field: "durationMinutes",
  value: unknown,
): asserts value is number {
  validateInteger(field, value);

  if (value <= 0) {
    throw new InvalidOperationTemplateDefinitionError(field, "expected a positive value", value);
  }
}

function validateNonNegativeInteger(
  field: "startCost" | "operationalCapacityCost",
  value: unknown,
): asserts value is number {
  validateInteger(field, value);

  if (value < 0) {
    throw new InvalidOperationTemplateDefinitionError(
      field,
      "expected a non-negative value",
      value,
    );
  }
}

function validateInteger(
  field: "durationMinutes" | "startCost" | "operationalCapacityCost",
  value: unknown,
): asserts value is number {
  if (typeof value !== "number") {
    throw new InvalidOperationTemplateDefinitionError(
      field,
      `expected a number, received ${describeValueType(value)}`,
      value,
    );
  }

  if (!Number.isFinite(value)) {
    throw new InvalidOperationTemplateDefinitionError(field, "expected a finite number", value);
  }

  if (!Number.isInteger(value)) {
    throw new InvalidOperationTemplateDefinitionError(field, "expected an integer", value);
  }
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
