import { describe, expect, it } from "vitest";

import { canonicalMvpRecruitmentCandidateDefinitions } from "@crimeworld/content";
import {
  DomainErrorCode,
  DomainEventType,
  MoneyTransactionCategory,
  RecruitmentOpportunityStatus,
  createCharacterState,
  createOrganizationState,
  createRecruitmentOpportunityState,
  parseCharacterId,
  parseOrganizationId,
  parseRecruitmentOpportunityId,
  parseSimulationTick,
  parseTransactionId,
} from "@crimeworld/domain";

import { executeRecruitmentActionRuntime } from "./index";

const definition = canonicalMvpRecruitmentCandidateDefinitions[0]!;
const organizationId = parseOrganizationId("organization:runtime_recruit");
const leaderId = parseCharacterId("character:runtime_recruit_leader");
const opportunityId = parseRecruitmentOpportunityId("recruitment-opportunity:runtime_recruit");
const tick = parseSimulationTick(100);

describe("recruitment action runtime", () => {
  it("delegates one matching authored recruitment action and preserves event order", () => {
    const result = executeRuntime();

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.organization.memberCharacterIds).toEqual([
      leaderId,
      definition.candidateCharacterId,
    ]);
    expect(result.value.organization.operationalCapacity).toBe(1);
    expect(result.value.opportunity.status).toBe(RecruitmentOpportunityStatus.Consumed);
    expect(result.value.transaction.category).toBe(MoneyTransactionCategory.RecruitmentCost);
    expect(result.value.events.map((event) => event.type)).toEqual([
      DomainEventType.OrganizationMoneyTransactionRecorded,
      DomainEventType.CharacterRecruited,
      DomainEventType.RecruitmentOpportunityConsumed,
    ]);
  });

  it("rejects mismatched authored candidate atomically", () => {
    const organizations = Object.freeze([organization()]);
    const opportunities = Object.freeze([opportunity()]);
    const result = executeRuntime({
      definition: canonicalMvpRecruitmentCandidateDefinitions[1]!,
      organizations,
      opportunities,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.RecruitmentActionRuntimeDefinitionMismatch);
    }
    expect(organizations[0]!.memberCharacterIds).toEqual([leaderId]);
    expect(opportunities[0]!.status).toBe(RecruitmentOpportunityStatus.Active);
  });

  it("propagates domain failures without partial state", () => {
    const organizations = Object.freeze([organization(50)]);
    const opportunities = Object.freeze([opportunity()]);
    const result = executeRuntime({ organizations, opportunities });

    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.error.code).toBe(DomainErrorCode.MoneyTransactionInsufficientFunds);
    expect(organizations[0]!.money).toBe(50);
    expect(organizations[0]!.memberCharacterIds).toEqual([leaderId]);
    expect(opportunities[0]!.status).toBe(RecruitmentOpportunityStatus.Active);
  });
});

function executeRuntime(
  overrides: Partial<Parameters<typeof executeRecruitmentActionRuntime>[0]> = {},
) {
  return executeRecruitmentActionRuntime({
    currentTick: tick,
    transactionId: parseTransactionId("transaction:runtime_recruit"),
    recruitmentOpportunityId: opportunityId,
    targetOrganizationId: organizationId,
    candidateCharacterId: definition.candidateCharacterId,
    currentTrust: definition.minimumTrustRequirement,
    definition,
    organizations: Object.freeze([organization()]),
    characters: Object.freeze([
      createCharacterState({
        characterId: leaderId,
        displayName: "Runtime Recruit Leader",
        capabilityTags: ["streetwise"],
        healthState: "healthy",
        legalState: "free",
        assignmentState: "idle",
        competence: 50,
        loyalty: 50,
        personalExposure: 0,
      }),
      createCharacterState({
        characterId: definition.candidateCharacterId,
        displayName: "Runtime Recruit Candidate",
        capabilityTags: ["streetwise", "force"],
        healthState: "healthy",
        legalState: "free",
        assignmentState: "idle",
        competence: 75,
        loyalty: 35,
        personalExposure: 30,
      }),
    ]),
    opportunities: Object.freeze([opportunity()]),
    transactions: Object.freeze([]),
    ...overrides,
  });
}

function organization(money = 100) {
  return createOrganizationState({
    organizationId,
    displayName: "Runtime Recruit Crew",
    leaderCharacterId: leaderId,
    memberCharacterIds: [leaderId],
    money,
    operationalCapacity: 1,
  });
}

function opportunity() {
  return createRecruitmentOpportunityState({
    recruitmentOpportunityId: opportunityId,
    candidateCharacterId: definition.candidateCharacterId,
    targetOrganizationId: organizationId,
    locationId: definition.locationId,
    createdAtTick: parseSimulationTick(50),
    expiresAtTick: parseSimulationTick(150),
    status: RecruitmentOpportunityStatus.Active,
  });
}
