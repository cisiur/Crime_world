import { describe, expect, it } from "vitest";

import { canonicalMvpRecurringIncomeDefinition } from "@crimeworld/content";
import {
  DomainErrorCode,
  DomainEventType,
  MoneyTransactionCategory,
  MoneyTransactionSourceType,
  RecurringEconomyProcessingStatus,
  createMoneyTransaction,
  createOrganizationState,
  createRecurringEconomyProcessingRecord,
  createRecurringEconomySchedule,
  generateRecurringIncomeSchedule,
  parseMoneySourceId,
  parseCharacterId,
  parseOrganizationId,
  parseRecurringEconomyScheduleId,
  parseSimulationTick,
  parseTransactionId,
  type MoneyTransaction,
  type OrganizationState,
  type RecurringEconomyProcessingRecord,
  type RecurringEconomySchedule,
} from "@crimeworld/domain";

import { executeRecurringIncomePeriod } from "./recurringEconomyRuntime";

const organizationId = parseOrganizationId("organization:runtime_income");
const leaderId = parseCharacterId("character:runtime_income_leader");
const dueTick = parseSimulationTick(50);
const currentTick = parseSimulationTick(50);

function scheduleId(suffix = "main") {
  return parseRecurringEconomyScheduleId(`recurring-schedule:runtime-income:${suffix}`);
}

function transactionId(suffix = "new") {
  return parseTransactionId(`transaction:runtime-income:${suffix}`);
}

function makeOrganization(money = 100): OrganizationState {
  return createOrganizationState({
    organizationId,
    displayName: "Runtime Income Org",
    leaderCharacterId: leaderId,
    memberCharacterIds: [leaderId],
    money,
    operationalCapacity: 2,
  });
}

function makeSchedules(
  input: { readonly active?: boolean; readonly nextDueTick?: typeof dueTick } = {},
) {
  const result = generateRecurringIncomeSchedule({
    organizationId,
    schedules: Object.freeze([]),
    scheduleId: scheduleId(),
    definition: canonicalMvpRecurringIncomeDefinition,
    firstDueTick: input.nextDueTick ?? dueTick,
  });

  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
  }

  if (input.active === false) {
    return Object.freeze(
      result.value.schedules.map((schedule) => createSchedule({ ...schedule, active: false })),
    );
  }

  return result.value.schedules;
}

function createSchedule(input: RecurringEconomySchedule): RecurringEconomySchedule {
  const result = createRecurringEconomySchedule(input);
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.value;
}

function existingTransaction(id = transactionId("existing")): MoneyTransaction {
  const result = createMoneyTransaction({
    transactionId: id,
    organizationId,
    recordedAtTick: dueTick,
    amount: 10,
    balanceBefore: 90,
    balanceAfter: 100,
    category: MoneyTransactionCategory.RecurringIncome,
    source: Object.freeze({
      type: MoneyTransactionSourceType.RecurringIncome,
      sourceId: parseMoneySourceId("runtime-income:existing"),
    }),
  });

  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.value;
}

function existingProcessingRecord(
  schedule: RecurringEconomySchedule,
): RecurringEconomyProcessingRecord {
  const result = createRecurringEconomyProcessingRecord({
    scheduleId: schedule.scheduleId,
    organizationId,
    dueTick: schedule.nextDueTick,
    processedAtTick: currentTick,
    status: RecurringEconomyProcessingStatus.Applied,
    amount: schedule.amount,
    category: schedule.category,
    source: schedule.source,
    transactionId: transactionId("processed"),
  });

  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.value;
}

function execute(
  input: {
    readonly organizations?: readonly OrganizationState[];
    readonly transactions?: readonly MoneyTransaction[];
    readonly processingRecords?: readonly RecurringEconomyProcessingRecord[];
    readonly schedules?: readonly RecurringEconomySchedule[];
    readonly id?: ReturnType<typeof transactionId>;
    readonly tick?: typeof currentTick;
  } = {},
) {
  return executeRecurringIncomePeriod({
    currentTick: input.tick ?? currentTick,
    transactionId: input.id ?? transactionId("new"),
    organizationId,
    organizations: input.organizations ?? Object.freeze([makeOrganization()]),
    transactions: input.transactions ?? Object.freeze([]),
    processingRecords:
      input.processingRecords ??
      Object.freeze([] satisfies readonly RecurringEconomyProcessingRecord[]),
    schedules: input.schedules ?? makeSchedules(),
  });
}

function expectFailureLeavesInputsUnchanged(
  input: Parameters<typeof execute>[0],
  code: DomainErrorCode,
) {
  const organizations = input?.organizations ?? Object.freeze([makeOrganization()]);
  const transactions =
    input?.transactions ?? Object.freeze([] satisfies readonly MoneyTransaction[]);
  const processingRecords =
    input?.processingRecords ??
    Object.freeze([] satisfies readonly RecurringEconomyProcessingRecord[]);
  const schedules = input?.schedules ?? makeSchedules();

  const result = execute({ ...input, organizations, transactions, processingRecords, schedules });

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.code).toBe(code);
  }
  expect(organizations[0]?.money).toBe(input?.organizations?.[0]?.money ?? 100);
  expect(transactions).toHaveLength(input?.transactions?.length ?? 0);
  expect(processingRecords).toHaveLength(input?.processingRecords?.length ?? 0);
  expect(schedules).toHaveLength(input?.schedules?.length ?? 1);
}

