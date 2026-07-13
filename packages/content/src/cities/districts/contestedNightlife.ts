import { parseDistrictId } from "@crimeworld/domain";

import type { DistrictDefinition } from "../../cityDefinition";

export const contestedNightlifeDistrictDefinition = {
  id: parseDistrictId("district:contested_nightlife"),
  name: "Contested Nightlife",
  kind: "contested-nightlife",
  tags: [
    "nightlife",
    "criminal-opportunity",
    "rival-territory",
    "unstable",
    "politically-sensitive",
    "high-visibility",
    "profitable",
  ],
  baselineProfile: {
    wealth: 3,
    lawEnforcementPresence: 3,
    civilianVisibility: 4,
    logisticsValue: 2,
    criminalOpportunity: 4,
    recruitmentOpportunity: 2,
    politicalSensitivity: 3,
    rivalPresence: 4,
  },
} satisfies DistrictDefinition;
