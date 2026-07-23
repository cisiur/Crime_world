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
  parseRecurringEconomyScheduleId,
  parseRouteId,
  parseTransactionId,
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
  RecurringEconomyScheduleId,
  RouteId,
  TransactionId,
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
export * from "./organizationState";
export * from "./businessState";
export * from "./operationState";
export * from "./operationAvailability";
export * from "./operationPlanning";
export * from "./operationLifecycle";
export * from "./operationOutcomeResolver";
export * from "./operationOutcomeClassification";
export * from "./operationConsequences";
export * from "./moneyLedger";
export * from "./recurringEconomy";
export * from "./crewUpkeepSchedules";
