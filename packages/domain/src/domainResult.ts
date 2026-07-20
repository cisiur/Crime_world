export const DomainErrorCode = {
  DistrictPropertyInputMismatch: "DISTRICT_PROPERTY_INPUT_MISMATCH",
  OperationOutcomeClassificationCategoryDuplicated:
    "OPERATION_OUTCOME_CLASSIFICATION_CATEGORY_DUPLICATED",
  OperationOutcomeClassificationCategoryMissing:
    "OPERATION_OUTCOME_CLASSIFICATION_CATEGORY_MISSING",
  OperationOutcomeClassificationCategoryUnsupported:
    "OPERATION_OUTCOME_CLASSIFICATION_CATEGORY_UNSUPPORTED",
  OperationOutcomeClassificationCanonicalOrderInvalid:
    "OPERATION_OUTCOME_CLASSIFICATION_CANONICAL_ORDER_INVALID",
  OperationOutcomeClassificationResolverRejected:
    "OPERATION_OUTCOME_CLASSIFICATION_RESOLVER_REJECTED",
  OperationOutcomeClassificationSelectedCategoryUnknown:
    "OPERATION_OUTCOME_CLASSIFICATION_SELECTED_CATEGORY_UNKNOWN",
  OperationOutcomeResolutionBandKeyDuplicated: "OPERATION_OUTCOME_RESOLUTION_BAND_KEY_DUPLICATED",
  OperationOutcomeResolutionBandKeyInvalid: "OPERATION_OUTCOME_RESOLUTION_BAND_KEY_INVALID",
  OperationOutcomeResolutionBandWeightInvalid: "OPERATION_OUTCOME_RESOLUTION_BAND_WEIGHT_INVALID",
  OperationOutcomeResolutionEmptyBands: "OPERATION_OUTCOME_RESOLUTION_EMPTY_BANDS",
  OperationOutcomeResolutionInvalidModifierContribution:
    "OPERATION_OUTCOME_RESOLUTION_INVALID_MODIFIER_CONTRIBUTION",
  OperationOutcomeResolutionOperationNotResolved:
    "OPERATION_OUTCOME_RESOLUTION_OPERATION_NOT_RESOLVED",
  OperationOutcomeResolutionTotalWeightInvalid: "OPERATION_OUTCOME_RESOLUTION_TOTAL_WEIGHT_INVALID",
  OperationPlanningAvailabilityRejected: "OPERATION_PLANNING_AVAILABILITY_REJECTED",
  OperationPlanningDuplicateOperationId: "OPERATION_PLANNING_DUPLICATE_OPERATION_ID",
  OperationPlanningInvalidData: "OPERATION_PLANNING_INVALID_DATA",
  SimulationPaused: "SIMULATION_PAUSED",
  UnsupportedCommand: "UNSUPPORTED_COMMAND",
} as const;

export type DomainErrorCode = (typeof DomainErrorCode)[keyof typeof DomainErrorCode];

export interface DomainError {
  readonly code: DomainErrorCode;
  readonly message: string;
}

export interface Success<TValue> {
  readonly ok: true;
  readonly value: TValue;
}

export interface Failure<TError extends DomainError = DomainError> {
  readonly ok: false;
  readonly error: TError;
}

export type DomainResult<TValue, TError extends DomainError = DomainError> =
  | Success<TValue>
  | Failure<TError>;

export function success<TValue>(value: TValue): Success<TValue> {
  return Object.freeze({
    ok: true,
    value,
  });
}

export function failure<TError extends DomainError>(error: TError): Failure<TError> {
  return Object.freeze({
    ok: false,
    error: Object.freeze({ ...error }),
  });
}
