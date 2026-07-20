import { createOperationOutcomeRolledEvent, type DomainEvent } from "./domainEvents";
import {
  DomainErrorCode,
  failure,
  success,
  type DomainError,
  type DomainResult,
} from "./domainResult";
import { OperationStatus, type OperationState } from "./operationState";
import { nextInt, type RandomState } from "./randomService";

export interface OperationOutcomeBandInput {
  readonly key: string;
  readonly weight: number;
}

export interface OperationOutcomeModifierContributions {
  readonly base: number;
  readonly competence: number;
  readonly capability: number;
  readonly district: number;
  readonly exposure: number;
}

export interface OperationOutcomeBandDiagnostic {
  readonly key: string;
  readonly weight: number;
  readonly lowerBound: number;
  readonly upperBound: number;
}

export interface ResolveOperationOutcomeInput {
  readonly operation: OperationState;
  readonly randomState: RandomState;
  readonly weightedBands: readonly OperationOutcomeBandInput[];
  readonly modifierContributions: OperationOutcomeModifierContributions;
}

export interface OperationOutcomeResolution {
  readonly operationId: OperationState["operationId"];
  readonly selectedBandKey: string;
  readonly percentileRoll: number;
  readonly selectedBandLowerBound: number;
  readonly selectedBandUpperBound: number;
  readonly weightedBands: readonly OperationOutcomeBandDiagnostic[];
  readonly modifierContributions: OperationOutcomeModifierContributions;
  readonly previousRandomState: RandomState;
  readonly nextRandomState: RandomState;
  readonly events: readonly DomainEvent[];
}

export interface OperationOutcomeResolutionOperationNotResolvedError extends DomainError {
  readonly code: typeof DomainErrorCode.OperationOutcomeResolutionOperationNotResolved;
  readonly operationId: OperationState["operationId"];
  readonly status: OperationState["status"];
}

export interface OperationOutcomeResolutionEmptyBandsError extends DomainError {
  readonly code: typeof DomainErrorCode.OperationOutcomeResolutionEmptyBands;
}

export interface OperationOutcomeResolutionBandKeyInvalidError extends DomainError {
  readonly code: typeof DomainErrorCode.OperationOutcomeResolutionBandKeyInvalid;
  readonly index: number;
  readonly key: string;
}

export interface OperationOutcomeResolutionBandKeyDuplicatedError extends DomainError {
  readonly code: typeof DomainErrorCode.OperationOutcomeResolutionBandKeyDuplicated;
  readonly key: string;
  readonly firstIndex: number;
  readonly duplicateIndex: number;
}

export interface OperationOutcomeResolutionBandWeightInvalidError extends DomainError {
  readonly code: typeof DomainErrorCode.OperationOutcomeResolutionBandWeightInvalid;
  readonly index: number;
  readonly key: string;
  readonly weight: number;
}

export interface OperationOutcomeResolutionTotalWeightInvalidError extends DomainError {
  readonly code: typeof DomainErrorCode.OperationOutcomeResolutionTotalWeightInvalid;
  readonly totalWeight: number;
  readonly expectedTotalWeight: 100;
}

export interface OperationOutcomeResolutionInvalidModifierContributionError extends DomainError {
  readonly code: typeof DomainErrorCode.OperationOutcomeResolutionInvalidModifierContribution;
  readonly field: keyof OperationOutcomeModifierContributions;
  readonly value: number;
}

export type OperationOutcomeResolutionError =
  | OperationOutcomeResolutionBandKeyDuplicatedError
  | OperationOutcomeResolutionBandKeyInvalidError
  | OperationOutcomeResolutionBandWeightInvalidError
  | OperationOutcomeResolutionEmptyBandsError
  | OperationOutcomeResolutionInvalidModifierContributionError
  | OperationOutcomeResolutionOperationNotResolvedError
  | OperationOutcomeResolutionTotalWeightInvalidError;

export type ResolveOperationOutcomeResult = DomainResult<
  OperationOutcomeResolution,
  OperationOutcomeResolutionError
>;

const PERCENTILE_MIN = 1;
const PERCENTILE_MAX = 100;

export function resolveOperationOutcome(
  input: ResolveOperationOutcomeInput,
): ResolveOperationOutcomeResult {
  if (input.operation.status !== OperationStatus.Resolved) {
    return failure({
      code: DomainErrorCode.OperationOutcomeResolutionOperationNotResolved,
      message: `Operation "${input.operation.operationId}" must be lifecycle-resolved before outcome resolution.`,
      operationId: input.operation.operationId,
      status: input.operation.status,
    });
  }

  const bandsResult = validateWeightedBands(input.weightedBands);
  if (!bandsResult.ok) {
    return bandsResult;
  }

  const modifierResult = validateModifierContributions(input.modifierContributions);
  if (!modifierResult.ok) {
    return modifierResult;
  }

  const rollResult = nextInt(input.randomState, PERCENTILE_MIN, PERCENTILE_MAX);
  const selectedBand = selectWeightedBand(bandsResult.value, rollResult.value);
  const modifierContributions = freezeModifierContributions(input.modifierContributions);
  const event = createOperationOutcomeRolledEvent({
    operationId: input.operation.operationId,
    operationTemplateId: input.operation.operationTemplateId,
    organizationId: input.operation.organizationId,
    targetLocationId: input.operation.targetLocationId,
    assignedCharacterIds: input.operation.assignedCharacterIds,
    selectedBandKey: selectedBand.key,
    percentileRoll: rollResult.value,
    selectedBandLowerBound: selectedBand.lowerBound,
    selectedBandUpperBound: selectedBand.upperBound,
    modifierContributions,
    previousRandomState: input.randomState,
    nextRandomState: rollResult.state,
  });

  return success(
    Object.freeze({
      operationId: input.operation.operationId,
      selectedBandKey: selectedBand.key,
      percentileRoll: rollResult.value,
      selectedBandLowerBound: selectedBand.lowerBound,
      selectedBandUpperBound: selectedBand.upperBound,
      weightedBands: bandsResult.value,
      modifierContributions,
      previousRandomState: input.randomState,
      nextRandomState: rollResult.state,
      events: Object.freeze([event]),
    }),
  );
}

