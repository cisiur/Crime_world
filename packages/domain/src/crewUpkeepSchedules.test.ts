import { describe, expect, it } from "vitest";

import {
  DomainErrorCode,
  MoneyTransactionCategory,
  MoneyTransactionSourceType,
  createCharacterState,
  createOrganizationState,
  createRecurringEconomySchedule,
  generateCrewUpkeepSchedules,
  parseCharacterId,
  parseOrganizationId,
  parseRecurringEconomyScheduleId,
  parseSimulationTick,
  type CharacterState,
  type CrewUpkeepScheduleDefinition,
  type OrganizationState,
  type RecurringEconomySchedule,
} from "./index";

const organizationId = parseOrganizationId("organization:crew_upkeep");
const otherOrganizationId = parseOrganizationId("organization:crew_upkeep_other");
const leaderId = parseCharacterId("character:crew_leader");
const memberAId = parseCharacterId("character:crew_member_a");
const memberBId = parseCharacterId("character:crew_member_b");
const outsiderId = parseCharacterId("character:crew_outsider");
const firstDueTick = parseSimulationTick(20);
const definition = Object.freeze({ amountPerCharacter: 5, periodTicks: 144 });

function scheduleId(suffix: string) {
  return parseRecurringEconomyScheduleId(`recurring-schedule:crew-upkeep:${suffix}`);
}

function makeCharacter(characterId = memberAId): CharacterState {
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

function makeOrganization(
  memberCharacterIds = [leaderId, memberAId, memberBId],
): OrganizationState {
  return createOrganizationState({
    organizationId,
    displayName: "Crew Upkeep Org",
    leaderCharacterId: leaderId,
    memberCharacterIds,
    money: 100,
    operationalCapacity: 2,
  });
}

function makeCharacters(): readonly CharacterState[] {
  return Object.freeze([
    makeCharacter(leaderId),
    makeCharacter(memberAId),
    makeCharacter(memberBId),
  ]);
}

function scheduleIds() {
  return Object.freeze({
    [leaderId]: scheduleId("leader"),
    [memberAId]: scheduleId("member-a"),
    [memberBId]: scheduleId("member-b"),
  });
}

function makeCrewSchedule(input: {
  readonly id: ReturnType<typeof scheduleId>;
  readonly characterId: typeof leaderId;
  readonly orgId?: typeof organizationId;
  readonly amount?: number;
  readonly active?: boolean;
}): RecurringEconomySchedule {
  const result = createRecurringEconomySchedule({
    scheduleId: input.id,
    organizationId: input.orgId ?? organizationId,
    category: MoneyTransactionCategory.CrewUpkeep,
    source: Object.freeze({
      type: MoneyTransactionSourceType.CrewUpkeep,
      characterId: input.characterId,
    }),
    amount: input.amount ?? -5,
    periodTicks: 144,
    nextDueTick: firstDueTick,
    active: input.active ?? true,
  });

  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.value;
}

function generate(
  input: {
    readonly organizations?: readonly OrganizationState[];
    readonly characters?: readonly CharacterState[];
    readonly schedules?: readonly RecurringEconomySchedule[];
    readonly ids?: ReturnType<typeof scheduleIds>;
    readonly firstDue?: ReturnType<typeof parseSimulationTick>;
    readonly upkeepDefinition?: CrewUpkeepScheduleDefinition;
  } = {},
) {
  return generateCrewUpkeepSchedules({
    organizationId,
    organizations: input.organizations ?? Object.freeze([makeOrganization()]),
    characters: input.characters ?? makeCharacters(),
    schedules: input.schedules ?? Object.freeze([]),
    definition: input.upkeepDefinition ?? definition,
    firstDueTick: input.firstDue ?? firstDueTick,
    scheduleIdsByCharacterId: input.ids ?? scheduleIds(),
  });
}

function crewCharacterIds(schedules: readonly RecurringEconomySchedule[]) {
  return schedules.map((schedule) => {
    expect(schedule.source.type).toBe(MoneyTransactionSourceType.CrewUpkeep);
    if (schedule.source.type !== MoneyTransactionSourceType.CrewUpkeep) {
      throw new Error("Expected a crew upkeep source.");
    }

    return schedule.source.characterId;
  });
}

function expectFailureLeavesSchedulesUnchanged(
  input: Parameters<typeof generate>[0],
  code: DomainErrorCode,
) {
  const schedules =
    input?.schedules ?? Object.freeze([] satisfies readonly RecurringEconomySchedule[]);
  const result = generate({ ...input, schedules });

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.code).toBe(code);
  }
  expect(schedules).toHaveLength(input?.schedules?.length ?? 0);
}

