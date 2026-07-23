import { describe, expect, it } from "vitest";

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
  parseBusinessId,
  parseCharacterId,
  parseLocationId,
  parseMoneySourceId,
  parseOrganizationId,
  parseRecurringEconomyScheduleId,
  parseSimulationTick,
  parseTransactionId,
  processRecurringEconomyDuePeriod,
  type MoneyTransaction,
  type MoneyTransactionCategory as MoneyTransactionCategoryType,
  type MoneyTransactionSource,
  type OrganizationState,
  type RecurringEconomyProcessingRecord,
  type RecurringEconomySchedule,
} from "@crimeworld/domain";

import { executeRecurringEconomyRuntime } from "./recurringEconomyRuntime";

const organizationAId = parseOrganizationId("organization:runtime_recurring_a");
const organizationBId = parseOrganizationId("organization:runtime_recurring_b");
const leaderAId = parseCharacterId("character:runtime_leader_a");
const leaderBId = parseCharacterId("character:runtime_leader_b");
const crewMemberId = parseCharacterId("character:runtime_upkeep_001");
const businessId = parseBusinessId("business:runtime_upkeep_001");
const hideoutId = parseLocationId("location:runtime_hideout_001");
const dueTick = parseSimulationTick(10);
const currentTick = parseSimulationTick(12);
const periodTicks = 5;

function createOrganizations(money = 100): readonly OrganizationState[] {
  return Object.freeze([
    createOrganizationState({
      organizationId: organizationAId,
      displayName: "Runtime Crew A",
      leaderCharacterId: leaderAId,
      memberCharacterIds: [leaderAId],
      money,
      operationalCapacity: 2,
    }),
    createOrganizationState({
      organizationId: organizationBId,
      displayName: "Runtime Crew B",
      leaderCharacterId: leaderBId,
      memberCharacterIds: [leaderBId],
      money: 250,
      operationalCapacity: 3,
    }),
  ]);
}

function scheduleId(suffix = "001") {
  return parseRecurringEconomyScheduleId(`recurring-schedule:runtime:${suffix}`);
}

function transactionId(suffix = "001") {
  return parseTransactionId(`transaction:runtime_recurring:${suffix}`);
}

function recurringIncomeSource(): MoneyTransactionSource {
  return Object.freeze({
    type: MoneyTransactionSourceType.RecurringIncome,
    sourceId: parseMoneySourceId("runtime-recurring:income_001"),
  });
}

function crewUpkeepSource(): MoneyTransactionSource {
  return Object.freeze({
    type: MoneyTransactionSourceType.CrewUpkeep,
    characterId: crewMemberId,
  });
}

function businessUpkeepSource(): MoneyTransactionSource {
  return Object.freeze({
    type: MoneyTransactionSourceType.BusinessUpkeep,
    businessId,
  });
}

function hideoutUpkeepSource(): MoneyTransactionSource {
  return Object.freeze({
    type: MoneyTransactionSourceType.HideoutUpkeep,
    locationId: hideoutId,
  });
}

function makeSchedule(input: {
  readonly id?: ReturnType<typeof scheduleId>;
  readonly amount: number;
  readonly category: MoneyTransactionCategoryType;
  readonly source: MoneyTransactionSource;
  readonly active?: boolean;
  readonly nextDueTick?: ReturnType<typeof parseSimulationTick>;
  readonly periodTicks?: number;
}): RecurringEconomySchedule {
  const result = createRecurringEconomySchedule({
    scheduleId: input.id ?? scheduleId("main"),
    organizationId: organizationAId,
    category: input.category as RecurringEconomySchedule["category"],
    source: input.source,
    amount: input.amount,
    periodTicks: input.periodTicks ?? periodTicks,
    nextDueTick: input.nextDueTick ?? dueTick,
    active: input.active ?? true,
  });

  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.value;
}

function existingTransaction(id = transactionId("existing")): MoneyTransaction {
  const result = createMoneyTransaction({
    transactionId: id,
    organizationId: organizationAId,
    recordedAtTick: dueTick,
    amount: 10,
    balanceBefore: 90,
    balanceAfter: 100,
    category: MoneyTransactionCategory.RecurringIncome,
    source: recurringIncomeSource(),
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
    organizationId: schedule.organizationId,
    dueTick: schedule.nextDueTick,
    processedAtTick: currentTick,
    status: RecurringEconomyProcessingStatus.Applied,
    amount: schedule.amount,
    category: schedule.category,
    source: schedule.source,
    transactionId: transactionId("already_processed"),
  });

  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.value;
}

function execute(input: {
  readonly schedule: RecurringEconomySchedule;
  readonly organizations?: readonly OrganizationState[];
  readonly transactions?: readonly MoneyTransaction[];
  readonly processingRecords?: readonly RecurringEconomyProcessingRecord[];
  readonly schedules?: readonly RecurringEconomySchedule[];
  readonly id?: ReturnType<typeof transactionId>;
  readonly tick?: ReturnType<typeof parseSimulationTick>;
}) {
  return executeRecurringEconomyRuntime({
    currentTick: input.tick ?? currentTick,
    transactionId: input.id ?? transactionId("new"),
    scheduleId: input.schedule.scheduleId,
    organizations: input.organizations ?? createOrganizations(),
    transactions: input.transactions ?? Object.freeze([]),
    processingRecords: input.processingRecords ?? Object.freeze([]),
    schedules: input.schedules ?? Object.freeze([input.schedule]),
  });
}

