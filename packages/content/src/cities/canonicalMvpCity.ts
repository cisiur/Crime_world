import { parseCityId } from "@crimeworld/domain";

import { SUPPORTED_CITY_DEFINITION_SCHEMA_VERSION, type CityDefinition } from "../cityDefinition";
import { canonicalMvpDistrictDefinitions } from "./districts";
import { canonicalMvpLocationDefinitions } from "./locations";
import { canonicalMvpRouteDefinitions } from "./routes";

export const canonicalMvpCityDefinition = {
  schemaVersion: SUPPORTED_CITY_DEFINITION_SCHEMA_VERSION,
  contentVersion: "mvp-city.v1",
  id: parseCityId("city:canonical_mvp"),
  name: "Canonical MVP City",
  districts: canonicalMvpDistrictDefinitions,
  routes: canonicalMvpRouteDefinitions,
  locations: canonicalMvpLocationDefinitions,
} satisfies CityDefinition;
