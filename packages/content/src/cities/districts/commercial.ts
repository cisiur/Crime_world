import { parseDistrictId } from "@crimeworld/domain";

import type { DistrictDefinition } from "../../cityDefinition";

export const commercialDistrictDefinition = {
  id: parseDistrictId("district:commercial"),
  name: "Commercial",
  kind: "commercial",
  tags: ["profitable", "high-visibility", "politically-sensitive", "small-businesses"],
  baselineProfile: {
    wealth: 4,
    lawEnforcementPresence: 3,
    civilianVisibility: 4,
    logisticsValue: 2,
    criminalOpportunity: 3,
    recruitmentOpportunity: 2,
    politicalSensitivity: 3,
    rivalPresence: 1,
  },
} satisfies DistrictDefinition;
