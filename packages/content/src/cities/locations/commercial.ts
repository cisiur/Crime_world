import { parseLocationId } from "@crimeworld/domain";

import { commercialDistrictDefinition } from "../districts";
import type { LocationDefinition } from "../../cityDefinition";

export const commercialLocationDefinitions = [
  {
    id: parseLocationId("location:shopping_center"),
    districtId: commercialDistrictDefinition.id,
    name: "Shopping Center",
    kind: "shop-or-service",
    tags: ["cash-rich", "high-visibility", "front-business"],
  },
  {
    id: parseLocationId("location:jewelry_store"),
    districtId: commercialDistrictDefinition.id,
    name: "Jewelry Store",
    kind: "shop-or-service",
    tags: ["cash-rich", "high-visibility"],
  },
  {
    id: parseLocationId("location:bank_branch"),
    districtId: commercialDistrictDefinition.id,
    name: "Bank Branch",
    kind: "municipal-or-legal",
    tags: ["cash-rich", "high-visibility", "civic-pressure"],
  },
  {
    id: parseLocationId("location:law_office"),
    districtId: commercialDistrictDefinition.id,
    name: "Law Office",
    kind: "municipal-or-legal",
    tags: ["legal-access", "high-visibility"],
  },
  {
    id: parseLocationId("location:hotel"),
    districtId: commercialDistrictDefinition.id,
    name: "Hotel",
    kind: "nightlife-venue",
    tags: ["cash-rich", "information-access", "high-visibility"],
  },
  {
    id: parseLocationId("location:restaurant_district"),
    districtId: commercialDistrictDefinition.id,
    name: "Restaurant District",
    kind: "nightlife-venue",
    tags: ["cash-rich", "information-access", "front-business", "high-visibility"],
  },
] as const satisfies readonly LocationDefinition[];
