import { describe, expect, it } from "vitest";

import {
  InvalidEntityIdError,
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
} from "../src/index";

const parserCases = [
  ["CityId", parseCityId, "city:harbor"],
  ["DistrictId", parseDistrictId, "district:old_docks"],
  ["RouteId", parseRouteId, "route:old_docks-industrial"],
  ["LocationId", parseLocationId, "location:warehouse.01"],
  ["CharacterId", parseCharacterId, "character:boss_001"],
  ["OrganizationId", parseOrganizationId, "organization:crew-alpha"],
  ["BusinessId", parseBusinessId, "business:front_001"],
  ["TransactionId", parseTransactionId, "transaction:ledger_001"],
  ["RecurringEconomyScheduleId", parseRecurringEconomyScheduleId, "recurring-schedule:rent_001"],
  ["OperationId", parseOperationId, "operation:0001"],
  ["OperationTemplateId", parseOperationTemplateId, "operation-template:local_extortion"],
  ["InvestigationId", parseInvestigationId, "investigation:case_001"],
  ["OpportunityId", parseOpportunityId, "opportunity:tip_001"],
  ["WorldEventId", parseWorldEventId, "event:0001"],
] as const;

describe("entity IDs", () => {
  it.each(parserCases)("%s parser returns the unchanged valid string", (_idType, parse, value) => {
    expect(parse(value)).toBe(value);
  });

  it("rejects empty strings", () => {
    expect(() => parseCharacterId("")).toThrow(InvalidEntityIdError);
  });

  it("rejects leading whitespace", () => {
    expect(() => parseCharacterId(" character:boss")).toThrow("leading whitespace");
  });

  it("rejects trailing whitespace", () => {
    expect(() => parseCharacterId("character:boss ")).toThrow("trailing whitespace");
  });

  it("rejects internal whitespace", () => {
    expect(() => parseCharacterId("character boss")).toThrow("internal whitespace");
  });

  it("rejects unsupported characters", () => {
    expect(() => parseCharacterId("character/boss")).toThrow("unsupported characters");
  });

  it("rejects invalid route IDs consistently with other branded IDs", () => {
    expect(() => parseRouteId("route main")).toThrow(InvalidEntityIdError);
    expect(() => parseRouteId("route/main")).toThrow("unsupported characters");
  });

  it("rejects values longer than 128 characters", () => {
    expect(() => parseCharacterId("a".repeat(129))).toThrow("maximum is 128");
  });

  it.each([42, {}, null, undefined])("rejects non-string values: %s", (value) => {
    expect(() => parseCharacterId(value)).toThrow(InvalidEntityIdError);
  });

  it("serializes through JSON as a normal string", () => {
    const id = parseCharacterId("character:boss_001");

    expect(JSON.stringify({ id })).toBe('{"id":"character:boss_001"}');
  });

  it("requires serialized raw strings to be parsed again before use as branded IDs", () => {
    const id = parseCharacterId("character:boss_001");
    const parsedJson = JSON.parse(JSON.stringify({ id })) as { id: unknown };

    expect(typeof parsedJson.id).toBe("string");
    expect(parseCharacterId(parsedJson.id)).toBe(id);
  });

  it("reports the parser ID type and validation rule in invalid ID errors", () => {
    expect(() => parseOrganizationId("organization crew")).toThrow(
      "Invalid OrganizationId: expected a non-empty string",
    );
  });

  it("validates TransactionId with the shared entity ID rules", () => {
    expect(parseTransactionId("transaction:e5_02a-001")).toBe("transaction:e5_02a-001");
    expect(() => parseTransactionId("")).toThrow(InvalidEntityIdError);
    expect(() => parseTransactionId(" transaction:001")).toThrow("leading whitespace");
    expect(() => parseTransactionId("transaction:001 ")).toThrow("trailing whitespace");
    expect(() => parseTransactionId("transaction 001")).toThrow("internal whitespace");
    expect(() => parseTransactionId("transaction/001")).toThrow("unsupported characters");
    expect(() => parseTransactionId("a".repeat(129))).toThrow("maximum is 128");
    expect(() => parseTransactionId(42)).toThrow(InvalidEntityIdError);
  });

  it("validates RecurringEconomyScheduleId with the shared entity ID rules", () => {
    expect(parseRecurringEconomyScheduleId("recurring-schedule:e5_02c-001")).toBe(
      "recurring-schedule:e5_02c-001",
    );
    expect(() => parseRecurringEconomyScheduleId("")).toThrow(InvalidEntityIdError);
    expect(() => parseRecurringEconomyScheduleId(" recurring-schedule:001")).toThrow(
      "leading whitespace",
    );
    expect(() => parseRecurringEconomyScheduleId("recurring-schedule:001 ")).toThrow(
      "trailing whitespace",
    );
    expect(() => parseRecurringEconomyScheduleId("recurring schedule 001")).toThrow(
      "internal whitespace",
    );
    expect(() => parseRecurringEconomyScheduleId("recurring-schedule/001")).toThrow(
      "unsupported characters",
    );
    expect(() => parseRecurringEconomyScheduleId("a".repeat(129))).toThrow("maximum is 128");
    expect(() => parseRecurringEconomyScheduleId(42)).toThrow(InvalidEntityIdError);
  });
});
