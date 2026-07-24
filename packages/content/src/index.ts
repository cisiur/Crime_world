export interface ContentPackageDescriptor {
  readonly packageName: "@crimeworld/content";
  readonly mutableCampaignState: false;
}

export const contentPackageDescriptor: ContentPackageDescriptor = {
  packageName: "@crimeworld/content",
  mutableCampaignState: false,
};

export * from "./cityDefinition";
export * from "./cityDebugReport";
export * from "./cityDefinitionValidation";
export * from "./businessLocationArchetypeDefinition";
export * from "./operationTemplateDefinition";
export * from "./localCollectionOperationTemplateDefinition";
export * from "./localCollectionOutcomeDefinition";
export * from "./localCollectionConsequenceDefinition";
export * from "./crewUpkeepDefinition";
export * from "./recurringIncomeDefinition";
export * from "./organizationSeeds";
export * from "./cities/canonicalMvpCity";
export * from "./cities/districts";
export * from "./cities/locations";
export * from "./cities/routes";
