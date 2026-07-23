import { describe, expect, it } from "vitest";

import {
  DomainErrorCode,
  DomainEventType,
  MoneyTransactionCategory,
  MoneyTransactionSourceType,
  createMoneyTransaction,
  createOrganizationState,
  parseBusinessId,
  parseCharacterId,
  parseLocationId,
  parseMoneySourceId,
  parseOperationId,
  parseOpportunityId,
  parseOrganizationId,
  parseSimulationTick,
  parseTransactionId,
  recordMoneyTransaction,
  type MoneyTransaction,
  type MoneyTransactionCategory as MoneyTransactionCategoryType,
  type MoneyTransactionSource,
  type OrganizationState,
} from "./index";

const organizationAId = parseOrganizationId("organization:a");
const organizationBId = parseOrganizationId("organization:b");
const leaderAId = parseCharacterId("character:leader_a");
const leaderBId = parseCharacterId("character:leader_b");
const operationId = parseOperationId("operation:local_collection_001");
const characterId = parseCharacterId("character:crew_001");
const businessId = parseBusinessId("business:corner_store");
const locationId = parseLocationId("location:hideout_001");
const opportunityId = parseOpportunityId("opportunity:recruit_001");
const tick = parseSimulationTick(12);

function createOrganizations(): readonly OrganizationState[] {
  return Object.freeze([
    createOrganizationState({
      organizationId: organizationAId,
      displayName: "Crew A",
      leaderCharacterId: leaderAId,
      memberCharacterIds: [leaderAId],
      money: 100,
      operationalCapacity: 2,
    }),
    createOrganizationState({
      organizationId: organizationBId,
      displayName: "Crew B",
      leaderCharacterId: leaderBId,
      memberCharacterIds: [leaderBId],
      money: 250,
      operationalCapacity: 3,
    }),
  ]);
}

function sourceId(value: string = "source:bounded_001") {
  return parseMoneySourceId(value);
}

function operationRewardSource(): MoneyTransactionSource {
  return Object.freeze({
    type: MoneyTransactionSourceType.OperationGrossReward,
    operationId,
  });
}

function operationCostSource(): MoneyTransactionSource {
  return Object.freeze({
    type: MoneyTransactionSourceType.OperationStartCost,
    operationId,
  });
}

function recurringIncomeSource(): MoneyTransactionSource {
  return Object.freeze({
    type: MoneyTransactionSourceType.RecurringIncome,
    sourceId: sourceId("recurring:route_001"),
  });
}

function crewUpkeepSource(): MoneyTransactionSource {
  return Object.freeze({
    type: MoneyTransactionSourceType.CrewUpkeep,
    characterId,
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
    locationId,
  });
}

function recruitmentCharacterSource(): MoneyTransactionSource {
  return Object.freeze({
    type: MoneyTransactionSourceType.RecruitmentCharacterCost,
    characterId,
  });
}

function recruitmentOpportunitySource(): MoneyTransactionSource {
  return Object.freeze({
    type: MoneyTransactionSourceType.RecruitmentOpportunityCost,
    opportunityId,
  });
}

function pressureManagementSource(): MoneyTransactionSource {
  return Object.freeze({
    type: MoneyTransactionSourceType.PressureManagement,
    sourceId: sourceId("pressure:bribe_001"),
  });
}

function recoverySource(): MoneyTransactionSource {
  return Object.freeze({
    type: MoneyTransactionSourceType.Recovery,
    sourceId: sourceId("recovery:contact_help"),
  });
}

function genericSource(): MoneyTransactionSource {
  return Object.freeze({
    type: MoneyTransactionSourceType.Generic,
    sourceId: sourceId("prototype:manual_adjustment"),
  });
}

function transactionId(suffix: string = "001") {
  return parseTransactionId(`transaction:${suffix}`);
}

function existingTransaction(): MoneyTransaction {
  const result = createMoneyTransaction({
    transactionId: transactionId("existing"),
    organizationId: organizationAId,
    recordedAtTick: tick,
    amount: 5,
    balanceBefore: 95,
    balanceAfter: 100,
    category: MoneyTransactionCategory.OperationReward,
    source: operationRewardSource(),
  });

  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("Expected test fixture transaction creation to succeed.");
  }

  return result.value;
}

