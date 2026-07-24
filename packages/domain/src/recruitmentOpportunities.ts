import type { CharacterState } from "./characterState";
import {
  createRecruitmentOpportunityExpiredEvent,
  createRecruitmentOpportunityGeneratedEvent,
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
  LocationId,
  OrganizationId,
  RecruitmentOpportunityId,
} from "./entityIds";
import { InvalidEntityIdError, parseRecruitmentOpportunityId } from "./entityIds";
import type { LocationState } from "./cityState";
import type { OrganizationState } from "./organizationState";
import {
  createRecruitmentOpportunityState,
  RecruitmentOpportunityStatus,
  type RecruitmentOpportunityState,
} from "./recruitmentOpportunityState";
import { parseSimulationTick, type SimulationTick } from "./simulationClock";

export interface RecruitmentOpportunityCandidateDefinition {
  readonly candidateCharacterId: CharacterId;
  readonly locationId: LocationId;
  readonly recruitmentCost: number;
  readonly minimumTrustRequirement: number;
  readonly maintenanceCostPreview: number;
  readonly opportunityDurationTicks: number;
}

export type RecruitmentOpportunityIdByCandidateId = Readonly<
  Record<string, RecruitmentOpportunityId>
>;

export interface GenerateRecruitmentOpportunitiesInput {
  readonly currentTick: SimulationTick;
  readonly targetOrganizationId: OrganizationId;
  readonly characters: readonly CharacterState[];
  readonly organizations: readonly OrganizationState[];
  readonly locations: readonly LocationState[];
  readonly existingOpportunities: readonly RecruitmentOpportunityState[];
  readonly candidateDefinitions: readonly RecruitmentOpportunityCandidateDefinition[];
  readonly opportunityIdsByCandidateId: RecruitmentOpportunityIdByCandidateId;
}

export interface GenerateRecruitmentOpportunitiesSuccess {
  readonly generatedOpportunities: readonly RecruitmentOpportunityState[];
  readonly reusedOpportunities: readonly RecruitmentOpportunityState[];
  readonly opportunities: readonly RecruitmentOpportunityState[];
  readonly events: readonly DomainEvent[];
}

export interface ExpireRecruitmentOpportunitiesInput {
  readonly currentTick: SimulationTick;
  readonly opportunities: readonly RecruitmentOpportunityState[];
}

export interface ExpireRecruitmentOpportunitiesSuccess {
  readonly expiredOpportunities: readonly RecruitmentOpportunityState[];
  readonly opportunities: readonly RecruitmentOpportunityState[];
  readonly events: readonly DomainEvent[];
}

export interface RecruitmentOpportunityGenerationInvalidDefinitionError extends DomainError {
  readonly code: typeof DomainErrorCode.RecruitmentOpportunityGenerationInvalidDefinition;
  readonly candidateCharacterId?: CharacterId;
  readonly field:
    | "candidateCharacterId"
    | "locationId"
    | "recruitmentCost"
    | "minimumTrustRequirement"
    | "maintenanceCostPreview"
    | "opportunityDurationTicks";
  readonly reason: string;
  readonly value: unknown;
}

export interface RecruitmentOpportunityGenerationInvalidCurrentTickError extends DomainError {
  readonly code: typeof DomainErrorCode.RecruitmentOpportunityGenerationInvalidCurrentTick;
  readonly reason: string;
  readonly value: unknown;
}

export interface RecruitmentOpportunityGenerationInvalidOpportunityIdError extends DomainError {
  readonly code: typeof DomainErrorCode.RecruitmentOpportunityGenerationInvalidOpportunityId;
  readonly candidateCharacterId: CharacterId;
  readonly reason: string;
  readonly value: unknown;
}

export interface RecruitmentOpportunityGenerationMissingCharacterError extends DomainError {
  readonly code: typeof DomainErrorCode.RecruitmentOpportunityGenerationMissingCharacter;
  readonly candidateCharacterId: CharacterId;
}

export interface RecruitmentOpportunityGenerationMissingLocationError extends DomainError {
  readonly code: typeof DomainErrorCode.RecruitmentOpportunityGenerationMissingLocation;
  readonly candidateCharacterId: CharacterId;
  readonly locationId: LocationId;
}

