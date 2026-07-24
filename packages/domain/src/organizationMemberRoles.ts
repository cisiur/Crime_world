import type { CharacterState } from "./characterState";
import {
  createOrganizationMemberRoleAssignedEvent,
  createOrganizationOperationalCapacityIncreasedEvent,
  type DomainEvent,
} from "./domainEvents";
import {
  DomainErrorCode,
  failure,
  success,
  type DomainError,
  type DomainResult,
} from "./domainResult";
import type { CharacterId, OrganizationId } from "./entityIds";
import { InvalidEntityIdError, parseCharacterId, parseOrganizationId } from "./entityIds";
import { createOrganizationState, type OrganizationState } from "./organizationState";

export const OrganizationMemberRole = {
  Boss: "boss",
  Operator: "operator",
  Lieutenant: "lieutenant",
} as const;

export type OrganizationMemberRole =
  (typeof OrganizationMemberRole)[keyof typeof OrganizationMemberRole];

export interface OrganizationRoleCapacityDefinition {
  readonly operatorCapacityContribution: 0;
  readonly lieutenantCapacityContribution: 1;
  readonly maximumLieutenantsPerOrganization: 1;
}

export interface OrganizationMemberRoleAssignment {
  readonly organizationId: OrganizationId;
  readonly characterId: CharacterId;
  readonly role: OrganizationMemberRole;
}

export interface CreateOrganizationMemberRoleAssignmentInput {
  readonly organizationId: OrganizationId;
  readonly characterId: CharacterId;
  readonly role: OrganizationMemberRole;
}

export interface AssignOrganizationMemberRoleInput {
  readonly organizationId: OrganizationId;
  readonly characterId: CharacterId;
  readonly role: OrganizationMemberRole;
  readonly organizations: readonly OrganizationState[];
  readonly characters: readonly CharacterState[];
  readonly roleAssignments: readonly OrganizationMemberRoleAssignment[];
  readonly definition: OrganizationRoleCapacityDefinition;
}

export interface AssignOrganizationMemberRoleSuccess {
  readonly organization: OrganizationState;
  readonly organizations: readonly OrganizationState[];
  readonly roleAssignment: OrganizationMemberRoleAssignment;
  readonly roleAssignments: readonly OrganizationMemberRoleAssignment[];
  readonly previousRole: OrganizationMemberRole | null;
  readonly events: readonly DomainEvent[];
}

export interface OrganizationMemberRoleAssignmentMissingOrganizationError extends DomainError {
  readonly code: typeof DomainErrorCode.OrganizationMemberRoleAssignmentMissingOrganization;
  readonly organizationId: OrganizationId;
}

export interface OrganizationMemberRoleAssignmentMissingCharacterError extends DomainError {
  readonly code: typeof DomainErrorCode.OrganizationMemberRoleAssignmentMissingCharacter;
  readonly characterId: CharacterId;
}

export interface OrganizationMemberRoleAssignmentNonMemberError extends DomainError {
  readonly code: typeof DomainErrorCode.OrganizationMemberRoleAssignmentNonMember;
  readonly organizationId: OrganizationId;
  readonly characterId: CharacterId;
}

export interface OrganizationMemberRoleAssignmentInvalidRoleError extends DomainError {
  readonly code: typeof DomainErrorCode.OrganizationMemberRoleAssignmentInvalidRole;
  readonly organizationId: OrganizationId;
  readonly characterId: CharacterId;
  readonly role: unknown;
  readonly reason:
    | "unsupported-role"
    | "boss-requires-leader"
    | "leader-requires-boss"
    | "lieutenant-requires-non-leader";
}

export interface OrganizationMemberRoleAssignmentDuplicateError extends DomainError {
  readonly code: typeof DomainErrorCode.OrganizationMemberRoleAssignmentDuplicate;
  readonly organizationId: OrganizationId;
  readonly characterId: CharacterId;
}

export interface OrganizationMemberRoleAssignmentInvalidExistingStateError extends DomainError {
  readonly code: typeof DomainErrorCode.OrganizationMemberRoleAssignmentInvalidExistingState;
  readonly organizationId?: OrganizationId;
  readonly characterId?: CharacterId;
  readonly reason:
    | "missing-organization"
    | "missing-character"
    | "non-member"
    | "unsupported-role"
    | "boss-not-leader"
    | "leader-not-boss"
    | "too-many-lieutenants";
}

