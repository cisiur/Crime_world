import type { CityId, DistrictId, LocationId, RouteId } from "@crimeworld/domain";

export const SUPPORTED_CITY_DEFINITION_SCHEMA_VERSION = "city-definition.v1";

export type CityDefinitionSchemaVersion = typeof SUPPORTED_CITY_DEFINITION_SCHEMA_VERSION;

export type AuthoredContentVersion = string;

export interface CityDefinition {
  readonly schemaVersion: CityDefinitionSchemaVersion;
  readonly contentVersion: AuthoredContentVersion;
  readonly id: CityId;
  readonly name: string;
  readonly districts: readonly DistrictDefinition[];
  readonly routes: readonly RouteDefinition[];
  readonly locations: readonly LocationDefinition[];
}

export interface DistrictDefinition {
  readonly id: DistrictId;
  readonly name: string;
  readonly kind: DistrictKind;
  readonly tags: readonly DistrictTag[];
  readonly baselineProfile: DistrictBaselineProfile;
}

export type StrategicOrdinal = 0 | 1 | 2 | 3 | 4;

export interface DistrictBaselineProfile {
  readonly wealth: StrategicOrdinal;
  readonly lawEnforcementPresence: StrategicOrdinal;
  readonly civilianVisibility: StrategicOrdinal;
  readonly logisticsValue: StrategicOrdinal;
  readonly criminalOpportunity: StrategicOrdinal;
  readonly recruitmentOpportunity: StrategicOrdinal;
  readonly politicalSensitivity: StrategicOrdinal;
  readonly rivalPresence: StrategicOrdinal;
}

export type DistrictKind =
  | "starting-residential"
  | "commercial"
  | "industrial-logistics"
  | "contested-nightlife";

export type DistrictTag =
  | "low-income"
  | "residential"
  | "recruitment-friendly"
  | "small-businesses"
  | "profitable"
  | "high-visibility"
  | "politically-sensitive"
  | "logistics-heavy"
  | "low-civilian-presence"
  | "route-competition"
  | "rival-territory"
  | "unstable"
  | "nightlife"
  | "criminal-opportunity";

export interface LocationDefinition {
  readonly id: LocationId;
  readonly districtId: DistrictId;
  readonly name: string;
  readonly kind: LocationKind;
  readonly tags: readonly LocationTag[];
}

export type LocationKind =
  | "hideout"
  | "safehouse"
  | "shop-or-service"
  | "nightlife-venue"
  | "warehouse-or-storage"
  | "workshop-or-transport"
  | "police-institution"
  | "medical-or-recovery"
  | "municipal-or-legal"
  | "landmark";

export type LocationTag =
  | "starter-base"
  | "low-profile"
  | "recovery-support"
  | "front-business"
  | "cash-rich"
  | "information-access"
  | "storage"
  | "smuggling-support"
  | "transport-access"
  | "law-enforcement"
  | "medical"
  | "legal-access"
  | "civic-pressure"
  | "public-landmark"
  | "rival-interest"
  | "high-visibility";

export interface RouteDefinition {
  readonly id: RouteId;
  readonly fromDistrictId: DistrictId;
  readonly toDistrictId: DistrictId;
  readonly kind: RouteKind;
  readonly direction: RouteDirection;
  readonly tags: readonly RouteTag[];
}

export type RouteKind = "road" | "logistics" | "transit" | "waterfront";

export type RouteDirection = "bidirectional" | "from-to";

export type RouteTag =
  | "primary-access"
  | "commercial-traffic"
  | "industrial-freight"
  | "public-transit"
  | "waterfront-access"
  | "smuggling-relevant"
  | "rival-interest"
  | "high-visibility";