export interface RecruitmentOpportunityGenerationMissingOrganizationError extends DomainError {
  readonly code: typeof DomainErrorCode.RecruitmentOpportunityGenerationMissingOrganization;
  readonly organizationId: OrganizationId;
}

export interface RecruitmentOpportunityGenerationIneligibleCandidateError extends DomainError {
  readonly code: typeof DomainErrorCode.RecruitmentOpportunityGenerationIneligibleCandidate;
  readonly candidateCharacterId: CharacterId;
  readonly reason:
    | "target-organization-member"
    | "other-organization-member"
    | "dead"
    | "detained"
    | "imprisoned";
}

export interface RecruitmentOpportunityGenerationConflictError extends DomainError {
  readonly code: typeof DomainErrorCode.RecruitmentOpportunityGenerationConflict;
  readonly candidateCharacterId?: CharacterId;
  readonly recruitmentOpportunityId?: RecruitmentOpportunityId;
  readonly reason:
    | "duplicate-candidate-definition"
    | "duplicate-generated-opportunity-id"
    | "duplicate-existing-active-opportunity"
    | "expected-opportunity-id-used-by-another-record"
    | "matching-opportunity-incompatible";
}

export type RecruitmentOpportunityGenerationError =
  | RecruitmentOpportunityGenerationConflictError
  | RecruitmentOpportunityGenerationIneligibleCandidateError
  | RecruitmentOpportunityGenerationInvalidCurrentTickError
  | RecruitmentOpportunityGenerationInvalidDefinitionError
  | RecruitmentOpportunityGenerationInvalidOpportunityIdError
  | RecruitmentOpportunityGenerationMissingCharacterError
  | RecruitmentOpportunityGenerationMissingLocationError
  | RecruitmentOpportunityGenerationMissingOrganizationError;

export type GenerateRecruitmentOpportunitiesResult = DomainResult<
  GenerateRecruitmentOpportunitiesSuccess,
  RecruitmentOpportunityGenerationError
>;

export type ExpireRecruitmentOpportunitiesResult = DomainResult<
  ExpireRecruitmentOpportunitiesSuccess,
  RecruitmentOpportunityGenerationInvalidCurrentTickError
>;

export function generateRecruitmentOpportunities(
  input: GenerateRecruitmentOpportunitiesInput,
): GenerateRecruitmentOpportunitiesResult {
  const currentTickResult = validateCurrentTick(input.currentTick);
  if (!currentTickResult.ok) {
    return currentTickResult;
  }

  if (
    !input.organizations.some(
      (organization) => organization.organizationId === input.targetOrganizationId,
    )
  ) {
    return failure({
      code: DomainErrorCode.RecruitmentOpportunityGenerationMissingOrganization,
      message: `Organization "${input.targetOrganizationId}" was not found for recruitment opportunity generation.`,
      organizationId: input.targetOrganizationId,
    });
  }

  const definitionResult = validateCandidateDefinitions(input.candidateDefinitions);
  if (!definitionResult.ok) {
    return definitionResult;
  }

  const expectedOpportunityIds = new Map<CharacterId, RecruitmentOpportunityId>();
  const seenOpportunityIds = new Map<RecruitmentOpportunityId, CharacterId>();
  for (const definition of input.candidateDefinitions) {
    const opportunityIdResult = parseMappedOpportunityId(
      definition.candidateCharacterId,
      input.opportunityIdsByCandidateId,
    );
    if (!opportunityIdResult.ok) {
      return opportunityIdResult;
    }

    const existingCandidateId = seenOpportunityIds.get(opportunityIdResult.value);
    if (
      existingCandidateId !== undefined &&
      existingCandidateId !== definition.candidateCharacterId
    ) {
      return opportunityConflict({
        candidateCharacterId: definition.candidateCharacterId,
        recruitmentOpportunityId: opportunityIdResult.value,
        reason: "duplicate-generated-opportunity-id",
      });
    }

    expectedOpportunityIds.set(definition.candidateCharacterId, opportunityIdResult.value);
    seenOpportunityIds.set(opportunityIdResult.value, definition.candidateCharacterId);
  }

  for (const definition of input.candidateDefinitions) {
    const validation = validateDefinitionReferences(definition, input);
    if (!validation.ok) {
      return validation;
    }
  }

  const existingResult = classifyExistingOpportunities({
    currentTick: input.currentTick,
    targetOrganizationId: input.targetOrganizationId,
    existingOpportunities: input.existingOpportunities,
    candidateDefinitions: input.candidateDefinitions,
    expectedOpportunityIds,
  });
  if (!existingResult.ok) {
    return existingResult;
  }

  const generatedOpportunities: RecruitmentOpportunityState[] = [];
  const events: DomainEvent[] = [];
  for (const definition of input.candidateDefinitions) {
    if (existingResult.value.reusedByCandidateId.has(definition.candidateCharacterId)) {
      continue;
    }

    const opportunityId = expectedOpportunityIds.get(definition.candidateCharacterId);
    if (opportunityId === undefined) {
      return invalidOpportunityId(
        definition.candidateCharacterId,
        "missing opportunity ID mapping",
        undefined,
      );
    }

    const expiresAtTick = parseSimulationTick(
      input.currentTick + definition.opportunityDurationTicks,
    );
    const opportunity = createRecruitmentOpportunityState({
      recruitmentOpportunityId: opportunityId,
      candidateCharacterId: definition.candidateCharacterId,
      targetOrganizationId: input.targetOrganizationId,
      locationId: definition.locationId,
      createdAtTick: input.currentTick,
      expiresAtTick,
      status: RecruitmentOpportunityStatus.Active,
    });

    generatedOpportunities.push(opportunity);
    events.push(
      createRecruitmentOpportunityGeneratedEvent({
        recruitmentOpportunityId: opportunity.recruitmentOpportunityId,
        candidateCharacterId: opportunity.candidateCharacterId,
        targetOrganizationId: opportunity.targetOrganizationId,
        locationId: opportunity.locationId,
        createdAtTick: opportunity.createdAtTick,
        expiresAtTick: opportunity.expiresAtTick,
      }),
    );
  }

  return success(
    Object.freeze({
      generatedOpportunities: Object.freeze(generatedOpportunities),
      reusedOpportunities: Object.freeze(existingResult.value.reusedOpportunities),
      opportunities: Object.freeze([...input.existingOpportunities, ...generatedOpportunities]),
      events: Object.freeze(events),
    }),
  );
}

