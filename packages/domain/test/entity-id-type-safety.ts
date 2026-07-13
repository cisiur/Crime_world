import {
  parseCharacterId,
  parseCityId,
  parseDistrictId,
  parseOperationId,
  parseOperationTemplateId,
  parseOrganizationId,
  parseRouteId,
} from "../src/index";
import type {
  CharacterId,
  CityId,
  OperationTemplateId,
  OrganizationId,
  RouteId,
} from "../src/index";

const characterId = parseCharacterId("character:boss_001");
const organizationId = parseOrganizationId("organization:crew_001");
const districtId = parseDistrictId("district:old_docks");
const cityId = parseCityId("city:harbor");
const operationId = parseOperationId("operation:001");
const operationTemplateId = parseOperationTemplateId("operation-template:local_extortion");
const routeId = parseRouteId("route:old_docks-industrial");

const stringValue: string = characterId;
const acceptsString = (value: string): string => value;
acceptsString(characterId);

// @ts-expect-error CharacterId cannot be assigned to OrganizationId.
const invalidOrganizationId: OrganizationId = characterId;

// @ts-expect-error DistrictId cannot be assigned to CityId.
const invalidCityId: CityId = districtId;

// @ts-expect-error OperationId cannot be assigned to OperationTemplateId.
const invalidOperationTemplateId: OperationTemplateId = operationId;

// @ts-expect-error DistrictId cannot be assigned to RouteId.
const invalidRouteId: RouteId = districtId;

// @ts-expect-error A plain unvalidated string cannot be assigned to a branded ID.
const invalidCharacterId: CharacterId = "character:boss_001";

void organizationId;
void cityId;
void operationTemplateId;
void routeId;
void stringValue;
void invalidOrganizationId;
void invalidCityId;
void invalidOperationTemplateId;
void invalidRouteId;
void invalidCharacterId;
