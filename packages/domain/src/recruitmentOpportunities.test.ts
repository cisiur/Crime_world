import { describe, expect, it } from "vitest";

import {
  DomainErrorCode,
  DomainEventType,
  RecruitmentOpportunityStatus,
  assertDomainEventInvariant,
  createCharacterState,
  createOrganizationState,
  createRecruitmentOpportunityState,
  expireRecruitmentOpportunities,
  generateRecruitmentOpportunities,
  parseCharacterId,
  parseLocationId,
  parseOrganizationId,
  parseRecruitmentOpportunityId,
  parseSimulationTick,
  type CharacterId,
  type CharacterState,
  type LocationState,
  type OrganizationState,
  type RecruitmentOpportunityCandidateDefinition,
  type RecruitmentOpportunityState,
} from "./index";

const orgA = parseOrganizationId("organization:recruitment_a");
const orgB = parseOrganizationId("organization:recruitment_b");
const leaderA = parseCharacterId("character:recruitment_leader_a");
const leaderB = parseCharacterId("character:recruitment_leader_b");
const candidateA = parseCharacterId("character:candidate_a");
const candidateB = parseCharacterId("character:candidate_b");
const locationA = parseLocationId("location:corner_store");
const locationB = parseLocationId("location:small_garage");
const tick = parseSimulationTick(100);

