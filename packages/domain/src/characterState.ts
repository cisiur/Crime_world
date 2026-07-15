import type { CharacterId } from "./entityIds";

export type CharacterCapabilityTag = "force" | "stealth" | "social" | "logistics" | "streetwise";

export type CharacterHealthState = "healthy" | "injured" | "critical" | "dead";

export type CharacterLegalState = "free" | "detained" | "imprisoned";

export type AssignmentState = "idle" | "assigned";

export interface CharacterState {
  readonly characterId: CharacterId;
  readonly displayName: string;
  readonly capabilityTags: readonly CharacterCapabilityTag[];
  readonly healthState: CharacterHealthState;
  readonly legalState: CharacterLegalState;
  readonly assignmentState: AssignmentState;
  readonly competence: number;
  readonly loyalty: number;
  readonly personalExposure: number;
}

export interface CreateCharacterStateInput {
  readonly characterId: CharacterId;
  readonly displayName: string;
  readonly capabilityTags: readonly CharacterCapabilityTag[];
  readonly healthState: CharacterHealthState;
  readonly legalState: CharacterLegalState;
  readonly assignmentState: AssignmentState;
  readonly competence: number;
  readonly loyalty: number;
  readonly personalExposure: number;
}

export type InvalidCharacterStateField =
  | "displayName"
  | "capabilityTags"
  | "healthState"
  | "legalState"
  | "assignmentState"
  | "competence"
  | "loyalty"
  | "personalExposure";

export class InvalidCharacterStateError extends Error {
  public constructor(
    public readonly field: InvalidCharacterStateField,
    public readonly reason: string,
    public readonly value: unknown,
  ) {
    super(`Invalid character state field "${field}": ${reason}.`);
    this.name = "InvalidCharacterStateError";
  }
}

const VALID_CHARACTER_CAPABILITY_TAGS = new Set<CharacterCapabilityTag>([
  "force",
  "stealth",
  "social",
  "logistics",
  "streetwise",
]);

const VALID_CHARACTER_HEALTH_STATES = new Set<CharacterHealthState>([
  "healthy",
  "injured",
  "critical",
  "dead",
]);

const VALID_CHARACTER_LEGAL_STATES = new Set<CharacterLegalState>([
  "free",
  "detained",
  "imprisoned",
]);

const VALID_ASSIGNMENT_STATES = new Set<AssignmentState>(["idle", "assigned"]);

const MIN_PERSONAL_EXPOSURE = 0;
const MAX_PERSONAL_EXPOSURE = 100;

export function createCharacterState(input: CreateCharacterStateInput): CharacterState {
  validateDisplayName(input.displayName);
  validateCapabilityTags(input.capabilityTags);
  validateHealthState(input.healthState);
  validateLegalState(input.legalState);
  validateAssignmentState(input.assignmentState);
  validateCompetence(input.competence);
  validateLoyalty(input.loyalty);
  validatePersonalExposure(input.personalExposure);

  return {
    characterId: input.characterId,
    displayName: input.displayName,
    capabilityTags: [...input.capabilityTags],
    healthState: input.healthState,
    legalState: input.legalState,
    assignmentState: input.assignmentState,
    competence: input.competence,
    loyalty: input.loyalty,
    personalExposure: input.personalExposure,
  };
}

export function isCharacterAvailable(character: CharacterState): boolean {
  return (
    character.healthState === "healthy" &&
    character.legalState === "free" &&
    character.assignmentState === "idle"
  );
}

function validateDisplayName(displayName: unknown): asserts displayName is string {
  if (typeof displayName !== "string") {
    throw new InvalidCharacterStateError(
      "displayName",
      `expected a string, received ${describeValueType(displayName)}`,
      displayName,
    );
  }

  if (displayName.length === 0) {
    throw new InvalidCharacterStateError("displayName", "expected a non-empty string", displayName);
  }

  if (displayName.trim().length === 0) {
    throw new InvalidCharacterStateError(
      "displayName",
      "expected a name that is not only whitespace",
      displayName,
    );
  }

  if (displayName.trimStart() !== displayName) {
    throw new InvalidCharacterStateError(
      "displayName",
      "expected no leading whitespace",
      displayName,
    );
  }

  if (displayName.trimEnd() !== displayName) {
    throw new InvalidCharacterStateError(
      "displayName",
      "expected no trailing whitespace",
      displayName,
    );
  }
}

function validateCapabilityTags(
  capabilityTags: unknown,
): asserts capabilityTags is readonly CharacterCapabilityTag[] {
  if (!Array.isArray(capabilityTags)) {
    throw new InvalidCharacterStateError(
      "capabilityTags",
      `expected an array, received ${describeValueType(capabilityTags)}`,
      capabilityTags,
    );
  }

  const seenCapabilityTags = new Set<CharacterCapabilityTag>();

  for (const capabilityTag of capabilityTags) {
    if (!isCharacterCapabilityTag(capabilityTag)) {
      throw new InvalidCharacterStateError(
        "capabilityTags",
        `unsupported capability tag "${String(capabilityTag)}"`,
        capabilityTag,
      );
    }

    if (seenCapabilityTags.has(capabilityTag)) {
      throw new InvalidCharacterStateError(
        "capabilityTags",
        `duplicate capability tag "${capabilityTag}"`,
        capabilityTag,
      );
    }

    seenCapabilityTags.add(capabilityTag);
  }
}

