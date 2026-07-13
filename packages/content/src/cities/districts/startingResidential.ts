import { parseDistrictId } from "@crimeworld/domain";

import type { DistrictDefinition } from "../../cityDefinition";

export const startingResidentialDistrictDefinition = {
  id: parseDistrictId("district:starting_residential"),
  name: "Starting Residential",
  kind: "starting-residential",
  tags: ["low-income", "residential", "recruitment-friendly", "small-businesses"],
  baselineProfile: {
    wealth: 1,
    lawEnforcementPresence: 1,
    civilianVisibility: 3,
    logisticsValue: 1,
    criminalOpportunity: 2,
    recruitmentOpportunity: 4,
    politicalSensitivity: 0,
    rivalPresence: 1,
  },
} satisfies DistrictDefinition;
