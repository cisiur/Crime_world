import type { RecruitmentCandidateDefinition } from "@crimeworld/content";
import {
  DomainErrorCode,
  failure,
  success,
  type CharacterCapabilityTag,
  type CharacterId,
  type CharacterState,
  type DomainError,
  type DomainResult,
  type LocationId,
  type RecruitmentOpportunityId,
  type RecruitmentOpportunityState,
  type RecruitmentOpportunityStatus,
} from "@crimeworld/domain";

export interface RecruitmentOpportunityView {
  readonly recruitmentOpportunityId: RecruitmentOpportunityId;
  readonly candidateCharacterId: CharacterId;
  readonly candidateDisplayName: string;
  readonly capabilityTags: readonly CharacterCapabilityTag[];
  readonly competence: number;
  readonly loyalty: number;
  readonly personalExposure: number;
  readonly recruitmentCost: number;
  readonly minimumTrustRequirement: number;
  readonly maintenanceCostPreview: number;
  readonly locationId: LocationId;
  readonly expiresAtTick: RecruitmentOpportunityState["expiresAtTick"];
  readonly status: RecruitmentOpportunityStatus;
}

export interface RecruitmentOpportunityProjectionMismatchError extends DomainError {
  readonly code: typeof DomainErrorCode.RecruitmentOpportunityGenerationInvalidDefinition;
  readonly reason:
    | "candidate-character-mismatch"
    | "definition-candidate-mismatch"
    | "definition-location-mismatch";
}

export type RecruitmentOpportunityProjectionResult = DomainResult<
  RecruitmentOpportunityView,
  RecruitmentOpportunityProjectionMismatchError
>;

export function createRecruitmentOpportunityView(input: {
  readonly opportunity: RecruitmentOpportunityState;
  readonly character: CharacterState;
  readonly definition: RecruitmentCandidateDefinition;
}): RecruitmentOpportunityProjectionResult {
  if (input.opportunity.candidateCharacterId !== input.character.characterId) {
    return projectionMismatch("candidate-character-mismatch");
  }

  if (input.opportunity.candidateCharacterId !== input.definition.candidateCharacterId) {
    return projectionMismatch("definition-candidate-mismatch");
  }

  if (input.opportunity.locationId !== input.definition.locationId) {
    return projectionMismatch("definition-location-mismatch");
  }

  return success(
    Object.freeze({
      recruitmentOpportunityId: input.opportunity.recruitmentOpportunityId,
      candidateCharacterId: input.character.characterId,
      candidateDisplayName: input.character.displayName,
      capabilityTags: Object.freeze([...input.character.capabilityTags]),
      competence: input.character.competence,
      loyalty: input.character.loyalty,
      personalExposure: input.character.personalExposure,
      recruitmentCost: input.definition.recruitmentCost,
      minimumTrustRequirement: input.definition.minimumTrustRequirement,
      maintenanceCostPreview: input.definition.maintenanceCostPreview,
      locationId: input.opportunity.locationId,
      expiresAtTick: input.opportunity.expiresAtTick,
      status: input.opportunity.status,
    }),
  );
}

function projectionMismatch(
  reason: RecruitmentOpportunityProjectionMismatchError["reason"],
): RecruitmentOpportunityProjectionResult {
  return failure({
    code: DomainErrorCode.RecruitmentOpportunityGenerationInvalidDefinition,
    message: `Recruitment opportunity projection mismatch: ${reason}.`,
    reason,
  });
}
