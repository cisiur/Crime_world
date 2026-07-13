import { parseLocationId } from "@crimeworld/domain";

import { contestedNightlifeDistrictDefinition } from "../districts";
import type { LocationDefinition } from "../../cityDefinition";

export const contestedNightlifeLocationDefinitions = [
  {
    id: parseLocationId("location:nightclub"),
    districtId: contestedNightlifeDistrictDefinition.id,
    name: "Nightclub",
    kind: "nightlife-venue",
    tags: ["cash-rich", "information-access", "rival-interest", "high-visibility"],
  },
  {
    id: parseLocationId("location:casino"),
    districtId: contestedNightlifeDistrictDefinition.id,
    name: "Casino",
    kind: "nightlife-venue",
    tags: ["cash-rich", "rival-interest", "high-visibility"],
  },
  {
    id: parseLocationId("location:music_venue"),
    districtId: contestedNightlifeDistrictDefinition.id,
    name: "Music Venue",
    kind: "nightlife-venue",
    tags: ["information-access", "rival-interest", "high-visibility"],
  },
  {
    id: parseLocationId("location:bar_district"),
    districtId: contestedNightlifeDistrictDefinition.id,
    name: "Bar District",
    kind: "nightlife-venue",
    tags: ["cash-rich", "information-access", "rival-interest", "high-visibility"],
  },
  {
    id: parseLocationId("location:underground_club"),
    districtId: contestedNightlifeDistrictDefinition.id,
    name: "Underground Club",
    kind: "nightlife-venue",
    tags: ["low-profile", "information-access", "rival-interest"],
  },
  {
    id: parseLocationId("location:rival_safehouse"),
    districtId: contestedNightlifeDistrictDefinition.id,
    name: "Rival Safehouse",
    kind: "safehouse",
    tags: ["low-profile", "rival-interest"],
  },
] as const satisfies readonly LocationDefinition[];
