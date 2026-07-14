import {
  createCityState,
  deriveDistrictProperties,
  parseDistrictId,
  parseLocationId,
  parseRouteId,
} from "@crimeworld/domain";
import { describe, expect, it } from "vitest";

import {
  SUPPORTED_CITY_DEFINITION_SCHEMA_VERSION,
  canonicalMvpCityDefinition,
  deriveDistrictAdjacency,
  validateCityDefinition,
  type CityDefinition,
  type CityDefinitionValidationErrorCode,
  type RouteDefinition,
} from "../src/index";

describe("canonical MVP city regression integrity", () => {
  it("keeps canonical city structure valid and uniquely identified", () => {
    expect(validateCityDefinition(canonicalMvpCityDefinition)).toEqual({
      valid: true,
      errors: [],
    });
    expect(canonicalMvpCityDefinition.districts).toHaveLength(4);
    expect(canonicalMvpCityDefinition.locations).toHaveLength(29);
    expect(canonicalMvpCityDefinition.routes).toHaveLength(5);
    expect(
      hasOnlyUniqueValues(canonicalMvpCityDefinition.districts.map((district) => district.id)),
    ).toBe(true);
    expect(
      hasOnlyUniqueValues(canonicalMvpCityDefinition.locations.map((location) => location.id)),
    ).toBe(true);
    expect(hasOnlyUniqueValues(canonicalMvpCityDefinition.routes.map((route) => route.id))).toBe(
      true,
    );
  });

  it("keeps canonical city references resolvable", () => {
    const districtIds = new Set(
      canonicalMvpCityDefinition.districts.map((district) => district.id),
    );

    expect(
      canonicalMvpCityDefinition.locations.every((location) =>
        districtIds.has(location.districtId),
      ),
    ).toBe(true);
    expect(
      canonicalMvpCityDefinition.routes.every(
        (route) => districtIds.has(route.fromDistrictId) && districtIds.has(route.toDistrictId),
      ),
    ).toBe(true);
    expect(
      deriveDistrictAdjacency(
        canonicalMvpCityDefinition.districts,
        canonicalMvpCityDefinition.routes,
      ),
    ).toHaveLength(canonicalMvpCityDefinition.districts.length);
  });

  it("remains structurally compatible with runtime city state and district properties", () => {
    const cityState = createCityState(canonicalMvpCityDefinition);

    expect(cityState.cityId).toBe(canonicalMvpCityDefinition.id);
    expect(cityState.districtStates).toHaveLength(canonicalMvpCityDefinition.districts.length);
    expect(cityState.locationStates).toHaveLength(canonicalMvpCityDefinition.locations.length);
    expect(cityState.routeStates).toHaveLength(canonicalMvpCityDefinition.routes.length);

    for (const districtDefinition of canonicalMvpCityDefinition.districts) {
      const districtState = cityState.districtStates.find(
        (candidateDistrictState) => candidateDistrictState.districtId === districtDefinition.id,
      );

      expect(districtState).toBeDefined();

      const result = deriveDistrictProperties(districtDefinition, districtState!);

      expect(result.ok).toBe(true);

      if (!result.ok) {
        throw new Error(result.error.message);
      }

      expect(result.value.districtId).toBe(districtDefinition.id);
      expect(result.value.baselineProfile).toEqual(districtDefinition.baselineProfile);
      expect(result.value.baselinePolicePresence).toBe(
        districtDefinition.baselineProfile.lawEnforcementPresence,
      );
    }
  });

  it.each([
    [
      "duplicate district",
      withCanonicalCityOverrides({
        districts: [
          ...canonicalMvpCityDefinition.districts,
          canonicalMvpCityDefinition.districts[0]!,
        ],
      }),
      "DUPLICATE_DISTRICT_ID",
    ],
    [
      "duplicate location",
      withCanonicalCityOverrides({
        locations: [
          ...canonicalMvpCityDefinition.locations,
          canonicalMvpCityDefinition.locations[0]!,
        ],
      }),
      "DUPLICATE_LOCATION_ID",
    ],
    [
      "duplicate route",
      withCanonicalCityOverrides({
        routes: [...canonicalMvpCityDefinition.routes, canonicalMvpCityDefinition.routes[0]!],
      }),
      "DUPLICATE_ROUTE_ID",
    ],
    [
      "orphan location",
      withCanonicalCityOverrides({
        locations: [
          ...canonicalMvpCityDefinition.locations,
          {
            ...canonicalMvpCityDefinition.locations[0]!,
            id: parseLocationId("location:regression_orphan_location"),
            districtId: parseDistrictId("district:regression_missing_location_district"),
          },
        ],
      }),
      "ORPHAN_LOCATION",
    ],
    [
      "missing route endpoint",
      withCanonicalCityOverrides({
        routes: [
          ...canonicalMvpCityDefinition.routes,
          {
            ...canonicalMvpCityDefinition.routes[0]!,
            id: parseRouteId("route:regression_missing_endpoint"),
            toDistrictId: parseDistrictId("district:regression_missing_route_district"),
          },
        ],
      }),
      "MISSING_ROUTE_ENDPOINT",
    ],
    [
      "self-loop",
      withCanonicalCityOverrides({
        routes: [
          ...canonicalMvpCityDefinition.routes,
          {
            ...canonicalMvpCityDefinition.routes[0]!,
            id: parseRouteId("route:regression_self_loop"),
            toDistrictId: canonicalMvpCityDefinition.routes[0]!.fromDistrictId,
          },
        ],
      }),
      "SELF_LOOP_ROUTE",
    ],
    [
      "duplicate connection",
      withCanonicalCityOverrides({
        routes: [
          ...canonicalMvpCityDefinition.routes,
          createRegressionRoute(
            "route:regression_duplicate_connection",
            canonicalMvpCityDefinition.routes[0]!.toDistrictId,
            canonicalMvpCityDefinition.routes[0]!.fromDistrictId,
          ),
        ],
      }),
      "DUPLICATE_ROUTE_CONNECTION",
    ],
    [
      "disconnected graph",
      withCanonicalCityOverrides({
        routes: [canonicalMvpCityDefinition.routes[0]!],
      }),
      "DISCONNECTED_DISTRICT_GRAPH",
    ],
    [
      "unsupported schema version",
      withCanonicalCityOverrides({
        schemaVersion: "city-definition.regression" as CityDefinition["schemaVersion"],
      }),
      "UNSUPPORTED_SCHEMA_VERSION",
    ],
  ] as const)("detects corrupted canonical city: %s", (_caseName, cityDefinition, expectedCode) => {
    expectValidationCode(cityDefinition, expectedCode);
  });

  it("keeps city validation deterministic", () => {
    expect(validateCityDefinition(canonicalMvpCityDefinition)).toEqual(
      validateCityDefinition(canonicalMvpCityDefinition),
    );
  });

  it("keeps district adjacency derivation deterministic", () => {
    expect(
      deriveDistrictAdjacency(
        canonicalMvpCityDefinition.districts,
        canonicalMvpCityDefinition.routes,
      ),
    ).toEqual(
      deriveDistrictAdjacency(
        canonicalMvpCityDefinition.districts,
        canonicalMvpCityDefinition.routes,
      ),
    );
  });

  it("keeps district property derivation deterministic for canonical runtime state", () => {
    const cityState = createCityState(canonicalMvpCityDefinition);

    const deriveCanonicalDistrictProperties = () =>
      canonicalMvpCityDefinition.districts.map((districtDefinition) => {
        const districtState = cityState.districtStates.find(
          (candidateDistrictState) => candidateDistrictState.districtId === districtDefinition.id,
        );

        expect(districtState).toBeDefined();

        return deriveDistrictProperties(districtDefinition, districtState!);
      });

    expect(deriveCanonicalDistrictProperties()).toEqual(deriveCanonicalDistrictProperties());
  });
});

function withCanonicalCityOverrides(overrides: Partial<CityDefinition>): CityDefinition {
  return {
    ...canonicalMvpCityDefinition,
    schemaVersion: SUPPORTED_CITY_DEFINITION_SCHEMA_VERSION,
    ...overrides,
  };
}

function createRegressionRoute(
  id: `route:${string}`,
  fromDistrictId: RouteDefinition["fromDistrictId"],
  toDistrictId: RouteDefinition["toDistrictId"],
): RouteDefinition {
  return {
    id: parseRouteId(id),
    fromDistrictId,
    toDistrictId,
    kind: "road",
    direction: "bidirectional",
    tags: [],
  };
}

function expectValidationCode(
  cityDefinition: CityDefinition,
  expectedCode: CityDefinitionValidationErrorCode,
): void {
  const result = validateCityDefinition(cityDefinition);

  expect(result.valid).toBe(false);
  expect(result.errors.map((error) => error.code)).toContain(expectedCode);
}

function hasOnlyUniqueValues(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}
