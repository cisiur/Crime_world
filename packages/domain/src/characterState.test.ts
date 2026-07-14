import { describe, expect, it } from "vitest";

import {
  InvalidCharacterStateError,
  createCharacterState,
  parseCharacterId,
  type CharacterCapabilityTag,
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

  it.each([-1, 101, 1.5, Number.NaN, Infinity, -Infinity])(
    "rejects invalid personal exposure: %s",
    (personalExposure) => {
      expectInvalidCharacterStateError(
        () => createCharacterState(createValidCharacterInput({ personalExposure })),
        "personalExposure",
      );
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
