import {
  parseCharacterId,
  parseLocationId,
  type CharacterCapabilityTag,
  type CharacterId,
  type LocationId,
} from "@crimeworld/domain";

import type { LocationDefinition } from "./cityDefinition";

export type RecruitmentCandidateReliabilityProfile =
  | "experienced-unreliable"
  | "loyal-inexperienced"
  | "cheap-exposed"
  | "expensive-specialist";

export interface RecruitmentCandidateCharacterSeed {
  readonly characterId: CharacterId;
  readonly displayName: string;
  readonly capabilityTags: readonly CharacterCapabilityTag[];
  readonly healthState: "healthy";
  readonly legalState: "free";
  readonly assignmentState: "idle";
  readonly competence: number;
  readonly loyalty: number;
  readonly personalExposure: number;
}

export interface RecruitmentCandidateDefinition {
  readonly candidateCharacterId: CharacterId;
  readonly locationId: LocationId;
  readonly recruitmentCost: number;
  readonly minimumTrustRequirement: number;
  readonly maintenanceCostPreview: number;
  readonly opportunityDurationTicks: number;
  readonly reliabilityProfile: RecruitmentCandidateReliabilityProfile;
}

export type RecruitmentCandidateDefinitionValidationErrorCode =
  | "CANONICAL_COLLECTION_SIZE"
  | "DUPLICATE_CANDIDATE"
  | "MISSING_CHARACTER_SEED"
  | "MISSING_LOCATION"
  | "INVALID_COST"
  | "INVALID_TRUST_REQUIREMENT"
  | "INVALID_MAINTENANCE_PREVIEW"
  | "INVALID_DURATION"
  | "INVALID_RELIABILITY_PROFILE";

export interface RecruitmentCandidateDefinitionValidationError {
  readonly code: RecruitmentCandidateDefinitionValidationErrorCode;
  readonly candidateCharacterId?: string;
  readonly locationId?: string;
  readonly field?:
    | "recruitmentCost"
    | "minimumTrustRequirement"
    | "maintenanceCostPreview"
    | "opportunityDurationTicks"
    | "reliabilityProfile";
  readonly reason?: string;
  readonly message: string;
}

export interface RecruitmentCandidateDefinitionValidationResult {
  readonly valid: boolean;
  readonly errors: readonly RecruitmentCandidateDefinitionValidationError[];
}

const MIN_CANONICAL_RECRUITMENT_CANDIDATE_COUNT = 3;
const MAX_CANONICAL_RECRUITMENT_CANDIDATE_COUNT = 5;

const RELIABILITY_PROFILES = new Set<RecruitmentCandidateReliabilityProfile>([
  "experienced-unreliable",
  "loyal-inexperienced",
  "cheap-exposed",
  "expensive-specialist",
]);

export const canonicalMvpRecruitmentCandidateCharacterSeeds = Object.freeze([
  createRecruitmentCandidateCharacterSeed({
    characterId: parseCharacterId("character:recruit_vera_kade"),
    displayName: "Vera Kade",
    capabilityTags: ["streetwise", "force"],
    healthState: "healthy",
    legalState: "free",
    assignmentState: "idle",
    competence: 75,
    loyalty: 35,
    personalExposure: 30,
  }),
  createRecruitmentCandidateCharacterSeed({
    characterId: parseCharacterId("character:recruit_eli_navarro"),
    displayName: "Eli Navarro",
    capabilityTags: ["social"],
    healthState: "healthy",
    legalState: "free",
    assignmentState: "idle",
    competence: 35,
    loyalty: 80,
    personalExposure: 10,
  }),
  createRecruitmentCandidateCharacterSeed({
    characterId: parseCharacterId("character:recruit_nika_ross"),
    displayName: "Nika Ross",
    capabilityTags: ["stealth", "streetwise"],
    healthState: "healthy",
    legalState: "free",
    assignmentState: "idle",
    competence: 50,
    loyalty: 50,
    personalExposure: 65,
  }),
  createRecruitmentCandidateCharacterSeed({
    characterId: parseCharacterId("character:recruit_tomas_vek"),
    displayName: "Tomas Vek",
    capabilityTags: ["logistics", "social"],
    healthState: "healthy",
    legalState: "free",
    assignmentState: "idle",
    competence: 70,
    loyalty: 60,
    personalExposure: 15,
  }),
] as const satisfies readonly RecruitmentCandidateCharacterSeed[]);

