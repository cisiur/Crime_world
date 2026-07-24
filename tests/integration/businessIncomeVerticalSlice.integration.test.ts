import { describe, expect, it } from "vitest";

import {
  canonicalMvpBusinessIncomeDefinitions,
  validateBusinessIncomeDefinitions,
} from "@crimeworld/content";
import {
  DomainEventType,
  MoneyTransactionCategory,
  MoneyTransactionSourceType,
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
  transferBusinessOwnership,
} from "@crimeworld/domain";
import { executeBusinessIncomePeriod } from "@crimeworld/application";

describe("business income vertical slice", () => {
  it("transfers ownership, generates one schedule, and executes one due income period", () => {
    const organizationId = parseOrganizationId("organization:business_slice");
    const leaderId = parseCharacterId("character:business_slice_leader");
    const businessId = parseBusinessId("business:business_slice_shop");
    const business = createBusinessState({
      businessId,
      locationId: parseLocationId("location:business_slice_shop"),
      ownerOrganizationId: null,
    });
    const organization = createOrganizationState({
      organizationId,
      displayName: "Business Slice Crew",
      leaderCharacterId: leaderId,
      memberCharacterIds: [leaderId],
      money: 100,
      operationalCapacity: 2,
    });
    const definition = canonicalMvpBusinessIncomeDefinitions[0]!;

    expect(validateBusinessIncomeDefinitions(canonicalMvpBusinessIncomeDefinitions).valid).toBe(
      true,
    );

    const ownership = transferBusinessOwnership({
      businessId,
      newOwnerOrganizationId: organizationId,
      businesses: Object.freeze([business]),
      organizations: Object.freeze([organization]),
    });
    expect(ownership.ok).toBe(true);
    if (!ownership.ok) throw new Error(ownership.error.message);

    const scheduleGeneration = generateBusinessIncomeSchedules({
      businesses: ownership.value.businesses,
      organizations: Object.freeze([organization]),
      schedules: Object.freeze([]),
      definitions: Object.freeze([
        {
          businessId,
          ownerOrganizationId: organizationId,
          amount: definition.amount,
          periodTicks: definition.periodTicks,
        },
      ]),
      firstDueTick: parseSimulationTick(144),
      scheduleIdsByBusinessId: {
        [businessId]: parseRecurringEconomyScheduleId("recurring-schedule:business-slice:shop"),
      },
    });
    expect(scheduleGeneration.ok).toBe(true);
    if (!scheduleGeneration.ok) throw new Error(scheduleGeneration.error.message);

    const income = executeBusinessIncomePeriod({
      currentTick: parseSimulationTick(144),
      transactionId: parseTransactionId("transaction:business-slice:income"),
      business: ownership.value.business,
      businessLocationArchetypeId: definition.businessLocationArchetypeId,
      definition,
      businesses: ownership.value.businesses,
      organizations: Object.freeze([organization]),
      transactions: Object.freeze([]),
      processingRecords: Object.freeze([]),
      schedules: scheduleGeneration.value.schedules,
    });
    expect(income.ok).toBe(true);
    if (!income.ok) throw new Error(income.error.message);

    expect(ownership.value.events.map((event) => event.type)).toEqual([
      DomainEventType.BusinessOwnershipTransferred,
    ]);
    expect(income.value.events.map((event) => event.type)).toEqual([
      DomainEventType.OrganizationMoneyTransactionRecorded,
      DomainEventType.RecurringEconomyPeriodProcessed,
    ]);
    expect(income.value.organizations[0]?.money).toBe(120);
    expect(income.value.transactions[0]).toMatchObject({
      amount: 20,
      balanceBefore: 100,
      balanceAfter: 120,
      category: MoneyTransactionCategory.BusinessIncome,
      source: { type: MoneyTransactionSourceType.BusinessIncome, businessId },
    });
    expect(income.value.processingRecords).toHaveLength(1);
    expect(income.value.schedules[0]?.nextDueTick).toBe(288);
  });
});
