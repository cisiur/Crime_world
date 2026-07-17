import { describe, expect, it } from "vitest";

import { parseLocationId, parseOperationTemplateId, type LocationId } from "@crimeworld/domain";

import {
  InvalidOperationTemplateDefinitionError,
  createOperationTemplateDefinition,
  type CreateOperationTemplateDefinitionInput,
  type InvalidOperationTemplateDefinitionField,
  type LocationKind,
  type OperationTemplateDefinition,
} from "./index";

describe("operation template definitions", () => {
  it("creates a valid operation template definition", () => {
    const template = createOperationTemplateDefinition(createValidTemplateInput());

    expect(template).toEqual({
      id: parseOperationTemplateId("operation-template:local_collection"),
      displayName: "Local Collection",
      category: "one-off-income",
      allowedTargetKinds: ["shop-or-service"],
      allowedTargetIds: [parseLocationId("location:corner_store")],
      durationMinutes: 60,
      startCost: 20,
      operationalCapacityCost: 1,
    });
  });

  it("returns an immutable template object and target arrays", () => {
    const template = createOperationTemplateDefinition(createValidTemplateInput());

    expect(Object.isFrozen(template)).toBe(true);
    expect(Object.isFrozen(template.allowedTargetKinds)).toBe(true);
    expect(Object.isFrozen(template.allowedTargetIds)).toBe(true);
  });

  it("does not retain mutable input target array references", () => {
    const allowedTargetKinds: LocationKind[] = ["shop-or-service"];
    const allowedTargetIds: LocationId[] = [parseLocationId("location:corner_store")];
    const template = createOperationTemplateDefinition(
      createValidTemplateInput({ allowedTargetKinds, allowedTargetIds }),
    );

    allowedTargetKinds.push("nightlife-venue");
    allowedTargetIds.push(parseLocationId("location:small_garage"));

    expect(template.allowedTargetKinds).toEqual(["shop-or-service"]);
    expect(template.allowedTargetKinds).not.toBe(allowedTargetKinds);
    expect(template.allowedTargetIds).toEqual([parseLocationId("location:corner_store")]);
    expect(template.allowedTargetIds).not.toBe(allowedTargetIds);
  });

  it("rejects duplicate target IDs", () => {
    const targetId = parseLocationId("location:corner_store");

    expectInvalidOperationTemplateDefinitionError(
      () =>
        createOperationTemplateDefinition(
          createValidTemplateInput({
            allowedTargetIds: [targetId, targetId],
          }),
        ),
      "allowedTargetIds",
    );
  });

  it("rejects duplicate target kinds", () => {
    expectInvalidOperationTemplateDefinitionError(
      () =>
        createOperationTemplateDefinition(
          createValidTemplateInput({
            allowedTargetKinds: ["shop-or-service", "shop-or-service"],
          }),
        ),
      "allowedTargetKinds",
    );
  });

  it.each([
    ["negative start cost", "startCost", -1],
    ["fractional start cost", "startCost", 1.5],
    ["non-finite start cost", "startCost", Number.NaN],
    ["negative operational capacity cost", "operationalCapacityCost", -1],
    ["fractional operational capacity cost", "operationalCapacityCost", 1.5],
    ["non-finite operational capacity cost", "operationalCapacityCost", Infinity],
  ] as const)("rejects invalid costs: %s", (_caseName, field, value) => {
    expectInvalidOperationTemplateDefinitionError(
      () =>
        createOperationTemplateDefinition({
          ...createValidTemplateInput(),
          [field]: value,
        }),
      field,
    );
  });

  it.each([0, -1, 1.5, Number.NaN, Infinity])("rejects invalid duration: %s", (durationMinutes) => {
    expectInvalidOperationTemplateDefinitionError(
      () => createOperationTemplateDefinition(createValidTemplateInput({ durationMinutes })),
      "durationMinutes",
    );
  });

  it.each([
    ["empty string", ""],
    ["whitespace-only string", "   "],
    ["leading whitespace", " Local Collection"],
    ["trailing whitespace", "Local Collection "],
    ["non-string runtime input", 42],
  ])("rejects invalid display names: %s", (_caseName, displayName) => {
    expectInvalidOperationTemplateDefinitionError(
      () =>
        createOperationTemplateDefinition(
          createValidTemplateInput({
            displayName,
          } as unknown as Partial<CreateOperationTemplateDefinitionInput>),
        ),
      "displayName",
    );
  });
});

function createValidTemplateInput(
  overrides: Partial<CreateOperationTemplateDefinitionInput> = {},
): CreateOperationTemplateDefinitionInput {
  return {
    id: parseOperationTemplateId("operation-template:local_collection"),
    displayName: "Local Collection",
    category: "one-off-income",
    allowedTargetKinds: ["shop-or-service"],
    allowedTargetIds: [parseLocationId("location:corner_store")],
    durationMinutes: 60,
    startCost: 20,
    operationalCapacityCost: 1,
    ...overrides,
  };
}

function expectInvalidOperationTemplateDefinitionError(
  act: () => OperationTemplateDefinition,
  expectedField: InvalidOperationTemplateDefinitionField,
): void {
  try {
    act();
  } catch (error) {
    expect(error).toBeInstanceOf(InvalidOperationTemplateDefinitionError);
    expect((error as InvalidOperationTemplateDefinitionError).field).toBe(expectedField);
    return;
  }

  throw new Error("Expected InvalidOperationTemplateDefinitionError.");
}
