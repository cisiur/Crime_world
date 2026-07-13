import { describe, expect, it } from "vitest";

import { parseCityId, parseDistrictId, parseLocationId, parseRouteId } from "@crimeworld/domain";

import {
  SUPPORTED_CITY_DEFINITION_SCHEMA_VERSION,
  type CityDefinition,
  type StrategicOrdinal,
} from "../src/index";

describe("city content definitions", () => {
  it("constructs a minimal serializable city definition with stable branded ID references", () => {
    const residentialDistrictId = parseDistrictId("district:old_row");
    const industrialDistrictId = parseDistrictId("district:freight_yard");

    const baselineValues: readonly StrategicOrdinal[] = [0, 1, 2, 3, 4];

    const city = {
      schemaVersion: SUPPORTED_CITY_DEFINITION_SCHEMA_VERSION,
      contentVersion: "test-fixture.v1",
      id: parseCityId("city:test_harbor"),
      name: "Test Harbor",
      districts: [
        {
          id: residentialDistrictId,
          name: "Old Row",
          kind: "starting-residential",
          tags: ["residential", "low-income", "recruitment-friendly"],
          baselineProfile: {
            wealth: 1,
            lawEnforcementPresence: 1,
            civilianVisibility: 3,
            logisticsValue: 1,
            criminalOpportunity: 2,
            recruitmentOpportunity: 4,
            politicalSensitivity: 0,
            rivalPresence: 1,
          },
        },
        {
          id: industrialDistrictId,
          name: "Freight Yard",
          kind: "industrial-logistics",
          tags: ["logistics-heavy", "low-civilian-presence", "route-competition"],
          baselineProfile: {
            wealth: 2,
            lawEnforcementPresence: 2,
            civilianVisibility: 1,
            logisticsValue: 4,
            criminalOpportunity: 3,
            recruitmentOpportunity: 1,
            politicalSensitivity: 1,
            rivalPresence: 2,
          },
        },
      ],
      routes: [
        {
          id: parseRouteId("route:old_row-freight_yard"),
          fromDistrictId: residentialDistrictId,
          toDistrictId: industrialDistrictId,
          kind: "road",
          direction: "bidirectional",
          tags: ["primary-access", "industrial-freight"],
        },
      ],
      locations: [
        {
          id: parseLocationId("location:old_row_hideout"),
          districtId: residentialDistrictId,
          name: "Old Row Back Room",
          kind: "hideout",
          tags: ["starter-base", "low-profile"],
        },
        {
          id: parseLocationId("location:freight_yard_lockup"),
          districtId: industrialDistrictId,
          name: "Freight Yard Lockup",
          kind: "warehouse-or-storage",
          tags: ["storage", "smuggling-support"],
        },
      ],
    } satisfies CityDefinition;

    const [firstRoute] = city.routes;
    const [firstLocation] = city.locations;
    const [firstDistrict] = city.districts;

    expect(firstRoute).toBeDefined();
    expect(firstLocation).toBeDefined();
    expect(firstDistrict).toBeDefined();
    expect(city.id).toBe("city:test_harbor");
    expect(firstRoute?.id).toBe("route:old_row-freight_yard");
    expect(firstRoute?.fromDistrictId).toBe(residentialDistrictId);
    expect(firstRoute?.toDistrictId).toBe(industrialDistrictId);
    expect(firstLocation?.districtId).toBe(residentialDistrictId);

    const districtBaselineValues = city.districts.flatMap((district) =>
      Object.values(district.baselineProfile),
    );
    expect(districtBaselineValues.every((value) => baselineValues.includes(value))).toBe(true);

    expect(firstDistrict == null ? false : "coordinates" in firstDistrict).toBe(false);
    expect(firstLocation == null ? false : "position" in firstLocation).toBe(false);
    expect(firstRoute == null ? false : "geometry" in firstRoute).toBe(false);

    const serializedCity = JSON.stringify(city);
    expect(serializedCity).toContain('"schemaVersion":"city-definition.v1"');

    const parsedCity = JSON.parse(serializedCity) as unknown;
    expect(parsedCity).toEqual(city);
  });
});
