import type { LocationKind } from "./cityDefinition";

export type BusinessLocationArchetypeId =
  | "business-location-archetype:hideout"
  | "business-location-archetype:safehouse"
  | "business-location-archetype:small_shop_service"
  | "business-location-archetype:nightlife_venue"
  | "business-location-archetype:warehouse_storage"
  | "business-location-archetype:workshop_transport";

export type BusinessLocationArchetypeClassification = "business" | "strategic-location";

export type BusinessLocationGameplayRole =
  | "organization-base"
  | "recovery"
  | "income-source"
  | "legal-cover"
  | "operational-location"
  | "storage"
  | "logistics"
  | "information-access"
  | "district-presence";

export type BusinessLocationRelativeProfile = "none" | "low" | "medium" | "high";

export interface BusinessLocationArchetypeDefinition {
  readonly id: BusinessLocationArchetypeId;
  readonly locationKind: LocationKind;
  readonly displayName: string;
  readonly classification: BusinessLocationArchetypeClassification;
  readonly roles: readonly BusinessLocationGameplayRole[];
  readonly incomePotential: BusinessLocationRelativeProfile;
  readonly upkeepBurden: BusinessLocationRelativeProfile;
  readonly visibility: BusinessLocationRelativeProfile;
  readonly vulnerability: BusinessLocationRelativeProfile;
  readonly operationalUtility: BusinessLocationRelativeProfile;
}

export type SupportedBusinessLocationKind =
  | "hideout"
  | "safehouse"
  | "shop-or-service"
  | "nightlife-venue"
  | "warehouse-or-storage"
  | "workshop-or-transport";

export type NonBusinessLocationKind =
  | "police-institution"
  | "medical-or-recovery"
  | "municipal-or-legal"
  | "landmark";

export type BusinessLocationArchetypeValidationErrorCode =
  | "DUPLICATE_ARCHETYPE_ID"
  | "DUPLICATE_LOCATION_KIND"
  | "MISSING_REQUIRED_ARCHETYPE"
  | "UNSUPPORTED_LOCATION_KIND"
  | "EMPTY_ROLES"
  | "INVALID_PROFILE_VALUE"
  | "HIDEOUT_SAFEHOUSE_INCOME_ROLE"
  | "HIDEOUT_SAFEHOUSE_INCOME_POTENTIAL"
  | "BUSINESS_MISSING_INCOME_ROLE"
  | "CANONICAL_COLLECTION_SIZE";

export interface BusinessLocationArchetypeValidationError {
  readonly code: BusinessLocationArchetypeValidationErrorCode;
  readonly archetypeId?: string;
  readonly locationKind?: string;
  readonly field?: string;
  readonly message: string;
}

export interface BusinessLocationArchetypeValidationResult {
  readonly valid: boolean;
  readonly errors: readonly BusinessLocationArchetypeValidationError[];
}

const REQUIRED_ARCHETYPE_IDS = Object.freeze([
  "business-location-archetype:hideout",
  "business-location-archetype:safehouse",
  "business-location-archetype:small_shop_service",
  "business-location-archetype:nightlife_venue",
  "business-location-archetype:warehouse_storage",
  "business-location-archetype:workshop_transport",
] as const satisfies readonly BusinessLocationArchetypeId[]);

const SUPPORTED_BUSINESS_LOCATION_KINDS = Object.freeze([
  "hideout",
  "safehouse",
  "shop-or-service",
  "nightlife-venue",
  "warehouse-or-storage",
  "workshop-or-transport",
] as const satisfies readonly SupportedBusinessLocationKind[]);

const BUSINESS_LOCATION_RELATIVE_PROFILES = Object.freeze([
  "none",
  "low",
  "medium",
  "high",
] as const satisfies readonly BusinessLocationRelativeProfile[]);

const REQUIRED_BUSINESS_ARCHETYPE_IDS = new Set<BusinessLocationArchetypeId>([
  "business-location-archetype:small_shop_service",
  "business-location-archetype:nightlife_venue",
  "business-location-archetype:workshop_transport",
]);

const HIDEOUT_SAFEHOUSE_ARCHETYPE_IDS = new Set<BusinessLocationArchetypeId>([
  "business-location-archetype:hideout",
  "business-location-archetype:safehouse",
]);