describe("crew upkeep schedule generation", () => {
  it("creates one active crew-upkeep schedule per organization member in member order", () => {
    const result = generate();

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }

    expect(crewCharacterIds(result.value.generatedSchedules)).toEqual([
      leaderId,
      memberAId,
      memberBId,
    ]);
    expect(result.value.reusedSchedules).toEqual([]);
    expect(result.value.schedules).toEqual(result.value.generatedSchedules);

    for (const schedule of result.value.generatedSchedules) {
      expect(schedule.organizationId).toBe(organizationId);
      expect(schedule.category).toBe(MoneyTransactionCategory.CrewUpkeep);
      expect(schedule.amount).toBe(-definition.amountPerCharacter);
      expect(schedule.periodTicks).toBe(definition.periodTicks);
      expect(schedule.nextDueTick).toBe(firstDueTick);
      expect(schedule.active).toBe(true);
      expect(Object.isFrozen(schedule)).toBe(true);
      expect(Object.isFrozen(schedule.source)).toBe(true);
    }
  });

  it("preserves existing schedule order and appends only new schedules", () => {
    const existing = makeCrewSchedule({ id: scheduleId("leader"), characterId: leaderId });
    const unrelated = makeCrewSchedule({
      id: scheduleId("other"),
      orgId: otherOrganizationId,
      characterId: outsiderId,
    });
    const schedules = Object.freeze([unrelated, existing]);
    const result = generate({ schedules });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }

    expect(result.value.reusedSchedules).toEqual([existing]);
    expect(crewCharacterIds(result.value.generatedSchedules)).toEqual([memberAId, memberBId]);
    expect(result.value.schedules[0]).toBe(unrelated);
    expect(result.value.schedules[1]).toBe(existing);
    expect(result.value.schedules.slice(2)).toEqual(result.value.generatedSchedules);
  });

  it("is idempotent when matching crew-upkeep schedules already exist", () => {
    const first = generate();
    expect(first.ok).toBe(true);
    if (!first.ok) {
      throw new Error(first.error.message);
    }

    const second = generate({ schedules: first.value.schedules });
    const third = generate({ schedules: first.value.schedules });

    expect(second).toEqual(third);
    expect(second.ok).toBe(true);
    if (!second.ok) {
      throw new Error(second.error.message);
    }
    expect(second.value.generatedSchedules).toEqual([]);
    expect(second.value.reusedSchedules).toEqual(first.value.generatedSchedules);
    expect(second.value.schedules).toEqual(first.value.schedules);
  });

  it("rejects invalid requests atomically", () => {
    expectFailureLeavesSchedulesUnchanged(
      { organizations: Object.freeze([]) },
      DomainErrorCode.CrewUpkeepScheduleGenerationMissingOrganization,
    );

    expectFailureLeavesSchedulesUnchanged(
      { characters: Object.freeze([makeCharacter(leaderId), makeCharacter(memberAId)]) },
      DomainErrorCode.CrewUpkeepScheduleGenerationMissingCharacter,
    );

    const duplicateMemberOrganization = {
      ...makeOrganization([leaderId, memberAId]),
      memberCharacterIds: [leaderId, memberAId, memberAId],
    } as unknown as OrganizationState;
    expectFailureLeavesSchedulesUnchanged(
      { organizations: Object.freeze([duplicateMemberOrganization]) },
      DomainErrorCode.CrewUpkeepScheduleGenerationDuplicateMember,
    );

    expectFailureLeavesSchedulesUnchanged(
      {
        ids: Object.freeze({
          [leaderId]: scheduleId("leader"),
          [memberAId]: " recurring-schedule:bad" as ReturnType<typeof scheduleId>,
          [memberBId]: scheduleId("member-b"),
        }),
      },
      DomainErrorCode.CrewUpkeepScheduleGenerationInvalidScheduleId,
    );

    expectFailureLeavesSchedulesUnchanged(
      { firstDue: -1 as ReturnType<typeof parseSimulationTick> },
      DomainErrorCode.CrewUpkeepScheduleGenerationInvalidFirstDueTick,
    );

    expectFailureLeavesSchedulesUnchanged(
      { upkeepDefinition: Object.freeze({ amountPerCharacter: 0, periodTicks: 144 }) },
      DomainErrorCode.CrewUpkeepScheduleGenerationInvalidDefinition,
    );
  });

  it("rejects existing schedule conflicts without partial generation", () => {
    const differentIdExisting = makeCrewSchedule({
      id: scheduleId("different-member-a"),
      characterId: memberAId,
    });
    expectFailureLeavesSchedulesUnchanged(
      { schedules: Object.freeze([differentIdExisting]) },
      DomainErrorCode.CrewUpkeepScheduleGenerationScheduleConflict,
    );

    const wrongAmount = makeCrewSchedule({
      id: scheduleId("member-a"),
      characterId: memberAId,
      amount: -6,
    });
    expectFailureLeavesSchedulesUnchanged(
      { schedules: Object.freeze([wrongAmount]) },
      DomainErrorCode.CrewUpkeepScheduleGenerationScheduleConflict,
    );

    const inactive = makeCrewSchedule({
      id: scheduleId("member-a"),
      characterId: memberAId,
      active: false,
    });
    expectFailureLeavesSchedulesUnchanged(
      { schedules: Object.freeze([inactive]) },
      DomainErrorCode.CrewUpkeepScheduleGenerationScheduleConflict,
    );

    const duplicateA = makeCrewSchedule({ id: scheduleId("member-a"), characterId: memberAId });
    const duplicateB = makeCrewSchedule({
      id: scheduleId("member-a-copy"),
      characterId: memberAId,
    });
    expectFailureLeavesSchedulesUnchanged(
      { schedules: Object.freeze([duplicateA, duplicateB]) },
      DomainErrorCode.CrewUpkeepScheduleGenerationScheduleConflict,
    );

    const reusedIdForOtherSource = makeCrewSchedule({
      id: scheduleId("member-a"),
      orgId: otherOrganizationId,
      characterId: outsiderId,
    });
    expectFailureLeavesSchedulesUnchanged(
      { schedules: Object.freeze([reusedIdForOtherSource]) },
      DomainErrorCode.CrewUpkeepScheduleGenerationScheduleConflict,
    );

    expectFailureLeavesSchedulesUnchanged(
      {
        ids: Object.freeze({
          [leaderId]: scheduleId("shared"),
          [memberAId]: scheduleId("shared"),
          [memberBId]: scheduleId("member-b"),
        }),
      },
      DomainErrorCode.CrewUpkeepScheduleGenerationScheduleConflict,
    );
  });

  it("is deterministic and never creates schedules for non-members", () => {
    const characters = Object.freeze([...makeCharacters(), makeCharacter(outsiderId)]);

    const first = generate({ characters });
    const second = generate({ characters });

    expect(first).toEqual(second);
    expect(first.ok).toBe(true);
    if (!first.ok) {
      throw new Error(first.error.message);
    }
    expect(
      first.value.generatedSchedules.some(
        (schedule) =>
          schedule.source.type === MoneyTransactionSourceType.CrewUpkeep &&
          schedule.source.characterId === outsiderId,
      ),
    ).toBe(false);
  });
});
