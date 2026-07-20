import { describe, expect, it } from "vitest";

import { OperationOutcomeCategory } from "@crimeworld/domain";

import { localCollectionOutcomeBands } from "./index";

describe("Local Collection outcome definition", () => {
  it("exports the accepted immutable classification bands", () => {
    expect(localCollectionOutcomeBands).toEqual([
      { category: OperationOutcomeCategory.Success, weight: 45 },
      { category: OperationOutcomeCategory.PartialSuccess, weight: 30 },
      { category: OperationOutcomeCategory.Failure, weight: 20 },
      { category: OperationOutcomeCategory.CriticalFailure, weight: 5 },
    ]);
    expect(Object.isFrozen(localCollectionOutcomeBands)).toBe(true);
    for (const band of localCollectionOutcomeBands) {
      expect(Object.isFrozen(band)).toBe(true);
    }
  });

  it("contains each category exactly once and totals 100 without consequences", () => {
    expect(localCollectionOutcomeBands.map((band) => band.category)).toEqual([
      "success",
      "partial-success",
      "failure",
      "critical-failure",
    ]);
    expect(localCollectionOutcomeBands.reduce((total, band) => total + band.weight, 0)).toBe(100);
    expect(new Set(localCollectionOutcomeBands.map((band) => band.category)).size).toBe(4);

    for (const band of localCollectionOutcomeBands) {
      expect(Object.keys(band).sort()).toEqual(["category", "weight"]);
      expect("reward" in band).toBe(false);
      expect("money" in band).toBe(false);
      expect("exposure" in band).toBe(false);
      expect("injury" in band).toBe(false);
      expect("health" in band).toBe(false);
    }
  });
});
