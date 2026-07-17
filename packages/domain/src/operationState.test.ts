import { describe, expect, it } from "vitest";

import {
  InvalidOperationStateError,
  OperationStatus,
  createOperationState,
  parseCharacterId,
  parseLocationId,
  parseOperationId,
  parseOperationTemplateId,
  parseOrganizationId,
  parseSimulationTick,
  type CharacterId,
  type CreateOperationStateInput,
  type InvalidOperationStateField,
  type OperationState,
} from "./index";

describe("operation state", () => {
  it("creates an operation with all valid fields", () => {
    const operationState = createOperationState(createValidOperationInput());

    expect(operationState).toEqual({
      operationId: parseOperationId("operation:local_collection_001"),
      operationTemplateId: parseOperationTemplateId("operation-template:local_collection"),
      organizationId: parseOrganizationId("organization:starter_crew"),
      targetLocationId: parseLocationId("location:corner_store"),
      assignedCharacterIds: [parseCharacterId("character:boss_001")],
      status: OperationStatus.Planned,
      plannedAtTick: parseSimulationTick(4),
      plannedCompletionTick: parseSimulationTick(10),
    });
  });

  it("returns an immutable operation object and assigned character array", () => {
    const operationState = createOperationState(createValidOperationInput());

    expect(Object.isFrozen(operationState)).toBe(true);
    expect(Object.isFrozen(operationState.assignedCharacterIds)).toBe(true);
  });

  it("does not retain the mutable input assigned character array reference", () => {
    const assignedCharacterIds: CharacterId[] = [parseCharacterId("character:boss_001")];
    const operationState = createOperationState(
      createValidOperationInput({ assignedCharacterIds }),
    );

    assignedCharacterIds.push(parseCharacterId("character:operator_001"));

    expect(operationState.assignedCharacterIds).toEqual([parseCharacterId("character:boss_001")]);
    expect(operationState.assignedCharacterIds).not.toBe(assignedCharacterIds);
  });

  it("preserves assigned character order", () => {
    const assignedCharacterIds = [
      parseCharacterId("character:operator_002"),
      parseCharacterId("character:boss_001"),
    ];
    const operationState = createOperationState(
      createValidOperationInput({ assignedCharacterIds }),
    );

    expect(operationState.assignedCharacterIds).toEqual(assignedCharacterIds);
  });

  it("accepts all supported lifecycle values", () => {
    expect(
      createOperationState(createValidOperationInput({ status: OperationStatus.Planned })),
    ).toHaveProperty("status", OperationStatus.Planned);
    expect(
      createOperationState(createValidOperationInput({ status: OperationStatus.Running })),
    ).toHaveProperty("status", OperationStatus.Running);
    expect(
      createOperationState(createValidOperationInput({ status: OperationStatus.Resolved })),
    ).toHaveProperty("status", OperationStatus.Resolved);
  });

  it("rejects duplicate assigned characters", () => {
    const characterId = parseCharacterId("character:boss_001");

    expectInvalidOperationStateError(
      () =>
        createOperationState(
          createValidOperationInput({
            assignedCharacterIds: [characterId, characterId],
          }),
        ),
      "assignedCharacterIds",
    );
  });

  it("rejects empty assigned character arrays", () => {
    expectInvalidOperationStateError(
      () =>
        createOperationState(
          createValidOperationInput({
            assignedCharacterIds: [],
          }),
        ),
      "assignedCharacterIds",
    );
  });

  it("rejects unsupported runtime assigned character values", () => {
    expectInvalidOperationStateError(
      () =>
        createOperationState(
          createValidOperationInput({
            assignedCharacterIds: [42] as unknown as readonly CharacterId[],
          }),
        ),
      "assignedCharacterIds",
    );
  });

  it("rejects invalid operation IDs", () => {
    expectInvalidOperationStateError(
      () =>
        createOperationState(
          createValidOperationInput({
            operationId: "operation invalid" as CreateOperationStateInput["operationId"],
          }),
        ),
      "operationId",
    );
  });

  it("rejects invalid operation template IDs", () => {
    expectInvalidOperationStateError(
      () =>
        createOperationState(
          createValidOperationInput({
            operationTemplateId:
              "operation-template invalid" as CreateOperationStateInput["operationTemplateId"],
          }),
        ),
      "operationTemplateId",
    );
  });

  it("rejects invalid organization IDs", () => {
    expectInvalidOperationStateError(
      () =>
        createOperationState(
          createValidOperationInput({
            organizationId: 42 as unknown as CreateOperationStateInput["organizationId"],
          }),
        ),
      "organizationId",
    );
  });

  it("rejects invalid target location IDs", () => {
    expectInvalidOperationStateError(
      () =>
        createOperationState(
          createValidOperationInput({
            targetLocationId: 42 as unknown as CreateOperationStateInput["targetLocationId"],
          }),
        ),
      "targetLocationId",
    );
  });

  it("rejects invalid lifecycle values", () => {
    expectInvalidOperationStateError(
      () =>
        createOperationState(
          createValidOperationInput({
            status: "cancelled" as CreateOperationStateInput["status"],
          }),
        ),
      "status",
    );
  });

  it.each([
    ["negative plannedAtTick", "plannedAtTick", -1],
    ["fractional plannedAtTick", "plannedAtTick", 1.5],
    ["non-finite plannedAtTick", "plannedAtTick", Number.NaN],
    ["negative plannedCompletionTick", "plannedCompletionTick", -1],
    ["fractional plannedCompletionTick", "plannedCompletionTick", 2.5],
    ["non-finite plannedCompletionTick", "plannedCompletionTick", Infinity],
  ] as const)("rejects invalid ticks: %s", (_caseName, field, value) => {
    expectInvalidOperationStateError(
      () =>
        createOperationState(
          createValidOperationInput({
            [field]: value,
          } as unknown as Partial<CreateOperationStateInput>),
        ),
      field,
    );
  });

  it("rejects completion ticks earlier than planned ticks", () => {
    expectInvalidOperationStateError(
      () =>
        createOperationState(
          createValidOperationInput({
            plannedAtTick: parseSimulationTick(10),
            plannedCompletionTick: parseSimulationTick(9),
          }),
        ),
      "plannedCompletionTick",
    );
  });
});

function createValidOperationInput(
  overrides: Partial<CreateOperationStateInput> = {},
): CreateOperationStateInput {
  return {
    operationId: parseOperationId("operation:local_collection_001"),
    operationTemplateId: parseOperationTemplateId("operation-template:local_collection"),
    organizationId: parseOrganizationId("organization:starter_crew"),
    targetLocationId: parseLocationId("location:corner_store"),
    assignedCharacterIds: [parseCharacterId("character:boss_001")],
    status: OperationStatus.Planned,
    plannedAtTick: parseSimulationTick(4),
    plannedCompletionTick: parseSimulationTick(10),
    ...overrides,
  };
}

function expectInvalidOperationStateError(
  act: () => OperationState,
  expectedField: InvalidOperationStateField,
): void {
  try {
    act();
  } catch (error) {
    expect(error).toBeInstanceOf(InvalidOperationStateError);
    expect((error as InvalidOperationStateError).field).toBe(expectedField);
    return;
  }

  throw new Error("Expected InvalidOperationStateError.");
}
