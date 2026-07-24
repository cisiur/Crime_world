import { describe, expect, it } from "vitest";

import {
  canonicalMvpCityDefinition,
  canonicalMvpRecruitmentCandidateCharacterSeeds,
  canonicalMvpRecruitmentCandidateDefinitions,
} from "@crimeworld/content";
import {
  RecruitmentOpportunityStatus,
  createCharacterState,
  createCityState,
  createOrganizationState,
  expireRecruitmentOpportunities,
  generateRecruitmentOpportunities,
  parseCharacterId,
  parseOrganizationId,
  parseRecruitmentOpportunityId,
  parseSimulationTick,
} from "@crimeworld/domain";

describe("recruitment opportunity generation integration", () => {
  it("generates concrete opportunities without recruitment execution side effects", () => {
    const targetOrganizationId = parseOrganizationId("organization:starter_crew");
    const leaderCharacterId = parseCharacterId("character:starter_boss");
    const city = createCityState(canonicalMvpCityDefinition);
    const definitions = canonicalMvpRecruitmentCandidateDefinitions.slice(0, 2);
    const characters = Object.freeze([
      createCharacterState({
        characterId: leaderCharacterId,
        displayName: "Starter Boss",
        capabilityTags: ["streetwise"],
        healthState: "healthy",
        legalState: "free",
        assignmentState: "idle",
        competence: 50,
        loyalty: 50,
        personalExposure: 0,
      }),
      ...canonicalMvpRecruitmentCandidateCharacterSeeds
        .slice(0, 2)
        .map((seed) => createCharacterState(seed)),
    ]);
    const organizations = Object.freeze([
      createOrganizationState({
        organizationId: targetOrganizationId,
        displayName: "Starter Crew",
        leaderCharacterId,
        memberCharacterIds: [leaderCharacterId],
        money: 100,
        operationalCapacity: 1,
      }),
    ]);
    const generation = generateRecruitmentOpportunities({
      currentTick: parseSimulationTick(100),
      targetOrganizationId,
      characters,
      organizations,
      locations: city.locationStates,
      existingOpportunities: Object.freeze([]),
      candidateDefinitions: definitions,
      opportunityIdsByCandidateId: {
        [definitions[0]!.candidateCharacterId]: parseRecruitmentOpportunityId(
          "recruitment-opportunity:integration_vera",
        ),
        [definitions[1]!.candidateCharacterId]: parseRecruitmentOpportunityId(
          "recruitment-opportunity:integration_eli",
        ),
      },
    });

    expect(generation.ok).toBe(true);
    if (!generation.ok) throw new Error(generation.error.message);
    expect(generation.value.generatedOpportunities).toHaveLength(2);
    expect(definitions.map((definition) => definition.reliabilityProfile)).toEqual([
      "experienced-unreliable",
      "loyal-inexperienced",
    ]);
    expect(organizations[0]!.memberCharacterIds).toEqual([leaderCharacterId]);
    expect(organizations[0]!.money).toBe(100);
    expect(generation.value.events).toHaveLength(2);

    const expiration = expireRecruitmentOpportunities({
      currentTick: generation.value.generatedOpportunities[0]!.expiresAtTick,
      opportunities: generation.value.opportunities,
    });

    expect(expiration.ok).toBe(true);
    if (!expiration.ok) throw new Error(expiration.error.message);
    expect(expiration.value.opportunities.map((opportunity) => opportunity.status)).toEqual([
      RecruitmentOpportunityStatus.Expired,
      RecruitmentOpportunityStatus.Active,
    ]);
    expect(expiration.value.events).toHaveLength(1);
    expect(organizations[0]!.memberCharacterIds).toEqual([leaderCharacterId]);
    expect(organizations[0]!.money).toBe(100);
    expect(generation.value.opportunities).not.toHaveProperty("transactions");
    expect(generation.value.opportunities).not.toHaveProperty("schedules");
  });
});
