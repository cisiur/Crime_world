import type { CharacterState } from "./characterState";
import {
  DomainErrorCode,
  failure,
  success,
  type DomainError,
  type DomainResult,
} from "./domainResult";
import type { CharacterId, OrganizationId, RecurringEconomyScheduleId } from "./entityIds";
import {
  InvalidEntityIdError,
  parseCharacterId,
  parseRecurringEconomyScheduleId,
} from "./entityIds";
import {
  MoneyTransactionCategory,
  MoneyTransactionSourceType,
  type MoneyTransactionSource,
} from "./moneyLedger";
import type { OrganizationState } from "./organizationState";
import { createRecurringEconomySchedule, type RecurringEconomySchedule } from "./recurringEconomy";
import { parseSimulationTick, type SimulationTick } from "./simulationClock";

export interface CrewUpkeepScheduleDefinition {
  readonly amountPerCharacter: number;
  readonly periodTicks: number;
}

export type CrewUpkeepScheduleIdByCharacterId = Readonly<
  Record<string, RecurringEconomyScheduleId>
>;

export interface GenerateCrewUpkeepSchedulesInput {
  readonly organizationId: OrganizationId;
  readonly organizations: readonly OrganizationState[];
  readonly characters: readonly CharacterState[];
  readonly schedules: readonly RecurringEconomySchedule[];
  readonly definition: CrewUpkeepScheduleDefinition;
  readonly firstDueTick: SimulationTick;
  readonly scheduleIdsByCharacterId: CrewUpkeepScheduleIdByCharacterId;
  readonly targetCharacterIds?: readonly CharacterId[];
}

export interface GenerateCrewUpkeepSchedulesSuccess {
  readonly generatedSchedules: readonly RecurringEconomySchedule[];
  readonly reusedSchedules: readonly RecurringEconomySchedule[];
  readonly schedules: readonly RecurringEconomySchedule[];
}

export interface CrewUpkeepScheduleGenerationMissingOrganizationError extends DomainError {
  readonly code: typeof DomainErrorCode.CrewUpkeepScheduleGenerationMissingOrganization;
  readonly organizationId: OrganizationId;
}

export interface CrewUpkeepScheduleGenerationMissingCharacterError extends DomainError {
  readonly code: typeof DomainErrorCode.CrewUpkeepScheduleGenerationMissingCharacter;
  readonly organizationId: OrganizationId;
  readonly characterId: CharacterId;
}

export interface CrewUpkeepScheduleGenerationDuplicateMemberError extends DomainError {
  readonly code: typeof DomainErrorCode.CrewUpkeepScheduleGenerationDuplicateMember;
  readonly organizationId: OrganizationId;
  readonly characterId: CharacterId;
}

export interface CrewUpkeepScheduleGenerationInvalidScheduleIdError extends DomainError {
  readonly code: typeof DomainErrorCode.CrewUpkeepScheduleGenerationInvalidScheduleId;
  readonly characterId: CharacterId;
  readonly reason: string;
  readonly value: unknown;
}

export interface CrewUpkeepScheduleGenerationScheduleConflictError extends DomainError {
  readonly code: typeof DomainErrorCode.CrewUpkeepScheduleGenerationScheduleConflict;
  readonly organizationId: OrganizationId;
  readonly characterId?: CharacterId;
  readonly scheduleId?: RecurringEconomyScheduleId;
  readonly reason:
    | "duplicate-generated-schedule-id"
    | "duplicate-existing-member-schedule"
    | "expected-schedule-id-used-by-another-source"
    | "member-schedule-id-mismatch"
    | "matching-schedule-incompatible";
}

export interface CrewUpkeepScheduleGenerationInvalidDefinitionError extends DomainError {
  readonly code: typeof DomainErrorCode.CrewUpkeepScheduleGenerationInvalidDefinition;
  readonly field: "amountPerCharacter" | "periodTicks";
  readonly reason: string;
  readonly value: unknown;
}

export interface CrewUpkeepScheduleGenerationInvalidFirstDueTickError extends DomainError {
  readonly code: typeof DomainErrorCode.CrewUpkeepScheduleGenerationInvalidFirstDueTick;
  readonly reason: string;
  readonly value: unknown;
}

export type CrewUpkeepScheduleGenerationError =
  | CrewUpkeepScheduleGenerationDuplicateMemberError
  | CrewUpkeepScheduleGenerationInvalidDefinitionError
  | CrewUpkeepScheduleGenerationInvalidFirstDueTickError
  | CrewUpkeepScheduleGenerationInvalidScheduleIdError
  | CrewUpkeepScheduleGenerationMissingCharacterError
  | CrewUpkeepScheduleGenerationMissingOrganizationError
  | CrewUpkeepScheduleGenerationScheduleConflictError;

