import { createOperationOutcomeClassifiedEvent, type DomainEvent } from "./domainEvents";
import {
  DomainErrorCode,
  failure,
  success,
  type DomainError,
  type DomainResult,
} from "./domainResult";
import {
  resolveOperationOutcome,
  type OperationOutcomeBandDiagnostic,
  type OperationOutcomeModifierContributions,
  type OperationOutcomeResolutionError,
} from "./operationOutcomeResolver";
import type { OperationState } from "./operationState";
import type { RandomState } from "./randomService";

export const OperationOutcomeCategory = {
  Success: "success",
  PartialSuccess: "partial-success",
  Failure: "failure",
  CriticalFailure: "critical-failure",
} as const;

export type OperationOutcomeCategory =
  (typeof OperationOutcomeCategory)[keyof typeof OperationOutcomeCategory];

export interface OperationOutcomeClassificationBandInput {
  readonly category: OperationOutcomeCategory;
  readonly weight: number;
}

export interface OperationOutcomeClassificationBandDiagnostic {
  readonly category: OperationOutcomeCategory;
  readonly weight: number;
  readonly lowerBound: number;
  readonly upperBound: number;
}

export interface ClassifyOperationOutcomeInput {
  readonly operation: OperationState;
  readonly randomState: RandomState;
  readonly outcomeBands: readonly OperationOutcomeClassificationBandInput[];
  readonly modifierContributions: OperationOutcomeModifierContributions;
}

export interface ClassifiedOperationOutcome {
  readonly operationId: OperationState["operationId"];
  readonly category: OperationOutcomeCategory;
  readonly percentileRoll: number;
  readonly selectedBandLowerBound: number;
  readonly selectedBandUpperBound: number;
  readonly outcomeBands: readonly OperationOutcomeClassificationBandDiagnostic[];
  readonly resolverBands: readonly OperationOutcomeBandDiagnostic[];
  readonly modifierContributions: OperationOutcomeModifierContributions;
  readonly previousRandomState: RandomState;
  readonly nextRandomState: RandomState;
  readonly events: readonly DomainEvent[];
}

export interface OperationOutcomeClassificationCategoryUnsupportedError extends DomainError {
  readonly code: typeof DomainErrorCode.OperationOutcomeClassificationCategoryUnsupported;
  readonly index: number;
  readonly category: string;
}

export interface OperationOutcomeClassificationCategoryDuplicatedError extends DomainError {
  readonly code: typeof DomainErrorCode.OperationOutcomeClassificationCategoryDuplicated;
  readonly category: OperationOutcomeCategory;
  readonly firstIndex: number;
  readonly duplicateIndex: number;
}

export interface OperationOutcomeClassificationCategoryMissingError extends DomainError {
  readonly code: typeof DomainErrorCode.OperationOutcomeClassificationCategoryMissing;
  readonly category: OperationOutcomeCategory;
}

export interface OperationOutcomeClassificationCanonicalOrderInvalidError extends DomainError {
  readonly code: typeof DomainErrorCode.OperationOutcomeClassificationCanonicalOrderInvalid;
  readonly index: number;
  readonly expectedCategory: OperationOutcomeCategory;
  readonly actualCategory: OperationOutcomeCategory;
}

export interface OperationOutcomeClassificationCanonicalWeightInvalidError extends DomainError {
  readonly code: typeof DomainErrorCode.OperationOutcomeClassificationCanonicalWeightInvalid;
  readonly index: number;
  readonly category: OperationOutcomeCategory;
  readonly expectedWeight: number;
  readonly actualWeight: number;
}

export interface OperationOutcomeClassificationResolverRejectedError extends DomainError {
  readonly code: typeof DomainErrorCode.OperationOutcomeClassificationResolverRejected;
  readonly resolverError: OperationOutcomeResolutionError;
}

export interface OperationOutcomeClassificationSelectedCategoryUnknownError extends DomainError {
  readonly code: typeof DomainErrorCode.OperationOutcomeClassificationSelectedCategoryUnknown;
  readonly selectedBandKey: string;
}

export type OperationOutcomeClassificationError =
  | OperationOutcomeClassificationCanonicalOrderInvalidError
  | OperationOutcomeClassificationCanonicalWeightInvalidError
  | OperationOutcomeClassificationCategoryDuplicatedError
  | OperationOutcomeClassificationCategoryMissingError
  | OperationOutcomeClassificationCategoryUnsupportedError
  | OperationOutcomeClassificationResolverRejectedError
  | OperationOutcomeClassificationSelectedCategoryUnknownError
  | OperationOutcomeResolutionError;