export function expireRecruitmentOpportunities(
  input: ExpireRecruitmentOpportunitiesInput,
): ExpireRecruitmentOpportunitiesResult {
  const currentTickResult = validateCurrentTick(input.currentTick);
  if (!currentTickResult.ok) {
    return currentTickResult;
  }

  const expiredOpportunities: RecruitmentOpportunityState[] = [];
  const events: DomainEvent[] = [];
  const opportunities = input.opportunities.map((opportunity) => {
    if (
      opportunity.status !== RecruitmentOpportunityStatus.Active ||
      input.currentTick < opportunity.expiresAtTick
    ) {
      return opportunity;
    }

    const expired = createRecruitmentOpportunityState({
      ...opportunity,
      status: RecruitmentOpportunityStatus.Expired,
    });
    expiredOpportunities.push(expired);
    events.push(
      createRecruitmentOpportunityExpiredEvent({
        recruitmentOpportunityId: expired.recruitmentOpportunityId,
        candidateCharacterId: expired.candidateCharacterId,
        targetOrganizationId: expired.targetOrganizationId,
        locationId: expired.locationId,
        expiredAtTick: input.currentTick,
      }),
    );
    return expired;
  });

  return success(
    Object.freeze({
      expiredOpportunities: Object.freeze(expiredOpportunities),
      opportunities: Object.freeze(opportunities),
      events: Object.freeze(events),
    }),
  );
}

function validateCandidateDefinitions(
  definitions: readonly RecruitmentOpportunityCandidateDefinition[],
): DomainResult<
  undefined,
  | RecruitmentOpportunityGenerationConflictError
  | RecruitmentOpportunityGenerationInvalidDefinitionError
