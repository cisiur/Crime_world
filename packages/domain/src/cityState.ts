import type { CityId, DistrictId, LocationId, RouteId } from "./entityIds";

export interface CityStateDefinitionInput {
  readonly id: CityId;
  readonly districts: readonly CityStateDistrictDefinitionInput[];
  readonly locations: readonly CityStateLocationDefinitionInput[];
  readonly routes: readonly CityStateRouteDefinitionInput[];
}

export interface CityStateDistrictDefinitionInput {
  readonly id: DistrictId;
}

export interface CityStateLocationDefinitionInput {
  readonly id: LocationId;
}

export interface CityStateRouteDefinitionInput {
  readonly id: RouteId;
}

export interface CityState {
  readonly cityId: CityId;
  readonly districtStates: readonly DistrictState[];
  readonly locationStates: readonly LocationState[];
  readonly routeStates: readonly RouteState[];
}

export interface DistrictState {
  readonly districtId: DistrictId;
  readonly currentTension: number;
  readonly currentExposure: number;
  readonly currentPolicePresenceModifier: number;
}

export interface LocationState {
  readonly locationId: LocationId;
  readonly enabled: boolean;
}

export interface RouteState {
  readonly routeId: RouteId;
  readonly enabled: boolean;
}

export function createCityState(cityDefinition: CityStateDefinitionInput): CityState {
  return {
    cityId: cityDefinition.id,
    districtStates: cityDefinition.districts.map(createDistrictState),
    locationStates: cityDefinition.locations.map(createLocationState),
    routeStates: cityDefinition.routes.map(createRouteState),
  };
}

function createDistrictState(districtDefinition: CityStateDistrictDefinitionInput): DistrictState {
  return {
    districtId: districtDefinition.id,
    currentTension: 0,
    currentExposure: 0,
    currentPolicePresenceModifier: 0,
  };
}

function createLocationState(locationDefinition: CityStateLocationDefinitionInput): LocationState {
  return {
    locationId: locationDefinition.id,
    enabled: true,
  };
}

function createRouteState(routeDefinition: CityStateRouteDefinitionInput): RouteState {
  return {
    routeId: routeDefinition.id,
    enabled: true,
  };
}
