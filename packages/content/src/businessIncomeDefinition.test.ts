import { describe, expect, it } from "vitest";

import {
  canonicalMvpBusinessIncomeDefinitions,
  validateBusinessIncomeDefinitions,
  type BusinessIncomeDefinition,
  type BusinessIncomeDefinitionValidationErrorCode,
} from "./index";

describe("business income definitions", () => {
  it("exports exactly three canonical MVP business income definitions", () => {
    expect(canonicalMvpBusinessIncomeDefinitions).toEqual([
      {
        businessLocationArchetypeId: "business-location-archetype:small_shop_service",
        amount: 20,
        periodTicks: 144,
      },
      {
        businessLocationArchetypeId: "business-location-archetype:nightlife_venue",
        amount: 60,
        periodTicks: 144,
      },
      {
        businessLocationArchetypeId: "business-location-archetype:workshop_transport",
        amount: 40,
        periodTicks: 144,
      },
    ]);
    expect(Object.isFrozen(canonicalMvpBusinessIncomeDefinitions)).toBe(true);
    expect(canonicalMvpBusinessIncomeDefinitions.every(Object.isFrozen)).toBe(true);
    expect(validateBusinessIncomeDefinitions(canonicalMvpBusinessIncomeDefinitions)).toEqual({
      valid: true,
      errors: [],
    });
  });

  it.each([
    [
      "duplicate archetype",
      [
        definitionAt(0),
        {
          ...definitionAt(1),
          businessLocationArchetypeId: definitionAt(0).businessLocationArchetypeId,
        },
        definitionAt(2),
      ],
      "DUPLICATE_ARCHETYPE_REFERENCE",
    ],
    [
      "missing definition",
      [definitionAt(0), definitionAt(1)],
      "MISSING_REQUIRED_INCOME_DEFINITION",
    ],
    [
      "unsupported archetype",
      [
        { ...definitionAt(0), businessLocationArchetypeId: "business-location-archetype:hideout" },
        definitionAt(1),
        definitionAt(2),
      ],
      "UNSUPPORTED_ARCHETYPE",
    ],
    [
      "invalid amount",
      [{ ...definitionAt(0), amount: 0 }, definitionAt(1), definitionAt(2)],
      "INVALID_AMOUNT",
    ],
    [
      "invalid interval",
      [
        { ...definitionAt(0), periodTicks: Number.MAX_SAFE_INTEGER + 1 },
        definitionAt(1),
        definitionAt(2),
      ],
      "INVALID_PERIOD_TICKS",
    ],
    [
      "wrong size",
      [...canonicalMvpBusinessIncomeDefinitions, definitionAt(0)],
      "CANONICAL_COLLECTION_SIZE",
    ],
  ] as const)("rejects %s", (_caseName, definitions, expectedCode) => {
    expectValidationCode(definitions as readonly BusinessIncomeDefinition[], expectedCode);
  });

  it("rejects zero, negative, non-integer, and unsafe amount or interval values", () => {
    for (const value of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
      expectValidationCode(
        [{ ...definitionAt(0), amount: value }, definitionAt(1), definitionAt(2)],
        "INVALID_AMOUNT",
      );
      expectValidationCode(
        [{ ...definitionAt(0), periodTicks: value }, definitionAt(1), definitionAt(2)],
        "INVALID_PERIOD_TICKS",
      );
    }
  });

  it("does not mutate input collections", () => {
    const mutableCopy = canonicalMvpBusinessIncomeDefinitions.map((definition) => ({
      ...definition,
    }));
    const before = JSON.stringify(mutableCopy);

    validateBusinessIncomeDefinitions(mutableCopy);

    expect(JSON.stringify(mutableCopy)).toBe(before);
  });
});

function definitionAt(index: number): BusinessIncomeDefinition {
  const definition = canonicalMvpBusinessIncomeDefinitions[index];
  if (definition === undefined) {
    throw new Error(`Missing definition at index ${index}.`);
  }
  return definition;
}

function expectValidationCode(
  definitions: readonly BusinessIncomeDefinition[],
  expectedCode: BusinessIncomeDefinitionValidationErrorCode,
): void {
  const result = validateBusinessIncomeDefinitions(definitions);

  expect(result.valid).toBe(false);
  expect(result.errors.map((error) => error.code)).toContain(expectedCode);
}
