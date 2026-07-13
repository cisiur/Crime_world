export interface ContentPackageDescriptor {
  readonly packageName: "@crimeworld/content";
  readonly mutableCampaignState: false;
}

export const contentPackageDescriptor: ContentPackageDescriptor = {
  packageName: "@crimeworld/content",
  mutableCampaignState: false,
};

export * from "./cityDefinition";
export * from "./cityDefinitionValidation";
export * from "./cities/canonicalMvpCity";
export * from "./cities/districts";
export * from "./cities/locations";
export * from "./cities/routes";
