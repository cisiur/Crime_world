import { describe, expect, it } from "vitest";

import {
  DomainErrorCode,
  MoneyTransactionCategory,
  MoneyTransactionSourceType,
  createBusinessState,
  createOrganizationState,
  createRecurringEconomySchedule,
  generateBusinessIncomeSchedules,
  parseBusinessId,
  parseCharacterId,
  parseLocationId,
  parseOrganizationId,
  parseRecurringEconomyScheduleId,
  parseSimulationTick,
  type BusinessIncomeScheduleDefinition,
  type BusinessState,
  type OrganizationId,
  type RecurringEconomySchedule,
} from "./index";

const orgA = parseOrganizationId("organization:business_income_a");
const orgB = parseOrganizationId("organization:business_income_b");
const leaderA = parseCharacterId("character:business_income_a_leader");
const leaderB = parseCharacterId("character:business_income_b_leader");
const businessShop = parseBusinessId("business:corner_store");
const businessBar = parseBusinessId("business:old_row_bar");
const businessHideout = parseBusinessId("business:hideout");
const firstDueTick = parseSimulationTick(25);

describe("business income schedule generation", () => {
  it("generates one active schedule for one owned eligible business", () => {
    const result = generate({
      businesses: Object.freeze([business(businessShop, orgA)]),
      definitions: Object.freeze([definition(businessShop, orgA, 20)]),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.generatedSchedules).toHaveLength(1);
    expect(result.value.generatedSchedules[0]).toMatchObject({
      scheduleId: scheduleId("shop"),
      organizationId: orgA,
      category: MoneyTransactionCategory.BusinessIncome,
      amount: 20,
      periodTicks: 144,
      nextDueTick: firstDueTick,
      active: true,
      source: { type: MoneyTransactionSourceType.BusinessIncome, businessId: businessShop },
    });
  });

  it("does not generate schedules for unowned or non-income businesses", () => {
    const result = generate({
      businesses: Object.freeze([business(businessShop, null), business(businessHideout, orgA)]),
      definitions: Object.freeze([]),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.generatedSchedules).toEqual([]);
    expect(result.value.schedules).toEqual([]);
  });

  it("reuses an exact matching schedule and preserves existing order", () => {
    const existing = makeSchedule(businessShop, orgA, scheduleId("shop"), 20);
    const unrelated = makeSchedule(businessBar, orgB, scheduleId("bar"), 60);
    const schedules = Object.freeze([unrelated, existing]);
    const result = generate({
      businesses: Object.freeze([business(businessShop, orgA)]),
      definitions: Object.freeze([definition(businessShop, orgA, 20)]),
      schedules,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.generatedSchedules).toEqual([]);
    expect(result.value.reusedSchedules).toEqual([existing]);
    expect(result.value.schedules).toEqual(schedules);
  });

  it("generates multiple schedules in business order after existing schedules", () => {
    const existing = makeSchedule(businessHideout, orgB, scheduleId("existing"), 10);
    const result = generate({
      businesses: Object.freeze([business(businessBar, orgB), business(businessShop, orgA)]),
      definitions: Object.freeze([
        definition(businessShop, orgA, 20),
        definition(businessBar, orgB, 60),
      ]),
      schedules: Object.freeze([existing]),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.schedules[0]).toBe(existing);
    expect(result.value.generatedSchedules.map((schedule) => schedule.source)).toEqual([
      { type: MoneyTransactionSourceType.BusinessIncome, businessId: businessBar },
      { type: MoneyTransactionSourceType.BusinessIncome, businessId: businessShop },
    ]);
    expect(result).toEqual(
      generate({
        businesses: Object.freeze([business(businessBar, orgB), business(businessShop, orgA)]),
        definitions: Object.freeze([
          definition(businessShop, orgA, 20),
          definition(businessBar, orgB, 60),
        ]),
        schedules: Object.freeze([existing]),
      }),
    );
  });

  const rejectionCases: readonly ScheduleRejectionCase[] = [
    {
      caseName: "missing business",
      input: { definitions: [definition(parseBusinessId("business:missing"), orgA, 20)] },
      expectedCode: DomainErrorCode.BusinessIncomeScheduleGenerationMissingBusiness,
    },
    {
      caseName: "missing organization",
      input: {
        definitions: [definition(businessShop, parseOrganizationId("organization:missing"), 20)],
        businesses: [business(businessShop, parseOrganizationId("organization:missing"))],
      },
      expectedCode: DomainErrorCode.BusinessIncomeScheduleGenerationMissingOrganization,
    },
    {
      caseName: "invalid amount",
      input: { definitions: [definition(businessShop, orgA, 0)] },
      expectedCode: DomainErrorCode.BusinessIncomeScheduleGenerationInvalidDefinition,
    },
    {
      caseName: "invalid interval",
      input: { definitions: [{ ...definition(businessShop, orgA, 20), periodTicks: 0 }] },
      expectedCode: DomainErrorCode.BusinessIncomeScheduleGenerationInvalidDefinition,
    },
    {
      caseName: "invalid first due",
      input: { firstDueTick: -1 as ReturnType<typeof parseSimulationTick> },
      expectedCode: DomainErrorCode.BusinessIncomeScheduleGenerationInvalidFirstDueTick,
    },
    {
      caseName: "missing schedule id",
      input: { scheduleIdsByBusinessId: {} },
      expectedCode: DomainErrorCode.BusinessIncomeScheduleGenerationInvalidScheduleId,
    },
  ];

  it.each(rejectionCases)("rejects $caseName atomically", ({ input, expectedCode }) => {
    const businesses = Object.freeze(input.businesses ?? [business(businessShop, orgA)]);
    const definitions = Object.freeze(input.definitions ?? [definition(businessShop, orgA, 20)]);
    const result = generate({
      businesses,
      definitions,
      ...(input.firstDueTick === undefined ? {} : { firstDueTick: input.firstDueTick }),
      ...(input.scheduleIdsByBusinessId === undefined
        ? {}
        : { scheduleIdsByBusinessId: input.scheduleIdsByBusinessId }),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe(expectedCode);
    expect(businesses[0]?.ownerOrganizationId).toBe(
      (input.businesses?.[0] ?? business(businessShop, orgA)).ownerOrganizationId,
    );
  });

  it("rejects duplicate, conflicting, and reused schedule IDs", () => {
    const duplicateExisting = Object.freeze([
      makeSchedule(businessShop, orgA, scheduleId("shop"), 20),
      makeSchedule(businessShop, orgA, scheduleId("dupe"), 20),
    ]);
    expect(generate({ schedules: duplicateExisting }).ok).toBe(false);

    const reusedId = makeSchedule(businessBar, orgB, scheduleId("shop"), 60);
    const reusedIdResult = generate({ schedules: Object.freeze([reusedId]) });
    expect(reusedIdResult.ok).toBe(false);
    if (!reusedIdResult.ok) {
      expect(reusedIdResult.error.code).toBe(
        DomainErrorCode.BusinessIncomeScheduleGenerationScheduleConflict,
      );
    }

    const conflicting = makeSchedule(businessShop, orgA, scheduleId("shop"), 25);
    const conflictResult = generate({ schedules: Object.freeze([conflicting]) });
    expect(conflictResult.ok).toBe(false);
  });
});

interface ScheduleRejectionCase {
  readonly caseName: string;
  readonly input: {
    readonly businesses?: readonly BusinessState[];
    readonly definitions?: readonly BusinessIncomeScheduleDefinition[];
    readonly firstDueTick?: ReturnType<typeof parseSimulationTick>;
    readonly scheduleIdsByBusinessId?: Readonly<Record<string, ReturnType<typeof scheduleId>>>;
  };
  readonly expectedCode: DomainErrorCode;
}

function generate(
  input: {
    readonly businesses?: readonly BusinessState[];
    readonly definitions?: readonly BusinessIncomeScheduleDefinition[];
    readonly schedules?: readonly RecurringEconomySchedule[];
    readonly firstDueTick?: ReturnType<typeof parseSimulationTick>;
    readonly scheduleIdsByBusinessId?: Readonly<Record<string, ReturnType<typeof scheduleId>>>;
  } = {},
) {
  return generateBusinessIncomeSchedules({
    businesses: input.businesses ?? Object.freeze([business(businessShop, orgA)]),
    organizations: organizations(),
    schedules: input.schedules ?? Object.freeze([]),
    definitions: input.definitions ?? Object.freeze([definition(businessShop, orgA, 20)]),
    firstDueTick: input.firstDueTick ?? firstDueTick,
    scheduleIdsByBusinessId: input.scheduleIdsByBusinessId ?? {
      [businessShop]: scheduleId("shop"),
      [businessBar]: scheduleId("bar"),
      [businessHideout]: scheduleId("hideout"),
    },
  });
}

function business(
  businessId: ReturnType<typeof parseBusinessId>,
  ownerOrganizationId: OrganizationId | null,
): BusinessState {
  return createBusinessState({
    businessId,
    locationId: parseLocationId(`location:${businessId.split(":")[1]}`),
    ownerOrganizationId,
  });
}

function definition(
  businessId: ReturnType<typeof parseBusinessId>,
  ownerOrganizationId: OrganizationId,
  amount: number,
): BusinessIncomeScheduleDefinition {
  return Object.freeze({ businessId, ownerOrganizationId, amount, periodTicks: 144 });
}

function makeSchedule(
  businessId: ReturnType<typeof parseBusinessId>,
  organizationId: OrganizationId,
  id: ReturnType<typeof scheduleId>,
  amount: number,
): RecurringEconomySchedule {
  const result = createRecurringEconomySchedule({
    scheduleId: id,
    organizationId,
    category: MoneyTransactionCategory.BusinessIncome,
    source: Object.freeze({ type: MoneyTransactionSourceType.BusinessIncome, businessId }),
    amount,
    periodTicks: 144,
    nextDueTick: firstDueTick,
    active: true,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

function scheduleId(suffix: string) {
  return parseRecurringEconomyScheduleId(`recurring-schedule:business-income:${suffix}`);
}

function organizations() {
  return Object.freeze([
    createOrganizationState({
      organizationId: orgA,
      displayName: "Business Income A",
      leaderCharacterId: leaderA,
      memberCharacterIds: [leaderA],
      money: 100,
      operationalCapacity: 2,
    }),
    createOrganizationState({
      organizationId: orgB,
      displayName: "Business Income B",
      leaderCharacterId: leaderB,
      memberCharacterIds: [leaderB],
      money: 100,
      operationalCapacity: 2,
    }),
  ]);
}