export interface OrganizationMemberRoleAssignmentUnsupportedTransitionError extends DomainError {
  readonly code: typeof DomainErrorCode.OrganizationMemberRoleAssignmentUnsupportedTransition;
  readonly organizationId: OrganizationId;
  readonly characterId: CharacterId;
  readonly previousRole: OrganizationMemberRole | null;
  readonly requestedRole: OrganizationMemberRole;
}

export interface OrganizationMemberRoleAssignmentCapacityInvalidError extends DomainError {
  readonly code: typeof DomainErrorCode.OrganizationMemberRoleAssignmentCapacityInvalid;
  readonly organizationId: OrganizationId;
  readonly operationalCapacity: number;
  readonly reason: "not-safe-non-negative-integer" | "increment-overflow";
}

export interface OrganizationMemberRoleAssignmentInvalidDefinitionError extends DomainError {
  readonly code: typeof DomainErrorCode.OrganizationMemberRoleAssignmentInvalidDefinition;
  readonly field:
    | "operatorCapacityContribution"
    | "lieutenantCapacityContribution"
    | "maximumLieutenantsPerOrganization";
  readonly reason: string;
  readonly value: unknown;
}

export type OrganizationMemberRoleAssignmentError =
  | OrganizationMemberRoleAssignmentCapacityInvalidError
  | OrganizationMemberRoleAssignmentDuplicateError
  | OrganizationMemberRoleAssignmentInvalidDefinitionError
  | OrganizationMemberRoleAssignmentInvalidExistingStateError
  | OrganizationMemberRoleAssignmentInvalidRoleError
  | OrganizationMemberRoleAssignmentMissingCharacterError
  | OrganizationMemberRoleAssignmentMissingOrganizationError
  | OrganizationMemberRoleAssignmentNonMemberError
  | OrganizationMemberRoleAssignmentUnsupportedTransitionError;

export type AssignOrganizationMemberRoleResult = DomainResult<
  AssignOrganizationMemberRoleSuccess,
  OrganizationMemberRoleAssignmentError
>;

export function createOrganizationMemberRoleAssignment(
  input: CreateOrganizationMemberRoleAssignmentInput,
): OrganizationMemberRoleAssignment {
  const organizationId = parseOrganizationId(input.organizationId);
  const characterId = parseCharacterId(input.characterId);
  if (!isOrganizationMemberRole(input.role)) {
    throw new InvalidOrganizationMemberRoleAssignmentError(
      "role",
      `unsupported role "${String(input.role)}"`,
      input.role,
    );
  }

  return Object.freeze({
    organizationId,
    characterId,
    role: input.role,
  });
}

export type InvalidOrganizationMemberRoleAssignmentField =
  | "organizationId"
  | "characterId"
  | "role";

export class InvalidOrganizationMemberRoleAssignmentError extends Error {
  public constructor(
    public readonly field: InvalidOrganizationMemberRoleAssignmentField,
    public readonly reason: string,
    public readonly value: unknown,
  ) {
    super(`Invalid organization member role assignment field "${field}": ${reason}.`);
    this.name = "InvalidOrganizationMemberRoleAssignmentError";
  }
}

