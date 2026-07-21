import { describe, expect, it } from "vitest";

import { OperationOutcomeCategory } from "@crimeworld/domain";

import { localCollectionConsequenceDefinition } from "./localCollectionConsequenceDefinition";

describe("local collection consequence definition", () => {
  it("defines the accepted immutable Local Collection consequences", () => {
    expect(Object.isFrozen(localCollectionConsequenceDefinition)).toBe(true);
    expect(localCollectionConsequenceDefinition.every((entry) => Object.isFrozen(entry))).toBe(
      true,
    );
    expect(localCollectionConsequenceDefinition).toEqual([
      {
        category: OperationOutcomeCategory.Success,
        grossReward: 80,
        personalExposureDelta: 4,
        healthConsequence: "none",
        operationalCapacityRelease: 1,
      },
      {
        category: OperationOutcomeCategory.PartialSuccess,
        grossReward: 40,
        personalExposureDelta: 10,
        healthConsequence: "none",
        operationalCapacityRelease: 1,
      },
      {
        category: OperationOutcomeCategory.Failure,
        grossReward: 0,
        personalExposureDelta: 14,
        healthConsequence: "none",
        operationalCapacityRelease: 1,
      },
      {
        category: OperationOutcomeCategory.CriticalFailure,
        grossReward: 0,
        personalExposureDelta: 25,
        healthConsequence: "injured",
        operationalCapacityRelease: 1,
      },
    ]);
    expect(new Set(localCollectionConsequenceDefinition.map((entry) => entry.category))).toEqual(
      new Set(Object.values(OperationOutcomeCategory)),
    );
    expect(
      localCollectionConsequenceDefinition.map((entry) => entry.operationalCapacityRelease),
    ).toEqual([1, 1, 1, 1]);
  });

  it("contains no probability, start-cost, net-money, UI, or pressure data", () => {
    for (const entry of localCollectionConsequenceDefinition) {
      expect("weight" in entry).toBe(false);
      expect("startCost" in entry).toBe(false);
      expect("netReward" in entry).toBe(false);
      expect("displayText" in entry).toBe(false);
      expect("ui" in entry).toBe(false);
      expect("districtTension" in entry).toBe(false);
      expect("policePressure" in entry).toBe(false);
      expect("investigation" in entry).toBe(false);
      expect("detention" in entry).toBe(false);
      expect("death" in entry).toBe(false);
    }
  });
});