export const canonicalMvpBusinessLocationArchetypeDefinitions = Object.freeze([
  createBusinessLocationArchetypeDefinition({
    id: "business-location-archetype:hideout",
    locationKind: "hideout",
    displayName: "Hideout",
    classification: "strategic-location",
    roles: ["organization-base", "operational-location", "district-presence"],
    incomePotential: "none",
    upkeepBurden: "medium",
    visibility: "low",
    vulnerability: "high",
    operationalUtility: "high",
  }),
  createBusinessLocationArchetypeDefinition({
    id: "business-location-archetype:safehouse",
    locationKind: "safehouse",
    displayName: "Safehouse",
    classification: "strategic-location",
    roles: ["recovery", "operational-location"],
    incomePotential: "none",
    upkeepBurden: "low",
    visibility: "low",
    vulnerability: "medium",
    operationalUtility: "medium",
  }),
  createBusinessLocationArchetypeDefinition({
    id: "business-location-archetype:small_shop_service",
    locationKind: "shop-or-service",
    displayName: "Small Shop or Service",
    classification: "business",
    roles: ["income-source", "legal-cover", "district-presence"],
    incomePotential: "low",
    upkeepBurden: "low",
    visibility: "medium",
    vulnerability: "medium",
    operationalUtility: "low",
  }),
  createBusinessLocationArchetypeDefinition({
    id: "business-location-archetype:nightlife_venue",
    locationKind: "nightlife-venue",
    displayName: "Restaurant or Nightlife Venue",
    classification: "business",
    roles: ["income-source", "information-access", "legal-cover", "district-presence"],
    incomePotential: "high",
    upkeepBurden: "high",
    visibility: "high",
    vulnerability: "high",
    operationalUtility: "medium",
  }),
  createBusinessLocationArchetypeDefinition({
    id: "business-location-archetype:warehouse_storage",
    locationKind: "warehouse-or-storage",
    displayName: "Warehouse or Storage Site",
    classification: "strategic-location",
    roles: ["storage", "logistics", "operational-location"],
    incomePotential: "none",
    upkeepBurden: "medium",
    visibility: "medium",
    vulnerability: "high",
    operationalUtility: "high",
  }),
  createBusinessLocationArchetypeDefinition({
    id: "business-location-archetype:workshop_transport",
    locationKind: "workshop-or-transport",
    displayName: "Workshop or Transport Business",
    classification: "business",
    roles: ["logistics", "operational-location", "income-source"],
    incomePotential: "medium",
    upkeepBurden: "high",
    visibility: "medium",
    vulnerability: "medium",
    operationalUtility: "high",
  }),
] as const satisfies readonly BusinessLocationArchetypeDefinition[]);

const canonicalMvpBusinessLocationArchetypesByLocationKind = new Map<
  SupportedBusinessLocationKind,
  BusinessLocationArchetypeDefinition
>(
  canonicalMvpBusinessLocationArchetypeDefinitions.map((definition) => [
    definition.locationKind as SupportedBusinessLocationKind,
    definition,
  ]),
);

export function getBusinessLocationArchetypeForLocationKind(
  locationKind: LocationKind,
): BusinessLocationArchetypeDefinition | null {
  if (!isSupportedBusinessLocationKind(locationKind)) {
    return null;
  }

  return canonicalMvpBusinessLocationArchetypesByLocationKind.get(locationKind) ?? null;
}