function record(input: {
  readonly amount: number;
  readonly category: MoneyTransactionCategoryType;
  readonly source: MoneyTransactionSource;
  readonly organizations?: readonly OrganizationState[];
  readonly transactions?: readonly MoneyTransaction[];
  readonly id?: ReturnType<typeof parseTransactionId>;
}) {
  return recordMoneyTransaction({
    transactionId: input.id ?? transactionId("new"),
    organizationId: organizationAId,
    recordedAtTick: tick,
    amount: input.amount,
    category: input.category,
    source: input.source,
    organizations: input.organizations ?? createOrganizations(),
    transactions: input.transactions ?? [],
  });
}

function expectFailureLeavesInputsUnchanged(input: {
  readonly amount: number;
  readonly category: MoneyTransactionCategoryType;
  readonly source: MoneyTransactionSource;
  readonly expectedCode: DomainErrorCode;
  readonly organizations?: readonly OrganizationState[];
  readonly transactions?: readonly MoneyTransaction[];
  readonly id?: ReturnType<typeof parseTransactionId>;
}) {
  const organizations = input.organizations ?? createOrganizations();
  const transactions = input.transactions ?? Object.freeze([existingTransaction()]);
  const organizationsBefore = organizations;
  const transactionsBefore = transactions;

  const result = record({
    amount: input.amount,
    category: input.category,
    source: input.source,
    organizations,
    transactions,
    ...(input.id === undefined ? {} : { id: input.id }),
  });

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.code).toBe(input.expectedCode);
  }
  expect(organizations).toBe(organizationsBefore);
  expect(transactions).toBe(transactionsBefore);
}