> {
  const seenCandidateIds = new Set<CharacterId>();

  for (const definition of definitions) {
    if (seenCandidateIds.has(definition.candidateCharacterId)) {
      return opportunityConflict({
        candidateCharacterId: definition.candidateCharacterId,
        reason: "duplicate-candidate-definition",
      });
    }
    seenCandidateIds.add(definition.candidateCharacterId);

    const costResult = validatePositiveSafeInteger(
      "recruitmentCost",
      definition.recruitmentCost,
      definition.candidateCharacterId,
    );
    if (!costResult.ok) return costResult;

    const trustResult = validateBoundedSafeInteger(
      "minimumTrustRequirement",
      definition.minimumTrustRequirement,
      definition.candidateCharacterId,
    );
    if (!trustResult.ok) return trustResult;

    const maintenanceResult = validateNonNegativeSafeInteger(
      "maintenanceCostPreview",
      definition.maintenanceCostPreview,
      definition.candidateCharacterId,
    );
    if (!maintenanceResult.ok) return maintenanceResult;

    const durationResult = validatePositiveSafeInteger(
      "opportunityDurationTicks",
      definition.opportunityDurationTicks,
      definition.candidateCharacterId,
    );
    if (!durationResult.ok) return durationResult;
  }

  return success(undefined);
}

function validateDefinitionReferences(
  definition: RecruitmentOpportunityCandidateDefinition,
  input: GenerateRecruitmentOpportunitiesInput,
): DomainResult<
  undefined,
  | RecruitmentOpportunityGenerationIneligibleCandidateError
  | RecruitmentOpportunityGenerationMissingCharacterError
  | RecruitmentOpportunityGenerationMissingLocationError
> {
  const candidate = input.characters.find(
    (character) => character.characterId === definition.candidateCharacterId,
  );
  if (candidate === undefined) {
    return failure({
      code: DomainErrorCode.RecruitmentOpportunityGenerationMissingCharacter,
      message: `Candidate character "${definition.candidateCharacterId}" was not found for recruitment opportunity generation.`,
      candidateCharacterId: definition.candidateCharacterId,
    });
  }

  if (!input.locations.some((location) => location.locationId === definition.locationId)) {
    return failure({
      code: DomainErrorCode.RecruitmentOpportunityGenerationMissingLocation,
      message: `Location "${definition.locationId}" was not found for recruitment opportunity generation.`,
      candidateCharacterId: definition.candidateCharacterId,
      locationId: definition.locationId,
    });
  }

  for (const organization of input.organizations) {
    if (!organization.memberCharacterIds.includes(definition.candidateCharacterId)) {
      continue;
    }

    return failure({
      code: DomainErrorCode.RecruitmentOpportunityGenerationIneligibleCandidate,
      message: `Candidate character "${definition.candidateCharacterId}" is already a member of an organization.`,
      candidateCharacterId: definition.candidateCharacterId,
      reason:
        organization.organizationId === input.targetOrganizationId
          ? "target-organization-member"
          : "other-organization-member",
    });
  }

  if (candidate.healthState === "dead") {
    return ineligible(definition.candidateCharacterId, "dead");
  }

  if (candidate.legalState === "detained") {
    return ineligible(definition.candidateCharacterId, "detained");
  }

  if (candidate.legalState === "imprisoned") {
    return ineligible(definition.candidateCharacterId, "imprisoned");
  }

  return success(undefined);
}

function classifyExistingOpportunities(input: {
  readonly currentTick: SimulationTick;
  readonly targetOrganizationId: OrganizationId;
  readonly existingOpportunities: readonly RecruitmentOpportunityState[];
  readonly candidateDefinitions: readonly RecruitmentOpportunityCandidateDefinition[];
  readonly expectedOpportunityIds: ReadonlyMap<CharacterId, RecruitmentOpportunityId>;
}): DomainResult<
  {
    readonly reusedOpportunities: readonly RecruitmentOpportunityState[];
    readonly reusedByCandidateId: ReadonlySet<CharacterId>;
  },
  RecruitmentOpportunityGenerationConflictError
