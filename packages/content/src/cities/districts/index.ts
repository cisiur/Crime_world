import { commercialDistrictDefinition } from "./commercial";
import { contestedNightlifeDistrictDefinition } from "./contestedNightlife";
import { industrialDistrictDefinition } from "./industrial";
import { startingResidentialDistrictDefinition } from "./startingResidential";

export {
  commercialDistrictDefinition,
  contestedNightlifeDistrictDefinition,
  industrialDistrictDefinition,
  startingResidentialDistrictDefinition,
};

export const canonicalMvpDistrictDefinitions = [
  startingResidentialDistrictDefinition,
  commercialDistrictDefinition,
  industrialDistrictDefinition,
  contestedNightlifeDistrictDefinition,
] as const;