export function validateBusinessLocationArchetypeDefinitions(
  definitions: readonly BusinessLocationArchetypeDefinition[],
): BusinessLocationArchetypeValidationResult {
  const errors: BusinessLocationArchetypeValidationError[] = [];

  if (definitions.length !== REQUIRED_ARCHETYPE_IDS.length) {
    errors.push({
      code: "CANONICAL_COLLECTION_SIZE",
      message: `Canonical business location archetype collection must contain exactly ${REQUIRED_ARCHETYPE_IDS.length} entries.`,
    });
  }

  const seenIds = new Set<string>();
  const seenLocationKinds = new Set<string>();

  for (const definition of definitions) {
    if (seenIds.has(definition.id)) {
      errors.push({
        code: "DUPLICATE_ARCHETYPE_ID",
        archetypeId: definition.id,
        message: `Duplicate business location archetype id "${definition.id}".`,
      });
    }
    seenIds.add(definition.id);

    if (seenLocationKinds.has(definition.locationKind)) {
      errors.push({
        code: "DUPLICATE_LOCATION_KIND",
        archetypeId: definition.id,
        locationKind: definition.locationKind,
        message: `Duplicate business location archetype mapping for location kind "${definition.locationKind}".`,
      });
    }
    seenLocationKinds.add(definition.locationKind);

    if (!isSupportedBusinessLocationKind(definition.locationKind)) {
      errors.push({
        code: "UNSUPPORTED_LOCATION_KIND",
        archetypeId: definition.id,
        locationKind: definition.locationKind,
        message: `Location kind "${definition.locationKind}" is not supported for MVP business location archetypes.`,
      });
    }

    if (definition.roles.length === 0) {
      errors.push({
        code: "EMPTY_ROLES",
        archetypeId: definition.id,
        message: `Business location archetype "${definition.id}" must declare at least one gameplay role.`,
      });
    }

    validateProfileFields(definition, errors);
    validateIncomeInvariants(definition, errors);
  }

  for (const requiredArchetypeId of REQUIRED_ARCHETYPE_IDS) {
    if (!seenIds.has(requiredArchetypeId)) {
      errors.push({
        code: "MISSING_REQUIRED_ARCHETYPE",
        archetypeId: requiredArchetypeId,
        message: `Missing required MVP business location archetype "${requiredArchetypeId}".`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function createBusinessLocationArchetypeDefinition(
  input: BusinessLocationArchetypeDefinition,
): BusinessLocationArchetypeDefinition {
  return Object.freeze({
    ...input,
    roles: Object.freeze([...input.roles]),
  });
}

function validateProfileFields(
  definition: BusinessLocationArchetypeDefinition,
  errors: BusinessLocationArchetypeValidationError[],
): void {
  for (const field of [
    "incomePotential",
    "upkeepBurden",
    "visibility",
    "vulnerability",
    "operationalUtility",
  ] as const) {
    if (!isBusinessLocationRelativeProfile(definition[field])) {
      errors.push({
        code: "INVALID_PROFILE_VALUE",
        archetypeId: definition.id,
        field,
        message: `Business location archetype "${definition.id}" has invalid ${field} value "${String(
          definition[field],
        )}".`,
      });
    }
  }
}

function validateIncomeInvariants(
  definition: BusinessLocationArchetypeDefinition,
  errors: BusinessLocationArchetypeValidationError[],
): void {
  if (HIDEOUT_SAFEHOUSE_ARCHETYPE_IDS.has(definition.id)) {
    if (definition.roles.includes("income-source")) {
      errors.push({
        code: "HIDEOUT_SAFEHOUSE_INCOME_ROLE",
        archetypeId: definition.id,
        message: `Business location archetype "${definition.id}" must not declare income-source.`,
      });
    }

    if (definition.incomePotential !== "none") {
      errors.push({
        code: "HIDEOUT_SAFEHOUSE_INCOME_POTENTIAL",
        archetypeId: definition.id,
        field: "incomePotential",
        message: `Business location archetype "${definition.id}" must have incomePotential "none".`,
      });
    }
  }

  if (
    REQUIRED_BUSINESS_ARCHETYPE_IDS.has(definition.id) &&
    !definition.roles.includes("income-source")
  ) {
    errors.push({
      code: "BUSINESS_MISSING_INCOME_ROLE",
      archetypeId: definition.id,
      message: `Business location archetype "${definition.id}" must declare income-source.`,
    });
  }
}

function isSupportedBusinessLocationKind(
  locationKind: LocationKind,
): locationKind is SupportedBusinessLocationKind {
  return (SUPPORTED_BUSINESS_LOCATION_KINDS as readonly LocationKind[]).includes(locationKind);
}

function isBusinessLocationRelativeProfile(
  value: unknown,
): value is BusinessLocationRelativeProfile {
  return (BUSINESS_LOCATION_RELATIVE_PROFILES as readonly unknown[]).includes(value);
}
