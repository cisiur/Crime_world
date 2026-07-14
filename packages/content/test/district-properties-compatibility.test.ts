import {
  createCityState,
  deriveDistrictProperties,
  type DistrictPropertiesDefinitionInput,
} from "@crimeworld/domain";
import { describe, expect, it } from "vitest";

import { canonicalMvpCityDefinition, canonicalMvpDistrictDefinitions } from "../src/index";

describe("district properties compatibility", () => {
  it("uses canonical authored districts as structural district properties input", () => {
    const districtDefinitions: readonly DistrictPropertiesDefinitionInput[] =
      canonicalMvpDistrictDefinitions;

    expect(districtDefinitions).toHaveLength(4);
  });

  it("derives runtime district properties for every canonical MVP district", () => {
    const cityState = createCityState(canonicalMvpCityDefinition);

    const districtProperties = canonicalMvpDistrictDefinitions.map((districtDefinition) => {
      const districtState = cityState.districtStates.find(
        (candidateDistrictState) => candidateDistrictState.districtId === districtDefinition.id,
      );

      expect(districtState).toBeDefined();

      return deriveDistrictProperties(districtDefinition, districtState!);
    });

    expect(districtProperties).toHaveLength(canonicalMvpDistrictDefinitions.length);

    for (const districtProperty of districtProperties) {
      const districtDefinition = canonicalMvpDistrictDefinitions.find(
        (candidateDistrictDefinition) =>
          candidateDistrictDefinition.id === districtProperty.districtId,
      );

      expect(districtDefinition).toBeDefined();
      expect(districtProperty.baselineProfile).toEqual(districtDefinition?.baselineProfile);
      expect(districtProperty.currentTension).toBe(0);
      expect(districtProperty.currentExposure).toBe(0);
      expect(districtProperty.currentPolicePresenceModifier).toBe(0);
      expect(districtProperty.baselinePolicePresence).toBe(
        districtDefinition?.baselineProfile.lawEnforcementPresence,
      );
      expect(districtProperty.effectivePolicePresence).toBe(
        districtDefinition?.baselineProfile.lawEnforcementPresence,
      );
    }
  });
});