function validateWeightedBands(
  bands: readonly OperationOutcomeBandInput[],
): DomainResult<readonly OperationOutcomeBandDiagnostic[], OperationOutcomeResolutionError> {
  if (bands.length === 0) {
    return failure({
      code: DomainErrorCode.OperationOutcomeResolutionEmptyBands,
      message: "Operation outcome resolution requires at least one weighted band.",
    });
  }

  const seenKeys = new Map<string, number>();
  const diagnostics: OperationOutcomeBandDiagnostic[] = [];
  let runningLowerBound = PERCENTILE_MIN;
  let totalWeight = 0;

  for (const [index, band] of bands.entries()) {
    const key = band.key.trim();

    if (key.length === 0) {
      return failure({
        code: DomainErrorCode.OperationOutcomeResolutionBandKeyInvalid,
        message: `Operation outcome band at index ${index} must have a non-empty key.`,
        index,
        key: band.key,
      });
    }

    const firstIndex = seenKeys.get(key);
    if (firstIndex !== undefined) {
      return failure({
        code: DomainErrorCode.OperationOutcomeResolutionBandKeyDuplicated,
        message: `Operation outcome band key "${key}" is duplicated.`,
        key,
        firstIndex,
        duplicateIndex: index,
      });
    }

    if (!Number.isFinite(band.weight) || !Number.isSafeInteger(band.weight) || band.weight <= 0) {
      return failure({
        code: DomainErrorCode.OperationOutcomeResolutionBandWeightInvalid,
        message: `Operation outcome band "${key}" must have a positive safe integer weight.`,
        index,
        key,
        weight: band.weight,
      });
    }

    const nextTotalWeight = totalWeight + band.weight;
    if (!Number.isSafeInteger(nextTotalWeight)) {
      return failure({
        code: DomainErrorCode.OperationOutcomeResolutionTotalWeightInvalid,
        message: "Operation outcome band total weight must be a safe integer equal to 100.",
        totalWeight: nextTotalWeight,
        expectedTotalWeight: PERCENTILE_MAX,
      });
    }

    seenKeys.set(key, index);
    totalWeight = nextTotalWeight;
    diagnostics.push(
      Object.freeze({
        key,
        weight: band.weight,
        lowerBound: runningLowerBound,
        upperBound: totalWeight,
      }),
    );
    runningLowerBound = totalWeight + 1;
  }

  if (totalWeight !== PERCENTILE_MAX) {
    return failure({
      code: DomainErrorCode.OperationOutcomeResolutionTotalWeightInvalid,
      message: "Operation outcome band total weight must equal 100.",
      totalWeight,
      expectedTotalWeight: PERCENTILE_MAX,
    });
  }

  return success(Object.freeze(diagnostics));
}

function validateModifierContributions(
  modifierContributions: OperationOutcomeModifierContributions,
): DomainResult<OperationOutcomeModifierContributions, OperationOutcomeResolutionError> {
  for (const field of ["base", "competence", "capability", "district", "exposure"] as const) {
    const value = modifierContributions[field];

    if (!Number.isFinite(value) || !Number.isSafeInteger(value)) {
      return failure({
        code: DomainErrorCode.OperationOutcomeResolutionInvalidModifierContribution,
        message: `Operation outcome modifier contribution "${field}" must be a finite safe integer.`,
        field,
        value,
      });
    }
  }

  return success(modifierContributions);
}

function selectWeightedBand(
  bands: readonly OperationOutcomeBandDiagnostic[],
  percentileRoll: number,
): OperationOutcomeBandDiagnostic {
  const selectedBand = bands.find((band) => percentileRoll <= band.upperBound);

  if (selectedBand === undefined) {
    throw new Error(`No outcome band matched percentile roll ${percentileRoll}.`);
  }

  return selectedBand;
}

function freezeModifierContributions(
  modifierContributions: OperationOutcomeModifierContributions,
): OperationOutcomeModifierContributions {
  return Object.freeze({
    base: modifierContributions.base,
    competence: modifierContributions.competence,
    capability: modifierContributions.capability,
    district: modifierContributions.district,
    exposure: modifierContributions.exposure,
  });
}