> {
  const reusedOpportunities: RecruitmentOpportunityState[] = [];
  const reusedByCandidateId = new Set<CharacterId>();

  for (const definition of input.candidateDefinitions) {
    const expectedOpportunityId = input.expectedOpportunityIds.get(definition.candidateCharacterId);
    const matchingOpportunities = input.existingOpportunities.filter(
      (opportunity) =>
        opportunity.status === RecruitmentOpportunityStatus.Active &&
        opportunity.candidateCharacterId === definition.candidateCharacterId &&
        opportunity.targetOrganizationId === input.targetOrganizationId,
    );

    if (matchingOpportunities.length > 1) {
      return opportunityConflict({
        candidateCharacterId: definition.candidateCharacterId,
        reason: "duplicate-existing-active-opportunity",
      });
    }

    const expectedIdOpportunity = input.existingOpportunities.find(
      (opportunity) => opportunity.recruitmentOpportunityId === expectedOpportunityId,
    );
    const existingMatch = matchingOpportunities[0];
    if (existingMatch !== undefined) {
      if (
        expectedOpportunityId === undefined ||
        !isExpectedRecruitmentOpportunity(existingMatch, definition, {
          targetOrganizationId: input.targetOrganizationId,
          opportunityId: expectedOpportunityId,
          currentTick: input.currentTick,
        })
      ) {
        return opportunityConflict({
          candidateCharacterId: definition.candidateCharacterId,
          recruitmentOpportunityId: existingMatch.recruitmentOpportunityId,
          reason: "matching-opportunity-incompatible",
        });
      }

      reusedOpportunities.push(existingMatch);
      reusedByCandidateId.add(definition.candidateCharacterId);
      continue;
    }

    if (expectedIdOpportunity !== undefined) {
      return opportunityConflict({
        candidateCharacterId: definition.candidateCharacterId,
        recruitmentOpportunityId: expectedIdOpportunity.recruitmentOpportunityId,
        reason: "expected-opportunity-id-used-by-another-record",
      });
    }
  }

  return success(
    Object.freeze({
      reusedOpportunities: Object.freeze(reusedOpportunities),
      reusedByCandidateId,
    }),
  );
}

function isExpectedRecruitmentOpportunity(
  opportunity: RecruitmentOpportunityState,
  definition: RecruitmentOpportunityCandidateDefinition,
  expected: {
    readonly targetOrganizationId: OrganizationId;
    readonly opportunityId: RecruitmentOpportunityId;
    readonly currentTick: SimulationTick;
  },
): boolean {
  return (
    opportunity.recruitmentOpportunityId === expected.opportunityId &&
    opportunity.candidateCharacterId === definition.candidateCharacterId &&
    opportunity.targetOrganizationId === expected.targetOrganizationId &&
    opportunity.locationId === definition.locationId &&
    opportunity.createdAtTick === expected.currentTick &&
    opportunity.expiresAtTick === expected.currentTick + definition.opportunityDurationTicks &&
    opportunity.status === RecruitmentOpportunityStatus.Active
  );
}

function parseMappedOpportunityId(
  candidateCharacterId: CharacterId,
  opportunityIdsByCandidateId: RecruitmentOpportunityIdByCandidateId,
): DomainResult<
  RecruitmentOpportunityId,
  RecruitmentOpportunityGenerationInvalidOpportunityIdError
> {
  const value = opportunityIdsByCandidateId[candidateCharacterId];
  try {
    return success(parseRecruitmentOpportunityId(value));
  } catch (error) {
    return invalidOpportunityId(
      candidateCharacterId,
      error instanceof InvalidEntityIdError
        ? error.reason
        : "recruitment opportunity ID parser rejected",
      value,
    );
  }
}

function validateCurrentTick(
  currentTick: SimulationTick,
): DomainResult<undefined, RecruitmentOpportunityGenerationInvalidCurrentTickError> {
  try {
    parseSimulationTick(currentTick);
  } catch (error) {
    return failure({
      code: DomainErrorCode.RecruitmentOpportunityGenerationInvalidCurrentTick,
      message: "Recruitment opportunity generation current tick is invalid.",
      reason: error instanceof Error ? error.message : "simulation tick parser rejected",
      value: currentTick,
    });
  }

  return success(undefined);
}

function validatePositiveSafeInteger(
  field: "recruitmentCost" | "opportunityDurationTicks",
  value: unknown,
  candidateCharacterId: CharacterId,
): DomainResult<undefined, RecruitmentOpportunityGenerationInvalidDefinitionError> {
  const result = validateSafeInteger(field, value, candidateCharacterId);
  if (!result.ok) return result;

  if (typeof value === "number" && value <= 0) {
    return invalidDefinition(field, "expected a positive value", value, candidateCharacterId);
  }

  return success(undefined);
}

