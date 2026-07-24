import { describe, expect, it } from "vitest";

import { canonicalMvpRecruitmentCandidateDefinitions } from "@crimeworld/content";
import {
  RecruitmentOpportunityStatus,
  createCharacterState,
  createRecruitmentOpportunityState,
  parseOrganizationId,
  parseRecruitmentOpportunityId,
  parseSimulationTick,
} from "@crimeworld/domain";

import { createRecruitmentOpportunityView } from "./index";

describe("recruitment opportunity read model", () => {
  it("projects current character values with authored recruitment values", () => {
    const definition = canonicalMvpRecruitmentCandidateDefinitions[0]!;
    const character = createCharacterState({
      characterId: definition.candidateCharacterId,
      displayName: "Current Vera",
      capabilityTags: ["streetwise", "force"],
      healthState: "healthy",
      legalState: "free",
      assignmentState: "assigned",
      competence: 76,
      loyalty: 34,
      personalExposure: 31,
    });
    const opportunity = createRecruitmentOpportunityState({
      recruitmentOpportunityId: parseRecruitmentOpportunityId("recruitment-opportunity:vera"),
      candidateCharacterId: definition.candidateCharacterId,
      targetOrganizationId: parseOrganizationId("organization:starter_crew"),
      locationId: definition.locationId,
      createdAtTick: parseSimulationTick(10),
      expiresAtTick: parseSimulationTick(442),
      status: RecruitmentOpportunityStatus.Active,
    });

    const result = createRecruitmentOpportunityView({ opportunity, character, definition });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value).toMatchObject({
      candidateDisplayName: "Current Vera",
      capabilityTags: ["streetwise", "force"],
      competence: 76,
      loyalty: 34,
      personalExposure: 31,
      recruitmentCost: 60,
      minimumTrustRequirement: 35,
      maintenanceCostPreview: 5,
      status: "active",
    });
    expect("displayName" in opportunity).toBe(false);
    expect("competence" in opportunity).toBe(false);
    expect(Object.isFrozen(result.value.capabilityTags)).toBe(true);
  });

  it("rejects mismatched opportunity, character, and authored definition", () => {
    const definition = canonicalMvpRecruitmentCandidateDefinitions[0]!;
    const otherDefinition = canonicalMvpRecruitmentCandidateDefinitions[1]!;
    const character = createCharacterState({
      characterId: definition.candidateCharacterId,
      displayName: "Current Vera",
      capabilityTags: ["streetwise"],
      healthState: "healthy",
      legalState: "free",
      assignmentState: "idle",
      competence: 75,
      loyalty: 35,
      personalExposure: 30,
    });
    const opportunity = createRecruitmentOpportunityState({
      recruitmentOpportunityId: parseRecruitmentOpportunityId("recruitment-opportunity:vera"),
      candidateCharacterId: definition.candidateCharacterId,
      targetOrganizationId: parseOrganizationId("organization:starter_crew"),
      locationId: definition.locationId,
      createdAtTick: parseSimulationTick(10),
      expiresAtTick: parseSimulationTick(442),
      status: RecruitmentOpportunityStatus.Active,
    });

    const result = createRecruitmentOpportunityView({
      opportunity,
      character,
      definition: otherDefinition,
    });

    expect(result.ok).toBe(false);
  });
});
