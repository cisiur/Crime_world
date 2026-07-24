import { describe, expect, it } from "vitest";

import {
  canonicalMvpCrewUpkeepDefinition,
  canonicalMvpRecruitmentCandidateCharacterSeeds,
  canonicalMvpRecruitmentCandidateDefinitions,
  canonicalMvpCityDefinition,
} from "@crimeworld/content";
import {
  DomainEventType,
  MoneyTransactionCategory,
  MoneyTransactionSourceType,
  OrganizationMemberRole,
  RecruitmentOpportunityStatus,
  createCharacterState,
  createCityState,
  createOrganizationState,
  generateRecruitmentOpportunities,
  parseCharacterId,
  parseOrganizationId,
  parseRecruitmentOpportunityId,
  parseRecurringEconomyScheduleId,
  parseSimulationTick,
  parseTransactionId,
} from "@crimeworld/domain";
import type { MoneyTransaction, OrganizationMemberRoleAssignment } from "@crimeworld/domain";

import {
  assignLieutenantRoleRuntime,
  executeRecruitmentActionRuntime,
  finalizeRecruitedCrewGrowth,
} from "@crimeworld/application";

const definition = canonicalMvpRecruitmentCandidateDefinitions[0]!;
const seed = canonicalMvpRecruitmentCandidateCharacterSeeds[0]!;
const organizationId = parseOrganizationId("organization:growth_integration");
const leaderId = parseCharacterId("character:growth_integration_leader");
const opportunityId = parseRecruitmentOpportunityId("recruitment-opportunity:growth_vera");
const recruitmentTick = parseSimulationTick(10);
const firstDueTick = parseSimulationTick(154);
const upkeepScheduleId = parseRecurringEconomyScheduleId("recurring-schedule:growth:vera-upkeep");

describe("crew growth and role assignment integration", () => {
  it("connects recruitment to operator role, crew upkeep, and one lieutenant capacity increase", () => {
    const first = runFlow();
    const second = runFlow();

    expect(first).toEqual(second);
    expect(first.finalOrganization.memberCharacterIds).toContain(definition.candidateCharacterId);
    expect(first.consumedOpportunity.status).toBe(RecruitmentOpportunityStatus.Consumed);
    expect(first.recruitmentTransaction).toMatchObject({
      amount: -definition.recruitmentCost,
      category: MoneyTransactionCategory.RecruitmentCost,
    });
    expect(first.transactionsAfterGrowth).toEqual([first.recruitmentTransaction]);
    expect(first.operatorRole).toEqual({
      organizationId,
      characterId: definition.candidateCharacterId,
      role: OrganizationMemberRole.Operator,
    });
    expect(first.schedules).toHaveLength(1);
    expect(first.schedules[0]).toMatchObject({
      scheduleId: upkeepScheduleId,
      organizationId,
      amount: -canonicalMvpCrewUpkeepDefinition.amountPerCharacter,
      periodTicks: canonicalMvpCrewUpkeepDefinition.periodTicks,
      nextDueTick: firstDueTick,
      active: true,
    });
    expect(first.schedules[0]?.source).toEqual({
      type: MoneyTransactionSourceType.CrewUpkeep,
      characterId: definition.candidateCharacterId,
    });
    expect(first.finalOrganization.operationalCapacity).toBe(2);
    expect(first.combinedEventTypes).toEqual([
      DomainEventType.RecruitmentOpportunityGenerated,
      DomainEventType.OrganizationMoneyTransactionRecorded,
      DomainEventType.CharacterRecruited,
      DomainEventType.RecruitmentOpportunityConsumed,
      DomainEventType.OrganizationMemberRoleAssigned,
      DomainEventType.OrganizationMemberRoleAssigned,
      DomainEventType.OrganizationOperationalCapacityIncreased,
    ]);

    const repeatLieutenant = assignLieutenantRoleRuntime({
      organizationId,
      characterId: definition.candidateCharacterId,
      organizations: first.organizations,
      characters: first.characters,
      roleAssignments: first.roleAssignments,
    });
    expect(repeatLieutenant.ok).toBe(true);
    if (!repeatLieutenant.ok) throw new Error(repeatLieutenant.error.message);
    expect(repeatLieutenant.value.organization.operationalCapacity).toBe(2);
    expect(repeatLieutenant.value.events).toEqual([]);
  });
});

function runFlow() {
  const startingOrganization = createOrganizationState({
    organizationId,
    displayName: "Growth Integration Crew",
    leaderCharacterId: leaderId,
    memberCharacterIds: [leaderId],
    money: 100,
    operationalCapacity: 1,
  });
  const characters = Object.freeze([
    createCharacterState({
      characterId: leaderId,
      displayName: "Growth Integration Leader",
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
  const cityState = createCityState(canonicalMvpCityDefinition);
  const opportunityGeneration = generateRecruitmentOpportunities({
    currentTick: recruitmentTick,
    targetOrganizationId: organizationId,
    characters,
    organizations: Object.freeze([startingOrganization]),
    locations: cityState.locationStates,
    existingOpportunities: Object.freeze([]),
    candidateDefinitions: Object.freeze([definition]),
    opportunityIdsByCandidateId: Object.freeze({
      [definition.candidateCharacterId]: opportunityId,
    }),
  });
  expect(opportunityGeneration.ok).toBe(true);
  if (!opportunityGeneration.ok) throw new Error(opportunityGeneration.error.message);

  const recruitment = executeRecruitmentActionRuntime({
    currentTick: recruitmentTick,
    transactionId: parseTransactionId("transaction:growth_recruitment"),
    recruitmentOpportunityId: opportunityId,
    targetOrganizationId: organizationId,
    candidateCharacterId: definition.candidateCharacterId,
    currentTrust: definition.minimumTrustRequirement,
    definition,
    organizations: Object.freeze([startingOrganization]),
    characters,
    opportunities: opportunityGeneration.value.opportunities,
    transactions: Object.freeze([]),
  });
  expect(recruitment.ok).toBe(true);
  if (!recruitment.ok) throw new Error(recruitment.error.message);

  const growth = finalizeRecruitedCrewGrowth({
    organizationId,
    recruitedCharacterId: definition.candidateCharacterId,
    firstDueTick,
    upkeepScheduleId,
    organizations: recruitment.value.organizations,
    characters,
    roleAssignments: Object.freeze([] satisfies OrganizationMemberRoleAssignment[]),
    schedules: Object.freeze([]),
  });
  expect(growth.ok).toBe(true);
  if (!growth.ok) throw new Error(growth.error.message);

  const lieutenant = assignLieutenantRoleRuntime({
    organizationId,
    characterId: definition.candidateCharacterId,
    organizations: growth.value.organizations,
    characters,
    roleAssignments: growth.value.roleAssignments,
  });
  expect(lieutenant.ok).toBe(true);
  if (!lieutenant.ok) throw new Error(lieutenant.error.message);

  return {
    finalOrganization: lieutenant.value.organization,
    organizations: lieutenant.value.organizations,
    characters,
    consumedOpportunity: recruitment.value.opportunity,
    recruitmentTransaction: recruitment.value.transaction,
    transactionsAfterGrowth: recruitment.value.transactions as readonly MoneyTransaction[],
    operatorRole: growth.value.roleAssignment,
    roleAssignments: lieutenant.value.roleAssignments,
    schedules: growth.value.schedules,
    combinedEventTypes: [
      ...opportunityGeneration.value.events,
      ...recruitment.value.events,
      ...growth.value.events,
      ...lieutenant.value.events,
    ].map((event) => event.type),
  };
}
