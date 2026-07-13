import type { DistrictId, LocationId, RouteId } from "@crimeworld/domain";

import {
  SUPPORTED_CITY_DEFINITION_SCHEMA_VERSION,
  type CityDefinition,
  type DistrictDefinition,
  type RouteDefinition,
} from "./cityDefinition";

export type CityDefinitionValidationErrorCode =
  | "UNSUPPORTED_SCHEMA_VERSION"
  | "EMPTY_DISTRICTS"
  | "EMPTY_ROUTES"
  | "EMPTY_LOCATIONS"
  | "DUPLICATE_DISTRICT_ID"
  | "DUPLICATE_ROUTE_ID"
  | "DUPLICATE_LOCATION_ID"
  | "MISSING_ROUTE_ENDPOINT"
  | "SELF_LOOP_ROUTE"
  | "DUPLICATE_ROUTE_CONNECTION"
  | "ORPHAN_LOCATION"
  | "DISCONNECTED_DISTRICT_GRAPH";

export type CityDefinitionValidationEntityKind = "city" | "district" | "route" | "location";

export interface CityDefinitionValidationEntityRef {
  readonly kind: CityDefinitionValidationEntityKind;
  readonly id?: string;
}

export interface CityDefinitionValidationError {
  readonly code: CityDefinitionValidationErrorCode;
  readonly entity: CityDefinitionValidationEntityRef;
  readonly message: string;
}

export interface CityDefinitionValidationResult {
  readonly valid: boolean;
  readonly errors: readonly CityDefinitionValidationError[];
}

export interface DistrictAdjacency {
  readonly districtId: DistrictId;
  readonly adjacentDistrictIds: readonly DistrictId[];
}