function validateHealthState(healthState: unknown): asserts healthState is CharacterHealthState {
  if (!isCharacterHealthState(healthState)) {
    throw new InvalidCharacterStateError(
      "healthState",
      `unsupported health state "${String(healthState)}"`,
      healthState,
    );
  }
}

function validateLegalState(legalState: unknown): asserts legalState is CharacterLegalState {
  if (!isCharacterLegalState(legalState)) {
    throw new InvalidCharacterStateError(
      "legalState",
      `unsupported legal state "${String(legalState)}"`,
      legalState,
    );
  }
}

function validateAssignmentState(
  assignmentState: unknown,
): asserts assignmentState is AssignmentState {
  if (!isAssignmentState(assignmentState)) {
    throw new InvalidCharacterStateError(
      "assignmentState",
      `unsupported assignment state "${String(assignmentState)}"`,
      assignmentState,
    );
  }
}

function validateCompetence(competence: unknown): asserts competence is number {
  if (typeof competence !== "number") {
    throw new InvalidCharacterStateError(
      "competence",
      `expected a number, received ${describeValueType(competence)}`,
      competence,
    );
  }

  if (!Number.isFinite(competence)) {
    throw new InvalidCharacterStateError("competence", "expected a finite number", competence);
  }

  if (!Number.isInteger(competence)) {
    throw new InvalidCharacterStateError("competence", "expected an integer", competence);
  }

  if (competence < MIN_PERSONAL_EXPOSURE || competence > MAX_PERSONAL_EXPOSURE) {
    throw new InvalidCharacterStateError(
      "competence",
      `expected a value between ${MIN_PERSONAL_EXPOSURE} and ${MAX_PERSONAL_EXPOSURE}`,
      competence,
    );
  }
}

function validateLoyalty(loyalty: unknown): asserts loyalty is number {
  if (typeof loyalty !== "number") {
    throw new InvalidCharacterStateError(
      "loyalty",
      `expected a number, received ${describeValueType(loyalty)}`,
      loyalty,
    );
  }

  if (!Number.isFinite(loyalty)) {
    throw new InvalidCharacterStateError("loyalty", "expected a finite number", loyalty);
  }

  if (!Number.isInteger(loyalty)) {
    throw new InvalidCharacterStateError("loyalty", "expected an integer", loyalty);
  }

  if (loyalty < MIN_PERSONAL_EXPOSURE || loyalty > MAX_PERSONAL_EXPOSURE) {
    throw new InvalidCharacterStateError(
      "loyalty",
      `expected a value between ${MIN_PERSONAL_EXPOSURE} and ${MAX_PERSONAL_EXPOSURE}`,
      loyalty,
    );
  }
}

function validatePersonalExposure(personalExposure: unknown): asserts personalExposure is number {
  if (typeof personalExposure !== "number") {
    throw new InvalidCharacterStateError(
      "personalExposure",
      `expected a number, received ${describeValueType(personalExposure)}`,
      personalExposure,
    );
  }

  if (!Number.isFinite(personalExposure)) {
    throw new InvalidCharacterStateError(
      "personalExposure",
      "expected a finite number",
      personalExposure,
    );
  }

  if (!Number.isInteger(personalExposure)) {
    throw new InvalidCharacterStateError(
      "personalExposure",
      "expected an integer",
      personalExposure,
    );
  }

  if (personalExposure < MIN_PERSONAL_EXPOSURE || personalExposure > MAX_PERSONAL_EXPOSURE) {
    throw new InvalidCharacterStateError(
      "personalExposure",
      `expected a value between ${MIN_PERSONAL_EXPOSURE} and ${MAX_PERSONAL_EXPOSURE}`,
      personalExposure,
    );
  }
}

function isCharacterCapabilityTag(value: unknown): value is CharacterCapabilityTag {
  return (
    typeof value === "string" &&
    VALID_CHARACTER_CAPABILITY_TAGS.has(value as CharacterCapabilityTag)
  );
}

function isCharacterHealthState(value: unknown): value is CharacterHealthState {
  return (
    typeof value === "string" && VALID_CHARACTER_HEALTH_STATES.has(value as CharacterHealthState)
  );
}

function isCharacterLegalState(value: unknown): value is CharacterLegalState {
  return (
    typeof value === "string" && VALID_CHARACTER_LEGAL_STATES.has(value as CharacterLegalState)
  );
}

function isAssignmentState(value: unknown): value is AssignmentState {
  return typeof value === "string" && VALID_ASSIGNMENT_STATES.has(value as AssignmentState);
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