describe("money ledger", () => {
  it.each([
    [MoneyTransactionCategory.OperationReward, 80, operationRewardSource, 180],
    [MoneyTransactionCategory.OperationCost, -20, operationCostSource, 80],
    [MoneyTransactionCategory.RecurringIncome, 30, recurringIncomeSource, 130],
    [MoneyTransactionCategory.CrewUpkeep, -10, crewUpkeepSource, 90],
    [MoneyTransactionCategory.BusinessUpkeep, -15, businessUpkeepSource, 85],
    [MoneyTransactionCategory.HideoutUpkeep, -12, hideoutUpkeepSource, 88],
    [MoneyTransactionCategory.RecruitmentCost, -25, recruitmentCharacterSource, 75],
    [MoneyTransactionCategory.RecruitmentCost, -25, recruitmentOpportunitySource, 75],
    [MoneyTransactionCategory.PressureManagementCost, -35, pressureManagementSource, 65],
    [MoneyTransactionCategory.RecoveryIncome, 40, recoverySource, 140],
    [MoneyTransactionCategory.RecoveryCost, -18, recoverySource, 82],
    [MoneyTransactionCategory.OtherIncome, 7, genericSource, 107],
    [MoneyTransactionCategory.OtherExpense, -7, genericSource, 93],
  ])(
    "records %s with compatible source and amount",
    (category, amount, buildSource, expectedBalance) => {
      const organizations = createOrganizations();
      const previousTransaction = existingTransaction();
      const transactions = Object.freeze([previousTransaction]);
      const result = record({
        amount,
        category,
        source: buildSource(),
        organizations,
        transactions,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) {
        throw new Error(result.error.message);
      }

      expect(result.value.organization.money).toBe(expectedBalance);
      expect(result.value.organizations).toHaveLength(2);
      expect(result.value.organizations[0]).toBe(result.value.organization);
      expect(result.value.organizations[1]).toBe(organizations[1]);
      expect(result.value.transactions).toHaveLength(2);
      expect(result.value.transactions[0]).toBe(previousTransaction);
      expect(result.value.transactions[1]).toBe(result.value.transaction);
      expect(result.value.events).toHaveLength(1);
      expect(result.value.events[0]).toEqual({
        type: DomainEventType.OrganizationMoneyTransactionRecorded,
        transactionId: result.value.transaction.transactionId,
        organizationId: organizationAId,
        category,
        source: result.value.transaction.source,
        amount,
        previousMoney: 100,
        currentMoney: expectedBalance,
        recordedAtTick: tick,
      });
      expect(result.value.transaction.balanceAfter - result.value.transaction.balanceBefore).toBe(
        amount,
      );
    },
  );

  it("does not mutate inputs and returns immutable transaction, source, collections, and events", () => {
    const organizations = createOrganizations();
    const originalSource = {
      type: MoneyTransactionSourceType.RecurringIncome,
      sourceId: sourceId("recurring:immutable"),
    };
    const transactions = Object.freeze([existingTransaction()]);
    const result = record({
      amount: 10,
      category: MoneyTransactionCategory.RecurringIncome,
      source: originalSource,
      organizations,
      transactions,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }

    expect(organizations[0]?.money).toBe(100);
    expect(transactions).toHaveLength(1);
    expect(result.value.transaction.source).not.toBe(originalSource);
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.organizations)).toBe(true);
    expect(Object.isFrozen(result.value.transactions)).toBe(true);
    expect(Object.isFrozen(result.value.transaction)).toBe(true);
    expect(Object.isFrozen(result.value.transaction.source)).toBe(true);
    expect(Object.isFrozen(result.value.events)).toBe(true);
    const event = result.value.events[0];
    expect(event).toBeDefined();
    if (
      event === undefined ||
      event.type !== DomainEventType.OrganizationMoneyTransactionRecorded
    ) {
      throw new Error("Expected one money transaction event.");
    }
    expect(Object.isFrozen(event)).toBe(true);
    expect(Object.isFrozen(event.source)).toBe(true);
  });

  it("creates deeply identical outputs and events for identical inputs", () => {
    const input = {
      amount: 30,
      category: MoneyTransactionCategory.RecurringIncome,
      source: recurringIncomeSource(),
      organizations: createOrganizations(),
      transactions: Object.freeze([existingTransaction()]),
      id: transactionId("deterministic"),
    };

    const first = record(input);
    const second = record(input);

    expect(first).toEqual(second);
  });

  it("isolates multiple organizations and preserves conservation across sequential transactions", () => {
    const first = record({
      amount: 50,
      category: MoneyTransactionCategory.OperationReward,
      source: operationRewardSource(),
      id: transactionId("seq_001"),
    });
    expect(first.ok).toBe(true);
    if (!first.ok) {
      throw new Error(first.error.message);
    }

    const second = record({
      amount: -20,
      category: MoneyTransactionCategory.OperationCost,
      source: operationCostSource(),
      organizations: first.value.organizations,
      transactions: first.value.transactions,
      id: transactionId("seq_002"),
    });
    expect(second.ok).toBe(true);
    if (!second.ok) {
      throw new Error(second.error.message);
    }

    const amountSum = second.value.transactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0,
    );
    const unaffectedOrganization = second.value.organizations[1];
    expect(unaffectedOrganization).toBeDefined();
    expect(unaffectedOrganization?.money).toBe(250);
    expect(100 + amountSum).toBe(second.value.organization.money);
    for (const transaction of second.value.transactions) {
      expect(transaction.balanceAfter - transaction.balanceBefore).toBe(transaction.amount);
    }
  });

  it("validates createMoneyTransaction invariants independently", () => {
    const source = operationRewardSource();
    const result = createMoneyTransaction({
      transactionId: transactionId("factory"),
      organizationId: organizationAId,
      recordedAtTick: tick,
      amount: 25,
      balanceBefore: 100,
      balanceAfter: 125,
      category: MoneyTransactionCategory.OperationReward,
      source,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }

    expect(result.value.source).not.toBe(source);
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.source)).toBe(true);
  });

  it("rejects missing organization", () => {
    expectFailureLeavesInputsUnchanged({
      amount: 10,
      category: MoneyTransactionCategory.OperationReward,
      source: operationRewardSource(),
      expectedCode: DomainErrorCode.MoneyTransactionMissingOrganization,
      organizations: [],
    });
  });

  it("rejects duplicate transaction IDs", () => {
    const existing = existingTransaction();
    expectFailureLeavesInputsUnchanged({
      amount: 10,
      category: MoneyTransactionCategory.OperationReward,
      source: operationRewardSource(),
      expectedCode: DomainErrorCode.MoneyTransactionDuplicateTransactionId,
      transactions: Object.freeze([existing]),
      id: existing.transactionId,
    });
  });

  it.each([
    [0, "zero"],
    [Number.NaN, "nan"],
    [Number.POSITIVE_INFINITY, "infinity"],
    [Number.NEGATIVE_INFINITY, "infinity"],
    [1.5, "non-integer"],
    [Number.MAX_SAFE_INTEGER + 1, "unsafe-integer"],
  ])("rejects invalid amount %s", (amount, reason) => {
    const result = record({
      amount,
      category: MoneyTransactionCategory.OperationReward,
      source: operationRewardSource(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.MoneyTransactionInvalidAmount);
      expect(result.error.message).toContain(reason);
    }
  });

  it("rejects category and amount sign mismatch", () => {
    expectFailureLeavesInputsUnchanged({
      amount: 10,
      category: MoneyTransactionCategory.OperationCost,
      source: operationCostSource(),
      expectedCode: DomainErrorCode.MoneyTransactionCategoryAmountMismatch,
    });
  });

  it("rejects category and source mismatch, including generic fallback misuse", () => {
    expectFailureLeavesInputsUnchanged({
      amount: 10,
      category: MoneyTransactionCategory.OperationReward,
      source: genericSource(),
      expectedCode: DomainErrorCode.MoneyTransactionCategorySourceMismatch,
    });

    expectFailureLeavesInputsUnchanged({
      amount: 10,
      category: MoneyTransactionCategory.OtherIncome,
      source: recurringIncomeSource(),
      expectedCode: DomainErrorCode.MoneyTransactionCategorySourceMismatch,
    });
  });

  it("rejects malformed bounded source IDs", () => {
    expectFailureLeavesInputsUnchanged({
      amount: 10,
      category: MoneyTransactionCategory.RecurringIncome,
      source: {
        type: MoneyTransactionSourceType.RecurringIncome,
        sourceId: "recurring invalid",
      } as unknown as MoneyTransactionSource,
      expectedCode: DomainErrorCode.MoneyTransactionInvalidSource,
    });
  });

  it.each([
    ["empty string", "", "received an empty string"],
    ["leading whitespace", " operation:bad", "received leading whitespace"],
    ["trailing whitespace", "operation:bad ", "received trailing whitespace"],
    ["internal whitespace", "operation bad", "received internal whitespace"],
    ["unsupported characters", "operation/bad", "received unsupported characters"],
    ["excessive length", "a".repeat(129), "maximum is 128"],
  ])("rejects entity-backed source IDs with %s", (_label, invalidId, expectedReason) => {
    const cases: ReadonlyArray<{
      readonly sourceType: MoneyTransactionSourceType;
      readonly field: string;
      readonly amount: number;
      readonly category: MoneyTransactionCategoryType;
      readonly source: MoneyTransactionSource;
    }> = [
      {
        sourceType: MoneyTransactionSourceType.OperationGrossReward,
        field: "operationId",
        amount: 10,
        category: MoneyTransactionCategory.OperationReward,
        source: {
          type: MoneyTransactionSourceType.OperationGrossReward,
          operationId: invalidId,
        } as unknown as MoneyTransactionSource,
      },
      {
        sourceType: MoneyTransactionSourceType.OperationStartCost,
        field: "operationId",
        amount: -10,
        category: MoneyTransactionCategory.OperationCost,
        source: {
          type: MoneyTransactionSourceType.OperationStartCost,
          operationId: invalidId,
        } as unknown as MoneyTransactionSource,
      },
      {
        sourceType: MoneyTransactionSourceType.CrewUpkeep,
        field: "characterId",
        amount: -10,
        category: MoneyTransactionCategory.CrewUpkeep,
        source: {
          type: MoneyTransactionSourceType.CrewUpkeep,
          characterId: invalidId,
        } as unknown as MoneyTransactionSource,
      },
      {
        sourceType: MoneyTransactionSourceType.BusinessUpkeep,
        field: "businessId",
        amount: -10,
        category: MoneyTransactionCategory.BusinessUpkeep,
        source: {
          type: MoneyTransactionSourceType.BusinessUpkeep,
          businessId: invalidId,
        } as unknown as MoneyTransactionSource,
      },
      {
        sourceType: MoneyTransactionSourceType.HideoutUpkeep,
        field: "locationId",
        amount: -10,
        category: MoneyTransactionCategory.HideoutUpkeep,
        source: {
          type: MoneyTransactionSourceType.HideoutUpkeep,
          locationId: invalidId,
        } as unknown as MoneyTransactionSource,
      },
      {
        sourceType: MoneyTransactionSourceType.RecruitmentCharacterCost,
        field: "characterId",
        amount: -10,
        category: MoneyTransactionCategory.RecruitmentCost,
        source: {
          type: MoneyTransactionSourceType.RecruitmentCharacterCost,
          characterId: invalidId,
        } as unknown as MoneyTransactionSource,
      },
      {
        sourceType: MoneyTransactionSourceType.RecruitmentOpportunityCost,
        field: "opportunityId",
        amount: -10,
        category: MoneyTransactionCategory.RecruitmentCost,
        source: {
          type: MoneyTransactionSourceType.RecruitmentOpportunityCost,
          opportunityId: invalidId,
        } as unknown as MoneyTransactionSource,
      },
    ];

    for (const testCase of cases) {
      const organizations = createOrganizations();
      const transactions = Object.freeze([existingTransaction()]);
      const result = record({
        amount: testCase.amount,
        category: testCase.category,
        source: testCase.source,
        organizations,
        transactions,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toMatchObject({
          code: DomainErrorCode.MoneyTransactionInvalidSource,
          sourceType: testCase.sourceType,
          field: testCase.field,
          reason: expect.stringContaining(expectedReason),
          value: invalidId,
        });
      }
      expect(organizations[0]?.money).toBe(100);
      expect(transactions).toHaveLength(1);
    }
  });

  it("converts entity ID parser failures from createMoneyTransaction into typed invalid-source results", () => {
    const result = createMoneyTransaction({
      transactionId: transactionId("invalid_entity_source"),
      organizationId: organizationAId,
      recordedAtTick: tick,
      amount: 10,
      balanceBefore: 100,
      balanceAfter: 110,
      category: MoneyTransactionCategory.OperationReward,
      source: {
        type: MoneyTransactionSourceType.OperationGrossReward,
        operationId: "operation bad",
      } as unknown as MoneyTransactionSource,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatchObject({
        code: DomainErrorCode.MoneyTransactionInvalidSource,
        sourceType: MoneyTransactionSourceType.OperationGrossReward,
        field: "operationId",
        reason: "received internal whitespace",
        value: "operation bad",
      });
    }
  });

  it("rejects unsupported runtime category and source discriminant values", () => {
    expectFailureLeavesInputsUnchanged({
      amount: 10,
      category: "unsupported-category" as unknown as MoneyTransactionCategoryType,
      source: operationRewardSource(),
      expectedCode: DomainErrorCode.MoneyTransactionUnsupportedCategory,
    });

    expectFailureLeavesInputsUnchanged({
      amount: 10,
      category: MoneyTransactionCategory.OperationReward,
      source: {
        type: "unsupported-source",
        sourceId: "source:ok",
      } as unknown as MoneyTransactionSource,
      expectedCode: DomainErrorCode.MoneyTransactionUnsupportedSource,
    });
  });

  it("rejects subtraction below zero and positive overflow", () => {
    expectFailureLeavesInputsUnchanged({
      amount: -101,
      category: MoneyTransactionCategory.OperationCost,
      source: operationCostSource(),
      expectedCode: DomainErrorCode.MoneyTransactionInsufficientFunds,
    });

    expectFailureLeavesInputsUnchanged({
      amount: 10,
      category: MoneyTransactionCategory.OperationReward,
      source: operationRewardSource(),
      organizations: Object.freeze([
        createOrganizationState({
          organizationId: organizationAId,
          displayName: "Crew A",
          leaderCharacterId: leaderAId,
          memberCharacterIds: [leaderAId],
          operationalCapacity: 2,
          money: Number.MAX_SAFE_INTEGER,
        }),
      ]),
      expectedCode: DomainErrorCode.MoneyTransactionArithmeticInvalid,
    });
  });

  it("rejects invalid factory balances", () => {
    const result = createMoneyTransaction({
      transactionId: transactionId("bad_balance"),
      organizationId: organizationAId,
      recordedAtTick: tick,
      amount: 5,
      balanceBefore: 100,
      balanceAfter: 104,
      category: MoneyTransactionCategory.OperationReward,
      source: operationRewardSource(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.MoneyTransactionArithmeticInvalid);
    }
  });
});
