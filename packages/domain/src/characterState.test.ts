import { describe, expect, it } from "vitest";

import {
  InvalidCharacterStateError,
  createCharacterState,
  isCharacterAvailable,
  parseCharacterId,
  type CharacterCapabilityTag,
  type CharacterHealthState,
  type CharacterLegalState,
  type CharacterState,
  type CreateCharacterStateInput,
  type InvalidCharacterStateField,
} from "./index";

describe("character state", () => {
  it("creates a character with all valid fields", () => {
    const characterState = createCharacterState(createValidCharacterInput());

    expect(characterState).toEqual({
      characterId: parseCharacterId("character:boss_001"),
      displayName: "Mara Voss",
      capabilityTags: ["force", "stealth", "social"],
      healthState: "healthy",
      legalState: "free",
      assignmentState: "idle",
      competence: 50,
      loyalty: 50,
      personalExposure: 10,
    });
  });

  it("preserves capability tag order", () => {
    const characterState = createCharacterState(
      createValidCharacterInput({
        capabilityTags: ["streetwise", "logistics", "social"],
      }),
    );

    expect(characterState.capabilityTags).toEqual(["streetwise", "logistics", "social"]);
  });

  it("accepts minimum and maximum personal exposure", () => {
    expect(createCharacterState(createValidCharacterInput({ personalExposure: 0 }))).toHaveProperty(
      "personalExposure",
      0,
    );
    expect(
      createCharacterState(createValidCharacterInput({ personalExposure: 100 })),
    ).toHaveProperty("personalExposure", 100);
  });

  it.each([0, 50, 100])("accepts valid competence values: %s", (competence) => {
    expect(createCharacterState(createValidCharacterInput({ competence }))).toHaveProperty(
      "competence",
      competence,
    );
  });

  it.each([0, 50, 100])("accepts valid loyalty values: %s", (loyalty) => {
    expect(createCharacterState(createValidCharacterInput({ loyalty }))).toHaveProperty(
      "loyalty",
      loyalty,
    );
  });

  it("returns a new state object", () => {
    const input = createValidCharacterInput();
    const characterState = createCharacterState(input);

    expect(characterState).not.toBe(input);
  });

  it("does not retain the mutable input capability tag array reference", () => {
    const capabilityTags: CharacterCapabilityTag[] = ["force", "streetwise"];
    const characterState = createCharacterState(createValidCharacterInput({ capabilityTags }));

    capabilityTags.push("logistics");

    expect(characterState.capabilityTags).toEqual(["force", "streetwise"]);
    expect(characterState.capabilityTags).not.toBe(capabilityTags);
  });

  it.each([
    ["empty string", ""],
    ["whitespace-only string", "   "],
    ["leading whitespace", " Mara"],
    ["trailing whitespace", "Mara "],
    ["non-string runtime input", 42],
  ])("rejects invalid display names: %s", (_caseName, displayName) => {
    expectInvalidCharacterStateError(
      () =>
        createCharacterState(
          createValidCharacterInput({
            displayName,
          } as unknown as Partial<CreateCharacterStateInput>),
        ),
      "displayName",
    );
  });

  it("rejects duplicate capability tags", () => {
    expectInvalidCharacterStateError(
      () =>
        createCharacterState(
          createValidCharacterInput({
            capabilityTags: ["force", "force"] as readonly CharacterCapabilityTag[],
          }),
        ),
      "capabilityTags",
    );
  });

  it("rejects unsupported runtime capability tag values", () => {
    expectInvalidCharacterStateError(
      () =>
        createCharacterState(
          createValidCharacterInput({
            capabilityTags: ["force", "hacking"] as unknown as readonly CharacterCapabilityTag[],
          }),
        ),
      "capabilityTags",
    );
  });

  it("rejects unsupported runtime health states", () => {
    expectInvalidCharacterStateError(
      () =>
        createCharacterState(
          createValidCharacterInput({
            healthState: "recovering" as CreateCharacterStateInput["healthState"],
          }),
        ),
      "healthState",
    );
  });

  it("rejects unsupported runtime legal states", () => {
    expectInvalidCharacterStateError(
      () =>
        createCharacterState(
          createValidCharacterInput({
            legalState: "wanted" as CreateCharacterStateInput["legalState"],
          }),
        ),
      "legalState",
    );
  });

  it("rejects unsupported runtime assignment states", () => {
    expectInvalidCharacterStateError(
      () =>
        createCharacterState(
          createValidCharacterInput({
            assignmentState: "recovering" as CreateCharacterStateInput["assignmentState"],
          }),
        ),
      "assignmentState",
    );
  });

  it.each([-1, 101, 1.5, Number.NaN, Infinity, -Infinity])(
    "rejects invalid competence: %s",
    (competence) => {
      expectInvalidCharacterStateError(
        () => createCharacterState(createValidCharacterInput({ competence })),
        "competence",
      );
    },
  );

  it.each([-1, 101, 1.5, Number.NaN, Infinity, -Infinity])(
    "rejects invalid loyalty: %s",
    (loyalty) => {
      expectInvalidCharacterStateError(
        () => createCharacterState(createValidCharacterInput({ loyalty })),
        "loyalty",
      );
    },
  );

  it.each([-1, 101, 1.5, Number.NaN, Infinity, -Infinity])(
    "rejects invalid personal exposure: %s",
    (personalExposure) => {
      expectInvalidCharacterStateError(
        () => createCharacterState(createValidCharacterInput({ personalExposure })),
        "personalExposure",
      );
    },
  );

  it("reports healthy, free, idle characters as available", () => {
    const characterState = createCharacterState(
      createValidCharacterInput({
        healthState: "healthy",
        legalState: "free",
        assignmentState: "idle",
      }),
    );

    expect(isCharacterAvailable(characterState)).toBe(true);
  });

  it("reports healthy, free, assigned characters as unavailable", () => {
    const characterState = createCharacterState(
      createValidCharacterInput({
        healthState: "healthy",
        legalState: "free",
        assignmentState: "assigned",
      }),
    );

    expect(isCharacterAvailable(characterState)).toBe(false);
  });

  it.each<CharacterHealthState>(["injured", "critical", "dead"])(
    "reports %s characters as unavailable",
    (healthState) => {
      const characterState = createCharacterState(createValidCharacterInput({ healthState }));

      expect(isCharacterAvailable(characterState)).toBe(false);
    },
  );

  it.each<CharacterLegalState>(["detained", "imprisoned"])(
    "reports %s characters as unavailable",
    (legalState) => {
      const characterState = createCharacterState(createValidCharacterInput({ legalState }));

      expect(isCharacterAvailable(characterState)).toBe(false);
    },
  );
});

function createValidCharacterInput(
  overrides: Partial<CreateCharacterStateInput> = {},
): CreateCharacterStateInput {
  return {
    characterId: parseCharacterId("character:boss_001"),
    displayName: "Mara Voss",
    capabilityTags: ["force", "stealth", "social"],
    healthState: "healthy",
    legalState: "free",
    assignmentState: "idle",
    competence: 50,
    loyalty: 50,
    personalExposure: 10,
    ...overrides,
  };
}

function expectInvalidCharacterStateError(
  act: () => CharacterState,
  expectedField: InvalidCharacterStateField,
): void {
  try {
    act();
  } catch (error) {
    expect(error).toBeInstanceOf(InvalidCharacterStateError);
    expect((error as InvalidCharacterStateError).field).toBe(expectedField);
    return;
  }

  throw new Error("Expected InvalidCharacterStateError.");
}
