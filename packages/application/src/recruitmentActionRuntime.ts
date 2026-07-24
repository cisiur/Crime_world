import type { RecruitmentCandidateDefinition } from "@crimeworld/content";
import {
  DomainErrorCode,
  executeRecruitmentAction,
  failure,
  type CharacterId,
  type CharacterState,
  type DomainError,
  type DomainEvent,
  type DomainResult,
  type ExecuteRecruitmentActionError,
  type MoneyTransaction,
  type OrganizationId,
  type OrganizationState,
  type RecruitmentOpportunityId,
  type RecruitmentOpportunityState,
  type SimulationTick,
  type TransactionId,
} from "@crimeworld/domain";

export interface ExecuteRecruitmentActionRuntimeInput {
  readonly currentTick: SimulationTick;
  readonly transactionId: TransactionId;
  readonly recruitmentOpportunityId: RecruitmentOpportunityId;
  readonly targetOrganizationId: OrganizationId;
  readonly candidateCharacterId: CharacterId;
  readonly currentTrust: number;
  readonly definition: RecruitmentCandidateDefinition;
  readonly organizations: readonly OrganizationState[];
  readonly characters: readonly CharacterState[];
  readonly opportunities: readonly RecruitmentOpportunityState[];
  readonly transactions: readonly MoneyTransaction[];
}

export interface ExecuteRecruitmentActionRuntimeSuccess {
  readonly organization: OrganizationState;
  readonly opportunity: RecruitmentOpportunityState;
  readonly transaction: MoneyTransaction;
  readonly organizations: readonly OrganizationState[];
  readonly opportunities: readonly RecruitmentOpportunityState[];
  readonly transactions: readonly MoneyTransaction[];
  readonly events: readonly DomainEvent[];
}

export interface RecruitmentActionRuntimeDefinitionMismatchError extends DomainError {
  readonly code: typeof DomainErrorCode.RecruitmentActionRuntimeDefinitionMismatch;
  readonly recruitmentOpportunityId: RecruitmentOpportunityId;
  readonly candidateCharacterId: CharacterId;
  readonly field: "candidateCharacterId" | "opportunityCandidateCharacterId" | "locationId";
}

export type ExecuteRecruitmentActionRuntimeError =
  | ExecuteRecruitmentActionError
  | RecruitmentActionRuntimeDefinitionMismatchError;

export type ExecuteRecruitmentActionRuntimeResult = DomainResult<
  ExecuteRecruitmentActionRuntimeSuccess,
  ExecuteRecruitmentActionRuntimeError
>;

export function executeRecruitmentActionRuntime(
  input: ExecuteRecruitmentActionRuntimeInput,
): ExecuteRecruitmentActionRuntimeResult {
  if (input.definition.candidateCharacterId !== input.candidateCharacterId) {
    return definitionMismatch(input, "candidateCharacterId");
  }

  const opportunity = input.opportunities.find(
    (candidate) => candidate.recruitmentOpportunityId === input.recruitmentOpportunityId,
  );
  if (
    opportunity !== undefined &&
    opportunity.candidateCharacterId !== input.definition.candidateCharacterId
  ) {
    return definitionMismatch(input, "opportunityCandidateCharacterId");
  }

  if (opportunity !== undefined && opportunity.locationId !== input.definition.locationId) {
    return definitionMismatch(input, "locationId");
  }

  return executeRecruitmentAction({
    currentTick: input.currentTick,
    transactionId: input.transactionId,
    recruitmentOpportunityId: input.recruitmentOpportunityId,
    targetOrganizationId: input.targetOrganizationId,
    candidateCharacterId: input.candidateCharacterId,
    currentTrust: input.currentTrust,
    organizations: input.organizations,
    characters: input.characters,
    opportunities: input.opportunities,
    transactions: input.transactions,
    definition: {
      recruitmentCost: input.definition.recruitmentCost,
      minimumTrustRequirement: input.definition.minimumTrustRequirement,
      maintenancePreview: input.definition.maintenanceCostPreview,
    },
  });
}

function definitionMismatch(
  input: ExecuteRecruitmentActionRuntimeInput,
  field: RecruitmentActionRuntimeDefinitionMismatchError["field"],
): ExecuteRecruitmentActionRuntimeResult {
  return failure({
    code: DomainErrorCode.RecruitmentActionRuntimeDefinitionMismatch,
    message: `Recruitment action runtime definition mismatch for field "${field}".`,
    recruitmentOpportunityId: input.recruitmentOpportunityId,
    candidateCharacterId: input.candidateCharacterId,
    field,
  });
}
