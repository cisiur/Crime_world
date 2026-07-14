import type { CharacterId, OrganizationId } from "./entityIds";

export interface OrganizationState {
  readonly organizationId: OrganizationId;
  readonly displayName: string;
  readonly leaderCharacterId: CharacterId;
  readonly memberCharacterIds: readonly CharacterId[];
  readonly money: number;
  readonly operationalCapacity: number;
}

export interface CreateOrganizationStateInput {
  readonly organizationId: OrganizationId;
  readonly displayName: string;
  readonly leaderCharacterId: CharacterId;
  readonly memberCharacterIds: readonly CharacterId[];
  readonly money: number;
  readonly operationalCapacity: number;
}

export interface CreatePlayerOrganizationInput {
  readonly organizationId: OrganizationId;
  readonly displayName: string;
  readonly leaderCharacterId: CharacterId;
  readonly money: number;
  readonly operationalCapacity: number;
}

export type InvalidOrganizationStateField =
  | "displayName"
  | "leaderCharacterId"
  | "memberCharacterIds"
  | "money"
  | "operationalCapacity";

export class InvalidOrganizationStateError extends Error {
  public constructor(
    public readonly field: InvalidOrganizationStateField,
    public readonly reason: string,
    public readonly value: unknown,
  ) {
    super(`Invalid organization state field "${field}": ${reason}.`);
    this.name = "InvalidOrganizationStateError";
  }
}

export function createOrganizationState(input: CreateOrganizationStateInput): OrganizationState {
  validateDisplayName(input.displayName);
  validateMemberCharacterIds(input.memberCharacterIds);
  validateLeaderMembership(input.leaderCharacterId, input.memberCharacterIds);
  validateNonNegativeInteger("money", input.money);
  validateNonNegativeInteger("operationalCapacity", input.operationalCapacity);

  return {
    organizationId: input.organizationId,
    displayName: input.displayName,
    leaderCharacterId: input.leaderCharacterId,
    memberCharacterIds: [...input.memberCharacterIds],
    money: input.money,
    operationalCapacity: input.operationalCapacity,
  };
}

export function createPlayerOrganization(input: CreatePlayerOrganizationInput): OrganizationState {
  return createOrganizationState({
    organizationId: input.organizationId,
    displayName: input.displayName,
    leaderCharacterId: input.leaderCharacterId,
    memberCharacterIds: [input.leaderCharacterId],
    money: input.money,
    operationalCapacity: input.operationalCapacity,
  });
}

function validateDisplayName(displayName: unknown): asserts displayName is string {
  if (typeof displayName !== "string") {
    throw new InvalidOrganizationStateError(
      "displayName",
      `expected a string, received ${describeValueType(displayName)}`,
      displayName,
    );
  }

  if (displayName.length === 0) {
    throw new InvalidOrganizationStateError(
      "displayName",
      "expected a non-empty string",
      displayName,
    );
  }

  if (displayName.trim().length === 0) {
    throw new InvalidOrganizationStateError(
      "displayName",
      "expected a name that is not only whitespace",
      displayName,
    );
  }

  if (displayName.trimStart() !== displayName) {
    throw new InvalidOrganizationStateError(
      "displayName",
      "expected no leading whitespace",
      displayName,
    );
  }

  if (displayName.trimEnd() !== displayName) {
    throw new InvalidOrganizationStateError(
      "displayName",
      "expected no trailing whitespace",
      displayName,
    );
  }
}

function validateMemberCharacterIds(
  memberCharacterIds: unknown,
): asserts memberCharacterIds is readonly CharacterId[] {
  if (!Array.isArray(memberCharacterIds)) {
    throw new InvalidOrganizationStateError(
      "memberCharacterIds",
      `expected an array, received ${describeValueType(memberCharacterIds)}`,
      memberCharacterIds,
    );
  }

  const seenMemberCharacterIds = new Set<CharacterId>();

  for (const memberCharacterId of memberCharacterIds) {
    if (typeof memberCharacterId !== "string") {
      throw new InvalidOrganizationStateError(
        "memberCharacterIds",
        `expected character IDs as strings, received ${describeValueType(memberCharacterId)}`,
        memberCharacterId,
      );
    }

    if (seenMemberCharacterIds.has(memberCharacterId as CharacterId)) {
      throw new InvalidOrganizationStateError(
        "memberCharacterIds",
        `duplicate member character id "${memberCharacterId}"`,
        memberCharacterId,
      );
    }

    seenMemberCharacterIds.add(memberCharacterId as CharacterId);
  }
}

function validateLeaderMembership(
  leaderCharacterId: unknown,
  memberCharacterIds: readonly CharacterId[],
): asserts leaderCharacterId is CharacterId {
  if (typeof leaderCharacterId !== "string") {
    throw new InvalidOrganizationStateError(
      "leaderCharacterId",
      `expected a character ID string, received ${describeValueType(leaderCharacterId)}`,
      leaderCharacterId,
    );
  }

  if (!memberCharacterIds.includes(leaderCharacterId as CharacterId)) {
    throw new InvalidOrganizationStateError(
      "leaderCharacterId",
      `expected leader "${leaderCharacterId}" to appear in memberCharacterIds`,
      leaderCharacterId,
    );
  }
}

function validateNonNegativeInteger(
  field: "money" | "operationalCapacity",
  value: unknown,
): asserts value is number {
  if (typeof value !== "number") {
    throw new InvalidOrganizationStateError(
      field,
      `expected a number, received ${describeValueType(value)}`,
      value,
    );
  }

  if (!Number.isFinite(value)) {
    throw new InvalidOrganizationStateError(field, "expected a finite number", value);
  }

  if (!Number.isInteger(value)) {
    throw new InvalidOrganizationStateError(field, "expected an integer", value);
  }

  if (value < 0) {
    throw new InvalidOrganizationStateError(field, "expected a non-negative value", value);
  }
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
