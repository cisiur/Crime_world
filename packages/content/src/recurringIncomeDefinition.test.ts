import { describe, expect, it } from "vitest";

import {
  InvalidRecurringIncomeDefinitionError,
  canonicalMvpRecurringIncomeDefinition,
  createRecurringIncomeDefinition,
} from "./index";

describe("recurring income definition", () => {
  it("exports the canonical immutable MVP recurring income definition", () => {
    expect(canonicalMvpRecurringIncomeDefinition).toEqual({
      amount: 15,
      periodTicks: 144,
    });
    expect(Object.isFrozen(canonicalMvpRecurringIncomeDefinition)).toBe(true);
  });

  it.each([
    ["zero amount", { amount: 0, periodTicks: 144 }, "amount"],
    ["negative amount", { amount: -1, periodTicks: 144 }, "amount"],
    ["non-safe amount", { amount: Number.MAX_SAFE_INTEGER + 1, periodTicks: 144 }, "amount"],
    ["zero period", { amount: 15, periodTicks: 0 }, "periodTicks"],
    ["negative period", { amount: 15, periodTicks: -1 }, "periodTicks"],
    ["non-safe period", { amount: 15, periodTicks: Number.MAX_SAFE_INTEGER + 1 }, "periodTicks"],
    ["infinite period", { amount: 15, periodTicks: Infinity }, "periodTicks"],
  ])("rejects invalid %s", (_label, definition, field) => {
    expect(() => createRecurringIncomeDefinition(definition)).toThrow(
      InvalidRecurringIncomeDefinitionError,
    );

    try {
      createRecurringIncomeDefinition(definition);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidRecurringIncomeDefinitionError);
      if (error instanceof InvalidRecurringIncomeDefinitionError) {
        expect(error.field).toBe(field);
      }
    }
  });
});
