export interface DomainRuntimeDescriptor {
  readonly packageName: "@crimeworld/domain";
  readonly runtime: "headless";
  readonly ownsGameplayRules: true;
}

export function describeDomainRuntime(): DomainRuntimeDescriptor {
  return {
    packageName: "@crimeworld/domain",
    runtime: "headless",
    ownsGameplayRules: true,
  };
}

export {
  InvalidEntityIdError,
  parseCampaignId,
  parseBusinessId,
  parseCharacterId,
  parseCityId,
  parseDistrictId,
  parseInvestigationId,
  parseLocationId,
  parseOperationId,
  parseOperationTemplateId,
  parseOpportunityId,
  parseOrganizationId,
  parseRouteId,
  parseWorldEventId,
} from "./entityIds";

export type {
  BusinessId,
  CharacterId,
  CityId,
  DistrictId,
  InvestigationId,
  LocationId,
  OperationId,
  OperationTemplateId,
  OpportunityId,
  OrganizationId,
  RouteId,
  WorldEventId,
  CampaignId,
} from "./entityIds";

export * from "./simulationClock";
export * from "./randomService";
export * from "./gameState";
export * from "./domainResult";
export * from "./domainEvents";
export * from "./commands";
export * from "./simulationTickPipeline";
export * from "./invariants";
export * from "./cityState";
export * from "./districtProperties";
export * from "./characterState";
