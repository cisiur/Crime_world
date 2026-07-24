import { describe, expect, it } from "vitest";

import {
  DomainErrorCode,
  DomainEventType,
  MoneyTransactionCategory,
  MoneyTransactionSourceType,
  RecruitmentOpportunityStatus,
  assertDomainEventInvariant,
  createCharacterState,
  createOrganizationState,
  createRecruitmentOpportunityState,
  executeRecruitmentAction,
  parseCharacterId,
  parseLocationId,
  parseOrganizationId,
  parseRecruitmentOpportunityId,
  parseSimulationTick,
  parseTransactionId,
  type CharacterId,
  type CharacterState,
  type OrganizationState,
  type RecruitmentActionDefinition,
  type RecruitmentOpportunityState,
} from "./index";

const organizationId = parseOrganizationId("organization:recruit_action");
const otherOrganizationId = parseOrganizationId("organization:other_recruit_action");
const leaderId = parseCharacterId("character:recruit_action_leader");
const otherLeaderId = parseCharacterId("character:other_recruit_action_leader");
const candidateId = parseCharacterId("character:recruit_action_candidate");
const otherCandidateId = parseCharacterId("character:recruit_action_other_candidate");
const opportunityId = parseRecruitmentOpportunityId("recruitment-opportunity:action");
const otherOpportunityId = parseRecruitmentOpportunityId("recruitment-opportunity:other_action");
const locationId = parseLocationId("location:corner_store");
const tick = parseSimulationTick(100);
const transactionId = parseTransactionId("transaction:recruit_action");

const definition: RecruitmentActionDefinition = Object.freeze({
  recruitmentCost: 60,
  minimumTrustRequirement: 35,
  maintenancePreview: 5,
});

describe("recruitment action", () => {
  it("records recruitment cost, appends membership, consumes the opportunity, and emits deterministic events", () => {
    const organizations = Object.freeze([
      organization(),
      organization(otherOrganizationId, otherLeaderId),
    ]);
    const characters = Object.freeze([
      character(leaderId),
      character(otherLeaderId),
      character(candidateId),
    ]);
    const opportunities = Object.freeze([opportunity()]);
    const result = execute({ organizations, characters, opportunities });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.events.map((event) => event.type)).toEqual([
      DomainEventType.OrganizationMoneyTransactionRecorded,
      DomainEventType.CharacterRecruited,
      DomainEventType.RecruitmentOpportunityConsumed,
    ]);
    result.value.events.forEach((event) =>
      expect(() => assertDomainEventInvariant(event)).not.toThrow(),
    );

    expect(result.value.transaction).toMatchObject({
      organizationId,
      amount: -60,
      balanceBefore: 100,
      balanceAfter: 40,
      category: MoneyTransactionCategory.RecruitmentCost,
      source: {
        type: MoneyTransactionSourceType.RecruitmentOpportunityCost,
        recruitmentOpportunityId: opportunityId,
        characterId: candidateId,
      },
    });
    expect(result.value.organization.memberCharacterIds).toEqual([leaderId, candidateId]);
    expect(result.value.organization.leaderCharacterId).toBe(leaderId);
    expect(result.value.organization.operationalCapacity).toBe(1);
    expect(result.value.organization.displayName).toBe("Recruit Action Crew");
    expect(result.value.opportunity.status).toBe(RecruitmentOpportunityStatus.Consumed);
    expect(result.value.opportunity.createdAtTick).toBe(parseSimulationTick(50));
    expect(result.value.opportunity.expiresAtTick).toBe(parseSimulationTick(150));
    expect(result.value.organizations[0]).toBe(result.value.organization);
    expect(result.value.organizations[1]).toBe(organizations[1]);
    expect(result.value.opportunities).toHaveLength(1);
    expect(result.value.transactions).toHaveLength(1);
  });

  const rejectionCases: readonly RecruitmentActionRejectionCase[] = [
    [
      "missing opportunity",
      { opportunities: [] },
      DomainErrorCode.RecruitmentActionMissingOpportunity,
    ],
    [
      "expired status",
      { opportunities: [opportunity({ status: RecruitmentOpportunityStatus.Expired })] },
      DomainErrorCode.RecruitmentActionOpportunityNotActive,
    ],
    [
      "consumed status",
      { opportunities: [opportunity({ status: RecruitmentOpportunityStatus.Consumed })] },
      DomainErrorCode.RecruitmentActionOpportunityNotActive,
    ],
    [
      "expired tick",
      { opportunities: [opportunity({ expiresAtTick: parseSimulationTick(100) })] },
      DomainErrorCode.RecruitmentActionOpportunityExpired,
    ],
    [
      "wrong organization",
      { opportunities: [opportunity({ targetOrganizationId: otherOrganizationId })] },
      DomainErrorCode.RecruitmentActionOpportunityMismatch,
    ],
    [
      "wrong candidate",
      { opportunities: [opportunity({ candidateCharacterId: otherCandidateId })] },
      DomainErrorCode.RecruitmentActionOpportunityMismatch,
    ],
    [
      "missing candidate",
      { characters: [character(leaderId)] },
      DomainErrorCode.RecruitmentActionMissingCandidate,
    ],
    [
      "missing organization",
      { organizations: [] },
      DomainErrorCode.RecruitmentActionMissingOrganization,
    ],
    [
      "already recruited",
      { organizations: [organization(organizationId, leaderId, [leaderId, candidateId])] },
      DomainErrorCode.RecruitmentActionIneligibleCandidate,
    ],
    [
      "other organization member",
      {
        organizations: [
          organization(),
          organization(otherOrganizationId, otherLeaderId, [otherLeaderId, candidateId]),
        ],
      },
      DomainErrorCode.RecruitmentActionIneligibleCandidate,
    ],
    [
      "dead candidate",
      { characters: [character(candidateId, { healthState: "dead" }), character(leaderId)] },
      DomainErrorCode.RecruitmentActionIneligibleCandidate,
    ],
    [
      "detained candidate",
      { characters: [character(candidateId, { legalState: "detained" }), character(leaderId)] },
      DomainErrorCode.RecruitmentActionIneligibleCandidate,
    ],
    [
      "imprisoned candidate",
      { characters: [character(candidateId, { legalState: "imprisoned" }), character(leaderId)] },
      DomainErrorCode.RecruitmentActionIneligibleCandidate,
    ],
    [
      "insufficient trust",
      { currentTrust: 34 },
      DomainErrorCode.RecruitmentActionInsufficientTrust,
    ],
    [
      "insufficient money",
      { organizations: [organization(organizationId, leaderId, [leaderId], 59)] },
      DomainErrorCode.MoneyTransactionInsufficientFunds,
    ],
    [
      "duplicate transaction id",
      {
        transactions: [
          {
            transactionId,
            organizationId,
            recordedAtTick: tick,
            amount: -1,
            balanceBefore: 100,
            balanceAfter: 99,
            category: MoneyTransactionCategory.RecruitmentCost,
            source: {
              type: MoneyTransactionSourceType.RecruitmentCharacterCost,
              characterId: candidateId,
            },
          },
        ],
      },
      DomainErrorCode.MoneyTransactionDuplicateTransactionId,
    ],
  ];

  it.each(rejectionCases)("rejects %s atomically", (_caseName, overrides, expectedCode) => {
    const organizations = Object.freeze(overrides.organizations ?? [organization()]);
    const characters = Object.freeze(
      overrides.characters ?? [character(leaderId), character(candidateId)],
    );
    const opportunities = Object.freeze(overrides.opportunities ?? [opportunity()]);
    const transactions = Object.freeze(overrides.transactions ?? []);
    const organizationSnapshot = JSON.stringify(organizations);
    const characterSnapshot = JSON.stringify(characters);
    const opportunitySnapshot = JSON.stringify(opportunities);
    const transactionSnapshot = JSON.stringify(transactions);
    const result = execute({
      ...overrides,
      organizations,
      characters,
      opportunities,
      transactions,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe(expectedCode);
    expect(JSON.stringify(organizations)).toBe(organizationSnapshot);
    expect(JSON.stringify(characters)).toBe(characterSnapshot);
    expect(JSON.stringify(opportunities)).toBe(opportunitySnapshot);
    expect(JSON.stringify(transactions)).toBe(transactionSnapshot);
  });

  it("preserves input collection order and appends the candidate exactly once", () => {
    const organizations = Object.freeze([
      organization(otherOrganizationId, otherLeaderId),
      organization(),
    ]);
    const opportunities = Object.freeze([
      opportunity({ recruitmentOpportunityId: otherOpportunityId }),
      opportunity(),
    ]);
    const result = execute({ organizations, opportunities });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.organizations.map((item) => item.organizationId)).toEqual([
      otherOrganizationId,
      organizationId,
    ]);
    expect(result.value.opportunities.map((item) => item.recruitmentOpportunityId)).toEqual([
      otherOpportunityId,
      opportunityId,
    ]);
    expect(
      result.value.organization.memberCharacterIds.filter((id) => id === candidateId),
    ).toHaveLength(1);
  });

  it("rejects invalid structural recruitment values before ledger effects", () => {
    const result = execute({ definition: { ...definition, recruitmentCost: 0 } });

    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.error.code).toBe(DomainErrorCode.RecruitmentActionInvalidDefinition);
  });
});

