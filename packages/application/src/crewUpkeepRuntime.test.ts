import { describe, expect, it } from "vitest";

import { canonicalMvpCrewUpkeepDefinition } from "@crimeworld/content";
import {
  DomainErrorCode,
  DomainEventType,
  MoneyTransactionCategory,
  MoneyTransactionSourceType,
  RecurringEconomyProcessingStatus,
  createCharacterState,
  createMoneyTransaction,
  createOrganizationState,
  createRecurringEconomyProcessingRecord,
  createRecurringEconomySchedule,
  generateCrewUpkeepSchedules,
  parseCharacterId,
  parseMoneySourceId,
  parseOrganizationId,
  parseRecurringEconomyScheduleId,
  parseSimulationTick,
  parseTransactionId,
  type CharacterState,
  type MoneyTransaction,
  type OrganizationState,
  type RecurringEconomyProcessingRecord,
  type RecurringEconomySchedule,
} from "@crimeworld/domain";

import { executeCrewUpkeepPeriod } from "./recurringEconomyRuntime";

const organizationId = parseOrganizationId("organization:runtime_crew_upkeep");
const leaderId = parseCharacterId("character:runtime_crew_leader");
const memberId = parseCharacterId("character:runtime_crew_member");
const otherMemberId = parseCharacterId("character:runtime_crew_other");
const dueTick = parseSimulationTick(30);
const currentTick = parseSimulationTick(30);

function scheduleId(suffix = "member") {
  return parseRecurringEconomyScheduleId(`recurring-schedule:runtime-crew:${suffix}`);
}

function transactionId(suffix = "new") {
  return parseTransactionId(`transaction:runtime-crew:${suffix}`);
}

function makeOrganization(money = 100): OrganizationState {
  return createOrganizationState({
    organizationId,
    displayName: "Runtime Crew Upkeep",
    leaderCharacterId: leaderId,
    memberCharacterIds: [leaderId, memberId],
    money,
    operationalCapacity: 2,
  });
}

function makeCharacter(characterId: typeof leaderId): CharacterState {
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

function makeSchedules(
  input: { readonly active?: boolean; readonly nextDueTick?: typeof dueTick } = {},
) {
  const result = generateCrewUpkeepSchedules({
    organizationId,
    organizations: Object.freeze([makeOrganization()]),
    characters: Object.freeze([makeCharacter(leaderId), makeCharacter(memberId)]),
    schedules: Object.freeze([]),
    definition: canonicalMvpCrewUpkeepDefinition,
    firstDueTick: input.nextDueTick ?? dueTick,
    scheduleIdsByCharacterId: Object.freeze({
      [leaderId]: scheduleId("leader"),
      [memberId]: scheduleId("member"),
    }),
  });

  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
  }

  if (input.active === false) {
    return Object.freeze(
      result.value.schedules.map((schedule) =>
        schedule.source.type === MoneyTransactionSourceType.CrewUpkeep &&
        schedule.source.characterId === memberId
          ? createSchedule({ ...schedule, active: false })
          : schedule,
      ),
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
      sourceId: parseMoneySourceId("runtime-crew:income"),
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
    readonly characterId?: typeof memberId;
    readonly id?: ReturnType<typeof transactionId>;
    readonly tick?: typeof currentTick;
  } = {},
) {
  return executeCrewUpkeepPeriod({
    currentTick: input.tick ?? currentTick,
    transactionId: input.id ?? transactionId("new"),
    organizationId,
    characterId: input.characterId ?? memberId,
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
  expect(schedules).toHaveLength(input?.schedules?.length ?? 2);
}

describe("crew upkeep runtime", () => {
  it("executes one paid crew-upkeep period through the recurring economy runtime", () => {
    const schedules = makeSchedules();
    const result = execute({ schedules });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }

    expect(result.value.processingStatus).toBe(RecurringEconomyProcessingStatus.Applied);
    expect(result.value.organizations[0]?.money).toBe(
      100 - canonicalMvpCrewUpkeepDefinition.amountPerCharacter,
    );
    expect(result.value.transactions).toHaveLength(1);
    expect(result.value.transactions[0]).toMatchObject({
      transactionId: transactionId("new"),
      amount: -canonicalMvpCrewUpkeepDefinition.amountPerCharacter,
      category: MoneyTransactionCategory.CrewUpkeep,
      balanceBefore: 100,
      balanceAfter: 95,
      source: { type: MoneyTransactionSourceType.CrewUpkeep, characterId: memberId },
    });
    expect(result.value.processingRecords).toHaveLength(1);
    expect(result.value.processingRecords[0]).toMatchObject({
      status: RecurringEconomyProcessingStatus.Applied,
      transactionId: transactionId("new"),
    });
    expect(result.value.schedules[1]?.nextDueTick).toBe(
      dueTick + canonicalMvpCrewUpkeepDefinition.periodTicks,
    );
    expect(result.value.events.map((event) => event.type)).toEqual([
      DomainEventType.OrganizationMoneyTransactionRecorded,
      DomainEventType.RecurringEconomyPeriodProcessed,
    ]);
    expect(
      result.value.transactions[0]!.balanceAfter - result.value.transactions[0]!.balanceBefore,
    ).toBe(result.value.transactions[0]!.amount);
  });

  it("records unpaid crew upkeep without a transaction when funds are insufficient", () => {
    const result = execute({ organizations: Object.freeze([makeOrganization(2)]) });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }

    expect(result.value.processingStatus).toBe(RecurringEconomyProcessingStatus.Unpaid);
    expect(result.value.organizations[0]?.money).toBe(2);
    expect(result.value.transactions).toHaveLength(0);
    expect(result.value.processingRecords[0]).toMatchObject({
      status: RecurringEconomyProcessingStatus.Unpaid,
      amount: -canonicalMvpCrewUpkeepDefinition.amountPerCharacter,
    });
    expect(result.value.events.map((event) => event.type)).toEqual([
      DomainEventType.RecurringEconomyPeriodProcessed,
    ]);
  });

  it("returns focused and delegated failures without partial state", () => {
    expectFailureLeavesInputsUnchanged(
      { characterId: otherMemberId },
      DomainErrorCode.CrewUpkeepRuntimeScheduleNotFound,
    );

    expectFailureLeavesInputsUnchanged(
      { schedules: makeSchedules({ active: false }) },
      DomainErrorCode.RecurringEconomyScheduleInactive,
    );

    expectFailureLeavesInputsUnchanged(
      { tick: parseSimulationTick(29) },
      DomainErrorCode.RecurringEconomyPeriodNotDue,
    );

    const schedules = makeSchedules();
    expectFailureLeavesInputsUnchanged(
      { schedules, processingRecords: Object.freeze([existingProcessingRecord(schedules[1]!)]) },
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
      ...schedules[1]!,
      nextDueTick: parseSimulationTick(Number.MAX_SAFE_INTEGER),
      periodTicks: 1,
    });
    expectFailureLeavesInputsUnchanged(
      {
        schedules: Object.freeze([schedules[0]!, overflowSchedule]),
        tick: parseSimulationTick(Number.MAX_SAFE_INTEGER),
      },
      DomainErrorCode.RecurringEconomyScheduleAdvanceInvalid,
    );
  });

  it("rejects ambiguous matching crew schedules", () => {
    const schedules = makeSchedules();
    const duplicate = createSchedule({
      ...schedules[1]!,
      scheduleId: scheduleId("duplicate-member"),
    });

    expectFailureLeavesInputsUnchanged(
      { schedules: Object.freeze([...schedules, duplicate]) },
      DomainErrorCode.CrewUpkeepRuntimeScheduleConflict,
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