function expectFailureLeavesInputsUnchanged(input: {
  readonly schedule: RecurringEconomySchedule;
  readonly expectedCode: DomainErrorCode;
  readonly organizations?: readonly OrganizationState[];
  readonly transactions?: readonly MoneyTransaction[];
  readonly processingRecords?: readonly RecurringEconomyProcessingRecord[];
  readonly schedules?: readonly RecurringEconomySchedule[];
  readonly id?: ReturnType<typeof transactionId>;
  readonly tick?: ReturnType<typeof parseSimulationTick>;
}) {
  const organizations = input.organizations ?? createOrganizations();
  const transactions = input.transactions ?? Object.freeze([]);
  const processingRecords = input.processingRecords ?? Object.freeze([]);
  const schedules = input.schedules ?? Object.freeze([input.schedule]);
  const organizationMoney = organizations[0]?.money;

  const result = execute({
    schedule: input.schedule,
    organizations,
    transactions,
    processingRecords,
    schedules,
    ...(input.id === undefined ? {} : { id: input.id }),
    ...(input.tick === undefined ? {} : { tick: input.tick }),
  });

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.code).toBe(input.expectedCode);
  }
  expect(organizations[0]?.money).toBe(organizationMoney);
  expect(transactions).toHaveLength(input.transactions?.length ?? 0);
  expect(processingRecords).toHaveLength(input.processingRecords?.length ?? 0);
  expect(schedules).toHaveLength(input.schedules?.length ?? 1);
}