describe("recruitment opportunity generation", () => {
  it("generates eligible opportunities in definition order after existing records", () => {
    const existing = opportunity("old", candidateA, orgB, locationA, 5, 20);
    const result = generate({ existingOpportunities: [existing] });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.generatedOpportunities.map((item) => item.candidateCharacterId)).toEqual([
      candidateA,
      candidateB,
    ]);
    expect(result.value.opportunities[0]).toBe(existing);
    expect(result.value.opportunities.slice(1).map((item) => item.locationId)).toEqual([
      locationA,
      locationB,
    ]);
    expect(result.value.generatedOpportunities[0]).toMatchObject({
      recruitmentOpportunityId: opportunityId("a"),
      targetOrganizationId: orgA,
      createdAtTick: tick,
      expiresAtTick: parseSimulationTick(388),
      status: RecruitmentOpportunityStatus.Active,
    });
    expect(result.value.events.map((event) => event.type)).toEqual([
      DomainEventType.RecruitmentOpportunityGenerated,
      DomainEventType.RecruitmentOpportunityGenerated,
    ]);
    result.value.events.forEach((event) => expect(() => assertDomainEventInvariant(event)).not.toThrow());
  });

  it("reuses an exact matching active opportunity", () => {
    const existing = opportunity("a", candidateA, orgA, locationA, tick, 388);
    const result = generate({
      existingOpportunities: [existing],
      candidateDefinitions: [definition(candidateA, locationA, 10, 288)],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.reusedOpportunities).toEqual([existing]);
    expect(result.value.generatedOpportunities).toEqual([]);
    expect(result.value.opportunities).toEqual([existing]);
  });

  const rejectionCases: readonly RecruitmentOpportunityRejectionCase[] = [
    ["missing candidate", { characters: [character(candidateB)] }, DomainErrorCode.RecruitmentOpportunityGenerationMissingCharacter],
    ["missing organization", { organizations: [organization(orgB, leaderB)] }, DomainErrorCode.RecruitmentOpportunityGenerationMissingOrganization],
    ["missing location", { locations: [location(locationB)] }, DomainErrorCode.RecruitmentOpportunityGenerationMissingLocation],
    [
      "target member",
      { organizations: [organization(orgA, leaderA, [leaderA, candidateA]), organization(orgB, leaderB)] },
      DomainErrorCode.RecruitmentOpportunityGenerationIneligibleCandidate,
    ],
    [
      "other member",
      { organizations: [organization(orgA, leaderA), organization(orgB, leaderB, [leaderB, candidateA])] },
      DomainErrorCode.RecruitmentOpportunityGenerationIneligibleCandidate,
    ],
    ["dead", { characters: [character(candidateA, { healthState: "dead" })] }, DomainErrorCode.RecruitmentOpportunityGenerationIneligibleCandidate],
    ["detained", { characters: [character(candidateA, { legalState: "detained" })] }, DomainErrorCode.RecruitmentOpportunityGenerationIneligibleCandidate],
    ["imprisoned", { characters: [character(candidateA, { legalState: "imprisoned" })] }, DomainErrorCode.RecruitmentOpportunityGenerationIneligibleCandidate],
    ["duplicate candidate definition", { candidateDefinitions: [definition(candidateA, locationA, 10, 288), definition(candidateA, locationB, 25, 576)] }, DomainErrorCode.RecruitmentOpportunityGenerationConflict],
    [
      "duplicate opportunity id",
      {
        candidateDefinitions: [definition(candidateA, locationA, 10, 288), definition(candidateB, locationB, 25, 576)],
        opportunityIdsByCandidateId: {
          [candidateA]: opportunityId("same"),
          [candidateB]: opportunityId("same"),
        },
      },
      DomainErrorCode.RecruitmentOpportunityGenerationConflict,
    ],
    ["invalid cost", { candidateDefinitions: [{ ...definition(candidateA, locationA, 0, 288), recruitmentCost: 0 }] }, DomainErrorCode.RecruitmentOpportunityGenerationInvalidDefinition],
    ["invalid trust", { candidateDefinitions: [{ ...definition(candidateA, locationA, 10, 288), minimumTrustRequirement: -1 }] }, DomainErrorCode.RecruitmentOpportunityGenerationInvalidDefinition],
    ["invalid maintenance", { candidateDefinitions: [{ ...definition(candidateA, locationA, 10, 288), maintenanceCostPreview: -1 }] }, DomainErrorCode.RecruitmentOpportunityGenerationInvalidDefinition],
    ["invalid duration", { candidateDefinitions: [definition(candidateA, locationA, 10, 0)] }, DomainErrorCode.RecruitmentOpportunityGenerationInvalidDefinition],
  ];

  it.each(rejectionCases)("rejects %s atomically", (_caseName, overrides, expectedCode) => {
    const characters = Object.freeze(overrides.characters ?? [character(candidateA), character(candidateB)]);
    const organizations = Object.freeze(overrides.organizations ?? [organization(orgA, leaderA), organization(orgB, leaderB)]);
    const result = generate({
      ...overrides,
      characters,
      organizations,
      candidateDefinitions: overrides.candidateDefinitions ?? [definition(candidateA, locationA, 10, 288)],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe(expectedCode);
    expect(characters).toEqual(overrides.characters ?? [character(candidateA), character(candidateB)]);
    expect(organizations).toEqual(overrides.organizations ?? [organization(orgA, leaderA), organization(orgB, leaderB)]);
  });

  it("rejects conflicting active opportunities and reused IDs", () => {
    expect(
      generate({
        existingOpportunities: [
          opportunity("wrong", candidateA, orgA, locationA, tick, 388),
        ],
        candidateDefinitions: [definition(candidateA, locationA, 10, 288)],
      }).ok,
    ).toBe(false);
    expect(
      generate({
        existingOpportunities: [
          opportunity("a", candidateB, orgA, locationB, tick, 676),
        ],
        candidateDefinitions: [definition(candidateA, locationA, 10, 288)],
      }).ok,
    ).toBe(false);
    expect(
      generate({
        existingOpportunities: [
          opportunity("a", candidateA, orgA, locationA, tick, 388),
          opportunity("other", candidateA, orgA, locationA, tick, 388),
        ],
        candidateDefinitions: [definition(candidateA, locationA, 10, 288)],
      }).ok,
    ).toBe(false);
  });

  it("allows assigned but otherwise eligible candidates without mutating runtime collections", () => {
    const assigned = character(candidateA, { assignmentState: "assigned" });
    const characters = Object.freeze([assigned]);
    const organizations = Object.freeze([organization(orgA, leaderA)]);
    const beforeCharacters = JSON.stringify(characters);
    const beforeOrganizations = JSON.stringify(organizations);
    const result = generate({
      characters,
      organizations,
      candidateDefinitions: [definition(candidateA, locationA, 10, 288)],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.generatedOpportunities).toHaveLength(1);
    expect(JSON.stringify(characters)).toBe(beforeCharacters);
    expect(JSON.stringify(organizations)).toBe(beforeOrganizations);
  });
});

describe("recruitment opportunity expiration", () => {
  it("expires active opportunities at or after expiration and preserves other records", () => {
    const before = opportunity("before", candidateA, orgA, locationA, 10, 40);
    const at = opportunity("at", candidateB, orgA, locationB, 10, 30);
    const alreadyExpired = opportunity("expired", candidateA, orgA, locationA, 10, 20, "expired");
    const consumed = opportunity("consumed", candidateB, orgA, locationB, 10, 20, "consumed");
    const input = Object.freeze([before, at, alreadyExpired, consumed]);
    const snapshot = JSON.stringify(input);
    const result = expireRecruitmentOpportunities({
      currentTick: parseSimulationTick(30),
      opportunities: input,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.opportunities).toHaveLength(4);
    expect(result.value.opportunities[0]).toBe(before);
    expect(result.value.opportunities[1]).toMatchObject({ status: "expired" });
    expect(result.value.opportunities[2]).toBe(alreadyExpired);
    expect(result.value.opportunities[3]).toBe(consumed);
    expect(result.value.events).toHaveLength(1);
    expect(result.value.events[0]?.type).toBe(DomainEventType.RecruitmentOpportunityExpired);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

type RecruitmentOpportunityRejectionCase = readonly [
  string,
  Partial<Parameters<typeof generateRecruitmentOpportunities>[0]>,
  DomainErrorCode,
];

function generate(
  overrides: Partial<Parameters<typeof generateRecruitmentOpportunities>[0]> = {},
) {
  return generateRecruitmentOpportunities({
    currentTick: tick,
    targetOrganizationId: orgA,
    characters: Object.freeze([character(candidateA), character(candidateB)]),
    organizations: Object.freeze([organization(orgA, leaderA), organization(orgB, leaderB)]),
    locations: Object.freeze([location(locationA), location(locationB)]),
    existingOpportunities: Object.freeze([]),
    candidateDefinitions: Object.freeze([
      definition(candidateA, locationA, 10, 288),
      definition(candidateB, locationB, 25, 576),
    ]),
    opportunityIdsByCandidateId: {
      [candidateA]: opportunityId("a"),
      [candidateB]: opportunityId("b"),
    },
    ...overrides,
  });
}

function definition(
  candidateCharacterId: CharacterId,
  locationId: ReturnType<typeof parseLocationId>,
  recruitmentCost: number,
  opportunityDurationTicks: number,
): RecruitmentOpportunityCandidateDefinition {
  return Object.freeze({
    candidateCharacterId,
    locationId,
    recruitmentCost,
    minimumTrustRequirement: 10,
    maintenanceCostPreview: 5,
    opportunityDurationTicks,
  });
}

function character(
  characterId: CharacterId,
  overrides: Partial<Parameters<typeof createCharacterState>[0]> = {},
): CharacterState {
  return createCharacterState({
    characterId,
    displayName: String(characterId),
    capabilityTags: ["streetwise"],
    healthState: "healthy",
    legalState: "free",
    assignmentState: "idle",
    competence: 50,
    loyalty: 50,
    personalExposure: 10,
    ...overrides,
  });
}

function organization(
  organizationId: ReturnType<typeof parseOrganizationId>,
  leaderCharacterId: CharacterId,
  memberCharacterIds: readonly CharacterId[] = [leaderCharacterId],
): OrganizationState {
  return createOrganizationState({
    organizationId,
    displayName: String(organizationId),
    leaderCharacterId,
    memberCharacterIds,
    money: 100,
    operationalCapacity: 1,
  });
}

function location(locationId: ReturnType<typeof parseLocationId>): LocationState {
  return Object.freeze({
    locationId,
    enabled: true,
    ownerOrganizationId: null,
    businessId: null,
  });
}

function opportunity(
  suffix: string,
  candidateCharacterId: CharacterId,
  targetOrganizationId: ReturnType<typeof parseOrganizationId>,
  locationId: ReturnType<typeof parseLocationId>,
  createdAtTick: number,
  expiresAtTick: number,
  status: RecruitmentOpportunityState["status"] = RecruitmentOpportunityStatus.Active,
): RecruitmentOpportunityState {
  return createRecruitmentOpportunityState({
    recruitmentOpportunityId: opportunityId(suffix),
    candidateCharacterId,
    targetOrganizationId,
    locationId,
    createdAtTick: parseSimulationTick(createdAtTick),
    expiresAtTick: parseSimulationTick(expiresAtTick),
    status,
  });
}

function opportunityId(suffix: string) {
  return parseRecruitmentOpportunityId(`recruitment-opportunity:${suffix}`);
}