export type GenerateCrewUpkeepSchedulesResult = DomainResult<
  GenerateCrewUpkeepSchedulesSuccess,
  CrewUpkeepScheduleGenerationError
>;

export function generateCrewUpkeepSchedules(
  input: GenerateCrewUpkeepSchedulesInput,
): GenerateCrewUpkeepSchedulesResult {
  const organization = input.organizations.find(
    (candidate) => candidate.organizationId === input.organizationId,
  );
  if (organization === undefined) {
    return failure({
      code: DomainErrorCode.CrewUpkeepScheduleGenerationMissingOrganization,
      message: `Organization "${input.organizationId}" was not found for crew upkeep schedule generation.`,
      organizationId: input.organizationId,
    });
  }

  const definitionResult = validateCrewUpkeepDefinition(input.definition);
  if (!definitionResult.ok) {
    return definitionResult;
  }

  const firstDueTickResult = validateFirstDueTick(input.firstDueTick);
  if (!firstDueTickResult.ok) {
    return firstDueTickResult;
  }

  const memberResult = validateMembers(organization, input.characters);
  if (!memberResult.ok) {
    return memberResult;
  }

  const scheduleCharacterIdsResult = resolveScheduleCharacterIds(
    organization,
    input.targetCharacterIds,
  );
  if (!scheduleCharacterIdsResult.ok) return scheduleCharacterIdsResult;

  const expectedScheduleIds = new Map<CharacterId, RecurringEconomyScheduleId>();
  const seenScheduleIds = new Map<RecurringEconomyScheduleId, CharacterId>();
  for (const characterId of scheduleCharacterIdsResult.value) {
    const scheduleIdResult = parseMappedScheduleId(characterId, input.scheduleIdsByCharacterId);
    if (!scheduleIdResult.ok) {
      return scheduleIdResult;
    }

    const existingCharacterId = seenScheduleIds.get(scheduleIdResult.value);
    if (existingCharacterId !== undefined && existingCharacterId !== characterId) {
      return scheduleConflict({
        organizationId: organization.organizationId,
        characterId,
        scheduleId: scheduleIdResult.value,
        reason: "duplicate-generated-schedule-id",
      });
    }

    expectedScheduleIds.set(characterId, scheduleIdResult.value);
    seenScheduleIds.set(scheduleIdResult.value, characterId);
  }

  const existingResult = classifyExistingSchedules({
    organization,
    schedules: input.schedules,
    definition: input.definition,
    scheduleCharacterIds: scheduleCharacterIdsResult.value,
    expectedScheduleIds,
  });
  if (!existingResult.ok) {
    return existingResult;
  }

  const generatedSchedules: RecurringEconomySchedule[] = [];
  for (const characterId of scheduleCharacterIdsResult.value) {
    if (existingResult.value.reusedByCharacterId.has(characterId)) {
      continue;
    }

    const scheduleId = expectedScheduleIds.get(characterId);
    if (scheduleId === undefined) {
      return invalidScheduleId(characterId, "missing schedule ID mapping", undefined);
    }

    const scheduleResult = createRecurringEconomySchedule({
      scheduleId,
      organizationId: organization.organizationId,
      category: MoneyTransactionCategory.CrewUpkeep,
      source: Object.freeze({
        type: MoneyTransactionSourceType.CrewUpkeep,
        characterId,
      }),
      amount: -input.definition.amountPerCharacter,
      periodTicks: input.definition.periodTicks,
      nextDueTick: input.firstDueTick,
      active: true,
    });

    if (!scheduleResult.ok) {
      return invalidDefinition(
        "amountPerCharacter",
        scheduleResult.error.message,
        input.definition.amountPerCharacter,
      );
    }

    generatedSchedules.push(scheduleResult.value);
  }

  return success(
    Object.freeze({
      generatedSchedules: Object.freeze(generatedSchedules),
      reusedSchedules: Object.freeze(existingResult.value.reusedSchedules),
      schedules: Object.freeze([...input.schedules, ...generatedSchedules]),
    }),
  );
}

function validateCrewUpkeepDefinition(
  definition: CrewUpkeepScheduleDefinition,
): DomainResult<undefined, CrewUpkeepScheduleGenerationInvalidDefinitionError> {
  const amountResult = validatePositiveSafeInteger(
    "amountPerCharacter",
    definition.amountPerCharacter,
  );
  if (!amountResult.ok) {
    return amountResult;
  }

  return validatePositiveSafeInteger("periodTicks", definition.periodTicks);
}

function validatePositiveSafeInteger(
  field: "amountPerCharacter" | "periodTicks",
  value: unknown,
): DomainResult<undefined, CrewUpkeepScheduleGenerationInvalidDefinitionError> {
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

  if (value <= 0) {
    return invalidDefinition(field, "expected a positive value", value);
  }

  return success(undefined);
}