export type ClassifyOperationOutcomeResult = DomainResult<
  ClassifiedOperationOutcome,
  OperationOutcomeClassificationError
>;

export const LOCAL_COLLECTION_OUTCOME_CATEGORY_ORDER: readonly OperationOutcomeCategory[] =
  Object.freeze([
    OperationOutcomeCategory.Success,
    OperationOutcomeCategory.PartialSuccess,
    OperationOutcomeCategory.Failure,
    OperationOutcomeCategory.CriticalFailure,
  ]);

const LOCAL_COLLECTION_OUTCOME_WEIGHT_BY_CATEGORY: ReadonlyMap<OperationOutcomeCategory, number> =
  new Map([
    [OperationOutcomeCategory.Success, 45],
    [OperationOutcomeCategory.PartialSuccess, 30],
    [OperationOutcomeCategory.Failure, 20],
    [OperationOutcomeCategory.CriticalFailure, 5],
  ]);

const OUTCOME_CATEGORY_VALUES = new Set<string>(Object.values(OperationOutcomeCategory));

export function isOperationOutcomeCategory(value: unknown): value is OperationOutcomeCategory {
  return typeof value === "string" && OUTCOME_CATEGORY_VALUES.has(value);
}

export function classifyOperationOutcome(
  input: ClassifyOperationOutcomeInput,
): ClassifyOperationOutcomeResult {
  const validationResult = validateLocalCollectionOutcomeBands(input.outcomeBands);
  if (!validationResult.ok) {
    return validationResult;
  }

  const resolverResult = resolveOperationOutcome({
    operation: input.operation,
    randomState: input.randomState,
    weightedBands: validationResult.value.map((band) => ({
      key: band.category,
      weight: band.weight,
    })),
    modifierContributions: input.modifierContributions,
  });

  if (!resolverResult.ok) {
    return resolverResult;
  }

  if (!isOperationOutcomeCategory(resolverResult.value.selectedBandKey)) {
    return failure({
      code: DomainErrorCode.OperationOutcomeClassificationSelectedCategoryUnknown,
      message: `Selected outcome band key "${resolverResult.value.selectedBandKey}" is not a supported outcome category.`,
      selectedBandKey: resolverResult.value.selectedBandKey,
    });
  }

  const category = resolverResult.value.selectedBandKey;
  const classifiedEvent = createOperationOutcomeClassifiedEvent({
    operationId: input.operation.operationId,
    operationTemplateId: input.operation.operationTemplateId,
    organizationId: input.operation.organizationId,
    targetLocationId: input.operation.targetLocationId,
    assignedCharacterIds: input.operation.assignedCharacterIds,
    category,
    percentileRoll: resolverResult.value.percentileRoll,
    selectedBandLowerBound: resolverResult.value.selectedBandLowerBound,
    selectedBandUpperBound: resolverResult.value.selectedBandUpperBound,
    modifierContributions: resolverResult.value.modifierContributions,
    previousRandomState: resolverResult.value.previousRandomState,
    nextRandomState: resolverResult.value.nextRandomState,
  });

  return success(
    Object.freeze({
      operationId: resolverResult.value.operationId,
      category,
      percentileRoll: resolverResult.value.percentileRoll,
      selectedBandLowerBound: resolverResult.value.selectedBandLowerBound,
      selectedBandUpperBound: resolverResult.value.selectedBandUpperBound,
      outcomeBands: createClassificationBandDiagnostics(resolverResult.value.weightedBands),
      resolverBands: resolverResult.value.weightedBands,
      modifierContributions: resolverResult.value.modifierContributions,
      previousRandomState: resolverResult.value.previousRandomState,
      nextRandomState: resolverResult.value.nextRandomState,
      events: Object.freeze([...resolverResult.value.events, classifiedEvent]),
    }),
  );
}

export function validateLocalCollectionOutcomeBands(
  bands: readonly OperationOutcomeClassificationBandInput[],
): DomainResult<
  readonly OperationOutcomeClassificationBandInput[],
  OperationOutcomeClassificationError
