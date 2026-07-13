import { parseDistrictId, parseLocationId, parseRouteId } from "@crimeworld/domain";
import { describe, expect, it } from "vitest";

import {
  SUPPORTED_CITY_DEFINITION_SCHEMA_VERSION,
  canonicalMvpCityDefinition,
  commercialDistrictDefinition,
  contestedNightlifeDistrictDefinition,
  deriveDistrictAdjacency,
  industrialDistrictDefinition,
  startingResidentialDistrictDefinition,
  validateCityDefinition,
  type CityDefinition,
  type CityDefinitionValidationErrorCode,
  type RouteDefinition,
} from "../src/index";

describe("city definition validation", () => {
  it("validates the canonical MVP city", () => {
    const result = validateCityDefinition(canonicalMvpCityDefinition);

    expect(result).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("derives canonical district adjacency from routes", () => {
    const adjacency = deriveDistrictAdjacency(
      canonicalMvpCityDefinition.districts,
      canonicalMvpCityDefinition.routes,
    );

    expect(adjacency).toEqual([
      {
        districtId: startingResidentialDistrictDefinition.id,
        adjacentDistrictIds: [
          commercialDistrictDefinition.id,
          contestedNightlifeDistrictDefinition.id,
          industrialDistrictDefinition.id,
        ],
      },
      {
        districtId: commercialDistrictDefinition.id,
        adjacentDistrictIds: [
          startingResidentialDistrictDefinition.id,
          industrialDistrictDefinition.id,
        ],
      },
      {
        districtId: industrialDistrictDefinition.id,
        adjacentDistrictIds: [
          startingResidentialDistrictDefinition.id,
          commercialDistrictDefinition.id,
          contestedNightlifeDistrictDefinition.id,
        ],
      },
      {
        districtId: contestedNightlifeDistrictDefinition.id,
        adjacentDistrictIds: [
          startingResidentialDistrictDefinition.id,
          industrialDistrictDefinition.id,
        ],
      },
    ]);
  });

  it("reports duplicate district ids", () => {
    const cityDefinition = withCityOverrides({
      districts: [...canonicalMvpCityDefinition.districts, startingResidentialDistrictDefinition],
    });

    expectValidationCodes(cityDefinition, ["DUPLICATE_DISTRICT_ID"]);
  });

  it("reports duplicate route ids", () => {
    const cityDefinition = withCityOverrides({
      routes: [...canonicalMvpCityDefinition.routes, canonicalMvpCityDefinition.routes[0]],
    });

    expectValidationCodes(cityDefinition, ["DUPLICATE_ROUTE_ID", "DUPLICATE_ROUTE_CONNECTION"]);
  });

  it("reports duplicate location ids", () => {
    const cityDefinition = withCityOverrides({
      locations: [...canonicalMvpCityDefinition.locations, canonicalMvpCityDefinition.locations[0]],
    });

    expectValidationCodes(cityDefinition, ["DUPLICATE_LOCATION_ID"]);
  });

  it("reports orphan locations", () => {
    const orphanLocation = {
      ...canonicalMvpCityDefinition.locations[0],
      id: parseLocationId("location:orphan_fixture"),
      districtId: parseDistrictId("district:missing_fixture"),
    };
    const cityDefinition = withCityOverrides({
      locations: [...canonicalMvpCityDefinition.locations, orphanLocation],
    });

    expectValidationCodes(cityDefinition, ["ORPHAN_LOCATION"]);
  });

  it("reports missing route endpoints", () => {
    const routeWithMissingEndpoint: RouteDefinition = {
      ...canonicalMvpCityDefinition.routes[0],
      id: parseRouteId("route:missing_endpoint_fixture"),
      toDistrictId: parseDistrictId("district:missing_fixture"),
    };
    const cityDefinition = withCityOverrides({
      routes: [...canonicalMvpCityDefinition.routes, routeWithMissingEndpoint],
    });

    expectValidationCodes(cityDefinition, ["MISSING_ROUTE_ENDPOINT"]);
  });

  it("reports self-loop routes", () => {
    const selfLoopRoute: RouteDefinition = {
      ...canonicalMvpCityDefinition.routes[0],
      id: parseRouteId("route:self_loop_fixture"),
      fromDistrictId: startingResidentialDistrictDefinition.id,
      toDistrictId: startingResidentialDistrictDefinition.id,
    };
    const cityDefinition = withCityOverrides({
      routes: [...canonicalMvpCityDefinition.routes, selfLoopRoute],
    });

    expectValidationCodes(cityDefinition, ["SELF_LOOP_ROUTE"]);
  });

  it("reports duplicate route connections", () => {
    const duplicateConnectionRoute: RouteDefinition = {
      ...canonicalMvpCityDefinition.routes[0],
      id: parseRouteId("route:duplicate_connection_fixture"),
      fromDistrictId: commercialDistrictDefinition.id,
      toDistrictId: startingResidentialDistrictDefinition.id,
    };
    const cityDefinition = withCityOverrides({
      routes: [...canonicalMvpCityDefinition.routes, duplicateConnectionRoute],
    });

    expectValidationCodes(cityDefinition, ["DUPLICATE_ROUTE_CONNECTION"]);
  });

  it("reports disconnected district graphs", () => {
    const cityDefinition = withCityOverrides({
      routes: [canonicalMvpCityDefinition.routes[0]],
    });

    expectValidationCodes(cityDefinition, ["DISCONNECTED_DISTRICT_GRAPH"]);
  });

  it("reports unsupported schema versions", () => {
    const cityDefinition = withCityOverrides({
      schemaVersion: "city-definition.v999" as CityDefinition["schemaVersion"],
    });

    expectValidationCodes(cityDefinition, ["UNSUPPORTED_SCHEMA_VERSION"]);
  });

  it("reports empty required collections", () => {
    const cityDefinition = withCityOverrides({
      districts: [],
      routes: [],
      locations: [],
    });

    expectValidationCodes(cityDefinition, ["EMPTY_DISTRICTS", "EMPTY_ROUTES", "EMPTY_LOCATIONS"]);
  });

  it("reports multiple independent validation errors in one pass", () => {
    const orphanLocation = {
      ...canonicalMvpCityDefinition.locations[0],
      id: parseLocationId("location:multi_error_orphan_fixture"),
      districtId: parseDistrictId("district:multi_error_missing_fixture"),
    };
    const cityDefinition = withCityOverrides({
      schemaVersion: "city-definition.future" as CityDefinition["schemaVersion"],
      districts: [...canonicalMvpCityDefinition.districts, startingResidentialDistrictDefinition],
      locations: [...canonicalMvpCityDefinition.locations, orphanLocation],
    });

    expectValidationCodes(cityDefinition, [
      "UNSUPPORTED_SCHEMA_VERSION",
      "DUPLICATE_DISTRICT_ID",
      "ORPHAN_LOCATION",
    ]);
  });

  it("does not throw when validating invalid city definitions", () => {
    const cityDefinition = withCityOverrides({
      schemaVersion: "city-definition.invalid" as CityDefinition["schemaVersion"],
      districts: [],
      routes: [],
      locations: [],
    });

    expect(() => validateCityDefinition(cityDefinition)).not.toThrow();
  });
});

function withCityOverrides(overrides: Partial<CityDefinition>): CityDefinition {
  return {
    ...canonicalMvpCityDefinition,
    schemaVersion: SUPPORTED_CITY_DEFINITION_SCHEMA_VERSION,
    ...overrides,
  };
}

function expectValidationCodes(
  cityDefinition: CityDefinition,
  expectedCodes: readonly CityDefinitionValidationErrorCode[],
): void {
  const result = validateCityDefinition(cityDefinition);
  const actualCodes = result.errors.map((error) => error.code);

  expect(result.valid).toBe(false);

  for (const expectedCode of expectedCodes) {
    expect(actualCodes).toContain(expectedCode);
  }
}