describe("recurring income runtime", () => {
  it("executes one applied recurring-income period through the recurring economy runtime", () => {
    const schedules = makeSchedules();
    const result = execute({ schedules });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }

    expect(result.value.processingStatus).toBe(RecurringEconomyProcessingStatus.Applied);
    expect(result.value.organizations[0]?.money).toBe(
      100 + canonicalMvpRecurringIncomeDefinition.amount,
    );
    expect(result.value.transactions).toHaveLength(1);
    expect(result.value.transactions[0]).toMatchObject({
      transactionId: transactionId("new"),
      amount: canonicalMvpRecurringIncomeDefinition.amount,
      category: MoneyTransactionCategory.RecurringIncome,
      balanceBefore: 100,
      balanceAfter: 115,
      source: { type: MoneyTransactionSourceType.RecurringIncome },
    });
    expect(result.value.processingRecords).toHaveLength(1);
    expect(result.value.processingRecords[0]).toMatchObject({
      status: RecurringEconomyProcessingStatus.Applied,
      transactionId: transactionId("new"),
    });
    expect(result.value.schedules[0]?.nextDueTick).toBe(
      dueTick + canonicalMvpRecurringIncomeDefinition.periodTicks,
    );
    expect(result.value.events.map((event) => event.type)).toEqual([
      DomainEventType.OrganizationMoneyTransactionRecorded,
      DomainEventType.RecurringEconomyPeriodProcessed,
    ]);
    expect(
      result.value.transactions[0]!.balanceAfter - result.value.transactions[0]!.balanceBefore,
    ).toBe(result.value.transactions[0]!.amount);
  });

  it("returns focused and delegated failures without partial state", () => {
    expectFailureLeavesInputsUnchanged(
      { schedules: Object.freeze([]) },
      DomainErrorCode.RecurringIncomeRuntimeScheduleNotFound,
    );

    expectFailureLeavesInputsUnchanged(
      { schedules: makeSchedules({ active: false }) },
      DomainErrorCode.RecurringEconomyScheduleInactive,
    );

    expectFailureLeavesInputsUnchanged(
      { tick: parseSimulationTick(49) },
      DomainErrorCode.RecurringEconomyPeriodNotDue,
    );

    const schedules = makeSchedules();
    expectFailureLeavesInputsUnchanged(
      { schedules, processingRecords: Object.freeze([existingProcessingRecord(schedules[0]!)]) },
      DomainErrorCode.RecurringEconomyPeriodAlreadyProcessed,
    );

    const duplicateTransaction = existingTransaction(transactionId("duplicate"));
    expectFailureLeavesInputsUnchanged(
      {
        transactions: Object.freeze([duplicateTransaction]),
        id: duplicateTransaction.transactionId,
      },
      DomainErrorCode.MoneyTransactionDuplicateTransactionId,
    );

    const overflowSchedule = createSchedule({
      ...schedules[0]!,
      nextDueTick: parseSimulationTick(Number.MAX_SAFE_INTEGER),
      periodTicks: 1,
    });
    expectFailureLeavesInputsUnchanged(
      {
        schedules: Object.freeze([overflowSchedule]),
        tick: parseSimulationTick(Number.MAX_SAFE_INTEGER),
      },
      DomainErrorCode.RecurringEconomyScheduleAdvanceInvalid,
    );

    const overflowOrganization = makeOrganization(Number.MAX_SAFE_INTEGER);
    expectFailureLeavesInputsUnchanged(
      { organizations: Object.freeze([overflowOrganization]) },
      DomainErrorCode.MoneyTransactionArithmeticInvalid,
    );
  });

  it("rejects ambiguous matching recurring-income schedules", () => {
    const schedules = makeSchedules();
    const duplicate = createSchedule({
      ...schedules[0]!,
      scheduleId: scheduleId("duplicate"),
    });

    expectFailureLeavesInputsUnchanged(
      { schedules: Object.freeze([...schedules, duplicate]) },
      DomainErrorCode.RecurringIncomeRuntimeScheduleConflict,
    );
  });

  it("is deterministic and returns immutable runtime state", () => {
    const input = {
      organizations: Object.freeze([makeOrganization()]),
      transactions: Object.freeze([] satisfies readonly MoneyTransaction[]),
      processingRecords: Object.freeze([] satisfies readonly RecurringEconomyProcessingRecord[]),
      schedules: makeSchedules(),
      id: transactionId("deterministic"),
    };

    const first = execute(input);
    const second = execute(input);

    expect(first).toEqual(second);
    expect(first.ok).toBe(true);
    if (!first.ok) {
      throw new Error(first.error.message);
    }
    expect(input.organizations[0]?.money).toBe(100);
    expect(input.transactions).toHaveLength(0);
    expect(input.processingRecords).toHaveLength(0);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.value)).toBe(true);
    expect(Object.isFrozen(first.value.schedules)).toBe(true);
    expect(Object.isFrozen(first.value.processingRecords)).toBe(true);
    expect(Object.isFrozen(first.value.organizations)).toBe(true);
    expect(Object.isFrozen(first.value.transactions)).toBe(true);
    expect(Object.isFrozen(first.value.events)).toBe(true);
  });
});
