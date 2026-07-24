import type { CharacterState } from "./characterState";
import {
  createCharacterRecruitedEvent,
  createRecruitmentOpportunityConsumedEvent,
  type DomainEvent,
} from "./domainEvents";
import {
  DomainErrorCode,
  failure,
  success,
  type DomainError,
  type DomainResult,
} from "./domainResult";
import type {
  CharacterId,
  OrganizationId,
  RecruitmentOpportunityId,
  TransactionId,
} from "./entityIds";
import {
  MoneyTransactionCategory,
  MoneyTransactionSourceType,
  recordMoneyTransaction,
  type MoneyTransaction,
  type MoneyTransactionError,
} from "./moneyLedger";
import { createOrganizationState, type OrganizationState } from "./organizationState";
import {
  createRecruitmentOpportunityState,
  RecruitmentOpportunityStatus,
  type RecruitmentOpportunityState,
} from "./recruitmentOpportunityState";
import { parseSimulationTick, type SimulationTick } from "./simulationClock";

export interface RecruitmentActionDefinition {
  readonly recruitmentCost: number;
  readonly minimumTrustRequirement: number;
  readonly maintenancePreview: number;
}

export interface ExecuteRecruitmentActionInput {
  readonly currentTick: SimulationTick;
  readonly transactionId: TransactionId;
  readonly recruitmentOpportunityId: RecruitmentOpportunityId;
  readonly targetOrganizationId: OrganizationId;
  readonly candidateCharacterId: CharacterId;
  readonly currentTrust: number;
  readonly organizations: readonly OrganizationState[];
  readonly characters: readonly CharacterState[];
  readonly opportunities: readonly RecruitmentOpportunityState[];
  readonly transactions: readonly MoneyTransaction[];
  readonly definition: RecruitmentActionDefinition;
}

export interface ExecuteRecruitmentActionSuccess {
  readonly organization: OrganizationState;
  readonly opportunity: RecruitmentOpportunityState;
  readonly transaction: MoneyTransaction;
  readonly organizations: readonly OrganizationState[];
  readonly opportunities: readonly RecruitmentOpportunityState[];
  readonly transactions: readonly MoneyTransaction[];
  readonly events: readonly DomainEvent[];
}

export interface RecruitmentActionInvalidCurrentTickError extends DomainError {
  readonly code: typeof DomainErrorCode.RecruitmentActionInvalidCurrentTick;
  readonly reason: string;
  readonly value: unknown;
}

export interface RecruitmentActionInvalidDefinitionError extends DomainError {
  readonly code: typeof DomainErrorCode.RecruitmentActionInvalidDefinition;
  readonly field: "recruitmentCost" | "minimumTrustRequirement" | "maintenancePreview";
  readonly reason: string;
  readonly value: unknown;
}

export interface RecruitmentActionMissingOpportunityError extends DomainError {
  readonly code: typeof DomainErrorCode.RecruitmentActionMissingOpportunity;
  readonly recruitmentOpportunityId: RecruitmentOpportunityId;
}

export interface RecruitmentActionOpportunityNotActiveError extends DomainError {
  readonly code: typeof DomainErrorCode.RecruitmentActionOpportunityNotActive;
  readonly recruitmentOpportunityId: RecruitmentOpportunityId;
  readonly status: RecruitmentOpportunityState["status"];
}

export interface RecruitmentActionOpportunityExpiredError extends DomainError {
  readonly code: typeof DomainErrorCode.RecruitmentActionOpportunityExpired;
  readonly recruitmentOpportunityId: RecruitmentOpportunityId;
  readonly currentTick: SimulationTick;
  readonly expiresAtTick: SimulationTick;
}

export interface RecruitmentActionOpportunityMismatchError extends DomainError {
  readonly code: typeof DomainErrorCode.RecruitmentActionOpportunityMismatch;
  readonly recruitmentOpportunityId: RecruitmentOpportunityId;
  readonly field: "targetOrganizationId" | "candidateCharacterId";
}

export interface RecruitmentActionMissingCandidateError extends DomainError {
  readonly code: typeof DomainErrorCode.RecruitmentActionMissingCandidate;
  readonly candidateCharacterId: CharacterId;
}

