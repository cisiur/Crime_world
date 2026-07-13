import { describe, expect, it } from "vitest";

import {
  createCityState,
  parseCityId,
  parseDistrictId,
  parseLocationId,
  parseRouteId,
  type CityStateDefinitionInput,
} from "../src/index";

type AuthoredDistrictFixture = CityStateDefinitionInput["districts"][number] & {
  readonly name: string;
};

type AuthoredLocationFixture = CityStateDefinitionInput["locations"][number] & {
  readonly districtId: ReturnType<typeof parseDistrictId>;
  readonly name: string;
};

type AuthoredRouteFixture = CityStateDefinitionInput["routes"][number] & {
  readonly fromDistrictId: ReturnType<typeof parseDistrictId>;
  readonly toDistrictId: ReturnType<typeof parseDistrictId>;
  readonly name: string;
};

interface AuthoredCityFixture extends CityStateDefinitionInput {
  readonly name: string;
  readonly districts: readonly [AuthoredDistrictFixture, AuthoredDistrictFixture];
  readonly locations: readonly [AuthoredLocationFixture, AuthoredLocationFixture];
  readonly routes: readonly [AuthoredRouteFixture];
}

describe("city state", () => {
  it("creates runtime city state from a city definition shape", () => {
    const cityDefinition = createMinimalCityDefinition();

    const cityState = createCityState(cityDefinition);

    expect(cityState.cityId).toBe(cityDefinition.id);
    expect(cityState.districtStates).toHaveLength(2);
    expect(cityState.locationStates).toHaveLength(2);
    expect(cityState.routeStates).toHaveLength(1);
    expect(cityState.districtStates.map((district) => district.districtId)).toEqual([
      cityDefinition.districts[0]?.id,
      cityDefinition.districts[1]?.id,
    ]);
    expect(cityState.locationStates.map((location) => location.locationId)).toEqual([
      cityDefinition.locations[0]?.id,
      cityDefinition.locations[1]?.id,
    ]);
    expect(cityState.routeStates.map((route) => route.routeId)).toEqual([
      cityDefinition.routes[0]?.id,
    ]);
  });

  it("initializes deterministic runtime defaults", () => {
    const cityState = createCityState(createMinimalCityDefinition());

    expect(cityState.districtStates).toEqual([
      {
        districtId: parseDistrictId("district:old_row"),
        currentTension: 0,
        currentExposure: 0,
        currentPolicePresenceModifier: 0,
      },
      {
        districtId: parseDistrictId("district:freight_yard"),
        currentTension: 0,
        currentExposure: 0,
        currentPolicePresenceModifier: 0,
      },
    ]);
    expect(cityState.locationStates.every((location) => location.enabled)).toBe(true);
    expect(cityState.routeStates.every((route) => route.enabled)).toBe(true);
  });

  it("stores IDs only and does not retain authored definition objects", () => {
    const cityDefinition = createMinimalCityDefinition();
    const cityState = createCityState(cityDefinition);

    expect(cityState.districtStates).not.toContain(cityDefinition.districts[0]);
    expect(cityState.locationStates).not.toContain(cityDefinition.locations[0]);
    expect(cityState.routeStates).not.toContain(cityDefinition.routes[0]);
    expect(cityState.districtStates[0]).toEqual({
      districtId: cityDefinition.districts[0]?.id,
      currentTension: 0,
      currentExposure: 0,
      currentPolicePresenceModifier: 0,
    });
    expect(cityState.locationStates[0]).toEqual({
      locationId: cityDefinition.locations[0]?.id,
      enabled: true,
    });
    expect(cityState.routeStates[0]).toEqual({
      routeId: cityDefinition.routes[0]?.id,
      enabled: true,
    });
    expect("name" in cityState.districtStates[0]!).toBe(false);
    expect("kind" in cityState.locationStates[0]!).toBe(false);
    expect("fromDistrictId" in cityState.routeStates[0]!).toBe(false);
  });

  it("can be changed by replacement without mutating authored content", () => {
    const cityDefinition = createMinimalCityDefinition();
    const cityState = createCityState(cityDefinition);

    const changedCityState = {
      ...cityState,
      districtStates: cityState.districtStates.map((districtState) =>
        districtState.districtId === cityDefinition.districts[0]?.id
          ? { ...districtState, currentTension: 2 }
          : districtState,
      ),
      locationStates: cityState.locationStates.map((locationState) =>
        locationState.locationId === cityDefinition.locations[0]?.id
          ? { ...locationState, enabled: false }
          : locationState,
      ),
    };

    expect(changedCityState.districtStates[0]?.currentTension).toBe(2);
    expect(changedCityState.locationStates[0]?.enabled).toBe(false);
    expect(cityDefinition.districts[0]).toEqual({
      id: parseDistrictId("district:old_row"),
      name: "Old Row",
    });
    expect(cityDefinition.locations[0]).toEqual({
      id: parseLocationId("location:old_row_hideout"),
      districtId: parseDistrictId("district:old_row"),
      name: "Old Row Back Room",
    });
  });

  it("is deterministic for the same city definition", () => {
    const cityDefinition = createMinimalCityDefinition();

    expect(createCityState(cityDefinition)).toEqual(createCityState(cityDefinition));
  });
});

function createMinimalCityDefinition(): AuthoredCityFixture {
  const oldRowDistrictId = parseDistrictId("district:old_row");
  const freightYardDistrictId = parseDistrictId("district:freight_yard");

  return {
    id: parseCityId("city:test_harbor"),
    name: "Test Harbor",
    districts: [
      {
        id: oldRowDistrictId,
        name: "Old Row",
      },
      {
        id: freightYardDistrictId,
        name: "Freight Yard",
      },
    ],
    locations: [
      {
        id: parseLocationId("location:old_row_hideout"),
        districtId: oldRowDistrictId,
        name: "Old Row Back Room",
      },
      {
        id: parseLocationId("location:freight_yard_lockup"),
        districtId: freightYardDistrictId,
        name: "Freight Yard Lockup",
      },
    ],
    routes: [
      {
        id: parseRouteId("route:old_row-freight_yard"),
        fromDistrictId: oldRowDistrictId,
        toDistrictId: freightYardDistrictId,
        name: "Old Row to Freight Yard",
      },
    ],
  };
}