> {
  const genericValidationResult = validateOperationOutcomeClassificationBands(bands);
  if (!genericValidationResult.ok) {
    return genericValidationResult;
  }

  for (const requiredCategory of LOCAL_COLLECTION_OUTCOME_CATEGORY_ORDER) {
    if (!genericValidationResult.value.some((band) => band.category === requiredCategory)) {
      return failure({
        code: DomainErrorCode.OperationOutcomeClassificationCategoryMissing,
        message: `Local Collection outcome bands must include category "${requiredCategory}".`,
        category: requiredCategory,
      });
    }
  }

  for (const [index, expectedCategory] of LOCAL_COLLECTION_OUTCOME_CATEGORY_ORDER.entries()) {
    const actualBand = genericValidationResult.value[index];
    const actualCategory = actualBand?.category;

    if (actualBand === undefined || actualCategory !== expectedCategory) {
      return failure({
        code: DomainErrorCode.OperationOutcomeClassificationCanonicalOrderInvalid,
        message: `Local Collection outcome band at index ${index} must be "${expectedCategory}".`,
        index,
        expectedCategory,
        actualCategory: actualCategory as OperationOutcomeCategory,
      });
    }

    const expectedWeight = LOCAL_COLLECTION_OUTCOME_WEIGHT_BY_CATEGORY.get(expectedCategory);
    if (actualBand.weight !== expectedWeight) {
      return failure({
        code: DomainErrorCode.OperationOutcomeClassificationCanonicalWeightInvalid,
        message: `Local Collection outcome band "${expectedCategory}" at index ${index} must have weight ${expectedWeight}.`,
        index,
        category: expectedCategory,
        expectedWeight: expectedWeight as number,
        actualWeight: actualBand.weight,
      });
    }
  }

  return genericValidationResult;
}

export function validateOperationOutcomeClassificationBands(
  bands: readonly OperationOutcomeClassificationBandInput[],
): DomainResult<
  readonly OperationOutcomeClassificationBandInput[],
  OperationOutcomeClassificationError
> {
  if (bands.length === 0) {
    return failure({
      code: DomainErrorCode.OperationOutcomeResolutionEmptyBands,
      message: "Operation outcome resolution requires at least one weighted band.",
    });
  }

  const seenCategories = new Map<OperationOutcomeCategory, number>();
  let totalWeight = 0;

  for (const [index, band] of bands.entries()) {
    if (!isOperationOutcomeCategory(band.category)) {
      return failure({
        code: DomainErrorCode.OperationOutcomeClassificationCategoryUnsupported,
        message: `Operation outcome band at index ${index} uses unsupported category "${String(
          band.category,
        )}".`,
        index,
        category: String(band.category),
      });
    }

    const firstIndex = seenCategories.get(band.category);
    if (firstIndex !== undefined) {
      return failure({
        code: DomainErrorCode.OperationOutcomeClassificationCategoryDuplicated,
        message: `Operation outcome category "${band.category}" is duplicated.`,
        category: band.category,
        firstIndex,
        duplicateIndex: index,
      });
    }

    seenCategories.set(band.category, index);

    if (!Number.isFinite(band.weight) || !Number.isSafeInteger(band.weight) || band.weight <= 0) {
      return failure({
        code: DomainErrorCode.OperationOutcomeResolutionBandWeightInvalid,
        message: `Operation outcome band "${band.category}" must have a positive safe integer weight.`,
        index,
        key: band.category,
        weight: band.weight,
      });
    }

    const nextTotalWeight = totalWeight + band.weight;
    if (!Number.isSafeInteger(nextTotalWeight)) {
      return failure({
        code: DomainErrorCode.OperationOutcomeResolutionTotalWeightInvalid,
        message: "Operation outcome band total weight must be a safe integer equal to 100.",
        totalWeight: nextTotalWeight,
        expectedTotalWeight: 100,
      });
    }

    totalWeight = nextTotalWeight;
  }

  if (totalWeight !== 100) {
    return failure({
      code: DomainErrorCode.OperationOutcomeResolutionTotalWeightInvalid,
      message: "Operation outcome band total weight must equal 100.",
      totalWeight,
      expectedTotalWeight: 100,
    });
  }

  return success(Object.freeze(bands.map((band) => Object.freeze({ ...band }))));
}

function createClassificationBandDiagnostics(
  resolverBands: readonly OperationOutcomeBandDiagnostic[],
): readonly OperationOutcomeClassificationBandDiagnostic[] {
  return Object.freeze(
    resolverBands.map((band) =>
      Object.freeze({
        category: band.key as OperationOutcomeCategory,
        weight: band.weight,
        lowerBound: band.lowerBound,
        upperBound: band.upperBound,
      }),
    ),
  );
}