export function validateCityDefinition(
  cityDefinition: CityDefinition,
): CityDefinitionValidationResult {
  const errors: CityDefinitionValidationError[] = [];

  validateSchemaVersion(cityDefinition, errors);
  validateNonEmptyCollections(cityDefinition, errors);

  const districtIds = collectDuplicateIdErrors(
    cityDefinition.districts,
    (district) => district.id,
    "DUPLICATE_DISTRICT_ID",
    "district",
    errors,
  );
  collectDuplicateIdErrors(
    cityDefinition.routes,
    (route) => route.id,
    "DUPLICATE_ROUTE_ID",
    "route",
    errors,
  );
  collectDuplicateIdErrors(
    cityDefinition.locations,
    (location) => location.id,
    "DUPLICATE_LOCATION_ID",
    "location",
    errors,
  );

  validateRoutes(cityDefinition.routes, districtIds, errors);
  validateLocations(cityDefinition.locations, districtIds, errors);
  validateConnectivity(cityDefinition.districts, cityDefinition.routes, districtIds, errors);

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function deriveDistrictAdjacency(
  districts: readonly DistrictDefinition[],
  routes: readonly RouteDefinition[],
): readonly DistrictAdjacency[] {
  const adjacency = new Map<DistrictId, DistrictId[]>();

  for (const district of districts) {
    adjacency.set(district.id, []);
  }

  for (const route of routes) {
    if (!adjacency.has(route.fromDistrictId) || !adjacency.has(route.toDistrictId)) {
      continue;
    }

    addAdjacentDistrict(adjacency, route.fromDistrictId, route.toDistrictId);

    if (route.direction === "bidirectional") {
      addAdjacentDistrict(adjacency, route.toDistrictId, route.fromDistrictId);
    }
  }

  return districts.map((district) => ({
    districtId: district.id,
    adjacentDistrictIds: adjacency.get(district.id) ?? [],
  }));
}

function validateSchemaVersion(
  cityDefinition: CityDefinition,
  errors: CityDefinitionValidationError[],
): void {
  if (cityDefinition.schemaVersion !== SUPPORTED_CITY_DEFINITION_SCHEMA_VERSION) {
    errors.push({
      code: "UNSUPPORTED_SCHEMA_VERSION",
      entity: { kind: "city", id: cityDefinition.id },
      message: `Unsupported city definition schema version "${cityDefinition.schemaVersion}".`,
    });
  }
}

function validateNonEmptyCollections(
  cityDefinition: CityDefinition,
  errors: CityDefinitionValidationError[],
): void {
  if (cityDefinition.districts.length === 0) {
    errors.push({
      code: "EMPTY_DISTRICTS",
      entity: { kind: "city", id: cityDefinition.id },
      message: "City definition must include at least one district.",
    });
  }

  if (cityDefinition.routes.length === 0) {
    errors.push({
      code: "EMPTY_ROUTES",
      entity: { kind: "city", id: cityDefinition.id },
      message: "City definition must include at least one route.",
    });
  }

  if (cityDefinition.locations.length === 0) {
    errors.push({
      code: "EMPTY_LOCATIONS",
      entity: { kind: "city", id: cityDefinition.id },
      message: "City definition must include at least one location.",
    });
  }
}

function collectDuplicateIdErrors<TItem, TId extends string>(
  items: readonly TItem[],
  getId: (item: TItem) => TId,
  code: CityDefinitionValidationErrorCode,
  entityKind: CityDefinitionValidationEntityKind,
  errors: CityDefinitionValidationError[],
): ReadonlySet<TId> {
  const seenIds = new Set<TId>();
  const duplicateIds = new Set<TId>();

  for (const item of items) {
    const id = getId(item);

    if (seenIds.has(id)) {
      duplicateIds.add(id);
      errors.push({
        code,
        entity: { kind: entityKind, id },
        message: `Duplicate ${entityKind} id "${id}".`,
      });
      continue;
    }

    seenIds.add(id);
  }

  return new Set([...seenIds, ...duplicateIds]);
}

function validateRoutes(
  routes: readonly RouteDefinition[],
  districtIds: ReadonlySet<DistrictId>,
  errors: CityDefinitionValidationError[],
): void {
  const coveredConnections = new Map<string, RouteId>();

  for (const route of routes) {
    const fromExists = districtIds.has(route.fromDistrictId);
    const toExists = districtIds.has(route.toDistrictId);

    if (!fromExists) {
      errors.push({
        code: "MISSING_ROUTE_ENDPOINT",
        entity: { kind: "route", id: route.id },
        message: `Route "${route.id}" references missing fromDistrictId "${route.fromDistrictId}".`,
      });
    }

    if (!toExists) {
      errors.push({
        code: "MISSING_ROUTE_ENDPOINT",
        entity: { kind: "route", id: route.id },
        message: `Route "${route.id}" references missing toDistrictId "${route.toDistrictId}".`,
      });
    }

    if (route.fromDistrictId === route.toDistrictId) {
      errors.push({
        code: "SELF_LOOP_ROUTE",
        entity: { kind: "route", id: route.id },
        message: `Route "${route.id}" connects district "${route.fromDistrictId}" to itself.`,
      });
    }

    if (!fromExists || !toExists || route.fromDistrictId === route.toDistrictId) {
      continue;
    }

    const overlappingRouteId = getOverlappingRouteId(route, coveredConnections);

    if (overlappingRouteId !== undefined) {
      errors.push({
        code: "DUPLICATE_ROUTE_CONNECTION",
        entity: { kind: "route", id: route.id },
        message: `Route "${route.id}" duplicates the connection already defined by "${overlappingRouteId}".`,
      });
      continue;
    }

    for (const connectionKey of getCoveredConnectionKeys(route)) {
      coveredConnections.set(connectionKey, route.id);
    }
  }
}

function validateLocations(
  locations: readonly { readonly id: LocationId; readonly districtId: DistrictId }[],
  districtIds: ReadonlySet<DistrictId>,
  errors: CityDefinitionValidationError[],
): void {
  for (const location of locations) {
    if (!districtIds.has(location.districtId)) {
      errors.push({
        code: "ORPHAN_LOCATION",
        entity: { kind: "location", id: location.id },
        message: `Location "${location.id}" references missing districtId "${location.districtId}".`,
      });
    }
  }
}

function validateConnectivity(
  districts: readonly DistrictDefinition[],
  routes: readonly RouteDefinition[],
  districtIds: ReadonlySet<DistrictId>,
  errors: CityDefinitionValidationError[],
): void {
  const firstDistrict = districts[0];

  if (firstDistrict === undefined || districtIds.size <= 1) {
    return;
  }

  const adjacency = deriveDistrictAdjacency(districts, routes);
  const adjacencyByDistrictId = new Map(
    adjacency.map((districtAdjacency) => [
      districtAdjacency.districtId,
      districtAdjacency.adjacentDistrictIds,
    ]),
  );
  const visitedDistrictIds = new Set<DistrictId>();
  const districtIdsToVisit: DistrictId[] = [firstDistrict.id];

  while (districtIdsToVisit.length > 0) {
    const districtId = districtIdsToVisit.shift();

    if (districtId === undefined || visitedDistrictIds.has(districtId)) {
      continue;
    }

    visitedDistrictIds.add(districtId);

    for (const adjacentDistrictId of adjacencyByDistrictId.get(districtId) ?? []) {
      if (districtIds.has(adjacentDistrictId) && !visitedDistrictIds.has(adjacentDistrictId)) {
        districtIdsToVisit.push(adjacentDistrictId);
      }
    }
  }

  const unreachableDistrictIds = [...districtIds].filter(
    (districtId) => !visitedDistrictIds.has(districtId),
  );

  if (unreachableDistrictIds.length > 0) {
    errors.push({
      code: "DISCONNECTED_DISTRICT_GRAPH",
      entity: { kind: "city" },
      message: `District graph is disconnected; unreachable districts: ${unreachableDistrictIds.join(", ")}.`,
    });
  }
}

function addAdjacentDistrict(
  adjacency: Map<DistrictId, DistrictId[]>,
  districtId: DistrictId,
  adjacentDistrictId: DistrictId,
): void {
  const adjacentDistrictIds = adjacency.get(districtId);

  if (adjacentDistrictIds === undefined || adjacentDistrictIds.includes(adjacentDistrictId)) {
    return;
  }

  adjacentDistrictIds.push(adjacentDistrictId);
}

function getOverlappingRouteId(
  route: RouteDefinition,
  coveredConnections: ReadonlyMap<string, RouteId>,
): RouteId | undefined {
  for (const connectionKey of getCoveredConnectionKeys(route)) {
    const overlappingRouteId = coveredConnections.get(connectionKey);

    if (overlappingRouteId !== undefined) {
      return overlappingRouteId;
    }
  }

  return undefined;
}

function getCoveredConnectionKeys(route: RouteDefinition): readonly string[] {
  const forwardConnectionKey = getDirectedConnectionKey(route.fromDistrictId, route.toDistrictId);

  if (route.direction === "from-to") {
    return [forwardConnectionKey];
  }

  return [forwardConnectionKey, getDirectedConnectionKey(route.toDistrictId, route.fromDistrictId)];
}

function getDirectedConnectionKey(fromDistrictId: DistrictId, toDistrictId: DistrictId): string {
  return `${fromDistrictId}->${toDistrictId}`;
}
