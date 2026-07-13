import { describe, expect, it } from "vitest";

import {
  canonicalMvpCityDefinition,
  canonicalMvpDistrictDefinitions,
  canonicalMvpLocationDefinitions,
  canonicalMvpRouteDefinitions,
  type CityDefinition,
  type RouteDefinition,
} from "../src/index";

describe("canonical MVP city definition", () => {
  it("exports exactly one canonical city definition through the public API", () => {
    const canonicalCities = [
      canonicalMvpCityDefinition,
    ] as const satisfies readonly CityDefinition[];

    expect(canonicalCities).toHaveLength(1);
    expect(canonicalCities[0]).toBe(canonicalMvpCityDefinition);
    expect(canonicalMvpCityDefinition.id).toBe("city:canonical_mvp");
  });

  it("assembles the canonical district, location, and route collections", () => {
    expect(canonicalMvpCityDefinition.districts).toBe(canonicalMvpDistrictDefinitions);
    expect(canonicalMvpCityDefinition.locations).toBe(canonicalMvpLocationDefinitions);
    expect(canonicalMvpCityDefinition.routes).toBe(canonicalMvpRouteDefinitions);
    expect(canonicalMvpCityDefinition.districts).toHaveLength(4);
    expect(canonicalMvpCityDefinition.locations).toHaveLength(29);
    expect(canonicalMvpCityDefinition.routes).toHaveLength(5);
  });

  it("defines five stable canonical routes", () => {
    const routeDefinitions: readonly RouteDefinition[] = canonicalMvpRouteDefinitions;
    const routeIds = routeDefinitions.map((route) => route.id);

    expect(routeIds).toEqual([
      "route:residential-commercial",
      "route:residential-nightlife",
      "route:residential-industrial",
      "route:commercial-industrial",
      "route:industrial-nightlife",
    ]);
    expect(new Set(routeIds).size).toBe(routeIds.length);
    expect(routeDefinitions.every((route) => route.direction === "bidirectional")).toBe(true);
  });

  it("uses existing district IDs for every route endpoint", () => {
    const canonicalDistrictIds = new Set(
      canonicalMvpCityDefinition.districts.map((district) => district.id),
    );

    expect(
      canonicalMvpCityDefinition.routes.every(
        (route) =>
          canonicalDistrictIds.has(route.fromDistrictId) &&
          canonicalDistrictIds.has(route.toDistrictId),
      ),
    ).toBe(true);
  });

  it("uses existing district IDs for every location", () => {
    const canonicalDistrictIds = new Set(
      canonicalMvpCityDefinition.districts.map((district) => district.id),
    );

    expect(
      canonicalMvpCityDefinition.locations.every((location) =>
        canonicalDistrictIds.has(location.districtId),
      ),
    ).toBe(true);
  });

  it("round-trips through JSON as plain authored content", () => {
    const serializedCity = JSON.stringify(canonicalMvpCityDefinition);

    expect(JSON.parse(serializedCity) as unknown).toEqual(canonicalMvpCityDefinition);
  });
});