export interface RecruitmentActionMissingOrganizationError extends DomainError {
  readonly code: typeof DomainErrorCode.RecruitmentActionMissingOrganization;
  readonly organizationId: OrganizationId;
}

export interface RecruitmentActionIneligibleCandidateError extends DomainError {
  readonly code: typeof DomainErrorCode.RecruitmentActionIneligibleCandidate;
  readonly candidateCharacterId: CharacterId;
  readonly reason:
    | "target-organization-member"
    | "other-organization-member"
    | "dead"
    | "detained"
    | "imprisoned";
}

export interface RecruitmentActionInsufficientTrustError extends DomainError {
  readonly code: typeof DomainErrorCode.RecruitmentActionInsufficientTrust;
  readonly currentTrust: number;
  readonly minimumTrustRequirement: number;
}

export type ExecuteRecruitmentActionError =
  | MoneyTransactionError
  | RecruitmentActionIneligibleCandidateError
  | RecruitmentActionInsufficientTrustError
  | RecruitmentActionInvalidCurrentTickError
  | RecruitmentActionInvalidDefinitionError
  | RecruitmentActionMissingCandidateError
  | RecruitmentActionMissingOpportunityError
  | RecruitmentActionMissingOrganizationError
  | RecruitmentActionOpportunityExpiredError
  | RecruitmentActionOpportunityMismatchError
  | RecruitmentActionOpportunityNotActiveError;

export type ExecuteRecruitmentActionResult = DomainResult<
  ExecuteRecruitmentActionSuccess,
  ExecuteRecruitmentActionError
>;

