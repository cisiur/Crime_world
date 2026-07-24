import type { BusinessLocationArchetypeId } from "./businessLocationArchetypeDefinition";

export interface BusinessIncomeDefinition {
  readonly businessLocationArchetypeId: BusinessLocationArchetypeId;
  readonly amount: number;
  readonly periodTicks: number;
}

export type BusinessIncomeDefinitionValidationErrorCode =
  | "DUPLICATE_ARCHETYPE_REFERENCE"
  | "UNSUPPORTED_ARCHETYPE"
  | "MISSING_REQUIRED_INCOME_DEFINITION"
  | "INVALID_AMOUNT"
  | "INVALID_PERIOD_TICKS"
  | "CANONICAL_COLLECTION_SIZE";

export interface BusinessIncomeDefinitionValidationError {
  readonly code: BusinessIncomeDefinitionValidationErrorCode;
  readonly businessLocationArchetypeId?: string;
  readonly field?: "amount" | "periodTicks";
  readonly reason?:
    | "zero"
    | "negative"
    | "non-number"
    | "non-finite"
    | "non-integer"
    | "unsafe-integer";
  readonly message: string;
}

export interface BusinessIncomeDefinitionValidationResult {
  readonly valid: boolean;
  readonly errors: readonly BusinessIncomeDefinitionValidationError[];
}

type PositiveSafeIntegerFailureReason = NonNullable<
  BusinessIncomeDefinitionValidationError["reason"]
>;

export const businessIncomeGeneratingArchetypeIds = Object.freeze([
  "business-location-archetype:small_shop_service",
  "business-location-archetype:nightlife_venue",
  "business-location-archetype:workshop_transport",
] as const satisfies readonly BusinessLocationArchetypeId[]);

const REQUIRED_INCOME_ARCHETYPE_IDS = new Set<BusinessLocationArchetypeId>(
  businessIncomeGeneratingArchetypeIds,
);

export const canonicalMvpBusinessIncomeDefinitions = Object.freeze([
  createBusinessIncomeDefinition({
    businessLocationArchetypeId: "business-location-archetype:small_shop_service",
    amount: 20,
    periodTicks: 144,
  }),
  createBusinessIncomeDefinition({
    businessLocationArchetypeId: "business-location-archetype:nightlife_venue",
    amount: 60,
    periodTicks: 144,
  }),
  createBusinessIncomeDefinition({
    businessLocationArchetypeId: "business-location-archetype:workshop_transport",
    amount: 40,
    periodTicks: 144,
  }),
] as const satisfies readonly BusinessIncomeDefinition[]);

export function createBusinessIncomeDefinition(
  input: BusinessIncomeDefinition,
): BusinessIncomeDefinition {
  return Object.freeze({
    businessLocationArchetypeId: input.businessLocationArchetypeId,
    amount: input.amount,
    periodTicks: input.periodTicks,
  });
}

export function validateBusinessIncomeDefinitions(
  definitions: readonly BusinessIncomeDefinition[],
): BusinessIncomeDefinitionValidationResult {
  const errors: BusinessIncomeDefinitionValidationError[] = [];

  if (definitions.length !== businessIncomeGeneratingArchetypeIds.length) {
    errors.push({
      code: "CANONICAL_COLLECTION_SIZE",
      message: `Canonical business income definition collection must contain exactly ${businessIncomeGeneratingArchetypeIds.length} entries.`,
    });
  }

  const seenArchetypeIds = new Set<string>();
  for (const definition of definitions) {
    if (seenArchetypeIds.has(definition.businessLocationArchetypeId)) {
      errors.push({
        code: "DUPLICATE_ARCHETYPE_REFERENCE",
        businessLocationArchetypeId: definition.businessLocationArchetypeId,
        message: `Duplicate business income definition for archetype "${definition.businessLocationArchetypeId}".`,
      });
    }
    seenArchetypeIds.add(definition.businessLocationArchetypeId);

    if (!REQUIRED_INCOME_ARCHETYPE_IDS.has(definition.businessLocationArchetypeId)) {
      errors.push({
        code: "UNSUPPORTED_ARCHETYPE",
        businessLocationArchetypeId: definition.businessLocationArchetypeId,
        message: `Business income definition references unsupported archetype "${definition.businessLocationArchetypeId}".`,
      });
    }

    validatePositiveSafeInteger(
      "amount",
      definition.amount,
      definition.businessLocationArchetypeId,
      errors,
    );
    validatePositiveSafeInteger(
      "periodTicks",
      definition.periodTicks,
      definition.businessLocationArchetypeId,
      errors,
    );
  }

  for (const requiredArchetypeId of businessIncomeGeneratingArchetypeIds) {
    if (!seenArchetypeIds.has(requiredArchetypeId)) {
      errors.push({
        code: "MISSING_REQUIRED_INCOME_DEFINITION",
        businessLocationArchetypeId: requiredArchetypeId,
        message: `Missing required MVP business income definition for archetype "${requiredArchetypeId}".`,
      });
    }
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors),
  });
}

function validatePositiveSafeInteger(
  field: "amount" | "periodTicks",
  value: unknown,
  businessLocationArchetypeId: BusinessLocationArchetypeId,
  errors: BusinessIncomeDefinitionValidationError[],
): void {
  const code = field === "amount" ? "INVALID_AMOUNT" : "INVALID_PERIOD_TICKS";
  const reason = getPositiveSafeIntegerFailureReason(value);
  if (reason === null) {
    return;
  }

  errors.push({
    code,
    businessLocationArchetypeId,
    field,
    reason,
    message: `Business income definition for "${businessLocationArchetypeId}" has invalid ${field}: ${reason}.`,
  });
}

function getPositiveSafeIntegerFailureReason(
  value: unknown,
): PositiveSafeIntegerFailureReason | null {
  if (typeof value !== "number") {
    return "non-number";
  }

  if (!Number.isFinite(value)) {
    return "non-finite";
  }

  if (!Number.isInteger(value)) {
    return "non-integer";
  }

  if (!Number.isSafeInteger(value)) {
    return "unsafe-integer";
  }

  if (value === 0) {
    return "zero";
  }

  if (value < 0) {
    return "negative";
  }

  return null;
}
