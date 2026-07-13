import { parseLocationId } from "@crimeworld/domain";

import { startingResidentialDistrictDefinition } from "../districts";
import type { LocationDefinition } from "../../cityDefinition";

export const startingResidentialLocationDefinitions = [
  {
    id: parseLocationId("location:starting_hideout"),
    districtId: startingResidentialDistrictDefinition.id,
    name: "Starting Hideout",
    kind: "hideout",
    tags: ["starter-base", "low-profile"],
  },
  {
    id: parseLocationId("location:cheap_apartments"),
    districtId: startingResidentialDistrictDefinition.id,
    name: "Cheap Apartments",
    kind: "landmark",
    tags: ["low-profile", "recovery-support"],
  },
  {
    id: parseLocationId("location:corner_store"),
    districtId: startingResidentialDistrictDefinition.id,
    name: "Corner Store",
    kind: "shop-or-service",
    tags: ["front-business", "low-profile"],
  },
  {
    id: parseLocationId("location:small_garage"),
    districtId: startingResidentialDistrictDefinition.id,
    name: "Small Garage",
    kind: "workshop-or-transport",
    tags: ["transport-access", "low-profile"],
  },
  {
    id: parseLocationId("location:community_center"),
    districtId: startingResidentialDistrictDefinition.id,
    name: "Community Center",
    kind: "municipal-or-legal",
    tags: ["public-landmark", "civic-pressure"],
  },
  {
    id: parseLocationId("location:local_clinic"),
    districtId: startingResidentialDistrictDefinition.id,
    name: "Local Clinic",
    kind: "medical-or-recovery",
    tags: ["medical", "recovery-support"],
  },
  {
    id: parseLocationId("location:residential_safehouse"),
    districtId: startingResidentialDistrictDefinition.id,
    name: "Residential Safehouse",
    kind: "safehouse",
    tags: ["low-profile", "recovery-support"],
  },
] as const satisfies readonly LocationDefinition[];