export function executeRecruitmentAction(
  input: ExecuteRecruitmentActionInput,
): ExecuteRecruitmentActionResult {
  const currentTickResult = validateCurrentTick(input.currentTick);
  if (!currentTickResult.ok) return currentTickResult;

  const definitionResult = validateDefinition(input.definition);
  if (!definitionResult.ok) return definitionResult;

  if (input.currentTrust < input.definition.minimumTrustRequirement) {
    return failure({
      code: DomainErrorCode.RecruitmentActionInsufficientTrust,
      message: `Recruitment trust ${input.currentTrust} is below required trust ${input.definition.minimumTrustRequirement}.`,
      currentTrust: input.currentTrust,
      minimumTrustRequirement: input.definition.minimumTrustRequirement,
    });
  }

  const opportunity = input.opportunities.find(
    (candidate) => candidate.recruitmentOpportunityId === input.recruitmentOpportunityId,
  );
  if (opportunity === undefined) {
    return failure({
      code: DomainErrorCode.RecruitmentActionMissingOpportunity,
      message: `Recruitment opportunity "${input.recruitmentOpportunityId}" was not found.`,
      recruitmentOpportunityId: input.recruitmentOpportunityId,
    });
  }

  if (opportunity.status !== RecruitmentOpportunityStatus.Active) {
    return failure({
      code: DomainErrorCode.RecruitmentActionOpportunityNotActive,
      message: `Recruitment opportunity "${opportunity.recruitmentOpportunityId}" is not active.`,
      recruitmentOpportunityId: opportunity.recruitmentOpportunityId,
      status: opportunity.status,
    });
  }

  if (input.currentTick >= opportunity.expiresAtTick) {
    return failure({
      code: DomainErrorCode.RecruitmentActionOpportunityExpired,
      message: `Recruitment opportunity "${opportunity.recruitmentOpportunityId}" is expired at tick ${input.currentTick}.`,
      recruitmentOpportunityId: opportunity.recruitmentOpportunityId,
      currentTick: input.currentTick,
      expiresAtTick: opportunity.expiresAtTick,
    });
  }

  if (opportunity.targetOrganizationId !== input.targetOrganizationId) {
    return opportunityMismatch(opportunity.recruitmentOpportunityId, "targetOrganizationId");
  }

  if (opportunity.candidateCharacterId !== input.candidateCharacterId) {
    return opportunityMismatch(opportunity.recruitmentOpportunityId, "candidateCharacterId");
  }

  const organization = input.organizations.find(
    (candidate) => candidate.organizationId === input.targetOrganizationId,
  );
  if (organization === undefined) {
    return failure({
      code: DomainErrorCode.RecruitmentActionMissingOrganization,
      message: `Organization "${input.targetOrganizationId}" was not found for recruitment.`,
      organizationId: input.targetOrganizationId,
    });
  }

  const candidate = input.characters.find(
    (character) => character.characterId === input.candidateCharacterId,
  );
  if (candidate === undefined) {
    return failure({
      code: DomainErrorCode.RecruitmentActionMissingCandidate,
      message: `Candidate character "${input.candidateCharacterId}" was not found for recruitment.`,
      candidateCharacterId: input.candidateCharacterId,
    });
  }

  const eligibilityResult = validateCandidateEligibility(
    candidate,
    input.targetOrganizationId,
    input.organizations,
  );
  if (!eligibilityResult.ok) return eligibilityResult;

  const ledgerResult = recordMoneyTransaction({
    transactionId: input.transactionId,
    organizationId: input.targetOrganizationId,
    recordedAtTick: input.currentTick,
    amount: -input.definition.recruitmentCost,
    category: MoneyTransactionCategory.RecruitmentCost,
    source: {
      type: MoneyTransactionSourceType.RecruitmentOpportunityCost,
      recruitmentOpportunityId: input.recruitmentOpportunityId,
      characterId: input.candidateCharacterId,
    },
    organizations: input.organizations,
    transactions: input.transactions,
  });
  if (!ledgerResult.ok) {
    return ledgerResult;
  }

  const paidOrganization = ledgerResult.value.organization;
  const recruitedOrganization = createOrganizationState({
    ...paidOrganization,
    memberCharacterIds: [...paidOrganization.memberCharacterIds, input.candidateCharacterId],
  });
  const organizations = replaceById(
    ledgerResult.value.organizations,
    "organizationId",
    recruitedOrganization.organizationId,
    recruitedOrganization,
  );
  const consumedOpportunity = createRecruitmentOpportunityState({
    ...opportunity,
    status: RecruitmentOpportunityStatus.Consumed,
  });
  const opportunities = replaceById(
    input.opportunities,
    "recruitmentOpportunityId",
    consumedOpportunity.recruitmentOpportunityId,
    consumedOpportunity,
  );
  const events = Object.freeze([
    ...ledgerResult.value.events,
    createCharacterRecruitedEvent({
      candidateCharacterId: input.candidateCharacterId,
      organizationId: input.targetOrganizationId,
      recruitmentOpportunityId: input.recruitmentOpportunityId,
      recruitmentCost: input.definition.recruitmentCost,
      recruitedAtTick: input.currentTick,
    }),
    createRecruitmentOpportunityConsumedEvent({
      recruitmentOpportunityId: input.recruitmentOpportunityId,
      candidateCharacterId: input.candidateCharacterId,
      targetOrganizationId: input.targetOrganizationId,
      consumedAtTick: input.currentTick,
    }),
  ]);

  return success(
    Object.freeze({
      organization: recruitedOrganization,
      opportunity: consumedOpportunity,
      transaction: ledgerResult.value.transaction,
      organizations,
      opportunities,
      transactions: ledgerResult.value.transactions,
      events,
    }),
  );
}

function validateCandidateEligibility(
  candidate: CharacterState,
  targetOrganizationId: OrganizationId,
  organizations: readonly OrganizationState[],
): DomainResult<undefined, RecruitmentActionIneligibleCandidateError> {
  for (const organization of organizations) {
    if (!organization.memberCharacterIds.includes(candidate.characterId)) {
      continue;
    }

    return ineligible(
      candidate.characterId,
      organization.organizationId === targetOrganizationId
        ? "target-organization-member"
        : "other-organization-member",
    );
  }

  if (candidate.healthState === "dead") return ineligible(candidate.characterId, "dead");
  if (candidate.legalState === "detained") return ineligible(candidate.characterId, "detained");
  if (candidate.legalState === "imprisoned") {
    return ineligible(candidate.characterId, "imprisoned");
  }

  return success(undefined);
}

function validateCurrentTick(
  currentTick: SimulationTick,
): DomainResult<undefined, RecruitmentActionInvalidCurrentTickError> {
  try {
    parseSimulationTick(currentTick);
  } catch (error) {
    return failure({
      code: DomainErrorCode.RecruitmentActionInvalidCurrentTick,
      message: "Recruitment action current tick is invalid.",
      reason: error instanceof Error ? error.message : "simulation tick parser rejected",
      value: currentTick,
    });
  }

  return success(undefined);
}

