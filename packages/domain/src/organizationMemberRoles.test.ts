import { describe, expect, it } from "vitest";

import {
  DomainErrorCode,
  DomainEventType,
  OrganizationMemberRole,
  assertDomainEventInvariant,
  assignOrganizationMemberRole,
  createCharacterState,
  createOrganizationMemberRoleAssignment,
  createOrganizationState,
  parseCharacterId,
  parseOrganizationId,
  type CharacterId,
  type CharacterState,
  type OrganizationMemberRoleAssignment,
  type OrganizationRoleCapacityDefinition,
  type OrganizationState,
} from "./index";

const organizationId = parseOrganizationId("organization:roles");
const otherOrganizationId = parseOrganizationId("organization:roles_other");
const leaderId = parseCharacterId("character:roles_leader");
const memberAId = parseCharacterId("character:roles_member_a");
const memberBId = parseCharacterId("character:roles_member_b");
const outsiderId = parseCharacterId("character:roles_outsider");
const definition: OrganizationRoleCapacityDefinition = Object.freeze({
  operatorCapacityContribution: 0,
  lieutenantCapacityContribution: 1,
  maximumLieutenantsPerOrganization: 1,
});

describe("organization member role assignment", () => {
  it("assigns boss to the leader and operator to ordinary members", () => {
    const boss = assignRole({ characterId: leaderId, role: OrganizationMemberRole.Boss });
    expect(boss.ok).toBe(true);
    if (!boss.ok) throw new Error(boss.error.message);
    expect(boss.value.roleAssignment).toEqual({
      organizationId,
      characterId: leaderId,
      role: OrganizationMemberRole.Boss,
    });
    expect(boss.value.organization.operationalCapacity).toBe(1);
    expect(boss.value.events).toHaveLength(1);
    expect(boss.value.events[0]).toMatchObject({
      type: DomainEventType.OrganizationMemberRoleAssigned,
      organizationId,
      characterId: leaderId,
      previousRole: null,
      assignedRole: OrganizationMemberRole.Boss,
    });

    const operator = assignRole({ characterId: memberAId, role: OrganizationMemberRole.Operator });
    expect(operator.ok).toBe(true);
    if (!operator.ok) throw new Error(operator.error.message);
    expect(operator.value.organization.operationalCapacity).toBe(1);
    expect(operator.value.events.map((event) => event.type)).toEqual([
      DomainEventType.OrganizationMemberRoleAssigned,
    ]);
  });

  it("rejects missing and non-member assignment targets atomically", () => {
    expectFailure(
      { organizations: Object.freeze([]) },
      DomainErrorCode.OrganizationMemberRoleAssignmentMissingOrganization,
    );
    expectFailure(
      { characterId: parseCharacterId("character:missing") },
      DomainErrorCode.OrganizationMemberRoleAssignmentMissingCharacter,
    );
    expectFailure(
      { characterId: outsiderId },
      DomainErrorCode.OrganizationMemberRoleAssignmentNonMember,
    );
  });

  it("rejects invalid leader and boss role combinations", () => {
    expectFailure(
      { characterId: memberAId, role: OrganizationMemberRole.Boss },
      DomainErrorCode.OrganizationMemberRoleAssignmentInvalidRole,
    );
    expectFailure(
      { characterId: leaderId, role: OrganizationMemberRole.Operator },
      DomainErrorCode.OrganizationMemberRoleAssignmentInvalidRole,
    );
    expectFailure(
      { characterId: leaderId, role: OrganizationMemberRole.Lieutenant },
      DomainErrorCode.OrganizationMemberRoleAssignmentInvalidRole,
    );
  });

  it("promotes an operator to lieutenant, increases capacity once, and emits ordered events", () => {
    const operator = role(memberAId, OrganizationMemberRole.Operator);
    const result = assignRole({
      characterId: memberAId,
      role: OrganizationMemberRole.Lieutenant,
      roleAssignments: Object.freeze([operator]),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.previousRole).toBe(OrganizationMemberRole.Operator);
    expect(result.value.organization.operationalCapacity).toBe(2);
    expect(result.value.organizations[0]!.operationalCapacity).toBe(2);
    expect(result.value.events.map((event) => event.type)).toEqual([
      DomainEventType.OrganizationMemberRoleAssigned,
      DomainEventType.OrganizationOperationalCapacityIncreased,
    ]);
    expect(result.value.events[1]).toMatchObject({
      previousOperationalCapacity: 1,
      currentOperationalCapacity: 2,
      delta: 1,
      sourceCharacterId: memberAId,
    });
    for (const event of result.value.events) {
      expect(() => assertDomainEventInvariant(event)).not.toThrow();
    }
  });

  it("does not increase capacity or emit events when the same lieutenant assignment is repeated", () => {
    const lieutenant = role(memberAId, OrganizationMemberRole.Lieutenant);
    const result = assignRole({
      characterId: memberAId,
      role: OrganizationMemberRole.Lieutenant,
      roleAssignments: Object.freeze([lieutenant]),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.organization.operationalCapacity).toBe(1);
    expect(result.value.roleAssignments).toEqual([lieutenant]);
    expect(result.value.events).toEqual([]);
  });

  it("rejects second lieutenants, demotion, replacement, duplicates, and malformed state", () => {
    expectFailure(
      {
        characterId: memberBId,
        role: OrganizationMemberRole.Lieutenant,
        roleAssignments: Object.freeze([
          role(memberAId, OrganizationMemberRole.Lieutenant),
          role(memberBId, OrganizationMemberRole.Operator),
        ]),
      },
      DomainErrorCode.OrganizationMemberRoleAssignmentUnsupportedTransition,
    );
    expectFailure(
      {
        characterId: memberAId,
        role: OrganizationMemberRole.Operator,
        roleAssignments: Object.freeze([role(memberAId, OrganizationMemberRole.Lieutenant)]),
      },
      DomainErrorCode.OrganizationMemberRoleAssignmentUnsupportedTransition,
    );
    expectFailure(
      {
        characterId: memberBId,
        role: OrganizationMemberRole.Lieutenant,
        roleAssignments: Object.freeze([role(memberAId, OrganizationMemberRole.Lieutenant)]),
      },
      DomainErrorCode.OrganizationMemberRoleAssignmentUnsupportedTransition,
    );
    expectFailure(
      {
        roleAssignments: Object.freeze([
          role(memberAId, OrganizationMemberRole.Operator),
          role(memberAId, OrganizationMemberRole.Lieutenant),
        ]),
      },
      DomainErrorCode.OrganizationMemberRoleAssignmentDuplicate,
    );
    expectFailure(
      {
        roleAssignments: Object.freeze([
          {
            organizationId,
            characterId: memberAId,
            role: "fixer",
          } as unknown as OrganizationMemberRoleAssignment,
        ]),
      },
      DomainErrorCode.OrganizationMemberRoleAssignmentInvalidExistingState,
    );
  });

  it("leaves other organizations unchanged and rejects overflow atomically", () => {
    const other = createOrganizationState({
      organizationId: otherOrganizationId,
      displayName: "Other",
      leaderCharacterId: outsiderId,
      memberCharacterIds: [outsiderId],
      money: 20,
      operationalCapacity: 7,
    });
    const firstOrganization = organization(Number.MAX_SAFE_INTEGER);
    const organizations = Object.freeze([firstOrganization, other]);
    const assignments = Object.freeze([role(memberAId, OrganizationMemberRole.Operator)]);
    const result = assignRole({
      organizations,
      roleAssignments: assignments,
      characterId: memberAId,
      role: OrganizationMemberRole.Lieutenant,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        DomainErrorCode.OrganizationMemberRoleAssignmentCapacityInvalid,
      );
    }
    expect(organizations[0]).toBe(firstOrganization);
    expect(organizations[1]).toBe(other);
    expect(assignments).toEqual([role(memberAId, OrganizationMemberRole.Operator)]);
  });

  it("preserves input immutability and deterministic output", () => {
    const organizations = Object.freeze([organization()]);
    const characters = Object.freeze([
      character(leaderId),
      character(memberAId),
      character(memberBId),
    ]);
    const assignments = Object.freeze([role(memberAId, OrganizationMemberRole.Operator)]);
    const before = JSON.parse(JSON.stringify({ organizations, characters, assignments }));

    const first = assignRole({
      organizations,
      characters,
      roleAssignments: assignments,
      characterId: memberAId,
      role: OrganizationMemberRole.Lieutenant,
    });
    const second = assignRole({
      organizations,
      characters,
      roleAssignments: assignments,
      characterId: memberAId,
      role: OrganizationMemberRole.Lieutenant,
    });

    expect(first).toEqual(second);
    expect(JSON.parse(JSON.stringify({ organizations, characters, assignments }))).toEqual(before);
  });
});

function assignRole(overrides: Partial<Parameters<typeof assignOrganizationMemberRole>[0]> = {}) {
  return assignOrganizationMemberRole({
    organizationId,
    characterId: memberAId,
    role: OrganizationMemberRole.Operator,
    organizations: Object.freeze([organization()]),
    characters: Object.freeze([
      character(leaderId),
      character(memberAId),
      character(memberBId),
      character(outsiderId),
    ]),
    roleAssignments: Object.freeze([]),
    definition,
    ...overrides,
  });
}

function organization(operationalCapacity = 1): OrganizationState {
  return createOrganizationState({
    organizationId,
    displayName: "Roles Crew",
    leaderCharacterId: leaderId,
    memberCharacterIds: [leaderId, memberAId, memberBId],
    money: 100,
    operationalCapacity,
  });
}

function character(characterId: CharacterId): CharacterState {
  return createCharacterState({
    characterId,
    displayName: String(characterId),
    capabilityTags: ["streetwise"],
    healthState: "healthy",
    legalState: "free",
    assignmentState: "idle",
    competence: 50,
    loyalty: 50,
    personalExposure: 0,
  });
}

function role(
  characterId: CharacterId,
  memberRole: OrganizationMemberRole,
): OrganizationMemberRoleAssignment {
  return createOrganizationMemberRoleAssignment({
    organizationId,
    characterId,
    role: memberRole,
  });
}

function expectFailure(
  input: Partial<Parameters<typeof assignOrganizationMemberRole>[0]>,
  code: DomainErrorCode,
) {
  const organizations = input.organizations ?? Object.freeze([organization()]);
  const roleAssignments = input.roleAssignments ?? Object.freeze([]);
  const result = assignRole({ ...input, organizations, roleAssignments });

  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.code).toBe(code);
  expect(organizations).toBe(input.organizations ?? organizations);
  expect(roleAssignments).toBe(input.roleAssignments ?? roleAssignments);
}
