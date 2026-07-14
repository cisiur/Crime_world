import { describe, expect, it } from "vitest";

import {
  InvalidOrganizationStateError,
  createOrganizationState,
  parseCharacterId,
  parseOrganizationId,
  type CharacterId,
  type CreateOrganizationStateInput,
  type InvalidOrganizationStateField,
  type OrganizationState,
} from "./index";

describe("organization state", () => {
  it("creates an organization with all valid fields", () => {
    const organizationState = createOrganizationState(createValidOrganizationInput());

    expect(organizationState).toEqual({
      organizationId: parseOrganizationId("organization:starter_crew"),
      displayName: "Starter Crew",
      leaderCharacterId: parseCharacterId("character:boss_001"),
      memberCharacterIds: [
        parseCharacterId("character:boss_001"),
        parseCharacterId("character:operator_001"),
      ],
      money: 250,
      operationalCapacity: 2,
    });
  });

  it("rejects a leader who is not a member", () => {
    expectInvalidOrganizationStateError(
      () =>
        createOrganizationState(
          createValidOrganizationInput({
            leaderCharacterId: parseCharacterId("character:outsider"),
          }),
        ),
      "leaderCharacterId",
    );
  });

  it("rejects duplicate members", () => {
    const bossId = parseCharacterId("character:boss_001");

    expectInvalidOrganizationStateError(
      () =>
        createOrganizationState(
          createValidOrganizationInput({
            memberCharacterIds: [bossId, bossId],
          }),
        ),
      "memberCharacterIds",
    );
  });

  it("preserves member order", () => {
    const memberCharacterIds = [
      parseCharacterId("character:boss_001"),
      parseCharacterId("character:operator_002"),
      parseCharacterId("character:operator_001"),
    ];
    const organizationState = createOrganizationState(
      createValidOrganizationInput({ memberCharacterIds }),
    );

    expect(organizationState.memberCharacterIds).toEqual(memberCharacterIds);
  });

  it("does not retain the mutable input member array reference", () => {
    const memberCharacterIds: CharacterId[] = [
      parseCharacterId("character:boss_001"),
      parseCharacterId("character:operator_001"),
    ];
    const organizationState = createOrganizationState(
      createValidOrganizationInput({ memberCharacterIds }),
    );

    memberCharacterIds.push(parseCharacterId("character:operator_002"));

    expect(organizationState.memberCharacterIds).toEqual([
      parseCharacterId("character:boss_001"),
      parseCharacterId("character:operator_001"),
    ]);
    expect(organizationState.memberCharacterIds).not.toBe(memberCharacterIds);
  });

  it("accepts zero and positive money", () => {
    expect(createOrganizationState(createValidOrganizationInput({ money: 0 }))).toHaveProperty(
      "money",
      0,
    );
    expect(createOrganizationState(createValidOrganizationInput({ money: 500 }))).toHaveProperty(
      "money",
      500,
    );
  });

  it.each([-1, 1.5, Number.NaN, Infinity])("rejects invalid money: %s", (money) => {
    expectInvalidOrganizationStateError(
      () => createOrganizationState(createValidOrganizationInput({ money })),
      "money",
    );
  });

  it("accepts zero and positive operational capacity", () => {
    expect(
      createOrganizationState(createValidOrganizationInput({ operationalCapacity: 0 })),
    ).toHaveProperty("operationalCapacity", 0);
    expect(
      createOrganizationState(createValidOrganizationInput({ operationalCapacity: 3 })),
    ).toHaveProperty("operationalCapacity", 3);
  });

  it.each([-1, 1.5, Number.NaN, Infinity])(
    "rejects invalid operational capacity: %s",
    (operationalCapacity) => {
      expectInvalidOrganizationStateError(
        () => createOrganizationState(createValidOrganizationInput({ operationalCapacity })),
        "operationalCapacity",
      );
    },
  );

  it.each([
    ["empty string", ""],
    ["whitespace-only string", "   "],
    ["leading whitespace", " Starter Crew"],
    ["trailing whitespace", "Starter Crew "],
    ["non-string runtime input", 42],
  ])("rejects invalid display names: %s", (_caseName, displayName) => {
    expectInvalidOrganizationStateError(
      () =>
        createOrganizationState(
          createValidOrganizationInput({
            displayName,
          } as unknown as Partial<CreateOrganizationStateInput>),
        ),
      "displayName",
    );
  });

  it.each([
    ["non-array runtime input", "character:boss_001"],
    ["null runtime input", null],
  ])("rejects invalid member arrays: %s", (_caseName, memberCharacterIds) => {
    expectInvalidOrganizationStateError(
      () =>
        createOrganizationState(
          createValidOrganizationInput({
            memberCharacterIds,
          } as unknown as Partial<CreateOrganizationStateInput>),
        ),
      "memberCharacterIds",
    );
  });

  it("rejects unsupported runtime member values", () => {
    expectInvalidOrganizationStateError(
      () =>
        createOrganizationState(
          createValidOrganizationInput({
            memberCharacterIds: [
              parseCharacterId("character:boss_001"),
              42,
            ] as unknown as readonly CharacterId[],
          }),
        ),
      "memberCharacterIds",
    );
  });

  it("rejects unsupported runtime leader values", () => {
    expectInvalidOrganizationStateError(
      () =>
        createOrganizationState(
          createValidOrganizationInput({
            leaderCharacterId: 42 as unknown as CharacterId,
          }),
        ),
      "leaderCharacterId",
    );
  });
});

function createValidOrganizationInput(
  overrides: Partial<CreateOrganizationStateInput> = {},
): CreateOrganizationStateInput {
  return {
    organizationId: parseOrganizationId("organization:starter_crew"),
    displayName: "Starter Crew",
    leaderCharacterId: parseCharacterId("character:boss_001"),
    memberCharacterIds: [
      parseCharacterId("character:boss_001"),
      parseCharacterId("character:operator_001"),
    ],
    money: 250,
    operationalCapacity: 2,
    ...overrides,
  };
}

function expectInvalidOrganizationStateError(
  act: () => OrganizationState,
  expectedField: InvalidOrganizationStateField,
): void {
  try {
    act();
  } catch (error) {
    expect(error).toBeInstanceOf(InvalidOrganizationStateError);
    expect((error as InvalidOrganizationStateError).field).toBe(expectedField);
    return;
  }

  throw new Error("Expected InvalidOrganizationStateError.");
}
