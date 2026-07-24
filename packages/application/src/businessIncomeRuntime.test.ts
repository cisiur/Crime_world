import { describe, expect, it } from "vitest";

import {
  canonicalMvpBusinessIncomeDefinitions,
  type BusinessIncomeDefinition,
} from "@crimeworld/content";
import {
  DomainErrorCode,
  DomainEventType,
  MoneyTransactionCategory,
  MoneyTransactionSourceType,
  RecurringEconomyProcessingStatus,
  assertDomainEventInvariant,
  createBusinessState,
  createOrganizationState,
  generateBusinessIncomeSchedules,
  parseBusinessId,
  parseCharacterId,
  parseLocationId,
  parseOrganizationId,
  parseRecurringEconomyScheduleId,
  parseSimulationTick,
  parseTransactionId,
  type BusinessState,
  type SimulationTick,
  type MoneyTransaction,
  type OrganizationState,
  type RecurringEconomyProcessingRecord,
  type RecurringEconomySchedule,
} from "@crimeworld/domain";

import { executeBusinessIncomePeriod } from "./recurringEconomyRuntime";

const organizationId = parseOrganizationId("organization:business_runtime");
const leaderId = parseCharacterId("character:business_runtime_leader");
const businessId = parseBusinessId("business:corner_shop");
const dueTick = parseSimulationTick(60);
const definition = canonicalMvpBusinessIncomeDefinitions[0]!;

describe("business income runtime", () => {
  it("executes one successful due business income period through the ledger", () => {
    const business = makeBusiness(organizationId);
    const schedules = makeSchedules(business, definition);
    const result = execute({
      business,
      businesses: Object.freeze([business]),
      schedules,
      randomStateSnapshot: "unused",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.processingStatus).toBe(RecurringEconomyProcessingStatus.Applied);
    expect(result.value.organizations[0]?.money).toBe(120);
    expect(result.value.transactions).toHaveLength(1);
    expect(result.value.transactions[0]).toMatchObject({
      transactionId: parseTransactionId("transaction:business-income:new"),
      organizationId,
      recordedAtTick: dueTick,
      amount: 20,
      balanceBefore: 100,
      balanceAfter: 120,
      category: MoneyTransactionCategory.BusinessIncome,
      source: { type: MoneyTransactionSourceType.BusinessIncome, businessId },
    });
    expect(result.value.processingRecords).toHaveLength(1);
    expect(result.value.processingRecords[0]).toMatchObject({
      status: RecurringEconomyProcessingStatus.Applied,
      transactionId: parseTransactionId("transaction:business-income:new"),
      source: { type: MoneyTransactionSourceType.BusinessIncome, businessId },
    });
    expect(result.value.schedules[0]?.nextDueTick).toBe(dueTick + 144);
    expect(result.value.events.map((event) => event.type)).toEqual([
      DomainEventType.OrganizationMoneyTransactionRecorded,
      DomainEventType.RecurringEconomyPeriodProcessed,
    ]);
    for (const event of result.value.events) {
      expect(() => assertDomainEventInvariant(event)).not.toThrow();
    }
  });

  const rejectionCases: readonly RuntimeRejectionCase[] = [
    {
      caseName: "not due",
      input: { tick: parseSimulationTick(59) },
      expectedCode: DomainErrorCode.RecurringEconomyPeriodNotDue,
    },
    {
      caseName: "definition mismatch",
      input: { definition: canonicalMvpBusinessIncomeDefinitions[1]! },
      expectedCode: DomainErrorCode.BusinessIncomeRuntimeDefinitionMismatch,
    },
    {
      caseName: "unowned business",
      input: { business: makeBusiness(null) },
      expectedCode: DomainErrorCode.BusinessIncomeRuntimeScheduleMismatch,
    },
    {
      caseName: "missing schedule",
      input: { schedules: [] },
      expectedCode: DomainErrorCode.BusinessIncomeRuntimeScheduleNotFound,
    },
  ];

  it.each(rejectionCases)("rejects $caseName atomically", ({ input, expectedCode }) => {
    const business = input.business ?? makeBusiness(organizationId);
    const schedules =
      input.schedules === undefined
        ? makeSchedules(makeBusiness(organizationId), definition)
        : Object.freeze(input.schedules);
    const organizations = Object.freeze([makeOrganization()]);
    const transactions = Object.freeze([] satisfies readonly MoneyTransaction[]);
    const processingRecords = Object.freeze(
      [] satisfies readonly RecurringEconomyProcessingRecord[],
    );

    const result = execute({
      business,
      businesses: Object.freeze([business]),
      schedules,
      organizations,
      transactions,
      processingRecords,
      ...(input.tick === undefined ? {} : { tick: input.tick }),
      ...(input.definition === undefined ? {} : { definition: input.definition }),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe(expectedCode);
    expect(organizations[0]?.money).toBe(100);
    expect(transactions).toHaveLength(0);
    expect(processingRecords).toHaveLength(0);
  });
});

interface RuntimeRejectionCase {
  readonly caseName: string;
  readonly input: {
    readonly business?: BusinessState;
    readonly definition?: BusinessIncomeDefinition;
    readonly schedules?: readonly RecurringEconomySchedule[];
    readonly tick?: SimulationTick;
  };
  readonly expectedCode: DomainErrorCode;
}

function execute(input: {
  readonly business: BusinessState;
  readonly businesses: readonly BusinessState[];
  readonly schedules: readonly RecurringEconomySchedule[];
  readonly organizations?: readonly OrganizationState[];
  readonly transactions?: readonly MoneyTransaction[];
  readonly processingRecords?: readonly RecurringEconomyProcessingRecord[];
  readonly tick?: ReturnType<typeof parseSimulationTick>;
  readonly definition?: BusinessIncomeDefinition;
  readonly randomStateSnapshot?: unknown;
}) {
  return executeBusinessIncomePeriod({
    currentTick: input.tick ?? dueTick,
    transactionId: parseTransactionId("transaction:business-income:new"),
    business: input.business,
    businessLocationArchetypeId: "business-location-archetype:small_shop_service",
    definition: input.definition ?? definition,
    businesses: input.businesses,
    organizations: input.organizations ?? Object.freeze([makeOrganization()]),
    transactions: input.transactions ?? Object.freeze([]),
    processingRecords: input.processingRecords ?? Object.freeze([]),
    schedules: input.schedules,
  });
}

function makeBusiness(ownerOrganizationId: typeof organizationId | null): BusinessState {
  return createBusinessState({
    businessId,
    locationId: parseLocationId("location:corner_shop"),
    ownerOrganizationId,
  });
}

function makeOrganization(): OrganizationState {
  return createOrganizationState({
    organizationId,
    displayName: "Business Runtime Org",
    leaderCharacterId: leaderId,
    memberCharacterIds: [leaderId],
    money: 100,
    operationalCapacity: 2,
  });
}

function makeSchedules(
  business: BusinessState,
  incomeDefinition: BusinessIncomeDefinition,
): readonly RecurringEconomySchedule[] {
  const result = generateBusinessIncomeSchedules({
    businesses: Object.freeze([business]),
    organizations: Object.freeze([makeOrganization()]),
    schedules: Object.freeze([]),
    definitions: Object.freeze([
      {
        businessId: business.businessId,
        ownerOrganizationId: organizationId,
        amount: incomeDefinition.amount,
        periodTicks: incomeDefinition.periodTicks,
      },
    ]),
    firstDueTick: dueTick,
    scheduleIdsByBusinessId: {
      [business.businessId]: parseRecurringEconomyScheduleId(
        "recurring-schedule:business-income:corner_shop",
      ),
    },
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value.schedules;
}
