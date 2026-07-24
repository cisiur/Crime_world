import { describe, expect, it } from "vitest";

import {
  canonicalMvpRecruitmentCandidateCharacterSeeds,
  canonicalMvpRecruitmentCandidateDefinitions,
} from "@crimeworld/content";
import {
  DomainEventType,
  MoneyTransactionCategory,
  RecruitmentOpportunityStatus,
  createCharacterState,
  createOrganizationState,
  createRecruitmentOpportunityState,
  executeRecruitmentAction,
  parseCharacterId,
  parseOrganizationId,
  parseRecruitmentOpportunityId,
  parseSimulationTick,
  parseTransactionId,
} from "@crimeworld/domain";

describe("recruitment action integration", () => {
  it("executes one active opportunity without role, capacity, or upkeep side effects", () => {
    const definition = canonicalMvpRecruitmentCandidateDefinitions[0]!;
    const seed = canonicalMvpRecruitmentCandidateCharacterSeeds[0]!;
    const organizationId = parseOrganizationId("organization:integration_recruit");
    const leaderId = parseCharacterId("character:integration_recruit_leader");
    const startingCapacity = 1;
    const organizations = Object.freeze([
      createOrganizationState({
        organizationId,
        displayName: "Integration Recruit Crew",
        leaderCharacterId: leaderId,
        memberCharacterIds: [leaderId],
        money: 100,
        operationalCapacity: startingCapacity,
      }),
    ]);
    const characters = Object.freeze([
      createCharacterState({
        characterId: leaderId,
        displayName: "Integration Recruit Leader",
        capabilityTags: ["streetwise"],
        healthState: "healthy",
        legalState: "free",
        assignmentState: "idle",
        competence: 50,
        loyalty: 50,
        personalExposure: 0,
      }),
      createCharacterState(seed),
    ]);
    const opportunity = createRecruitmentOpportunityState({
      recruitmentOpportunityId: parseRecruitmentOpportunityId(
        "recruitment-opportunity:integration_action",
      ),
      candidateCharacterId: definition.candidateCharacterId,
      targetOrganizationId: organizationId,
      locationId: definition.locationId,
      createdAtTick: parseSimulationTick(10),
      expiresAtTick: parseSimulationTick(442),
      status: RecruitmentOpportunityStatus.Active,
    });

    const result = executeRecruitmentAction({
      currentTick: parseSimulationTick(100),
      transactionId: parseTransactionId("transaction:integration_recruit"),
      recruitmentOpportunityId: opportunity.recruitmentOpportunityId,
      targetOrganizationId: organizationId,
      candidateCharacterId: definition.candidateCharacterId,
      currentTrust: definition.minimumTrustRequirement,
      organizations,
      characters,
      opportunities: Object.freeze([opportunity]),
      transactions: Object.freeze([]),
      definition: {
        recruitmentCost: definition.recruitmentCost,
        minimumTrustRequirement: definition.minimumTrustRequirement,
        maintenancePreview: definition.maintenanceCostPreview,
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.transactions).toHaveLength(1);
    expect(result.value.transactions[0]).toMatchObject({
      amount: -definition.recruitmentCost,
      category: MoneyTransactionCategory.RecruitmentCost,
    });
    expect(result.value.organization.memberCharacterIds).toEqual([
      leaderId,
      definition.candidateCharacterId,
    ]);
    expect(result.value.organization.operationalCapacity).toBe(startingCapacity);
    expect(result.value.opportunity.status).toBe(RecruitmentOpportunityStatus.Consumed);
    expect(result.value.events.map((event) => event.type)).toEqual([
      DomainEventType.OrganizationMoneyTransactionRecorded,
      DomainEventType.CharacterRecruited,
      DomainEventType.RecruitmentOpportunityConsumed,
    ]);
    expect(result.value).not.toHaveProperty("schedules");
    expect(result.value.organization).not.toHaveProperty("roleAssignments");
  });
});
