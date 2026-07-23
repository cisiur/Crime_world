import { describe, expect, it } from "vitest";

import {
  DomainErrorCode,
  MoneyTransactionCategory,
  MoneyTransactionSourceType,
  createRecurringEconomySchedule,
  createRecurringIncomeSourceId,
  generateRecurringIncomeSchedule,
  parseCharacterId,
  parseMoneySourceId,
  parseOrganizationId,
  parseRecurringEconomyScheduleId,
  parseSimulationTick,
  type RecurringEconomySchedule,
  type RecurringIncomeScheduleDefinition,
} from "./index";

const organizationId = parseOrganizationId("organization:recurring_income");
const otherOrganizationId = parseOrganizationId("organization:recurring_income_other");
const firstDueTick = parseSimulationTick(40);
const definition: RecurringIncomeScheduleDefinition = Object.freeze({
  amount: 15,
  periodTicks: 144,
});

function scheduleId(suffix = "main") {
  return parseRecurringEconomyScheduleId(`recurring-schedule:income:${suffix}`);
}

function makeIncomeSchedule(
  input: {
    readonly id?: ReturnType<typeof scheduleId>;
    readonly orgId?: typeof organizationId;
    readonly amount?: number;
    readonly periodTicks?: number;
    readonly nextDueTick?: typeof firstDueTick;
    readonly active?: boolean;
    readonly sourceId?: ReturnType<typeof parseMoneySourceId>;
  } = {},
): RecurringEconomySchedule {
  const result = createRecurringEconomySchedule({
    scheduleId: input.id ?? scheduleId(),
    organizationId: input.orgId ?? organizationId,
    category: MoneyTransactionCategory.RecurringIncome,
    source: Object.freeze({
      type: MoneyTransactionSourceType.RecurringIncome,
      sourceId: input.sourceId ?? createRecurringIncomeSourceId(input.orgId ?? organizationId),
    }),
    amount: input.amount ?? definition.amount,
    periodTicks: input.periodTicks ?? definition.periodTicks,
    nextDueTick: input.nextDueTick ?? firstDueTick,
    active: input.active ?? true,
  });

  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.value;
}

function makeCrewSchedule(id = scheduleId("crew")): RecurringEconomySchedule {
  const result = createRecurringEconomySchedule({
    scheduleId: id,
    organizationId,
    category: MoneyTransactionCategory.CrewUpkeep,
    source: Object.freeze({
      type: MoneyTransactionSourceType.CrewUpkeep,
      characterId: parseCharacterId("character:income_schedule_crew"),
    }),
    amount: -5,
    periodTicks: 144,
    nextDueTick: firstDueTick,
    active: true,
  });

  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.value;
}

function generate(
  input: {
    readonly schedules?: readonly RecurringEconomySchedule[];
    readonly id?: ReturnType<typeof scheduleId>;
    readonly firstDue?: typeof firstDueTick;
    readonly incomeDefinition?: RecurringIncomeScheduleDefinition;
  } = {},
) {
  return generateRecurringIncomeSchedule({
    organizationId,
    schedules: input.schedules ?? Object.freeze([]),
    scheduleId: input.id ?? scheduleId(),
    definition: input.incomeDefinition ?? definition,
    firstDueTick: input.firstDue ?? firstDueTick,
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

describe("recurring income schedule generation", () => {
  it("creates one active recurring-income schedule for an organization", () => {
    const result = generate();

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }

    expect(result.value.reusedSchedules).toEqual([]);
    expect(result.value.generatedSchedules).toHaveLength(1);
    expect(result.value.schedules).toEqual(result.value.generatedSchedules);
    expect(result.value.generatedSchedules[0]).toMatchObject({
      scheduleId: scheduleId(),
      organizationId,
      category: MoneyTransactionCategory.RecurringIncome,
      amount: definition.amount,
      periodTicks: definition.periodTicks,
      nextDueTick: firstDueTick,
      active: true,
      source: {
        type: MoneyTransactionSourceType.RecurringIncome,
        sourceId: createRecurringIncomeSourceId(organizationId),
      },
    });
    expect(Object.isFrozen(result.value.generatedSchedules[0])).toBe(true);
    expect(Object.isFrozen(result.value.generatedSchedules[0]?.source)).toBe(true);
  });

  it("preserves existing order and appends only a new income schedule", () => {
    const unrelated = makeIncomeSchedule({ id: scheduleId("other"), orgId: otherOrganizationId });
    const crew = makeCrewSchedule();
    const schedules = Object.freeze([unrelated, crew]);
    const result = generate({ schedules });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }

    expect(result.value.schedules[0]).toBe(unrelated);
    expect(result.value.schedules[1]).toBe(crew);
    expect(result.value.schedules[2]).toBe(result.value.generatedSchedules[0]);
  });

  it("is idempotent when the matching recurring-income schedule already exists", () => {
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

  it("rejects invalid definition, schedule ID, and first due tick atomically", () => {
    expectFailureLeavesSchedulesUnchanged(
      { incomeDefinition: Object.freeze({ amount: 0, periodTicks: 144 }) },
      DomainErrorCode.RecurringIncomeScheduleGenerationInvalidDefinition,
    );
    expectFailureLeavesSchedulesUnchanged(
      { incomeDefinition: Object.freeze({ amount: 15, periodTicks: 0 }) },
      DomainErrorCode.RecurringIncomeScheduleGenerationInvalidDefinition,
    );
    expectFailureLeavesSchedulesUnchanged(
      { id: " recurring-schedule:bad" as ReturnType<typeof scheduleId> },
      DomainErrorCode.RecurringIncomeScheduleGenerationInvalidScheduleId,
    );
    expectFailureLeavesSchedulesUnchanged(
      { firstDue: -1 as typeof firstDueTick },
      DomainErrorCode.RecurringIncomeScheduleGenerationInvalidFirstDueTick,
    );
  });

  it("rejects duplicate and conflicting income schedules atomically", () => {
    const differentIdExisting = makeIncomeSchedule({ id: scheduleId("different") });
    expectFailureLeavesSchedulesUnchanged(
      { schedules: Object.freeze([differentIdExisting]) },
      DomainErrorCode.RecurringIncomeScheduleGenerationScheduleConflict,
    );

    const duplicateA = makeIncomeSchedule({ id: scheduleId() });
    const duplicateB = makeIncomeSchedule({ id: scheduleId("copy") });
    expectFailureLeavesSchedulesUnchanged(
      { schedules: Object.freeze([duplicateA, duplicateB]) },
      DomainErrorCode.RecurringIncomeScheduleGenerationScheduleConflict,
    );

    const reusedIdByCrew = makeCrewSchedule(scheduleId());
    expectFailureLeavesSchedulesUnchanged(
      { schedules: Object.freeze([reusedIdByCrew]) },
      DomainErrorCode.RecurringIncomeScheduleGenerationScheduleConflict,
    );

    const conflictingAmount = makeIncomeSchedule({ amount: 20 });
    expectFailureLeavesSchedulesUnchanged(
      { schedules: Object.freeze([conflictingAmount]) },
      DomainErrorCode.RecurringIncomeScheduleGenerationScheduleConflict,
    );
  });

  it("is deterministic", () => {
    const schedules = Object.freeze([makeCrewSchedule()]);

    const first = generate({ schedules });
    const second = generate({ schedules });

    expect(first).toEqual(second);
  });
});
