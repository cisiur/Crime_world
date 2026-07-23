import { describe, expect, it } from "vitest";

import {
  InvalidCrewUpkeepDefinitionError,
  canonicalMvpCrewUpkeepDefinition,
  createCrewUpkeepDefinition,
} from "./index";

describe("crew upkeep definition", () => {
  it("exports the canonical immutable MVP crew upkeep definition", () => {
    expect(canonicalMvpCrewUpkeepDefinition).toEqual({
      amountPerCharacter: 5,
      periodTicks: 144,
    });
    expect(Object.isFrozen(canonicalMvpCrewUpkeepDefinition)).toBe(true);
  });

  it.each([
    ["zero amount", { amountPerCharacter: 0, periodTicks: 144 }, "amountPerCharacter"],
    ["negative amount", { amountPerCharacter: -1, periodTicks: 144 }, "amountPerCharacter"],
    [
      "non-safe amount",
      { amountPerCharacter: Number.MAX_SAFE_INTEGER + 1, periodTicks: 144 },
      "amountPerCharacter",
    ],
    ["zero period", { amountPerCharacter: 5, periodTicks: 0 }, "periodTicks"],
    [
      "non-safe period",
      { amountPerCharacter: 5, periodTicks: Number.MAX_SAFE_INTEGER + 1 },
      "periodTicks",
    ],
    ["infinite period", { amountPerCharacter: 5, periodTicks: Infinity }, "periodTicks"],
  ])("rejects invalid %s", (_label, definition, field) => {
    expect(() => createCrewUpkeepDefinition(definition)).toThrow(InvalidCrewUpkeepDefinitionError);

    try {
      createCrewUpkeepDefinition(definition);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidCrewUpkeepDefinitionError);
      if (error instanceof InvalidCrewUpkeepDefinitionError) {
        expect(error.field).toBe(field);
      }
    }
  });
});
