import { commercialLocationDefinitions } from "./commercial";
import { contestedNightlifeLocationDefinitions } from "./contestedNightlife";
import { industrialLocationDefinitions } from "./industrial";
import { startingResidentialLocationDefinitions } from "./startingResidential";

export {
  commercialLocationDefinitions,
  contestedNightlifeLocationDefinitions,
  industrialLocationDefinitions,
  startingResidentialLocationDefinitions,
};

export const canonicalMvpLocationDefinitions = [
  ...startingResidentialLocationDefinitions,
  ...commercialLocationDefinitions,
  ...industrialLocationDefinitions,
  ...contestedNightlifeLocationDefinitions,
] as const;
