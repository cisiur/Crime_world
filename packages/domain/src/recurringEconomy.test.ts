import { describe, expect, it } from "vitest";

import {
  DomainErrorCode,
  DomainEventType,
  MoneyTransactionCategory,
  MoneyTransactionSourceType,
  RecurringEconomyProcessingStatus,
  assertDomainEventInvariant,
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
} from "./index";

const organizationAId = parseOrganizationId("organization:recurring_a");
const organizationBId = parseOrganizationId("organization:recurring_b");
const leaderAId = parseCharacterId("character:recurring_leader_a");
const leaderBId = parseCharacterId("character:recurring_leader_b");
const crewMemberId = parseCharacterId("character:upkeep_001");
const businessId = parseBusinessId("business:upkeep_001");
const hideoutId = parseLocationId("location:hideout_upkeep_001");
const dueTick = parseSimulationTick(10);
const processedAtTick = parseSimulationTick(12);
const periodTicks = 5;

function createOrganizations(money = 100): readonly OrganizationState[] {
  return Object.freeze([
    createOrganizationState({
      organizationId: organizationAId,
      displayName: "Recurring Crew A",
      leaderCharacterId: leaderAId,
      memberCharacterIds: [leaderAId],
      money,
      operationalCapacity: 2,
    }),
    createOrganizationState({
      organizationId: organizationBId,
      displayName: "Recurring Crew B",
      leaderCharacterId: leaderBId,
      memberCharacterIds: [leaderBId],
      money: 250,
      operationalCapacity: 3,
    }),
  ]);
}

function scheduleId(suffix = "income") {
  return parseRecurringEconomyScheduleId(`recurring-schedule:${suffix}`);
}

function transactionId(suffix = "001") {
  return parseTransactionId(`transaction:recurring:${suffix}`);
}

function sourceId(value: string) {
  return parseMoneySourceId(value);
}

