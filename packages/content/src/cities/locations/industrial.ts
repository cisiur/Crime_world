import { parseLocationId } from "@crimeworld/domain";

import { industrialDistrictDefinition } from "../districts";
import type { LocationDefinition } from "../../cityDefinition";

export const industrialLocationDefinitions = [
  {
    id: parseLocationId("location:freight_terminal"),
    districtId: industrialDistrictDefinition.id,
    name: "Freight Terminal",
    kind: "workshop-or-transport",
    tags: ["transport-access", "smuggling-support", "high-visibility"],
  },
  {
    id: parseLocationId("location:warehouse"),
    districtId: industrialDistrictDefinition.id,
    name: "Warehouse",
    kind: "warehouse-or-storage",
    tags: ["storage", "smuggling-support"],
  },
  {
    id: parseLocationId("location:truck_depot"),
    districtId: industrialDistrictDefinition.id,
    name: "Truck Depot",
    kind: "workshop-or-transport",
    tags: ["transport-access", "smuggling-support"],
  },
  {
    id: parseLocationId("location:rail_yard"),
    districtId: industrialDistrictDefinition.id,
    name: "Rail Yard",
    kind: "workshop-or-transport",
    tags: ["transport-access", "storage", "high-visibility"],
  },
  {
    id: parseLocationId("location:shipping_office"),
    districtId: industrialDistrictDefinition.id,
    name: "Shipping Office",
    kind: "shop-or-service",
    tags: ["front-business", "information-access", "transport-access"],
  },
  {
    id: parseLocationId("location:storage_facility"),
    districtId: industrialDistrictDefinition.id,
    name: "Storage Facility",
    kind: "warehouse-or-storage",
    tags: ["storage", "smuggling-support", "low-profile"],
  },
] as const satisfies readonly LocationDefinition[];