function validateDefinition(
  definition: RecruitmentActionDefinition,
): DomainResult<undefined, RecruitmentActionInvalidDefinitionError> {
  const costResult = validatePositiveSafeInteger("recruitmentCost", definition.recruitmentCost);
  if (!costResult.ok) return costResult;

  const trustResult = validateBoundedSafeInteger(
    "minimumTrustRequirement",
    definition.minimumTrustRequirement,
  );
  if (!trustResult.ok) return trustResult;

  return validateNonNegativeSafeInteger("maintenancePreview", definition.maintenancePreview);
}

function validatePositiveSafeInteger(
  field: "recruitmentCost",
  value: unknown,
): DomainResult<undefined, RecruitmentActionInvalidDefinitionError> {
  const result = validateSafeInteger(field, value);
  if (!result.ok) return result;

  if (typeof value === "number" && value <= 0) {
    return invalidDefinition(field, "expected a positive value", value);
  }

  return success(undefined);
}

function validateNonNegativeSafeInteger(
  field: "maintenancePreview",
  value: unknown,
): DomainResult<undefined, RecruitmentActionInvalidDefinitionError> {
  const result = validateSafeInteger(field, value);
  if (!result.ok) return result;

  if (typeof value === "number" && value < 0) {
    return invalidDefinition(field, "expected a non-negative value", value);
  }

  return success(undefined);
}

function validateBoundedSafeInteger(
  field: "minimumTrustRequirement",
  value: unknown,
): DomainResult<undefined, RecruitmentActionInvalidDefinitionError> {
  const result = validateSafeInteger(field, value);
  if (!result.ok) return result;

  if (typeof value === "number" && (value < 0 || value > 100)) {
    return invalidDefinition(field, "expected a value between 0 and 100", value);
  }

  return success(undefined);
}

function validateSafeInteger(
  field: RecruitmentActionInvalidDefinitionError["field"],
  value: unknown,
): DomainResult<undefined, RecruitmentActionInvalidDefinitionError> {
  if (typeof value !== "number") {
    return invalidDefinition(
      field,
      `expected a number, received ${describeValueType(value)}`,
      value,
    );
  }

  if (!Number.isFinite(value)) {
    return invalidDefinition(field, "expected a finite number", value);
  }

  if (!Number.isSafeInteger(value)) {
    return invalidDefinition(field, "expected a safe integer", value);
  }

  return success(undefined);
}

function opportunityMismatch(
  recruitmentOpportunityId: RecruitmentOpportunityId,
  field: RecruitmentActionOpportunityMismatchError["field"],
): DomainResult<never, RecruitmentActionOpportunityMismatchError> {
  return failure({
    code: DomainErrorCode.RecruitmentActionOpportunityMismatch,
    message: `Recruitment opportunity "${recruitmentOpportunityId}" has mismatched field "${field}".`,
    recruitmentOpportunityId,
    field,
  });
}

function ineligible(
  candidateCharacterId: CharacterId,
  reason: RecruitmentActionIneligibleCandidateError["reason"],
): DomainResult<never, RecruitmentActionIneligibleCandidateError> {
  return failure({
    code: DomainErrorCode.RecruitmentActionIneligibleCandidate,
    message: `Candidate character "${candidateCharacterId}" is ineligible for recruitment: ${reason}.`,
    candidateCharacterId,
    reason,
  });
}

function invalidDefinition<TValue = undefined>(
  field: RecruitmentActionInvalidDefinitionError["field"],
  reason: string,
  value: unknown,
): DomainResult<TValue, RecruitmentActionInvalidDefinitionError> {
  return failure({
    code: DomainErrorCode.RecruitmentActionInvalidDefinition,
    message: `Recruitment action definition field "${field}" is invalid: ${reason}.`,
    field,
    reason,
    value,
  });
}

function replaceById<TItem, TKey extends keyof TItem>(
  items: readonly TItem[],
  key: TKey,
  id: TItem[TKey],
  replacement: TItem,
): readonly TItem[] {
  return Object.freeze(items.map((item) => (item[key] === id ? replacement : item)));
}

function describeValueType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "an array";

  return `a ${typeof value}`;
}
