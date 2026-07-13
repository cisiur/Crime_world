import { parseRouteId } from "@crimeworld/domain";

import {
  commercialDistrictDefinition,
  contestedNightlifeDistrictDefinition,
  industrialDistrictDefinition,
  startingResidentialDistrictDefinition,
} from "../districts";
import type { RouteDefinition } from "../../cityDefinition";

export const canonicalMvpRouteDefinitions = [
  {
    id: parseRouteId("route:residential-commercial"),
    fromDistrictId: startingResidentialDistrictDefinition.id,
    toDistrictId: commercialDistrictDefinition.id,
    kind: "road",
    direction: "bidirectional",
    tags: ["primary-access", "commercial-traffic", "high-visibility"],
  },
  {
    id: parseRouteId("route:residential-nightlife"),
    fromDistrictId: startingResidentialDistrictDefinition.id,
    toDistrictId: contestedNightlifeDistrictDefinition.id,
    kind: "transit",
    direction: "bidirectional",
    tags: ["public-transit", "rival-interest", "high-visibility"],
  },
  {
    id: parseRouteId("route:residential-industrial"),
    fromDistrictId: startingResidentialDistrictDefinition.id,
    toDistrictId: industrialDistrictDefinition.id,
    kind: "logistics",
    direction: "bidirectional",
    tags: ["industrial-freight", "smuggling-relevant"],
  },
  {
    id: parseRouteId("route:commercial-industrial"),
    fromDistrictId: commercialDistrictDefinition.id,
    toDistrictId: industrialDistrictDefinition.id,
    kind: "logistics",
    direction: "bidirectional",
    tags: ["commercial-traffic", "industrial-freight", "high-visibility"],
  },
  {
    id: parseRouteId("route:industrial-nightlife"),
    fromDistrictId: industrialDistrictDefinition.id,
    toDistrictId: contestedNightlifeDistrictDefinition.id,
    kind: "road",
    direction: "bidirectional",
    tags: ["smuggling-relevant", "rival-interest", "industrial-freight"],
  },
] as const satisfies readonly RouteDefinition[];
