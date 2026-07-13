import { parseDistrictId } from "@crimeworld/domain";

import type { DistrictDefinition } from "../../cityDefinition";

export const industrialDistrictDefinition = {
  id: parseDistrictId("district:industrial"),
  name: "Industrial & Logistics",
  kind: "industrial-logistics",
  tags: ["logistics-heavy", "low-civilian-presence", "route-competition", "criminal-opportunity"],
  baselineProfile: {
    wealth: 2,
    lawEnforcementPresence: 2,
    civilianVisibility: 1,
    logisticsValue: 4,
    criminalOpportunity: 3,
    recruitmentOpportunity: 1,
    politicalSensitivity: 1,
    rivalPresence: 2,
  },
} satisfies DistrictDefinition;
