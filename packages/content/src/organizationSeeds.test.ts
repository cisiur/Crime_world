import { describe, expect, it } from "vitest";

import { rivalOrganizationSeeds, type OrganizationSeed } from "./index";

describe("rival organization seeds", () => {
  it("exports exactly two rival organization seeds", () => {
    const seeds: readonly OrganizationSeed[] = rivalOrganizationSeeds;

    expect(seeds).toHaveLength(2);
  });

  it("uses unique organization IDs", () => {
    const organizationIds = rivalOrganizationSeeds.map((seed) => seed.organizationId);

    expect(new Set(organizationIds).size).toBe(rivalOrganizationSeeds.length);
  });

  it("uses unique leader character IDs", () => {
    const leaderCharacterIds = rivalOrganizationSeeds.map((seed) => seed.leaderCharacterId);

    expect(new Set(leaderCharacterIds).size).toBe(rivalOrganizationSeeds.length);
  });

  it("uses non-negative starting money values", () => {
    for (const seed of rivalOrganizationSeeds) {
      expect(seed.startingMoney).toBeGreaterThanOrEqual(0);
    }
  });

  it("uses non-negative starting operational capacity values", () => {
    for (const seed of rivalOrganizationSeeds) {
      expect(seed.startingOperationalCapacity).toBeGreaterThanOrEqual(0);
    }
  });

  it("exports objects that satisfy the OrganizationSeed contract", () => {
    const seeds: readonly OrganizationSeed[] = rivalOrganizationSeeds;

    for (const seed of seeds) {
      expect(seed.organizationId).toMatch(/^organization:/);
      expect(seed.displayName.length).toBeGreaterThan(0);
      expect(seed.leaderCharacterId).toMatch(/^character:/);
      expect(Number.isInteger(seed.startingMoney)).toBe(true);
      expect(Number.isInteger(seed.startingOperationalCapacity)).toBe(true);
    }
  });
});