function validateFirstDueTick(
  firstDueTick: SimulationTick,
): DomainResult<undefined, CrewUpkeepScheduleGenerationInvalidFirstDueTickError> {
  try {
    parseSimulationTick(firstDueTick);
  } catch (error) {
    return failure({
      code: DomainErrorCode.CrewUpkeepScheduleGenerationInvalidFirstDueTick,
      message: "Crew upkeep first due tick is invalid.",
      reason: error instanceof Error ? error.message : "simulation tick parser rejected",
      value: firstDueTick,
    });
  }

  return success(undefined);
}

function validateMembers(
  organization: OrganizationState,
  characters: readonly CharacterState[],
): DomainResult<
  readonly CharacterId[],
  | CrewUpkeepScheduleGenerationDuplicateMemberError
  | CrewUpkeepScheduleGenerationMissingCharacterError
  | CrewUpkeepScheduleGenerationInvalidScheduleIdError
> {
  const existingCharacterIds = new Set(characters.map((character) => character.characterId));
  const seenMemberIds = new Set<CharacterId>();

  for (const memberCharacterId of organization.memberCharacterIds) {
    let characterId: CharacterId;
    try {
      characterId = parseCharacterId(memberCharacterId);
    } catch (error) {
      return invalidScheduleId(
        memberCharacterId as CharacterId,
        error instanceof InvalidEntityIdError ? error.reason : "character ID parser rejected",
        memberCharacterId,
      );
    }

    if (seenMemberIds.has(characterId)) {
      return failure({
        code: DomainErrorCode.CrewUpkeepScheduleGenerationDuplicateMember,
        message: `Organization "${organization.organizationId}" contains duplicate member "${characterId}".`,
        organizationId: organization.organizationId,
        characterId,
      });
    }

    if (!existingCharacterIds.has(characterId)) {
      return failure({
        code: DomainErrorCode.CrewUpkeepScheduleGenerationMissingCharacter,
        message: `Organization "${organization.organizationId}" member "${characterId}" is missing from supplied characters.`,
        organizationId: organization.organizationId,
        characterId,
      });
    }

    seenMemberIds.add(characterId);
  }

  return success(Object.freeze([...seenMemberIds]));
}

function resolveScheduleCharacterIds(
  organization: OrganizationState,
  targetCharacterIds: readonly CharacterId[] | undefined,
): DomainResult<
  readonly CharacterId[],
  | CrewUpkeepScheduleGenerationDuplicateMemberError
  | CrewUpkeepScheduleGenerationMissingCharacterError
  | CrewUpkeepScheduleGenerationInvalidScheduleIdError
> {
  if (targetCharacterIds === undefined) {
    return success(Object.freeze([...organization.memberCharacterIds]));
  }

  const seenCharacterIds = new Set<CharacterId>();
  const resolvedCharacterIds: CharacterId[] = [];
  for (const targetCharacterId of targetCharacterIds) {
    let characterId: CharacterId;
    try {
      characterId = parseCharacterId(targetCharacterId);
    } catch (error) {
      return invalidScheduleId(
        targetCharacterId as CharacterId,
        error instanceof InvalidEntityIdError ? error.reason : "character ID parser rejected",
        targetCharacterId,
      );
    }

    if (seenCharacterIds.has(characterId)) {
      return failure({
        code: DomainErrorCode.CrewUpkeepScheduleGenerationDuplicateMember,
        message: `Crew upkeep target members contain duplicate character "${characterId}".`,
        organizationId: organization.organizationId,
        characterId,
      });
    }

    if (!organization.memberCharacterIds.includes(characterId)) {
      return failure({
        code: DomainErrorCode.CrewUpkeepScheduleGenerationMissingCharacter,
        message: `Crew upkeep target character "${characterId}" is not a member of organization "${organization.organizationId}".`,
        organizationId: organization.organizationId,
        characterId,
      });
    }

    seenCharacterIds.add(characterId);
    resolvedCharacterIds.push(characterId);
  }

  return success(Object.freeze(resolvedCharacterIds));
}

function parseMappedScheduleId(
  characterId: CharacterId,
  scheduleIdsByCharacterId: CrewUpkeepScheduleIdByCharacterId,
): DomainResult<RecurringEconomyScheduleId, CrewUpkeepScheduleGenerationInvalidScheduleIdError> {
  const value = scheduleIdsByCharacterId[characterId];
  try {
    return success(parseRecurringEconomyScheduleId(value));
  } catch (error) {
    return invalidScheduleId(
      characterId,
      error instanceof InvalidEntityIdError ? error.reason : "schedule ID parser rejected",
      value,
    );
  }
}

