import {
  canonicalMvpCrewUpkeepDefinition,
  canonicalMvpOrganizationRoleCapacityDefinition,
} from "@crimeworld/content";
import {
  DomainErrorCode,
  MoneyTransactionCategory,
  MoneyTransactionSourceType,
  OrganizationMemberRole,
  assignOrganizationMemberRole,
  failure,
  generateCrewUpkeepSchedules,
  success,
  type AssignOrganizationMemberRoleResult,
  type CharacterId,
  type CharacterState,
  type CrewUpkeepScheduleGenerationError,
  type DomainError,
  type DomainEvent,
  type DomainResult,
  type OrganizationId,
  type OrganizationMemberRoleAssignment,
  type OrganizationMemberRoleAssignmentError,
  type OrganizationState,
  type RecurringEconomySchedule,
  type RecurringEconomyScheduleId,
  type SimulationTick,
} from "@crimeworld/domain";

export interface FinalizeRecruitedCrewGrowthInput {
  readonly organizationId: OrganizationId;
  readonly recruitedCharacterId: CharacterId;
  readonly firstDueTick: SimulationTick;
  readonly upkeepScheduleId: RecurringEconomyScheduleId;
  readonly organizations: readonly OrganizationState[];
  readonly characters: readonly CharacterState[];
  readonly roleAssignments: readonly OrganizationMemberRoleAssignment[];
  readonly schedules: readonly RecurringEconomySchedule[];
}

export interface FinalizeRecruitedCrewGrowthSuccess {
  readonly organization: OrganizationState;
  readonly organizations: readonly OrganizationState[];
  readonly roleAssignment: OrganizationMemberRoleAssignment;
  readonly roleAssignments: readonly OrganizationMemberRoleAssignment[];
  readonly schedules: readonly RecurringEconomySchedule[];
  readonly generatedSchedules: readonly RecurringEconomySchedule[];
  readonly reusedSchedules: readonly RecurringEconomySchedule[];
  readonly events: readonly DomainEvent[];
}

export interface CrewGrowthRuntimeUpkeepMismatchError extends DomainError {
  readonly code: typeof DomainErrorCode.CrewGrowthRuntimeUpkeepMismatch;
  readonly organizationId: OrganizationId;
  readonly recruitedCharacterId: CharacterId;
  readonly matchingScheduleCount?: number;
  readonly field?: "amount" | "periodTicks" | "category" | "source" | "active";
}

export type FinalizeRecruitedCrewGrowthError =
  | CrewGrowthRuntimeUpkeepMismatchError
  | CrewUpkeepScheduleGenerationError
  | OrganizationMemberRoleAssignmentError;

export type FinalizeRecruitedCrewGrowthResult = DomainResult<
  FinalizeRecruitedCrewGrowthSuccess,
  FinalizeRecruitedCrewGrowthError
>;

export interface AssignLieutenantRoleRuntimeInput {
  readonly organizationId: OrganizationId;
  readonly characterId: CharacterId;
  readonly organizations: readonly OrganizationState[];
  readonly characters: readonly CharacterState[];
  readonly roleAssignments: readonly OrganizationMemberRoleAssignment[];
}

export type AssignLieutenantRoleRuntimeResult = AssignOrganizationMemberRoleResult;

