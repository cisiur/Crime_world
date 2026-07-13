import { describe, expect, it } from "vitest";

import {
  canonicalMvpDistrictDefinitions,
  commercialDistrictDefinition,
  contestedNightlifeDistrictDefinition,
  industrialDistrictDefinition,
  startingResidentialDistrictDefinition,
  type DistrictDefinition,
  type StrategicOrdinal,
} from "../src/index";

const acceptedStrategicOrdinalValues: readonly StrategicOrdinal[] = [0, 1, 2, 3, 4];

describe("canonical MVP district definitions", () => {
  it("exports exactly four canonical district definitions through the public API", () => {
    expect(canonicalMvpDistrictDefinitions).toHaveLength(4);
    expect(canonicalMvpDistrictDefinitions).toEqual([
      startingResidentialDistrictDefinition,
      commercialDistrictDefinition,
      industrialDistrictDefinition,
      contestedNightlifeDistrictDefinition,
    ]);
  });

  it("uses stable unique branded district IDs", () => {
    const districtIds = canonicalMvpDistrictDefinitions.map((district) => district.id);

    expect(districtIds).toEqual([
      "district:starting_residential",
      "district:commercial",
      "district:industrial",
      "district:contested_nightlife",
    ]);
    expect(new Set(districtIds).size).toBe(canonicalMvpDistrictDefinitions.length);
  });

  it("conforms to the district definition contract with bounded tags", () => {
    const districtDefinitions: readonly DistrictDefinition[] = canonicalMvpDistrictDefinitions;

    expect(districtDefinitions.map((district) => district.kind)).toEqual([
      "starting-residential",
      "commercial",
      "industrial-logistics",
      "contested-nightlife",
    ]);
    expect(startingResidentialDistrictDefinition.tags).toContain("recruitment-friendly");
    expect(commercialDistrictDefinition.tags).toContain("profitable");
    expect(industrialDistrictDefinition.tags).toContain("logistics-heavy");
    expect(contestedNightlifeDistrictDefinition.tags).toContain("rival-territory");
  });

  it("uses StrategicOrdinal baseline values for every authored profile entry", () => {
    for (const district of canonicalMvpDistrictDefinitions) {
      expect(
        Object.values(district.baselineProfile).every((value) =>
          acceptedStrategicOrdinalValues.includes(value),
        ),
      ).toBe(true);
    }
  });

  it("assigns baseline profiles consistent with each district identity", () => {
    expect(startingResidentialDistrictDefinition.baselineProfile).toMatchObject({
      wealth: 1,
      lawEnforcementPresence: 1,
      recruitmentOpportunity: 4,
      politicalSensitivity: 0,
    });
    expect(commercialDistrictDefinition.baselineProfile).toMatchObject({
      wealth: 4,
      lawEnforcementPresence: 3,
      civilianVisibility: 4,
      politicalSensitivity: 3,
    });
    expect(industrialDistrictDefinition.baselineProfile).toMatchObject({
      civilianVisibility: 1,
      logisticsValue: 4,
      criminalOpportunity: 3,
    });
    expect(contestedNightlifeDistrictDefinition.baselineProfile).toMatchObject({
      criminalOpportunity: 4,
      politicalSensitivity: 3,
      rivalPresence: 4,
    });
  });

  it("is plain JSON-serializable authored content", () => {
    const serializedDistricts = JSON.stringify(canonicalMvpDistrictDefinitions);

    expect(JSON.parse(serializedDistricts) as unknown).toEqual(canonicalMvpDistrictDefinitions);
  });
});
