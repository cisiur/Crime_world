import {
  OperationOutcomeCategory,
  type OperationOutcomeClassificationBandInput,
} from "@crimeworld/domain";

export const localCollectionOutcomeBands: readonly OperationOutcomeClassificationBandInput[] =
  Object.freeze([
    Object.freeze({
      category: OperationOutcomeCategory.Success,
      weight: 45,
    }),
    Object.freeze({
      category: OperationOutcomeCategory.PartialSuccess,
      weight: 30,
    }),
    Object.freeze({
      category: OperationOutcomeCategory.Failure,
      weight: 20,
    }),
    Object.freeze({
      category: OperationOutcomeCategory.CriticalFailure,
      weight: 5,
    }),
  ]);