export function assignOrganizationMemberRole(
  input: AssignOrganizationMemberRoleInput,
): AssignOrganizationMemberRoleResult {
  const definitionResult = validateDefinition(input.definition);
  if (!definitionResult.ok) return definitionResult;

  const targetOrganization = input.organizations.find(
    (organization) => organization.organizationId === input.organizationId,
  );
  if (targetOrganization === undefined) {
    return failure({
      code: DomainErrorCode.OrganizationMemberRoleAssignmentMissingOrganization,
      message: `Organization "${input.organizationId}" was not found for role assignment.`,
      organizationId: input.organizationId,
    });
  }

  const capacityResult = validateOrganizationCapacity(targetOrganization);
  if (!capacityResult.ok) return capacityResult;

  const targetCharacter = input.characters.find(
    (character) => character.characterId === input.characterId,
  );
  if (targetCharacter === undefined) {
    return failure({
      code: DomainErrorCode.OrganizationMemberRoleAssignmentMissingCharacter,
      message: `Character "${input.characterId}" was not found for role assignment.`,
      characterId: input.characterId,
    });
  }

  if (!targetOrganization.memberCharacterIds.includes(targetCharacter.characterId)) {
    return failure({
      code: DomainErrorCode.OrganizationMemberRoleAssignmentNonMember,
      message: `Character "${input.characterId}" is not a member of organization "${input.organizationId}".`,
      organizationId: input.organizationId,
      characterId: input.characterId,
    });
  }

  const requestedRoleResult = validateRequestedRole(
    targetOrganization,
    targetCharacter.characterId,
    input.role,
  );
  if (!requestedRoleResult.ok) return requestedRoleResult;

  const existingStateResult = validateExistingAssignments(
    input.roleAssignments,
    input.organizations,
    input.characters,
    input.definition.maximumLieutenantsPerOrganization,
  );
  if (!existingStateResult.ok) return existingStateResult;

  const existingAssignment = input.roleAssignments.find(
    (assignment) =>
      assignment.organizationId === input.organizationId &&
      assignment.characterId === input.characterId,
  );
  const previousRole = existingAssignment?.role ?? null;

  if (previousRole === input.role) {
    if (existingAssignment === undefined) {
      return unsupportedTransition(
        input.organizationId,
        input.characterId,
        previousRole,
        input.role,
      );
    }

    return success(
      Object.freeze({
        organization: targetOrganization,
        organizations: Object.freeze([...input.organizations]),
        roleAssignment: existingAssignment,
        roleAssignments: Object.freeze([...input.roleAssignments]),
        previousRole,
        events: Object.freeze([] satisfies DomainEvent[]),
      }),
    );
  }

  const transitionResult = validateTransition(previousRole, input.role);
  if (!transitionResult.ok) {
    return unsupportedTransition(input.organizationId, input.characterId, previousRole, input.role);
  }

  if (input.role === OrganizationMemberRole.Lieutenant) {
    const currentLieutenant = input.roleAssignments.find(
      (assignment) =>
        assignment.organizationId === input.organizationId &&
        assignment.role === OrganizationMemberRole.Lieutenant,
    );
    if (currentLieutenant !== undefined && currentLieutenant.characterId !== input.characterId) {
      return unsupportedTransition(
        input.organizationId,
        input.characterId,
        previousRole,
        input.role,
      );
    }
  }

  const nextAssignment = createOrganizationMemberRoleAssignment({
    organizationId: input.organizationId,
    characterId: input.characterId,
    role: input.role,
  });
  const nextRoleAssignments =
    existingAssignment === undefined
      ? Object.freeze([...input.roleAssignments, nextAssignment])
      : Object.freeze(
          input.roleAssignments.map((assignment) =>
            assignment === existingAssignment ? nextAssignment : assignment,
          ),
        );

  const capacityIncrease =
    previousRole === OrganizationMemberRole.Operator &&
    input.role === OrganizationMemberRole.Lieutenant
      ? input.definition.lieutenantCapacityContribution
      : 0;
  const nextCapacity = targetOrganization.operationalCapacity + capacityIncrease;
  if (!Number.isSafeInteger(nextCapacity)) {
    return failure({
      code: DomainErrorCode.OrganizationMemberRoleAssignmentCapacityInvalid,
      message: `Operational capacity increase for organization "${input.organizationId}" would overflow.`,
      organizationId: input.organizationId,
      operationalCapacity: targetOrganization.operationalCapacity,
      reason: "increment-overflow",
    });
  }

  const nextOrganization =
    capacityIncrease === 0
      ? targetOrganization
      : createOrganizationState({
          ...targetOrganization,
          operationalCapacity: nextCapacity,
        });
  const nextOrganizations =
    capacityIncrease === 0
      ? Object.freeze([...input.organizations])
      : replaceById(
          input.organizations,
          "organizationId",
          nextOrganization.organizationId,
          nextOrganization,
        );
  const events: DomainEvent[] = [
    createOrganizationMemberRoleAssignedEvent({
      organizationId: input.organizationId,
      characterId: input.characterId,
      previousRole,
      assignedRole: input.role,
    }),
  ];

  if (capacityIncrease > 0) {
    events.push(
      createOrganizationOperationalCapacityIncreasedEvent({
        organizationId: input.organizationId,
        previousOperationalCapacity: targetOrganization.operationalCapacity,
        currentOperationalCapacity: nextOrganization.operationalCapacity,
        delta: capacityIncrease,
        sourceCharacterId: input.characterId,
      }),
    );
  }

  return success(
    Object.freeze({
      organization: nextOrganization,
      organizations: nextOrganizations,
      roleAssignment: nextAssignment,
      roleAssignments: nextRoleAssignments,
      previousRole,
      events: Object.freeze(events),
    }),
  );
}