export function finalizeRecruitedCrewGrowth(
  input: FinalizeRecruitedCrewGrowthInput,
): FinalizeRecruitedCrewGrowthResult {
  const roleResult = assignOrganizationMemberRole({
    organizationId: input.organizationId,
    characterId: input.recruitedCharacterId,
    role: OrganizationMemberRole.Operator,
    organizations: input.organizations,
    characters: input.characters,
    roleAssignments: input.roleAssignments,
    definition: canonicalMvpOrganizationRoleCapacityDefinition,
  });
  if (!roleResult.ok) return roleResult;

  const upkeepResult = generateCrewUpkeepSchedules({
    organizationId: input.organizationId,
    organizations: input.organizations,
    characters: input.characters,
    schedules: input.schedules,
    definition: canonicalMvpCrewUpkeepDefinition,
    firstDueTick: input.firstDueTick,
    scheduleIdsByCharacterId: Object.freeze({
      [input.recruitedCharacterId]: input.upkeepScheduleId,
    }),
    targetCharacterIds: [input.recruitedCharacterId],
  });
  if (!upkeepResult.ok) return upkeepResult;

  const recruitSchedules = upkeepResult.value.schedules.filter(
    (schedule) =>
      schedule.organizationId === input.organizationId &&
      schedule.category === MoneyTransactionCategory.CrewUpkeep &&
      schedule.source.type === MoneyTransactionSourceType.CrewUpkeep &&
      schedule.source.characterId === input.recruitedCharacterId,
  );

  if (recruitSchedules.length !== 1) {
    return failure({
      code: DomainErrorCode.CrewGrowthRuntimeUpkeepMismatch,
      message: `Expected exactly one crew-upkeep schedule for recruited character "${input.recruitedCharacterId}".`,
      organizationId: input.organizationId,
      recruitedCharacterId: input.recruitedCharacterId,
      matchingScheduleCount: recruitSchedules.length,
    });
  }

  const schedule = recruitSchedules[0];
  if (schedule === undefined) {
    return failure({
      code: DomainErrorCode.CrewGrowthRuntimeUpkeepMismatch,
      message: `Crew-upkeep schedule for recruited character "${input.recruitedCharacterId}" was not found.`,
      organizationId: input.organizationId,
      recruitedCharacterId: input.recruitedCharacterId,
      matchingScheduleCount: 0,
    });
  }

  const scheduleValidation = validateRecruitSchedule(input, schedule);
  if (!scheduleValidation.ok) return scheduleValidation;

  return success(
    Object.freeze({
      organization: roleResult.value.organization,
      organizations: roleResult.value.organizations,
      roleAssignment: roleResult.value.roleAssignment,
      roleAssignments: roleResult.value.roleAssignments,
      schedules: upkeepResult.value.schedules,
      generatedSchedules: upkeepResult.value.generatedSchedules,
      reusedSchedules: upkeepResult.value.reusedSchedules,
      events: roleResult.value.events,
    }),
  );
}

export function assignLieutenantRoleRuntime(
  input: AssignLieutenantRoleRuntimeInput,
): AssignLieutenantRoleRuntimeResult {
  return assignOrganizationMemberRole({
    organizationId: input.organizationId,
    characterId: input.characterId,
    role: OrganizationMemberRole.Lieutenant,
    organizations: input.organizations,
    characters: input.characters,
    roleAssignments: input.roleAssignments,
    definition: canonicalMvpOrganizationRoleCapacityDefinition,
  });
}

function validateRecruitSchedule(
  input: FinalizeRecruitedCrewGrowthInput,
  schedule: RecurringEconomySchedule,
): DomainResult<undefined, CrewGrowthRuntimeUpkeepMismatchError> {
  if (schedule.category !== MoneyTransactionCategory.CrewUpkeep) {
    return upkeepMismatch(input, "category");
  }
  if (
    schedule.source.type !== MoneyTransactionSourceType.CrewUpkeep ||
    schedule.source.characterId !== input.recruitedCharacterId
  ) {
    return upkeepMismatch(input, "source");
  }
  if (schedule.amount !== -canonicalMvpCrewUpkeepDefinition.amountPerCharacter) {
    return upkeepMismatch(input, "amount");
  }
  if (schedule.periodTicks !== canonicalMvpCrewUpkeepDefinition.periodTicks) {
    return upkeepMismatch(input, "periodTicks");
  }
  if (schedule.active !== true) {
    return upkeepMismatch(input, "active");
  }

  return success(undefined);
}

function upkeepMismatch(
  input: FinalizeRecruitedCrewGrowthInput,
  field: NonNullable<CrewGrowthRuntimeUpkeepMismatchError["field"]>,
): DomainResult<never, CrewGrowthRuntimeUpkeepMismatchError> {
  return failure({
    code: DomainErrorCode.CrewGrowthRuntimeUpkeepMismatch,
    message: `Crew growth upkeep schedule has mismatched field "${field}".`,
    organizationId: input.organizationId,
    recruitedCharacterId: input.recruitedCharacterId,
    field,
  });
}