type RecruitmentActionRejectionCase = readonly [
  string,
  Partial<Parameters<typeof executeRecruitmentAction>[0]>,
  DomainErrorCode,
];

function execute(overrides: Partial<Parameters<typeof executeRecruitmentAction>[0]> = {}) {
  return executeRecruitmentAction({
    currentTick: tick,
    transactionId,
    recruitmentOpportunityId: opportunityId,
    targetOrganizationId: organizationId,
    candidateCharacterId: candidateId,
    currentTrust: 35,
    organizations: Object.freeze([organization()]),
    characters: Object.freeze([character(leaderId), character(candidateId)]),
    opportunities: Object.freeze([opportunity()]),
    transactions: Object.freeze([]),
    definition,
    ...overrides,
  });
}

function organization(
  id = organizationId,
  leaderCharacterId = leaderId,
  memberCharacterIds: readonly CharacterId[] = [leaderCharacterId],
  money = 100,
): OrganizationState {
  return createOrganizationState({
    organizationId: id,
    displayName: id === organizationId ? "Recruit Action Crew" : "Other Recruit Action Crew",
    leaderCharacterId,
    memberCharacterIds,
    money,
    operationalCapacity: 1,
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

function opportunity(
  overrides: Partial<Parameters<typeof createRecruitmentOpportunityState>[0]> = {},
): RecruitmentOpportunityState {
  return createRecruitmentOpportunityState({
    recruitmentOpportunityId: opportunityId,
    candidateCharacterId: candidateId,
    targetOrganizationId: organizationId,
    locationId,
    createdAtTick: parseSimulationTick(50),
    expiresAtTick: parseSimulationTick(150),
    status: RecruitmentOpportunityStatus.Active,
    ...overrides,
  });
}