export function isOrganizationMemberRole(value: unknown): value is OrganizationMemberRole {
  return (
    value === OrganizationMemberRole.Boss ||
    value === OrganizationMemberRole.Operator ||
    value === OrganizationMemberRole.Lieutenant
  );
}

function validateDefinition(
  definition: OrganizationRoleCapacityDefinition,
): DomainResult<undefined, OrganizationMemberRoleAssignmentInvalidDefinitionError> {
  if (definition.operatorCapacityContribution !== 0) {
    return invalidDefinition(
      "operatorCapacityContribution",
      "expected canonical value 0",
      definition.operatorCapacityContribution,
    );
  }
  if (definition.lieutenantCapacityContribution !== 1) {
    return invalidDefinition(
      "lieutenantCapacityContribution",
      "expected canonical value 1",
      definition.lieutenantCapacityContribution,
    );
  }
  if (definition.maximumLieutenantsPerOrganization !== 1) {
    return invalidDefinition(
      "maximumLieutenantsPerOrganization",
      "expected canonical value 1",
      definition.maximumLieutenantsPerOrganization,
    );
  }
  return success(undefined);
}

function validateOrganizationCapacity(
  organization: OrganizationState,
): DomainResult<undefined, OrganizationMemberRoleAssignmentCapacityInvalidError> {
  if (
    !Number.isFinite(organization.operationalCapacity) ||
    !Number.isSafeInteger(organization.operationalCapacity) ||
    organization.operationalCapacity < 0
  ) {
    return failure({
      code: DomainErrorCode.OrganizationMemberRoleAssignmentCapacityInvalid,
      message: `Organization "${organization.organizationId}" has invalid operational capacity.`,
      organizationId: organization.organizationId,
      operationalCapacity: organization.operationalCapacity,
      reason: "not-safe-non-negative-integer",
    });
  }
  return success(undefined);
}

function validateRequestedRole(
  organization: OrganizationState,
  characterId: CharacterId,
  role: OrganizationMemberRole,
): DomainResult<undefined, OrganizationMemberRoleAssignmentInvalidRoleError> {
  if (!isOrganizationMemberRole(role)) {
    return invalidRole(organization.organizationId, characterId, role, "unsupported-role");
  }

  const isLeader = organization.leaderCharacterId === characterId;
  if (role === OrganizationMemberRole.Boss && !isLeader) {
    return invalidRole(organization.organizationId, characterId, role, "boss-requires-leader");
  }
  if (role !== OrganizationMemberRole.Boss && isLeader) {
    return invalidRole(organization.organizationId, characterId, role, "leader-requires-boss");
  }
  if (role === OrganizationMemberRole.Lieutenant && isLeader) {
    return invalidRole(
      organization.organizationId,
      characterId,
      role,
      "lieutenant-requires-non-leader",
    );
  }
  return success(undefined);
}

function validateExistingAssignments(
  assignments: readonly OrganizationMemberRoleAssignment[],
  organizations: readonly OrganizationState[],
  characters: readonly CharacterState[],
  maximumLieutenantsPerOrganization: number,
): DomainResult<
  undefined,
  | OrganizationMemberRoleAssignmentDuplicateError
  | OrganizationMemberRoleAssignmentInvalidExistingStateError