function classifyExistingSchedules(input: {
  readonly organization: OrganizationState;
  readonly schedules: readonly RecurringEconomySchedule[];
  readonly definition: CrewUpkeepScheduleDefinition;
  readonly scheduleCharacterIds: readonly CharacterId[];
  readonly expectedScheduleIds: ReadonlyMap<CharacterId, RecurringEconomyScheduleId>;
}): DomainResult<
  {
    readonly reusedSchedules: readonly RecurringEconomySchedule[];
    readonly reusedByCharacterId: ReadonlySet<CharacterId>;
  },
  CrewUpkeepScheduleGenerationScheduleConflictError
> {
  const reusedSchedules: RecurringEconomySchedule[] = [];
  const reusedByCharacterId = new Set<CharacterId>();

  for (const characterId of input.scheduleCharacterIds) {
    const expectedScheduleId = input.expectedScheduleIds.get(characterId);
    const matchingSchedules = input.schedules.filter(
      (schedule) =>
        schedule.organizationId === input.organization.organizationId &&
        schedule.category === MoneyTransactionCategory.CrewUpkeep &&
        isCrewUpkeepSourceForCharacter(schedule.source, characterId),
    );

    if (matchingSchedules.length > 1) {
      return scheduleConflict({
        organizationId: input.organization.organizationId,
        characterId,
        reason: "duplicate-existing-member-schedule",
      });
    }

    const expectedIdSchedule = input.schedules.find(
      (schedule) => schedule.scheduleId === expectedScheduleId,
    );

    const existingMatch = matchingSchedules[0];
    if (existingMatch !== undefined) {
      if (existingMatch.scheduleId !== expectedScheduleId) {
        return scheduleConflict({
          organizationId: input.organization.organizationId,
          characterId,
          scheduleId: existingMatch.scheduleId,
          reason: "member-schedule-id-mismatch",
        });
      }

      if (
        existingMatch.amount !== -input.definition.amountPerCharacter ||
        existingMatch.periodTicks !== input.definition.periodTicks ||
        existingMatch.active !== true ||
        existingMatch.source.type !== MoneyTransactionSourceType.CrewUpkeep
      ) {
        return scheduleConflict({
          organizationId: input.organization.organizationId,
          characterId,
          scheduleId: existingMatch.scheduleId,
          reason: "matching-schedule-incompatible",
        });
      }

      reusedSchedules.push(existingMatch);
      reusedByCharacterId.add(characterId);
      continue;
    }

    if (expectedIdSchedule !== undefined) {
      return scheduleConflict({
        organizationId: input.organization.organizationId,
        characterId,
        scheduleId: expectedIdSchedule.scheduleId,
        reason: "expected-schedule-id-used-by-another-source",
      });
    }
  }

  return success(
    Object.freeze({
      reusedSchedules: Object.freeze(reusedSchedules),
      reusedByCharacterId,
    }),
  );
}

function isCrewUpkeepSourceForCharacter(
  source: MoneyTransactionSource,
  characterId: CharacterId,
): boolean {
  return (
    source.type === MoneyTransactionSourceType.CrewUpkeep && source.characterId === characterId
  );
}

function invalidScheduleId<TValue = never>(
  characterId: CharacterId,
  reason: string,
  value: unknown,
): DomainResult<TValue, CrewUpkeepScheduleGenerationInvalidScheduleIdError> {
  return failure({
    code: DomainErrorCode.CrewUpkeepScheduleGenerationInvalidScheduleId,
    message: `Crew upkeep schedule ID for character "${characterId}" is invalid: ${reason}.`,
    characterId,
    reason,
    value,
  });
}

function scheduleConflict(input: {
  readonly organizationId: OrganizationId;
  readonly characterId?: CharacterId;
  readonly scheduleId?: RecurringEconomyScheduleId;
  readonly reason: CrewUpkeepScheduleGenerationScheduleConflictError["reason"];
}): DomainResult<never, CrewUpkeepScheduleGenerationScheduleConflictError> {
  return failure({
    code: DomainErrorCode.CrewUpkeepScheduleGenerationScheduleConflict,
    message: `Crew upkeep schedule conflict: ${input.reason}.`,
    organizationId: input.organizationId,
    ...(input.characterId === undefined ? {} : { characterId: input.characterId }),
    ...(input.scheduleId === undefined ? {} : { scheduleId: input.scheduleId }),
    reason: input.reason,
  });
}

function invalidDefinition<TValue = undefined>(
  field: "amountPerCharacter" | "periodTicks",
  reason: string,
  value: unknown,
): DomainResult<TValue, CrewUpkeepScheduleGenerationInvalidDefinitionError> {
  return failure({
    code: DomainErrorCode.CrewUpkeepScheduleGenerationInvalidDefinition,
    message: `Crew upkeep definition field "${field}" is invalid: ${reason}.`,
    field,
    reason,
    value,
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
