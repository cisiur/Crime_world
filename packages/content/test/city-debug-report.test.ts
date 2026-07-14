import { createCityState, deriveDistrictProperties, parseDistrictId } from "@crimeworld/domain";
import { describe, expect, it } from "vitest";

import {
  canonicalMvpCityDefinition,
  formatCityDebugReport,
  validateCityDefinition,
  type CityDefinition,
} from "../src/index";

describe("city debug report", () => {
  it("formats the canonical city summary", () => {
    const report = formatCityDebugReport(canonicalMvpCityDefinition);

    expect(report).toContain("CrimeWorld City Debug Report");
    expect(report).toContain("City");
    expect(report).toContain("  id: city:canonical_mvp");
    expect(report).toContain("  schemaVersion: city-definition.v1");
    expect(report).toContain("  contentVersion: mvp-city.v1");
    expect(report).toContain("  districts: 4");
    expect(report).toContain("  locations: 29");
    expect(report).toContain("  routes: 5");
  });

  it("formats valid validation output when supplied", () => {
    const report = formatCityDebugReport(canonicalMvpCityDefinition, {
      validationResult: validateCityDefinition(canonicalMvpCityDefinition),
    });

    expect(report).toContain("Validation");
    expect(report).toContain("  status: VALID");
    expect(report).not.toContain("  errors");
  });

  it("formats invalid validation output when supplied", () => {
    const invalidCityDefinition: CityDefinition = {
      ...canonicalMvpCityDefinition,
      locations: [
        ...canonicalMvpCityDefinition.locations,
        {
          ...canonicalMvpCityDefinition.locations[0]!,
          districtId: parseDistrictId("district:debug_report_missing"),
        },
      ],
    };
    const report = formatCityDebugReport(invalidCityDefinition, {
      validationResult: validateCityDefinition(invalidCityDefinition),
    });

    expect(report).toContain("  status: INVALID");
    expect(report).toContain("    - code: DUPLICATE_LOCATION_ID");
    expect(report).toContain("      entity: kind=location, id=location:starting_hideout");
    expect(report).toContain("    - code: ORPHAN_LOCATION");
    expect(report).toContain(
      '      message: Location "location:starting_hideout" references missing districtId "district:debug_report_missing".',
    );
  });

  it("formats district details with baseline, location count, and neighbours", () => {
    const report = formatCityDebugReport(canonicalMvpCityDefinition);

    expect(report).toContain("Districts");
    expect(report).toContain("  - district:starting_residential");
    expect(report).toContain("    name: Starting Residential");
    expect(report).toContain(
      "    baseline: wealth=1, lawEnforcementPresence=1, civilianVisibility=3, logisticsValue=1, criminalOpportunity=2, recruitmentOpportunity=4, politicalSensitivity=0, rivalPresence=1",
    );
    expect(report).toContain("    locations: 7");
    expect(report).toContain(
      "    neighbours: district:commercial, district:contested_nightlife, district:industrial",
    );
  });

  it("formats route details", () => {
    const report = formatCityDebugReport(canonicalMvpCityDefinition);

    expect(report).toContain("Routes");
    expect(report).toContain("  - route:residential-commercial");
    expect(report).toContain("    from: district:starting_residential");
    expect(report).toContain("    to: district:commercial");
    expect(report).toContain("    direction: bidirectional");
    expect(report).toContain("    kind: road");
  });

  it("formats optional runtime district properties when supplied", () => {
    const cityState = createCityState(canonicalMvpCityDefinition);
    const runtimeDistrictProperties = canonicalMvpCityDefinition.districts.map(
      (districtDefinition) => {
        const districtState = cityState.districtStates.find(
          (candidateDistrictState) => candidateDistrictState.districtId === districtDefinition.id,
        );

        expect(districtState).toBeDefined();

        const result = deriveDistrictProperties(districtDefinition, districtState!);

        expect(result.ok).toBe(true);

        if (!result.ok) {
          throw new Error(result.error.message);
        }

        return result.value;
      },
    );

    const report = formatCityDebugReport(canonicalMvpCityDefinition, {
      runtimeDistrictProperties,
    });

    expect(report).toContain("    runtime");
    expect(report).toContain("      currentTension: 0");
    expect(report).toContain("      currentExposure: 0");
    expect(report).toContain("      currentPolicePresenceModifier: 0");
    expect(report).toContain("      baselinePolicePresence: 1");
    expect(report).toContain("      effectivePolicePresence: 1");
  });

  it("does not include runtime details when runtime properties are omitted", () => {
    const report = formatCityDebugReport(canonicalMvpCityDefinition);

    expect(report).not.toContain("    runtime");
  });

  it("is deterministic for identical input", () => {
    const validationResult = validateCityDefinition(canonicalMvpCityDefinition);

    expect(
      formatCityDebugReport(canonicalMvpCityDefinition, {
        validationResult,
      }),
    ).toBe(
      formatCityDebugReport(canonicalMvpCityDefinition, {
        validationResult,
      }),
    );
  });

  it("does not throw for canonical city input", () => {
    expect(() => formatCityDebugReport(canonicalMvpCityDefinition)).not.toThrow();
  });
});
