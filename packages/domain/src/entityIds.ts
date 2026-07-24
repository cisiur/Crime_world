declare const entityIdBrand: unique symbol;

type EntityId<TIdType extends string> = string & {
  readonly [entityIdBrand]: TIdType;
};

type EntityIdTypeName =
  | "CityId"
  | "DistrictId"
  | "RouteId"
  | "LocationId"
  | "CharacterId"
  | "OrganizationId"
  | "BusinessId"
  | "TransactionId"
  | "RecurringEconomyScheduleId"
  | "OperationId"
  | "OperationTemplateId"
  | "InvestigationId"
  | "OpportunityId"
  | "RecruitmentOpportunityId"
  | "WorldEventId"
  | "CampaignId";

export type CityId = EntityId<"CityId">;
export type DistrictId = EntityId<"DistrictId">;
export type RouteId = EntityId<"RouteId">;
export type LocationId = EntityId<"LocationId">;
export type CharacterId = EntityId<"CharacterId">;
export type OrganizationId = EntityId<"OrganizationId">;
export type BusinessId = EntityId<"BusinessId">;
export type TransactionId = EntityId<"TransactionId">;
export type RecurringEconomyScheduleId = EntityId<"RecurringEconomyScheduleId">;
export type OperationId = EntityId<"OperationId">;
export type OperationTemplateId = EntityId<"OperationTemplateId">;
export type InvestigationId = EntityId<"InvestigationId">;
export type OpportunityId = EntityId<"OpportunityId">;
export type RecruitmentOpportunityId = EntityId<"RecruitmentOpportunityId">;
export type WorldEventId = EntityId<"WorldEventId">;
export type CampaignId = EntityId<"CampaignId">;

const MAX_ENTITY_ID_LENGTH = 128;
const ENTITY_ID_PATTERN = /^[A-Za-z0-9_.:-]+$/;
const ENTITY_ID_RULES =
  "expected a non-empty string up to 128 characters using only ASCII letters, digits, underscore, hyphen, period, or colon, with no whitespace";

export class InvalidEntityIdError extends Error {
  public constructor(
    public readonly idType: EntityIdTypeName,
    public readonly reason: string,
    public readonly value: unknown,
  ) {
    super(`Invalid ${idType}: ${ENTITY_ID_RULES}; ${reason}.`);
    this.name = "InvalidEntityIdError";
  }
}

export function parseCityId(value: unknown): CityId {
  return parseEntityId("CityId", value);
}

export function parseDistrictId(value: unknown): DistrictId {
  return parseEntityId("DistrictId", value);
}

export function parseRouteId(value: unknown): RouteId {
  return parseEntityId("RouteId", value);
}

export function parseLocationId(value: unknown): LocationId {
  return parseEntityId("LocationId", value);
}

export function parseCharacterId(value: unknown): CharacterId {
  return parseEntityId("CharacterId", value);
}

export function parseOrganizationId(value: unknown): OrganizationId {
  return parseEntityId("OrganizationId", value);
}

export function parseBusinessId(value: unknown): BusinessId {
  return parseEntityId("BusinessId", value);
}

export function parseTransactionId(value: unknown): TransactionId {
  return parseEntityId("TransactionId", value);
}

export function parseRecurringEconomyScheduleId(value: unknown): RecurringEconomyScheduleId {
  return parseEntityId("RecurringEconomyScheduleId", value);
}

export function parseOperationId(value: unknown): OperationId {
  return parseEntityId("OperationId", value);
}

export function parseOperationTemplateId(value: unknown): OperationTemplateId {
  return parseEntityId("OperationTemplateId", value);
}

export function parseInvestigationId(value: unknown): InvestigationId {
  return parseEntityId("InvestigationId", value);
}

export function parseOpportunityId(value: unknown): OpportunityId {
  return parseEntityId("OpportunityId", value);
}

export function parseRecruitmentOpportunityId(value: unknown): RecruitmentOpportunityId {
  return parseEntityId("RecruitmentOpportunityId", value);
}

export function parseWorldEventId(value: unknown): WorldEventId {
  return parseEntityId("WorldEventId", value);
}

export function parseCampaignId(value: unknown): CampaignId {
  return parseEntityId("CampaignId", value);
}

function parseEntityId<TIdType extends EntityIdTypeName>(
  idType: TIdType,
  value: unknown,
): EntityId<TIdType> {
  validateEntityId(idType, value);
  return value as EntityId<TIdType>;
}

function validateEntityId(idType: EntityIdTypeName, value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new InvalidEntityIdError(idType, `received ${describeValueType(value)}`, value);
  }

  if (value.length === 0) {
    throw new InvalidEntityIdError(idType, "received an empty string", value);
  }

  if (value.length > MAX_ENTITY_ID_LENGTH) {
    throw new InvalidEntityIdError(
      idType,
      `received ${value.length} characters, maximum is ${MAX_ENTITY_ID_LENGTH}`,
      value,
    );
  }

  if (value.trimStart() !== value) {
    throw new InvalidEntityIdError(idType, "received leading whitespace", value);
  }

  if (value.trimEnd() !== value) {
    throw new InvalidEntityIdError(idType, "received trailing whitespace", value);
  }

  if (/\s/.test(value)) {
    throw new InvalidEntityIdError(idType, "received internal whitespace", value);
  }

  if (!ENTITY_ID_PATTERN.test(value)) {
    throw new InvalidEntityIdError(idType, "received unsupported characters", value);
  }
}

function describeValueType(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    return "an array";
  }

  return `a ${typeof value}`;
}