export const canonicalMvpRecruitmentCandidateDefinitions = Object.freeze([
  createRecruitmentCandidateDefinition({
    candidateCharacterId: parseCharacterId("character:recruit_vera_kade"),
    locationId: parseLocationId("location:bar_district"),
    recruitmentCost: 60,
    minimumTrustRequirement: 35,
    maintenanceCostPreview: 5,
    opportunityDurationTicks: 432,
    reliabilityProfile: "experienced-unreliable",
  }),
  createRecruitmentCandidateDefinition({
    candidateCharacterId: parseCharacterId("character:recruit_eli_navarro"),
    locationId: parseLocationId("location:community_center"),
    recruitmentCost: 25,
    minimumTrustRequirement: 15,
    maintenanceCostPreview: 5,
    opportunityDurationTicks: 576,
    reliabilityProfile: "loyal-inexperienced",
  }),
  createRecruitmentCandidateDefinition({
    candidateCharacterId: parseCharacterId("character:recruit_nika_ross"),
    locationId: parseLocationId("location:corner_store"),
    recruitmentCost: 10,
    minimumTrustRequirement: 10,
    maintenanceCostPreview: 5,
    opportunityDurationTicks: 288,
    reliabilityProfile: "cheap-exposed",
  }),
  createRecruitmentCandidateDefinition({
    candidateCharacterId: parseCharacterId("character:recruit_tomas_vek"),
    locationId: parseLocationId("location:freight_terminal"),
    recruitmentCost: 90,
    minimumTrustRequirement: 45,
    maintenanceCostPreview: 5,
    opportunityDurationTicks: 720,
    reliabilityProfile: "expensive-specialist",
  }),
] as const satisfies readonly RecruitmentCandidateDefinition[]);

export function createRecruitmentCandidateCharacterSeed(
  input: RecruitmentCandidateCharacterSeed,
): RecruitmentCandidateCharacterSeed {
  return Object.freeze({
    characterId: input.characterId,
    displayName: input.displayName,
    capabilityTags: Object.freeze([...input.capabilityTags]),
    healthState: input.healthState,
    legalState: input.legalState,
    assignmentState: input.assignmentState,
    competence: input.competence,
    loyalty: input.loyalty,
    personalExposure: input.personalExposure,
  });
}

export function createRecruitmentCandidateDefinition(
  input: RecruitmentCandidateDefinition,
): RecruitmentCandidateDefinition {
  return Object.freeze({
    candidateCharacterId: input.candidateCharacterId,
    locationId: input.locationId,
    recruitmentCost: input.recruitmentCost,
    minimumTrustRequirement: input.minimumTrustRequirement,
    maintenanceCostPreview: input.maintenanceCostPreview,
    opportunityDurationTicks: input.opportunityDurationTicks,
    reliabilityProfile: input.reliabilityProfile,
  });
}