function validateNonNegativeSafeInteger(
  field: "maintenanceCostPreview",
  value: unknown,
  candidateCharacterId: CharacterId,
): DomainResult<undefined, RecruitmentOpportunityGenerationInvalidDefinitionError> {
  const result = validateSafeInteger(field, value, candidateCharacterId);
  if (!result.ok) return result;

  if (typeof value === "number" && value < 0) {
    return invalidDefinition(field, "expected a non-negative value", value, candidateCharacterId);
  }

  return success(undefined);
}

function validateBoundedSafeInteger(
  field: "minimumTrustRequirement",
  value: unknown,
  candidateCharacterId: CharacterId,
): DomainResult<undefined, RecruitmentOpportunityGenerationInvalidDefinitionError> {
  const result = validateSafeInteger(field, value, candidateCharacterId);
  if (!result.ok) return result;

  if (typeof value === "number" && (value < 0 || value > 100)) {
    return invalidDefinition(
      field,
      "expected a value between 0 and 100",
      value,
      candidateCharacterId,
    );
  }

  return success(undefined);
}

function validateSafeInteger(
  field:
    | "recruitmentCost"
    | "minimumTrustRequirement"
    | "maintenanceCostPreview"
    | "opportunityDurationTicks",
  value: unknown,
  candidateCharacterId: CharacterId,
): DomainResult<undefined, RecruitmentOpportunityGenerationInvalidDefinitionError> {
  if (typeof value !== "number") {
    return invalidDefinition(
      field,
      `expected a number, received ${describeValueType(value)}`,
      value,
      candidateCharacterId,
    );
  }

  if (!Number.isFinite(value)) {
    return invalidDefinition(field, "expected a finite number", value, candidateCharacterId);
  }

  if (!Number.isSafeInteger(value)) {
    return invalidDefinition(field, "expected a safe integer", value, candidateCharacterId);
  }

  return success(undefined);
}

function ineligible(
  candidateCharacterId: CharacterId,
  reason: RecruitmentOpportunityGenerationIneligibleCandidateError["reason"],
): DomainResult<never, RecruitmentOpportunityGenerationIneligibleCandidateError> {
  return failure({
    code: DomainErrorCode.RecruitmentOpportunityGenerationIneligibleCandidate,
    message: `Candidate character "${candidateCharacterId}" is not eligible for recruitment opportunity generation: ${reason}.`,
    candidateCharacterId,
    reason,
  });
}

function invalidDefinition<TValue = undefined>(
  field: RecruitmentOpportunityGenerationInvalidDefinitionError["field"],
  reason: string,
  value: unknown,
  candidateCharacterId?: CharacterId,
): DomainResult<TValue, RecruitmentOpportunityGenerationInvalidDefinitionError> {
  return failure({
    code: DomainErrorCode.RecruitmentOpportunityGenerationInvalidDefinition,
    message: `Recruitment candidate definition field "${field}" is invalid: ${reason}.`,
    field,
    reason,
    value,
    ...(candidateCharacterId === undefined ? {} : { candidateCharacterId }),
  });
}

function invalidOpportunityId<TValue = never>(
  candidateCharacterId: CharacterId,
  reason: string,
  value: unknown,
): DomainResult<TValue, RecruitmentOpportunityGenerationInvalidOpportunityIdError> {
  return failure({
    code: DomainErrorCode.RecruitmentOpportunityGenerationInvalidOpportunityId,
    message: `Recruitment opportunity ID for candidate "${candidateCharacterId}" is invalid: ${reason}.`,
    candidateCharacterId,
    reason,
    value,
  });
}

function opportunityConflict(input: {
  readonly candidateCharacterId?: CharacterId;
  readonly recruitmentOpportunityId?: RecruitmentOpportunityId;
  readonly reason: RecruitmentOpportunityGenerationConflictError["reason"];
}): DomainResult<never, RecruitmentOpportunityGenerationConflictError> {
  return failure({
    code: DomainErrorCode.RecruitmentOpportunityGenerationConflict,
    message: `Recruitment opportunity generation conflict: ${input.reason}.`,
    ...(input.candidateCharacterId === undefined
      ? {}
      : { candidateCharacterId: input.candidateCharacterId }),
    ...(input.recruitmentOpportunityId === undefined
      ? {}
      : { recruitmentOpportunityId: input.recruitmentOpportunityId }),
    reason: input.reason,
  });
}

function describeValueType(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    return "an array";
  }

  return `a ${typeof value}`;
}
