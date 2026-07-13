import { describe, expect, it } from "vitest";

import {
  canonicalMvpDistrictDefinitions,
  canonicalMvpLocationDefinitions,
  commercialDistrictDefinition,
  commercialLocationDefinitions,
  contestedNightlifeDistrictDefinition,
  contestedNightlifeLocationDefinitions,
  industrialDistrictDefinition,
  industrialLocationDefinitions,
  startingResidentialDistrictDefinition,
  startingResidentialLocationDefinitions,
  type LocationDefinition,
} from "../src/index";

describe("canonical MVP location definitions", () => {
  it("exports 20 to 30 canonical strategic locations through the public API", () => {
    expect(canonicalMvpLocationDefinitions.length).toBeGreaterThanOrEqual(20);
    expect(canonicalMvpLocationDefinitions.length).toBeLessThanOrEqual(30);
    expect(canonicalMvpLocationDefinitions).toHaveLength(24);
    expect(canonicalMvpLocationDefinitions).toEqual([
      ...startingResidentialLocationDefinitions,
      ...commercialLocationDefinitions,
      ...industrialLocationDefinitions,
      ...contestedNightlifeLocationDefinitions,
    ]);
  });

  it("distributes locations evenly across the four canonical districts", () => {
    expect(startingResidentialLocationDefinitions).toHaveLength(6);
    expect(commercialLocationDefinitions).toHaveLength(6);
    expect(industrialLocationDefinitions).toHaveLength(6);
    expect(contestedNightlifeLocationDefinitions).toHaveLength(6);
  });

  it("uses unique stable branded location IDs", () => {
    const locationIds = canonicalMvpLocationDefinitions.map((location) => location.id);

    expect(new Set(locationIds).size).toBe(canonicalMvpLocationDefinitions.length);
    expect(locationIds).toContain("location:cheap_apartments");
    expect(locationIds).toContain("location:bank_branch");
    expect(locationIds).toContain("location:freight_terminal");
    expect(locationIds).toContain("location:rival_safehouse");
  });

  it("assigns every location to exactly one canonical district", () => {
    const canonicalDistrictIds = new Set(
      canonicalMvpDistrictDefinitions.map((district) => district.id),
    );

    expect(
      canonicalMvpLocationDefinitions.every((location) =>
        canonicalDistrictIds.has(location.districtId),
      ),
    ).toBe(true);
    expect(
      startingResidentialLocationDefinitions.every(
        (location) => location.districtId === startingResidentialDistrictDefinition.id,
      ),
    ).toBe(true);
    expect(
      commercialLocationDefinitions.every(
        (location) => location.districtId === commercialDistrictDefinition.id,
      ),
    ).toBe(true);
    expect(
      industrialLocationDefinitions.every(
        (location) => location.districtId === industrialDistrictDefinition.id,
      ),
    ).toBe(true);
    expect(
      contestedNightlifeLocationDefinitions.every(
        (location) => location.districtId === contestedNightlifeDistrictDefinition.id,
      ),
    ).toBe(true);
  });

  it("conforms to accepted location kinds and bounded tags", () => {
    const locationDefinitions: readonly LocationDefinition[] = canonicalMvpLocationDefinitions;

    expect(locationDefinitions.some((location) => location.kind === "safehouse")).toBe(true);
    expect(locationDefinitions.some((location) => location.kind === "shop-or-service")).toBe(true);
    expect(locationDefinitions.some((location) => location.kind === "nightlife-venue")).toBe(true);
    expect(locationDefinitions.some((location) => location.kind === "warehouse-or-storage")).toBe(
      true,
    );
    expect(locationDefinitions.some((location) => location.kind === "workshop-or-transport")).toBe(
      true,
    );
    expect(locationDefinitions.some((location) => location.kind === "medical-or-recovery")).toBe(
      true,
    );
    expect(locationDefinitions.some((location) => location.tags.includes("rival-interest"))).toBe(
      true,
    );
    expect(
      locationDefinitions.some((location) => location.tags.includes("smuggling-support")),
    ).toBe(true);
  });

  it("is plain JSON-serializable authored content", () => {
    const serializedLocations = JSON.stringify(canonicalMvpLocationDefinitions);

    expect(JSON.parse(serializedLocations) as unknown).toEqual(canonicalMvpLocationDefinitions);
  });
});