function recurringIncomeSource(): MoneyTransactionSource {
  return Object.freeze({
    type: MoneyTransactionSourceType.RecurringIncome,
    sourceId: sourceId("recurring:income_001"),
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
  readonly nextDueTick?: ReturnType<typeof parseSimulationTick>;
  readonly active?: boolean;
  readonly periodTicks?: number;
}): RecurringEconomySchedule {
  const result = createRecurringEconomySchedule({
    scheduleId: input.id ?? scheduleId("schedule_001"),
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
    processedAtTick,
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

function process(input: {
  readonly schedule: RecurringEconomySchedule;
  readonly organizations?: readonly OrganizationState[];
  readonly transactions?: readonly MoneyTransaction[];
  readonly processingRecords?: readonly RecurringEconomyProcessingRecord[];
  readonly schedules?: readonly RecurringEconomySchedule[];
  readonly id?: ReturnType<typeof transactionId>;
  readonly currentTick?: ReturnType<typeof parseSimulationTick>;
}) {
  return processRecurringEconomyDuePeriod({
    scheduleId: input.schedule.scheduleId,
    currentTick: input.currentTick ?? processedAtTick,
    transactionId: input.id ?? transactionId("new"),
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
  readonly currentTick?: ReturnType<typeof parseSimulationTick>;
}) {
  const organizations = input.organizations ?? createOrganizations();
  const transactions = input.transactions ?? Object.freeze([]);
  const processingRecords = input.processingRecords ?? Object.freeze([]);
  const schedules = input.schedules ?? Object.freeze([input.schedule]);
  const organizationsBefore = organizations;
  const transactionsBefore = transactions;
  const processingRecordsBefore = processingRecords;
  const schedulesBefore = schedules;

  const result = process({
    schedule: input.schedule,
    organizations,
    transactions,
    processingRecords,
    schedules,
    ...(input.id === undefined ? {} : { id: input.id }),
    ...(input.currentTick === undefined ? {} : { currentTick: input.currentTick }),
  });

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.code).toBe(input.expectedCode);
  }
  expect(organizations).toBe(organizationsBefore);
  expect(transactions).toBe(transactionsBefore);
  expect(processingRecords).toBe(processingRecordsBefore);
  expect(schedules).toBe(schedulesBefore);
  expect(organizations[0]?.money).toBe(input.organizations?.[0]?.money ?? 100);
  expect(transactions).toHaveLength(input.transactions?.length ?? 0);
  expect(processingRecords).toHaveLength(input.processingRecords?.length ?? 0);
}

describe("recurring economy", () => {
  it.each([
    ["recurring income", MoneyTransactionCategory.RecurringIncome, 30, recurringIncomeSource, 130],
    ["crew upkeep", MoneyTransactionCategory.CrewUpkeep, -15, crewUpkeepSource, 85],
    ["business upkeep", MoneyTransactionCategory.BusinessUpkeep, -20, businessUpkeepSource, 80],
    ["hideout upkeep", MoneyTransactionCategory.HideoutUpkeep, -12, hideoutUpkeepSource, 88],
  ])(
    "processes one due %s period through the ledger",
    (_label, category, amount, source, money) => {
      const schedule = makeSchedule({
        id: scheduleId(String(category)),
        amount,
        category,
        source: source(),
      });
      const previousTransaction = existingTransaction();
      const transactions = Object.freeze([previousTransaction]);
      const result = process({ schedule, transactions });

      expect(result.ok).toBe(true);
      if (!result.ok) {
        throw new Error(result.error.message);
      }

      const transaction = result.value.transaction;
      expect(transaction).toBeDefined();
      if (transaction === undefined) {
        throw new Error("Expected an applied recurring transaction.");
      }

      expect(result.value.organization?.money).toBe(money);
      expect(result.value.organizations).toHaveLength(2);
      expect(result.value.organizations[0]).toBe(result.value.organization);
      expect(result.value.organizations[1]).toMatchObject({
        organizationId: organizationBId,
        money: 250,
      });
      expect(result.value.transactions).toHaveLength(2);
      expect(result.value.transactions[0]).toBe(previousTransaction);
      expect(result.value.transactions[1]).toBe(transaction);
      expect(transaction).toMatchObject({
        transactionId: transactionId("new"),
        organizationId: organizationAId,
        recordedAtTick: processedAtTick,
        amount,
        balanceBefore: 100,
        balanceAfter: money,
        category,
        source: result.value.processingRecord.source,
      });
      expect(result.value.processingRecord).toEqual({
        scheduleId: schedule.scheduleId,
        organizationId: organizationAId,
        dueTick,
        processedAtTick,
        status: RecurringEconomyProcessingStatus.Applied,
        amount,
        category,
        source: transaction.source,
        transactionId: transactionId("new"),
      });
      expect(result.value.processingRecords).toEqual([result.value.processingRecord]);
      expect(result.value.schedule.nextDueTick).toBe(dueTick + periodTicks);
      expect(result.value.schedules).toEqual([result.value.schedule]);
      expect(result.value.events.map((event) => event.type)).toEqual([
        DomainEventType.OrganizationMoneyTransactionRecorded,
        DomainEventType.RecurringEconomyPeriodProcessed,
      ]);
      expect(result.value.events[1]).toEqual({
        type: DomainEventType.RecurringEconomyPeriodProcessed,
        scheduleId: schedule.scheduleId,
        organizationId: organizationAId,
        dueTick,
        processedAtTick,
        status: RecurringEconomyProcessingStatus.Applied,
        amount,
        category,
        source: result.value.processingRecord.source,
        transactionId: transactionId("new"),
      });
      for (const event of result.value.events) {
        expect(Object.isFrozen(event)).toBe(true);
        expect(() => assertDomainEventInvariant(event)).not.toThrow();
      }
      expect(transaction.balanceAfter - transaction.balanceBefore).toBe(amount);
    },
  );

  it("does not mutate inputs and returns immutable collections, records, schedules, and sources", () => {
    const source = recurringIncomeSource();
    const schedule = makeSchedule({
      amount: 10,
      category: MoneyTransactionCategory.RecurringIncome,
      source,
    });
    const organizations = createOrganizations();
    const schedules = Object.freeze([schedule]);
    const transactions = Object.freeze([existingTransaction()]);
    const processingRecords = Object.freeze(
      [] satisfies readonly RecurringEconomyProcessingRecord[],
    );
    const result = process({ schedule, organizations, transactions, processingRecords, schedules });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }

    expect(organizations[0]?.money).toBe(100);
    expect(transactions).toHaveLength(1);
    expect(processingRecords).toHaveLength(0);
    expect(schedule.nextDueTick).toBe(dueTick);
    expect(schedule.source).not.toBe(source);
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.schedules)).toBe(true);
    expect(Object.isFrozen(result.value.schedule)).toBe(true);
    expect(Object.isFrozen(result.value.schedule.source)).toBe(true);
    expect(Object.isFrozen(result.value.processingRecords)).toBe(true);
    expect(Object.isFrozen(result.value.processingRecord)).toBe(true);
    expect(Object.isFrozen(result.value.processingRecord.source)).toBe(true);
    expect(Object.isFrozen(result.value.transactions)).toBe(true);
    expect(Object.isFrozen(result.value.events)).toBe(true);
  });

  it("records insufficient funds as unpaid without mutating money or appending a transaction", () => {
    const schedule = makeSchedule({
      amount: -25,
      category: MoneyTransactionCategory.CrewUpkeep,
      source: crewUpkeepSource(),
    });
    const organizations = createOrganizations(10);
    const transactions = Object.freeze([existingTransaction()]);
    const result = process({ schedule, organizations, transactions });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }

    expect(result.value.organization).toBeUndefined();
    expect(result.value.transaction).toBeUndefined();
    expect(result.value.organizations).toBe(organizations);
    expect(result.value.transactions).toBe(transactions);
    expect(result.value.organizations[0]?.money).toBe(10);
    expect(result.value.transactions).toHaveLength(1);
    expect(result.value.processingRecord).toEqual({
      scheduleId: schedule.scheduleId,
      organizationId: organizationAId,
      dueTick,
      processedAtTick,
      status: RecurringEconomyProcessingStatus.Unpaid,
      amount: -25,
      category: MoneyTransactionCategory.CrewUpkeep,
      source: schedule.source,
    });
    expect(result.value.schedule.nextDueTick).toBe(dueTick + periodTicks);
    expect(result.value.events).toEqual([
      {
        type: DomainEventType.RecurringEconomyPeriodProcessed,
        scheduleId: schedule.scheduleId,
        organizationId: organizationAId,
        dueTick,
        processedAtTick,
        status: RecurringEconomyProcessingStatus.Unpaid,
        amount: -25,
        category: MoneyTransactionCategory.CrewUpkeep,
        source: schedule.source,
      },
    ]);
    expect(() => assertDomainEventInvariant(result.value.events[0]!)).not.toThrow();
  });

  it("rejects unknown, inactive, not-due, duplicate, ledger-failed, and overflow cases atomically", () => {
    const schedule = makeSchedule({
      amount: 20,
      category: MoneyTransactionCategory.RecurringIncome,
      source: recurringIncomeSource(),
    });

    expectFailureLeavesInputsUnchanged({
      schedule,
      expectedCode: DomainErrorCode.RecurringEconomyScheduleNotFound,
      schedules: Object.freeze([]),
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
      currentTick: parseSimulationTick(9),
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
      id: duplicateTransaction.transactionId,
      transactions: Object.freeze([duplicateTransaction]),
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
      currentTick: parseSimulationTick(Number.MAX_SAFE_INTEGER),
      expectedCode: DomainErrorCode.RecurringEconomyScheduleAdvanceInvalid,
    });
  });

  it("rejects invalid schedule and processing-record contracts", () => {
    const zeroAmount = createRecurringEconomySchedule({
      scheduleId: scheduleId("zero"),
      organizationId: organizationAId,
      category: MoneyTransactionCategory.RecurringIncome,
      source: recurringIncomeSource(),
      amount: 0,
      periodTicks,
      nextDueTick: dueTick,
      active: true,
    });
    expect(zeroAmount.ok).toBe(false);
    if (!zeroAmount.ok) {
      expect(zeroAmount.error.code).toBe(DomainErrorCode.MoneyTransactionInvalidAmount);
    }

    const invalidPeriod = createRecurringEconomySchedule({
      scheduleId: scheduleId("bad_period"),
      organizationId: organizationAId,
      category: MoneyTransactionCategory.RecurringIncome,
      source: recurringIncomeSource(),
      amount: 10,
      periodTicks: 0,
      nextDueTick: dueTick,
      active: true,
    });
    expect(invalidPeriod.ok).toBe(false);
    if (!invalidPeriod.ok) {
      expect(invalidPeriod.error.code).toBe(DomainErrorCode.RecurringEconomyScheduleInvalid);
    }

    const unsupportedCategory = createRecurringEconomySchedule({
      scheduleId: scheduleId("bad_category"),
      organizationId: organizationAId,
      category: MoneyTransactionCategory.OperationReward as RecurringEconomySchedule["category"],
      source: recurringIncomeSource(),
      amount: 10,
      periodTicks,
      nextDueTick: dueTick,
      active: true,
    });
    expect(unsupportedCategory.ok).toBe(false);
    if (!unsupportedCategory.ok) {
      expect(unsupportedCategory.error.code).toBe(DomainErrorCode.RecurringEconomyScheduleInvalid);
    }

    const unpaidWithTransaction = createRecurringEconomyProcessingRecord({
      scheduleId: scheduleId("bad_record"),
      organizationId: organizationAId,
      dueTick,
      processedAtTick,
      status: RecurringEconomyProcessingStatus.Unpaid,
      amount: -10,
      category: MoneyTransactionCategory.CrewUpkeep,
      source: crewUpkeepSource(),
      transactionId: transactionId("not_allowed"),
    });
    expect(unpaidWithTransaction.ok).toBe(false);
    if (!unpaidWithTransaction.ok) {
      expect(unpaidWithTransaction.error.code).toBe(
        DomainErrorCode.RecurringEconomyProcessingRecordInvalid,
      );
    }
  });

  it("creates deeply identical outputs for identical inputs", () => {
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

    const first = process(input);
    const second = process(input);

    expect(first).toEqual(second);
  });

  it("preserves organization isolation and ledger conservation across sequential periods", () => {
    const schedule = makeSchedule({
      amount: 25,
      category: MoneyTransactionCategory.RecurringIncome,
      source: recurringIncomeSource(),
    });
    const first = process({ schedule, id: transactionId("seq_001") });
    expect(first.ok).toBe(true);
    if (!first.ok) {
      throw new Error(first.error.message);
    }

    const second = process({
      schedule: first.value.schedule,
      organizations: first.value.organizations,
      transactions: first.value.transactions,
      processingRecords: first.value.processingRecords,
      schedules: first.value.schedules,
      currentTick: parseSimulationTick(15),
      id: transactionId("seq_002"),
    });
    expect(second.ok).toBe(true);
    if (!second.ok) {
      throw new Error(second.error.message);
    }

    const transactionDelta = second.value.transactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0,
    );
    expect(second.value.organizations[1]).toBe(first.value.organizations[1]);
    expect(second.value.organizations[1]?.money).toBe(250);
    expect(100 + transactionDelta).toBe(second.value.organization?.money);
    for (const transaction of second.value.transactions) {
      expect(transaction.balanceAfter - transaction.balanceBefore).toBe(transaction.amount);
    }
  });
});