describe("recurring economy runtime", () => {
  it("executes a due recurring income period and propagates domain state", () => {
    const schedule = makeSchedule({
      amount: 30,
      category: MoneyTransactionCategory.RecurringIncome,
      source: recurringIncomeSource(),
    });
    const previousTransaction = existingTransaction();
    const transactions = Object.freeze([previousTransaction]);
    const result = execute({ schedule, transactions });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }

    expect(result.value.processingStatus).toBe(RecurringEconomyProcessingStatus.Applied);
    expect(result.value.organizations[0]?.money).toBe(130);
    expect(result.value.organizations[1]?.money).toBe(250);
    expect(result.value.transactions).toHaveLength(2);
    expect(result.value.transactions[0]).toBe(previousTransaction);
    expect(result.value.transactions[1]).toMatchObject({
      transactionId: transactionId("new"),
      amount: 30,
      balanceBefore: 100,
      balanceAfter: 130,
      category: MoneyTransactionCategory.RecurringIncome,
    });
    expect(result.value.processingRecords).toHaveLength(1);
    expect(result.value.processingRecords[0]).toMatchObject({
      status: RecurringEconomyProcessingStatus.Applied,
      transactionId: transactionId("new"),
    });
    expect(result.value.schedules[0]?.nextDueTick).toBe(dueTick + periodTicks);
    expect(result.value.events.map((event) => event.type)).toEqual([
      DomainEventType.OrganizationMoneyTransactionRecorded,
      DomainEventType.RecurringEconomyPeriodProcessed,
    ]);
  });

  it.each([
    ["crew upkeep", MoneyTransactionCategory.CrewUpkeep, -15, crewUpkeepSource],
    ["business upkeep", MoneyTransactionCategory.BusinessUpkeep, -20, businessUpkeepSource],
    ["hideout upkeep", MoneyTransactionCategory.HideoutUpkeep, -12, hideoutUpkeepSource],
  ])("executes applied %s through the domain scheduler", (_label, category, amount, source) => {
    const schedule = makeSchedule({
      id: scheduleId(String(category)),
      amount,
      category,
      source: source(),
    });
    const result = execute({ schedule });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }

    expect(result.value.processingStatus).toBe(RecurringEconomyProcessingStatus.Applied);
    expect(result.value.transactions).toHaveLength(1);
    expect(result.value.processingRecords[0]).toMatchObject({
      category,
      amount,
      status: RecurringEconomyProcessingStatus.Applied,
    });
  });

  it("propagates unpaid processing without creating a transaction or money event", () => {
    const schedule = makeSchedule({
      amount: -25,
      category: MoneyTransactionCategory.CrewUpkeep,
      source: crewUpkeepSource(),
    });
    const organizations = createOrganizations(10);
    const transactions = Object.freeze([existingTransaction()]);
    const result = execute({ schedule, organizations, transactions });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }

    expect(result.value.processingStatus).toBe(RecurringEconomyProcessingStatus.Unpaid);
    expect(result.value.organizations).toBe(organizations);
    expect(result.value.organizations[0]?.money).toBe(10);
    expect(result.value.transactions).toBe(transactions);
    expect(result.value.processingRecords).toHaveLength(1);
    expect(result.value.processingRecords[0]).toMatchObject({
      status: RecurringEconomyProcessingStatus.Unpaid,
      amount: -25,
    });
    expect(result.value.events.map((event) => event.type)).toEqual([
      DomainEventType.RecurringEconomyPeriodProcessed,
    ]);
  });

  it("returns domain failures without runtime state or event aggregation", () => {
    const schedule = makeSchedule({
      amount: 20,
      category: MoneyTransactionCategory.RecurringIncome,
      source: recurringIncomeSource(),
    });

    expectFailureLeavesInputsUnchanged({
      schedule,
      schedules: Object.freeze([]),
      expectedCode: DomainErrorCode.RecurringEconomyScheduleNotFound,
    });

    expectFailureLeavesInputsUnchanged({
      schedule: makeSchedule({
        id: scheduleId("inactive"),
        amount: 20,
        category: MoneyTransactionCategory.RecurringIncome,
        source: recurringIncomeSource(),
        active: false,
      }),
      expectedCode: DomainErrorCode.RecurringEconomyScheduleInactive,
    });

    expectFailureLeavesInputsUnchanged({
      schedule,
      tick: parseSimulationTick(9),
      expectedCode: DomainErrorCode.RecurringEconomyPeriodNotDue,
    });

    expectFailureLeavesInputsUnchanged({
      schedule,
      processingRecords: Object.freeze([existingProcessingRecord(schedule)]),
      expectedCode: DomainErrorCode.RecurringEconomyPeriodAlreadyProcessed,
    });

    const duplicateTransaction = existingTransaction(transactionId("duplicate"));
    expectFailureLeavesInputsUnchanged({
      schedule,
      transactions: Object.freeze([duplicateTransaction]),
      id: duplicateTransaction.transactionId,
      expectedCode: DomainErrorCode.MoneyTransactionDuplicateTransactionId,
    });

    const overflowSchedule = makeSchedule({
      id: scheduleId("overflow"),
      amount: 20,
      category: MoneyTransactionCategory.RecurringIncome,
      source: recurringIncomeSource(),
      nextDueTick: parseSimulationTick(Number.MAX_SAFE_INTEGER),
      periodTicks: 1,
    });
    expectFailureLeavesInputsUnchanged({
      schedule: overflowSchedule,
      tick: parseSimulationTick(Number.MAX_SAFE_INTEGER),
      expectedCode: DomainErrorCode.RecurringEconomyScheduleAdvanceInvalid,
    });
  });

  it("preserves event ordering and matches direct domain orchestration", () => {
    const schedule = makeSchedule({
      amount: 20,
      category: MoneyTransactionCategory.RecurringIncome,
      source: recurringIncomeSource(),
    });
    const organizations = createOrganizations();
    const transactions = Object.freeze([existingTransaction()]);
    const processingRecords = Object.freeze(
      [] satisfies readonly RecurringEconomyProcessingRecord[],
    );
    const schedules = Object.freeze([schedule]);
    const id = transactionId("compare");

    const runtime = executeRecurringEconomyRuntime({
      currentTick,
      transactionId: id,
      scheduleId: schedule.scheduleId,
      organizations,
      transactions,
      processingRecords,
      schedules,
    });
    const domain = processRecurringEconomyDuePeriod({
      currentTick,
      transactionId: id,
      scheduleId: schedule.scheduleId,
      organizations,
      transactions,
      processingRecords,
      schedules,
    });

    expect(runtime.ok).toBe(true);
    expect(domain.ok).toBe(true);
    if (!runtime.ok || !domain.ok) {
      throw new Error("expected runtime and domain processing to succeed");
    }

    expect(runtime.value).toEqual({
      schedules: domain.value.schedules,
      processingRecords: domain.value.processingRecords,
      organizations: domain.value.organizations,
      transactions: domain.value.transactions,
      events: domain.value.events,
      processingStatus: domain.value.processingRecord.status,
    });
    expect(runtime.value.events.map((event) => event.type)).toEqual(
      domain.value.events.map((event) => event.type),
    );
  });

  it("is deterministic and returns immutable runtime success data", () => {
    const input = {
      schedule: makeSchedule({
        amount: 30,
        category: MoneyTransactionCategory.RecurringIncome,
        source: recurringIncomeSource(),
      }),
      organizations: createOrganizations(),
      transactions: Object.freeze([existingTransaction()]),
      processingRecords: Object.freeze([] satisfies readonly RecurringEconomyProcessingRecord[]),
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
    expect(input.transactions).toHaveLength(1);
    expect(input.processingRecords).toHaveLength(0);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.value)).toBe(true);
    expect(Object.isFrozen(first.value.events)).toBe(true);
    expect(Object.isFrozen(first.value.schedules)).toBe(true);
    expect(Object.isFrozen(first.value.processingRecords)).toBe(true);
    expect(Object.isFrozen(first.value.organizations)).toBe(true);
    expect(Object.isFrozen(first.value.transactions)).toBe(true);
  });
});