export function validateRecruitmentCandidateDefinitions(input: {
  readonly definitions: readonly RecruitmentCandidateDefinition[];
  readonly characterSeeds: readonly RecruitmentCandidateCharacterSeed[];
  readonly locations: readonly LocationDefinition[];
}): RecruitmentCandidateDefinitionValidationResult {
  const errors: RecruitmentCandidateDefinitionValidationError[] = [];

  if (
    input.definitions.length < MIN_CANONICAL_RECRUITMENT_CANDIDATE_COUNT ||
    input.definitions.length > MAX_CANONICAL_RECRUITMENT_CANDIDATE_COUNT
  ) {
    errors.push({
      code: "CANONICAL_COLLECTION_SIZE",
      message: `Canonical recruitment candidate definitions must contain between ${MIN_CANONICAL_RECRUITMENT_CANDIDATE_COUNT} and ${MAX_CANONICAL_RECRUITMENT_CANDIDATE_COUNT} entries.`,
    });
  }

  const seedIds = new Set(input.characterSeeds.map((seed) => seed.characterId));
  const locationIds = new Set(input.locations.map((location) => location.id));
  const seenCandidateIds = new Set<string>();

  for (const definition of input.definitions) {
    if (seenCandidateIds.has(definition.candidateCharacterId)) {
      errors.push({
        code: "DUPLICATE_CANDIDATE",
        candidateCharacterId: definition.candidateCharacterId,
        message: `Duplicate recruitment candidate definition for "${definition.candidateCharacterId}".`,
      });
    }
    seenCandidateIds.add(definition.candidateCharacterId);

    if (!seedIds.has(definition.candidateCharacterId)) {
      errors.push({
        code: "MISSING_CHARACTER_SEED",
        candidateCharacterId: definition.candidateCharacterId,
        message: `Recruitment candidate "${definition.candidateCharacterId}" does not have a concrete character seed.`,
      });
    }

    if (!locationIds.has(definition.locationId)) {
      errors.push({
        code: "MISSING_LOCATION",
        candidateCharacterId: definition.candidateCharacterId,
        locationId: definition.locationId,
        message: `Recruitment candidate "${definition.candidateCharacterId}" references missing location "${definition.locationId}".`,
      });
    }

    validatePositiveSafeInteger(
      "recruitmentCost",
      "INVALID_COST",
      definition.recruitmentCost,
      definition.candidateCharacterId,
      errors,
    );
    validateBoundedSafeInteger(
      "minimumTrustRequirement",
      "INVALID_TRUST_REQUIREMENT",
      definition.minimumTrustRequirement,
      definition.candidateCharacterId,
      errors,
    );
    validateNonNegativeSafeInteger(
      "maintenanceCostPreview",
      "INVALID_MAINTENANCE_PREVIEW",
      definition.maintenanceCostPreview,
      definition.candidateCharacterId,
      errors,
    );
    validatePositiveSafeInteger(
      "opportunityDurationTicks",
      "INVALID_DURATION",
      definition.opportunityDurationTicks,
      definition.candidateCharacterId,
      errors,
    );

    if (!RELIABILITY_PROFILES.has(definition.reliabilityProfile)) {
      errors.push({
        code: "INVALID_RELIABILITY_PROFILE",
        candidateCharacterId: definition.candidateCharacterId,
        field: "reliabilityProfile",
        reason: "unsupported",
        message: `Recruitment candidate "${definition.candidateCharacterId}" has unsupported reliability profile "${String(
          definition.reliabilityProfile,
        )}".`,
      });
    }
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors),
  });
}

function validatePositiveSafeInteger(
  field: "recruitmentCost" | "opportunityDurationTicks",
  code: "INVALID_COST" | "INVALID_DURATION",
  value: unknown,
  candidateCharacterId: CharacterId,
  errors: RecruitmentCandidateDefinitionValidationError[],
): void {
  const reason =
    getSafeIntegerFailureReason(value) ??
    (typeof value === "number" && value <= 0 ? "non-positive" : null);
  if (reason !== null) {
    addNumericError(code, field, value, candidateCharacterId, reason, errors);
  }
}

function validateNonNegativeSafeInteger(
  field: "maintenanceCostPreview",
  code: "INVALID_MAINTENANCE_PREVIEW",
  value: unknown,
  candidateCharacterId: CharacterId,
  errors: RecruitmentCandidateDefinitionValidationError[],
): void {
  const reason =
    getSafeIntegerFailureReason(value) ??
    (typeof value === "number" && value < 0 ? "negative" : null);
  if (reason !== null) {
    addNumericError(code, field, value, candidateCharacterId, reason, errors);
  }
}

function validateBoundedSafeInteger(
  field: "minimumTrustRequirement",
  code: "INVALID_TRUST_REQUIREMENT",
  value: unknown,
  candidateCharacterId: CharacterId,
  errors: RecruitmentCandidateDefinitionValidationError[],
): void {
  const reason =
    getSafeIntegerFailureReason(value) ??
    (typeof value === "number" && (value < 0 || value > 100) ? "out-of-range" : null);
  if (reason !== null) {
    addNumericError(code, field, value, candidateCharacterId, reason, errors);
  }
}

function addNumericError(
  code: RecruitmentCandidateDefinitionValidationErrorCode,
  field: NonNullable<RecruitmentCandidateDefinitionValidationError["field"]>,
  value: unknown,
  candidateCharacterId: CharacterId,
  reason: string,
  errors: RecruitmentCandidateDefinitionValidationError[],
): void {
  errors.push({
    code,
    candidateCharacterId,
    field,
    reason,
    message: `Recruitment candidate "${candidateCharacterId}" has invalid ${field}: ${reason}.`,
  });
}

function getSafeIntegerFailureReason(value: unknown): string | null {
  if (typeof value !== "number") {
    return "non-number";
  }

  if (!Number.isFinite(value)) {
    return "non-finite";
  }

  if (!Number.isInteger(value)) {
    return "non-integer";
  }

  if (!Number.isSafeInteger(value)) {
    return "unsafe-integer";
  }

  return null;
}
