import {
  OperationOutcomeCategory,
  type LocalCollectionConsequenceDefinitionEntry,
} from "@crimeworld/domain";

export const localCollectionConsequenceDefinition: readonly LocalCollectionConsequenceDefinitionEntry[] =
  Object.freeze([
    Object.freeze({
      category: OperationOutcomeCategory.Success,
      grossReward: 80,
      personalExposureDelta: 4,
      healthConsequence: "none",
      operationalCapacityRelease: 1,
    }),
    Object.freeze({
      category: OperationOutcomeCategory.PartialSuccess,
      grossReward: 40,
      personalExposureDelta: 10,
      healthConsequence: "none",
      operationalCapacityRelease: 1,
    }),
    Object.freeze({
      category: OperationOutcomeCategory.Failure,
      grossReward: 0,
      personalExposureDelta: 14,
      healthConsequence: "none",
      operationalCapacityRelease: 1,
    }),
    Object.freeze({
      category: OperationOutcomeCategory.CriticalFailure,
      grossReward: 0,
      personalExposureDelta: 25,
      healthConsequence: "injured",
      operationalCapacityRelease: 1,
    }),
  ]);
