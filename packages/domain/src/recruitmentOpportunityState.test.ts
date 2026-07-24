import { describe, expect, it } from "vitest";

import {
  InvalidEntityIdError,
  InvalidRecruitmentOpportunityStateError,
  RecruitmentOpportunityStatus,
  createRecruitmentOpportunityState,
  parseCharacterId,
  parseLocationId,
  parseOrganizationId,
  parseRecruitmentOpportunityId,
  parseSimulationTick,
} from "./index";

describe("recruitment opportunity state", () => {
  it("parses valid recruitment opportunity IDs and rejects invalid IDs", () => {
    expect(parseRecruitmentOpportunityId("recruitment-opportunity:vera_kade")).toBe(
      "recruitment-opportunity:vera_kade",
    );
    expect(() => parseRecruitmentOpportunityId("recruitment opportunity")).toThrow(
      InvalidEntityIdError,
    );
  });

  it("creates immutable active recruitment opportunity state", () => {
    const opportunity = createState();

    expect(opportunity).toEqual({
      recruitmentOpportunityId: "recruitment-opportunity:vera",
      candidateCharacterId: "character:vera",
      targetOrganizationId: "organization:starter",
      locationId: "location:corner_store",
      createdAtTick: 10,
      expiresAtTick: 20,
      status: "active",
    });
    expect(Object.isFrozen(opportunity)).toBe(true);
  });

  it("rejects invalid status and invalid tick ordering", () => {
    expect(() => createState({ status: "available" as RecruitmentOpportunityStatus })).toThrow(
      InvalidRecruitmentOpportunityStateError,
    );
    expect(() => createState({ expiresAtTick: parseSimulationTick(10) })).toThrow(
      InvalidRecruitmentOpportunityStateError,
    );
  });
});

function createState(
  overrides: Partial<Parameters<typeof createRecruitmentOpportunityState>[0]> = {},
) {
  return createRecruitmentOpportunityState({
    recruitmentOpportunityId: parseRecruitmentOpportunityId("recruitment-opportunity:vera"),
    candidateCharacterId: parseCharacterId("character:vera"),
    targetOrganizationId: parseOrganizationId("organization:starter"),
    locationId: parseLocationId("location:corner_store"),
    createdAtTick: parseSimulationTick(10),
    expiresAtTick: parseSimulationTick(20),
    status: RecruitmentOpportunityStatus.Active,
    ...overrides,
  });
}