> {
  const seenPairs = new Set<string>();
  const lieutenantCounts = new Map<OrganizationId, number>();

  for (const assignment of assignments) {
    let organizationId: OrganizationId;
    let characterId: CharacterId;
    try {
      organizationId = parseOrganizationId(assignment.organizationId);
      characterId = parseCharacterId(assignment.characterId);
    } catch (error) {
      return invalidExisting(
        "unsupported-role",
        error instanceof InvalidEntityIdError ? error.message : "assignment ID parser rejected",
      );
    }

    const pairKey = `${organizationId}\u0000${characterId}`;
    if (seenPairs.has(pairKey)) {
      return failure({
        code: DomainErrorCode.OrganizationMemberRoleAssignmentDuplicate,
        message: `Duplicate role assignments exist for character "${characterId}" in organization "${organizationId}".`,
        organizationId,
        characterId,
      });
    }
    seenPairs.add(pairKey);

    if (!isOrganizationMemberRole(assignment.role)) {
      return invalidExisting("unsupported-role", "existing assignment has unsupported role", {
        organizationId,
        characterId,
      });
    }

    const organization = organizations.find(
      (candidate) => candidate.organizationId === organizationId,
    );
    if (organization === undefined) {
      return invalidExisting(
        "missing-organization",
        "existing assignment references missing organization",
        {
          organizationId,
          characterId,
        },
      );
    }
    if (!characters.some((character) => character.characterId === characterId)) {
      return invalidExisting(
        "missing-character",
        "existing assignment references missing character",
        {
          organizationId,
          characterId,
        },
      );
    }
    if (!organization.memberCharacterIds.includes(characterId)) {
      return invalidExisting("non-member", "existing assignment references non-member", {
        organizationId,
        characterId,
      });
    }

    const isLeader = organization.leaderCharacterId === characterId;
    if (assignment.role === OrganizationMemberRole.Boss && !isLeader) {
      return invalidExisting("boss-not-leader", "boss assignment does not match leader", {
        organizationId,
        characterId,
      });
    }
    if (assignment.role !== OrganizationMemberRole.Boss && isLeader) {
      return invalidExisting("leader-not-boss", "leader assignment is not boss", {
        organizationId,
        characterId,
      });
    }
    if (assignment.role === OrganizationMemberRole.Lieutenant) {
      lieutenantCounts.set(organizationId, (lieutenantCounts.get(organizationId) ?? 0) + 1);
    }
  }

  for (const [organizationId, lieutenantCount] of lieutenantCounts) {
    if (lieutenantCount > maximumLieutenantsPerOrganization) {
      return invalidExisting("too-many-lieutenants", "organization has too many lieutenants", {
        organizationId,
      });
    }
  }

  return success(undefined);
}

function validateTransition(
  previousRole: OrganizationMemberRole | null,
  requestedRole: OrganizationMemberRole,
): DomainResult<undefined, OrganizationMemberRoleAssignmentUnsupportedTransitionError> {
  if (previousRole === null) {
    return requestedRole === OrganizationMemberRole.Operator ||
      requestedRole === OrganizationMemberRole.Boss
      ? success(undefined)
      : failure({} as OrganizationMemberRoleAssignmentUnsupportedTransitionError);
  }

  if (
    previousRole === OrganizationMemberRole.Operator &&
    requestedRole === OrganizationMemberRole.Lieutenant
  ) {
    return success(undefined);
  }

  return failure({} as OrganizationMemberRoleAssignmentUnsupportedTransitionError);
}

function unsupportedTransition(
  organizationId: OrganizationId,
  characterId: CharacterId,
  previousRole: OrganizationMemberRole | null,
  requestedRole: OrganizationMemberRole,
): AssignOrganizationMemberRoleResult {
  return failure({
    code: DomainErrorCode.OrganizationMemberRoleAssignmentUnsupportedTransition,
    message: `Unsupported organization member role transition from "${previousRole ?? "none"}" to "${requestedRole}".`,
    organizationId,
    characterId,
    previousRole,
    requestedRole,
  });
}

function invalidRole(
  organizationId: OrganizationId,
  characterId: CharacterId,
  role: unknown,
  reason: OrganizationMemberRoleAssignmentInvalidRoleError["reason"],
): DomainResult<never, OrganizationMemberRoleAssignmentInvalidRoleError> {
  return failure({
    code: DomainErrorCode.OrganizationMemberRoleAssignmentInvalidRole,
    message: `Role assignment for character "${characterId}" in organization "${organizationId}" is invalid: ${reason}.`,
    organizationId,
    characterId,
    role,
    reason,
  });
}

function invalidExisting(
  reason: OrganizationMemberRoleAssignmentInvalidExistingStateError["reason"],
  message: string,
  ids?: {
    readonly organizationId?: OrganizationId;
    readonly characterId?: CharacterId;
  },
): DomainResult<never, OrganizationMemberRoleAssignmentInvalidExistingStateError> {
  return failure({
    code: DomainErrorCode.OrganizationMemberRoleAssignmentInvalidExistingState,
    message: `Invalid existing organization member role assignment state: ${message}.`,
    ...(ids?.organizationId === undefined ? {} : { organizationId: ids.organizationId }),
    ...(ids?.characterId === undefined ? {} : { characterId: ids.characterId }),
    reason,
  });
}

function invalidDefinition(
  field: OrganizationMemberRoleAssignmentInvalidDefinitionError["field"],
  reason: string,
  value: unknown,
): DomainResult<undefined, OrganizationMemberRoleAssignmentInvalidDefinitionError> {
  return failure({
    code: DomainErrorCode.OrganizationMemberRoleAssignmentInvalidDefinition,
    message: `Organization role capacity definition field "${field}" is invalid: ${reason}.`,
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
