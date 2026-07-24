import { createOrganizationMoneyTransactionRecordedEvent, type DomainEvent } from "./domainEvents";
import {
  DomainErrorCode,
  failure,
  success,
  type DomainError,
  type DomainResult,
} from "./domainResult";
import type {
  BusinessId,
  CharacterId,
  LocationId,
  OperationId,
  OpportunityId,
  OrganizationId,
  RecruitmentOpportunityId,
  TransactionId,
} from "./entityIds";
import {
  InvalidEntityIdError,
  parseBusinessId,
  parseCharacterId,
  parseLocationId,
  parseOperationId,
  parseOpportunityId,
  parseRecruitmentOpportunityId,
} from "./entityIds";
import { createOrganizationState, type OrganizationState } from "./organizationState";
import type { SimulationTick } from "./simulationClock";

declare const moneySourceIdBrand: unique symbol;

export type MoneySourceId = string & {
  readonly [moneySourceIdBrand]: "MoneySourceId";
};

export const MoneyTransactionCategory = {
  OperationReward: "operation-reward",
  RecurringIncome: "recurring-income",
  BusinessIncome: "business-income",
  RecoveryIncome: "recovery-income",
  OtherIncome: "other-income",
  OperationCost: "operation-cost",
  CrewUpkeep: "crew-upkeep",
  BusinessUpkeep: "business-upkeep",
  HideoutUpkeep: "hideout-upkeep",
  RecruitmentCost: "recruitment-cost",
  PressureManagementCost: "pressure-management-cost",
  RecoveryCost: "recovery-cost",
  OtherExpense: "other-expense",
} as const;

export type MoneyTransactionCategory =
  (typeof MoneyTransactionCategory)[keyof typeof MoneyTransactionCategory];

export const MoneyTransactionSourceType = {
  OperationStartCost: "operation-start-cost",
  OperationGrossReward: "operation-gross-reward",
  RecurringIncome: "recurring-income",
  BusinessIncome: "business-income",
  CrewUpkeep: "crew-upkeep",
  BusinessUpkeep: "business-upkeep",
  HideoutUpkeep: "hideout-upkeep",
  RecruitmentCharacterCost: "recruitment-character-cost",
  RecruitmentOpportunityCost: "recruitment-opportunity-cost",
  PressureManagement: "pressure-management",
  Recovery: "recovery",
  Generic: "generic",
} as const;

export type MoneyTransactionSourceType =
  (typeof MoneyTransactionSourceType)[keyof typeof MoneyTransactionSourceType];

export interface OperationStartCostMoneySource {
  readonly type: typeof MoneyTransactionSourceType.OperationStartCost;
  readonly operationId: OperationId;
}

export interface OperationGrossRewardMoneySource {
  readonly type: typeof MoneyTransactionSourceType.OperationGrossReward;
  readonly operationId: OperationId;
}

export interface RecurringIncomeMoneySource {
  readonly type: typeof MoneyTransactionSourceType.RecurringIncome;
  readonly sourceId: MoneySourceId;
}

export interface BusinessIncomeMoneySource {
  readonly type: typeof MoneyTransactionSourceType.BusinessIncome;
  readonly businessId: BusinessId;
}

export interface CrewUpkeepMoneySource {
  readonly type: typeof MoneyTransactionSourceType.CrewUpkeep;
  readonly characterId: CharacterId;
}

export interface BusinessUpkeepMoneySource {
  readonly type: typeof MoneyTransactionSourceType.BusinessUpkeep;
  readonly businessId: BusinessId;
}

export interface HideoutUpkeepMoneySource {
  readonly type: typeof MoneyTransactionSourceType.HideoutUpkeep;
  readonly locationId: LocationId;
}

export interface RecruitmentCharacterCostMoneySource {
  readonly type: typeof MoneyTransactionSourceType.RecruitmentCharacterCost;
  readonly characterId: CharacterId;
}

export interface RecruitmentOpportunityCostMoneySource {
  readonly type: typeof MoneyTransactionSourceType.RecruitmentOpportunityCost;
  readonly opportunityId?: OpportunityId;
  readonly recruitmentOpportunityId?: RecruitmentOpportunityId;
  readonly characterId?: CharacterId;
}

export interface PressureManagementMoneySource {
  readonly type: typeof MoneyTransactionSourceType.PressureManagement;
  readonly sourceId: MoneySourceId;
}

export interface RecoveryMoneySource {
  readonly type: typeof MoneyTransactionSourceType.Recovery;
  readonly sourceId: MoneySourceId;
}

export interface GenericMoneySource {
  readonly type: typeof MoneyTransactionSourceType.Generic;
  readonly sourceId: MoneySourceId;
}

export type MoneyTransactionSource =
  | BusinessIncomeMoneySource
  | BusinessUpkeepMoneySource
  | CrewUpkeepMoneySource
  | GenericMoneySource
  | HideoutUpkeepMoneySource
  | OperationGrossRewardMoneySource
  | OperationStartCostMoneySource
  | PressureManagementMoneySource
  | RecurringIncomeMoneySource
  | RecoveryMoneySource
  | RecruitmentCharacterCostMoneySource
  | RecruitmentOpportunityCostMoneySource;

export interface MoneyTransaction {
  readonly transactionId: TransactionId;
  readonly organizationId: OrganizationId;
  readonly recordedAtTick: SimulationTick;
  readonly amount: number;
  readonly balanceBefore: number;
  readonly balanceAfter: number;
  readonly category: MoneyTransactionCategory;
  readonly source: MoneyTransactionSource;
}

export interface CreateMoneyTransactionInput {
  readonly transactionId: TransactionId;
  readonly organizationId: OrganizationId;
  readonly recordedAtTick: SimulationTick;
  readonly amount: number;
  readonly balanceBefore: number;
  readonly balanceAfter: number;
  readonly category: MoneyTransactionCategory;
  readonly source: MoneyTransactionSource;
}

export interface RecordMoneyTransactionInput {
  readonly transactionId: TransactionId;
  readonly organizationId: OrganizationId;
  readonly recordedAtTick: SimulationTick;
  readonly amount: number;
  readonly category: MoneyTransactionCategory;
  readonly source: MoneyTransactionSource;
  readonly organizations: readonly OrganizationState[];
  readonly transactions: readonly MoneyTransaction[];
}

export interface RecordMoneyTransactionSuccess {
  readonly organization: OrganizationState;
  readonly organizations: readonly OrganizationState[];
  readonly transaction: MoneyTransaction;
  readonly transactions: readonly MoneyTransaction[];
  readonly events: readonly DomainEvent[];
}

export interface MoneyTransactionMissingOrganizationError extends DomainError {
  readonly code: typeof DomainErrorCode.MoneyTransactionMissingOrganization;
  readonly organizationId: OrganizationId;
}

export interface MoneyTransactionDuplicateTransactionIdError extends DomainError {
  readonly code: typeof DomainErrorCode.MoneyTransactionDuplicateTransactionId;
  readonly transactionId: TransactionId;
  readonly existingRecordIndex: number;
}

export interface MoneyTransactionInvalidAmountError extends DomainError {
  readonly code: typeof DomainErrorCode.MoneyTransactionInvalidAmount;
  readonly amount: number;
  readonly reason: "zero" | "nan" | "infinity" | "non-integer" | "unsafe-integer";
}

export interface MoneyTransactionUnsupportedCategoryError extends DomainError {
  readonly code: typeof DomainErrorCode.MoneyTransactionUnsupportedCategory;
  readonly category: string;
}

export interface MoneyTransactionUnsupportedSourceError extends DomainError {
  readonly code: typeof DomainErrorCode.MoneyTransactionUnsupportedSource;
  readonly sourceType: string;
}

export interface MoneyTransactionInvalidSourceError extends DomainError {
  readonly code: typeof DomainErrorCode.MoneyTransactionInvalidSource;
  readonly sourceType: string;
  readonly field: string;
  readonly reason: string;
  readonly value: unknown;
}

export interface MoneyTransactionCategorySourceMismatchError extends DomainError {
  readonly code: typeof DomainErrorCode.MoneyTransactionCategorySourceMismatch;
  readonly category: string;
  readonly sourceType: string;
}

export interface MoneyTransactionCategoryAmountMismatchError extends DomainError {
  readonly code: typeof DomainErrorCode.MoneyTransactionCategoryAmountMismatch;
  readonly category: string;
  readonly amount: number;
  readonly expectedDirection: "positive" | "negative";
}

export interface MoneyTransactionArithmeticInvalidError extends DomainError {
  readonly code: typeof DomainErrorCode.MoneyTransactionArithmeticInvalid;
  readonly balanceBefore: number;
  readonly amount: number;
  readonly balanceAfter?: number;
  readonly reason:
    | "balance-before-invalid"
    | "balance-after-invalid"
    | "balance-equation-mismatch"
    | "overflow";
}

export interface MoneyTransactionInsufficientFundsError extends DomainError {
  readonly code: typeof DomainErrorCode.MoneyTransactionInsufficientFunds;
  readonly organizationId: OrganizationId;
  readonly currentBalance: number;
  readonly amount: number;
}

export type MoneyTransactionError =
  | MoneyTransactionArithmeticInvalidError
  | MoneyTransactionCategoryAmountMismatchError
  | MoneyTransactionCategorySourceMismatchError
  | MoneyTransactionDuplicateTransactionIdError
  | MoneyTransactionInsufficientFundsError
  | MoneyTransactionInvalidAmountError
  | MoneyTransactionInvalidSourceError
  | MoneyTransactionMissingOrganizationError
  | MoneyTransactionUnsupportedCategoryError
  | MoneyTransactionUnsupportedSourceError;

export type CreateMoneyTransactionResult = DomainResult<MoneyTransaction, MoneyTransactionError>;

export type RecordMoneyTransactionResult = DomainResult<
  RecordMoneyTransactionSuccess,
  MoneyTransactionError
>;

const MONEY_SOURCE_ID_PATTERN = /^[A-Za-z0-9_.:-]+$/;
const MAX_MONEY_SOURCE_ID_LENGTH = 128;

export function parseMoneySourceId(value: unknown): MoneySourceId {
  const result = validateBoundedSourceId(MoneyTransactionSourceType.Generic, "sourceId", value);
  if (!result.ok) {
    throw new InvalidMoneySourceIdError(result.error.reason, value);
  }

  return value as MoneySourceId;
}

export class InvalidMoneySourceIdError extends Error {
  public constructor(
    public readonly reason: string,
    public readonly value: unknown,
  ) {
    super(
      `Invalid MoneySourceId: expected a non-empty string up to 128 characters using only ASCII letters, digits, underscore, hyphen, period, or colon, with no whitespace; ${reason}.`,
    );
    this.name = "InvalidMoneySourceIdError";
  }
}

export function isMoneyTransactionCategory(
  category: unknown,
): category is MoneyTransactionCategory {
  return Object.values(MoneyTransactionCategory).includes(category as MoneyTransactionCategory);
}

export function createMoneyTransaction(
  input: CreateMoneyTransactionInput,
): CreateMoneyTransactionResult {
  const amountResult = validateAmount(input.amount);
  if (!amountResult.ok) {
    return amountResult;
  }

  const categoryResult = validateCategory(input.category);
  if (!categoryResult.ok) {
    return categoryResult;
  }

  const sourceResult = normalizeMoneyTransactionSource(input.source);
  if (!sourceResult.ok) {
    return sourceResult;
  }

  const compatibilityResult = validateCategorySourceAmountCompatibility(
    input.category,
    sourceResult.value,
    input.amount,
  );
  if (!compatibilityResult.ok) {
    return compatibilityResult;
  }

  const balanceResult = validateBalances(input.balanceBefore, input.amount, input.balanceAfter);
  if (!balanceResult.ok) {
    return balanceResult;
  }

  return success(
    Object.freeze({
      transactionId: input.transactionId,
      organizationId: input.organizationId,
      recordedAtTick: input.recordedAtTick,
      amount: input.amount,
      balanceBefore: input.balanceBefore,
      balanceAfter: input.balanceAfter,
      category: input.category,
      source: sourceResult.value,
    }),
  );
}

export function recordMoneyTransaction(
  input: RecordMoneyTransactionInput,
): RecordMoneyTransactionResult {
  const duplicateIndex = input.transactions.findIndex(
    (transaction) => transaction.transactionId === input.transactionId,
  );
  if (duplicateIndex !== -1) {
    return failure({
      code: DomainErrorCode.MoneyTransactionDuplicateTransactionId,
      message: `Money transaction "${input.transactionId}" already exists.`,
      transactionId: input.transactionId,
      existingRecordIndex: duplicateIndex,
    });
  }

  const organization = input.organizations.find(
    (candidate) => candidate.organizationId === input.organizationId,
  );
  if (organization === undefined) {
    return failure({
      code: DomainErrorCode.MoneyTransactionMissingOrganization,
      message: `Organization "${input.organizationId}" was not found for money transaction "${input.transactionId}".`,
      organizationId: input.organizationId,
    });
  }

  const amountResult = validateAmount(input.amount);
  if (!amountResult.ok) {
    return amountResult;
  }

  const balanceAfter = organization.money + input.amount;
  if (!Number.isSafeInteger(balanceAfter)) {
    return failure({
      code: DomainErrorCode.MoneyTransactionArithmeticInvalid,
      message: "Money transaction would exceed safe integer bounds.",
      balanceBefore: organization.money,
      amount: input.amount,
      reason: "overflow",
    });
  }

  if (balanceAfter < 0) {
    return failure({
      code: DomainErrorCode.MoneyTransactionInsufficientFunds,
      message: `Organization "${organization.organizationId}" has insufficient funds for money transaction "${input.transactionId}".`,
      organizationId: organization.organizationId,
      currentBalance: organization.money,
      amount: input.amount,
    });
  }

  const transactionResult = createMoneyTransaction({
    transactionId: input.transactionId,
    organizationId: input.organizationId,
    recordedAtTick: input.recordedAtTick,
    amount: input.amount,
    balanceBefore: organization.money,
    balanceAfter,
    category: input.category,
    source: input.source,
  });
  if (!transactionResult.ok) {
    return transactionResult;
  }

  const nextOrganization = createOrganizationState({
    ...organization,
    money: balanceAfter,
  });
  const nextOrganizations = replaceById(
    input.organizations,
    "organizationId",
    nextOrganization.organizationId,
    nextOrganization,
  );
  const nextTransactions = Object.freeze([...input.transactions, transactionResult.value]);
  const events = Object.freeze([
    createOrganizationMoneyTransactionRecordedEvent({
      transactionId: transactionResult.value.transactionId,
      organizationId: transactionResult.value.organizationId,
      category: transactionResult.value.category,
      source: transactionResult.value.source,
      amount: transactionResult.value.amount,
      previousMoney: transactionResult.value.balanceBefore,
      currentMoney: transactionResult.value.balanceAfter,
      recordedAtTick: transactionResult.value.recordedAtTick,
    }),
  ]);

  return success(
    Object.freeze({
      organization: nextOrganization,
      organizations: nextOrganizations,
      transaction: transactionResult.value,
      transactions: nextTransactions,
      events,
    }),
  );
}

function validateAmount(
  amount: number,
): DomainResult<undefined, MoneyTransactionInvalidAmountError> {
  if (Number.isNaN(amount)) {
    return invalidAmount(amount, "nan");
  }

  if (!Number.isFinite(amount)) {
    return invalidAmount(amount, "infinity");
  }

  if (!Number.isInteger(amount)) {
    return invalidAmount(amount, "non-integer");
  }

  if (!Number.isSafeInteger(amount)) {
    return invalidAmount(amount, "unsafe-integer");
  }

  if (amount === 0) {
    return invalidAmount(amount, "zero");
  }

  return success(undefined);
}

function validateCategory(
  category: MoneyTransactionCategory,
): DomainResult<undefined, MoneyTransactionUnsupportedCategoryError> {
  if (!isMoneyTransactionCategory(category)) {
    return failure({
      code: DomainErrorCode.MoneyTransactionUnsupportedCategory,
      message: `Money transaction category "${String(category)}" is not supported.`,
      category: String(category),
    });
  }

  return success(undefined);
}

function normalizeMoneyTransactionSource(
  source: MoneyTransactionSource,
): DomainResult<MoneyTransactionSource, MoneyTransactionError> {
  if (typeof source !== "object" || source === null || Array.isArray(source)) {
    return failure({
      code: DomainErrorCode.MoneyTransactionInvalidSource,
      message: "Money transaction source must be an object.",
      sourceType: "unknown",
      field: "source",
      reason: `expected an object, received ${describeValueType(source)}`,
      value: source,
    });
  }

  const sourceType = (source as Partial<MoneyTransactionSource>).type;
  if (!isMoneyTransactionSourceType(sourceType)) {
    return failure({
      code: DomainErrorCode.MoneyTransactionUnsupportedSource,
      message: `Money transaction source type "${String(sourceType)}" is not supported.`,
      sourceType: String(sourceType),
    });
  }

  switch (sourceType) {
    case MoneyTransactionSourceType.OperationStartCost:
    case MoneyTransactionSourceType.OperationGrossReward:
      return normalizeEntitySource(sourceType, "operationId", source, parseOperationId);
    case MoneyTransactionSourceType.RecurringIncome:
    case MoneyTransactionSourceType.PressureManagement:
    case MoneyTransactionSourceType.Recovery:
    case MoneyTransactionSourceType.Generic:
      return normalizeBoundedSource(sourceType, source);
    case MoneyTransactionSourceType.BusinessIncome:
      return normalizeEntitySource(sourceType, "businessId", source, parseBusinessId);
    case MoneyTransactionSourceType.CrewUpkeep:
      return normalizeEntitySource(sourceType, "characterId", source, parseCharacterId);
    case MoneyTransactionSourceType.BusinessUpkeep:
      return normalizeEntitySource(sourceType, "businessId", source, parseBusinessId);
    case MoneyTransactionSourceType.HideoutUpkeep:
      return normalizeEntitySource(sourceType, "locationId", source, parseLocationId);
    case MoneyTransactionSourceType.RecruitmentCharacterCost:
      return normalizeEntitySource(sourceType, "characterId", source, parseCharacterId);
    case MoneyTransactionSourceType.RecruitmentOpportunityCost:
      return normalizeRecruitmentOpportunityCostSource(source);
  }
}

function normalizeRecruitmentOpportunityCostSource(
  source: MoneyTransactionSource,
): DomainResult<MoneyTransactionSource, MoneyTransactionInvalidSourceError> {
  const fields = source as unknown as Record<string, unknown>;
  const opportunityId = fields.opportunityId;
  const recruitmentOpportunityId = fields.recruitmentOpportunityId;
  const characterId = fields.characterId;

  if (opportunityId !== undefined) {
    return normalizeEntitySource(
      MoneyTransactionSourceType.RecruitmentOpportunityCost,
      "opportunityId",
      source,
      parseOpportunityId,
    );
  }

  if (typeof recruitmentOpportunityId !== "string") {
    return invalidSource(
      MoneyTransactionSourceType.RecruitmentOpportunityCost,
      "recruitmentOpportunityId",
      `expected an ID string, received ${describeValueType(recruitmentOpportunityId)}`,
      recruitmentOpportunityId,
    );
  }

  if (typeof characterId !== "string") {
    return invalidSource(
      MoneyTransactionSourceType.RecruitmentOpportunityCost,
      "characterId",
      `expected an ID string, received ${describeValueType(characterId)}`,
      characterId,
    );
  }

  let parsedRecruitmentOpportunityId: RecruitmentOpportunityId;
  try {
    parsedRecruitmentOpportunityId = parseRecruitmentOpportunityId(recruitmentOpportunityId);
  } catch (error) {
    return invalidSource(
      MoneyTransactionSourceType.RecruitmentOpportunityCost,
      "recruitmentOpportunityId",
      error instanceof InvalidEntityIdError ? error.reason : "entity ID parser rejected the value",
      recruitmentOpportunityId,
    );
  }

  let parsedCharacterId: CharacterId;
  try {
    parsedCharacterId = parseCharacterId(characterId);
  } catch (error) {
    return invalidSource(
      MoneyTransactionSourceType.RecruitmentOpportunityCost,
      "characterId",
      error instanceof InvalidEntityIdError ? error.reason : "entity ID parser rejected the value",
      characterId,
    );
  }

  return success(
    Object.freeze({
      type: MoneyTransactionSourceType.RecruitmentOpportunityCost,
      recruitmentOpportunityId: parsedRecruitmentOpportunityId,
      characterId: parsedCharacterId,
    }),
  );
}

function validateCategorySourceAmountCompatibility(
  category: MoneyTransactionCategory,
  source: MoneyTransactionSource,
  amount: number,
): DomainResult<undefined, MoneyTransactionError> {
  const directionResult = validateCategoryAmountDirection(category, amount);
  if (!directionResult.ok) {
    return directionResult;
  }

  const expectedSources = CATEGORY_SOURCE_COMPATIBILITY[category];
  if (!expectedSources.includes(source.type)) {
    return failure({
      code: DomainErrorCode.MoneyTransactionCategorySourceMismatch,
      message: `Money transaction category "${category}" is not compatible with source type "${source.type}".`,
      category,
      sourceType: source.type,
    });
  }

  return success(undefined);
}

function validateCategoryAmountDirection(
  category: MoneyTransactionCategory,
  amount: number,
): DomainResult<undefined, MoneyTransactionCategoryAmountMismatchError> {
  const expectedDirection = INCOME_CATEGORIES.has(category) ? "positive" : "negative";
  const valid = expectedDirection === "positive" ? amount > 0 : amount < 0;
  if (valid) {
    return success(undefined);
  }

  return failure({
    code: DomainErrorCode.MoneyTransactionCategoryAmountMismatch,
    message: `Money transaction category "${category}" requires a ${expectedDirection} amount.`,
    category,
    amount,
    expectedDirection,
  });
}

function validateBalances(
  balanceBefore: number,
  amount: number,
  balanceAfter: number,
): DomainResult<undefined, MoneyTransactionArithmeticInvalidError> {
  if (!isNonNegativeSafeInteger(balanceBefore)) {
    return failure({
      code: DomainErrorCode.MoneyTransactionArithmeticInvalid,
      message: "Money transaction balanceBefore must be a non-negative safe integer.",
      balanceBefore,
      amount,
      balanceAfter,
      reason: "balance-before-invalid",
    });
  }

  if (!isNonNegativeSafeInteger(balanceAfter)) {
    return failure({
      code: DomainErrorCode.MoneyTransactionArithmeticInvalid,
      message: "Money transaction balanceAfter must be a non-negative safe integer.",
      balanceBefore,
      amount,
      balanceAfter,
      reason: "balance-after-invalid",
    });
  }

  const expectedBalanceAfter = balanceBefore + amount;
  if (!Number.isSafeInteger(expectedBalanceAfter)) {
    return failure({
      code: DomainErrorCode.MoneyTransactionArithmeticInvalid,
      message: "Money transaction balance arithmetic would exceed safe integer bounds.",
      balanceBefore,
      amount,
      balanceAfter,
      reason: "overflow",
    });
  }

  if (balanceAfter !== expectedBalanceAfter) {
    return failure({
      code: DomainErrorCode.MoneyTransactionArithmeticInvalid,
      message: "Money transaction balanceAfter must equal balanceBefore plus amount.",
      balanceBefore,
      amount,
      balanceAfter,
      reason: "balance-equation-mismatch",
    });
  }

  return success(undefined);
}

function normalizeEntitySource(
  sourceType: MoneyTransactionSourceType,
  field: string,
  source: MoneyTransactionSource,
  parseId: (value: unknown) => string,
): DomainResult<MoneyTransactionSource, MoneyTransactionInvalidSourceError> {
  const value = (source as unknown as Record<string, unknown>)[field];
  if (typeof value !== "string") {
    return failure({
      code: DomainErrorCode.MoneyTransactionInvalidSource,
      message: `Money transaction source "${sourceType}" requires field "${field}" as an ID string.`,
      sourceType,
      field,
      reason: `expected an ID string, received ${describeValueType(value)}`,
      value,
    });
  }

  let parsedValue: string;
  try {
    parsedValue = parseId(value);
  } catch (error) {
    return invalidSource(
      sourceType,
      field,
      error instanceof InvalidEntityIdError ? error.reason : "entity ID parser rejected the value",
      value,
    );
  }

  return success(
    Object.freeze({ type: sourceType, [field]: parsedValue }) as unknown as MoneyTransactionSource,
  );
}

function normalizeBoundedSource(
  sourceType: MoneyTransactionSourceType,
  source: MoneyTransactionSource,
): DomainResult<MoneyTransactionSource, MoneyTransactionInvalidSourceError> {
  const value = (source as unknown as Record<string, unknown>).sourceId;
  const validation = validateBoundedSourceId(sourceType, "sourceId", value);
  if (!validation.ok) {
    return validation;
  }

  return success(
    Object.freeze({
      type: sourceType,
      sourceId: value as MoneySourceId,
    }) as MoneyTransactionSource,
  );
}

function validateBoundedSourceId(
  sourceType: string,
  field: string,
  value: unknown,
): DomainResult<undefined, MoneyTransactionInvalidSourceError> {
  if (typeof value !== "string") {
    return invalidSource(
      sourceType,
      field,
      `expected a string, received ${describeValueType(value)}`,
      value,
    );
  }

  if (value.length === 0) {
    return invalidSource(sourceType, field, "received an empty string", value);
  }

  if (value.length > MAX_MONEY_SOURCE_ID_LENGTH) {
    return invalidSource(
      sourceType,
      field,
      `received ${value.length} characters, maximum is ${MAX_MONEY_SOURCE_ID_LENGTH}`,
      value,
    );
  }

  if (value.trimStart() !== value) {
    return invalidSource(sourceType, field, "received leading whitespace", value);
  }

  if (value.trimEnd() !== value) {
    return invalidSource(sourceType, field, "received trailing whitespace", value);
  }

  if (/\s/.test(value)) {
    return invalidSource(sourceType, field, "received internal whitespace", value);
  }

  if (!MONEY_SOURCE_ID_PATTERN.test(value)) {
    return invalidSource(sourceType, field, "received unsupported characters", value);
  }

  return success(undefined);
}

function invalidAmount(
  amount: number,
  reason: MoneyTransactionInvalidAmountError["reason"],
): DomainResult<undefined, MoneyTransactionInvalidAmountError> {
  return failure({
    code: DomainErrorCode.MoneyTransactionInvalidAmount,
    message: `Money transaction amount is invalid: ${reason}.`,
    amount,
    reason,
  });
}

function invalidSource<TValue = undefined>(
  sourceType: string,
  field: string,
  reason: string,
  value: unknown,
): DomainResult<TValue, MoneyTransactionInvalidSourceError> {
  return failure({
    code: DomainErrorCode.MoneyTransactionInvalidSource,
    message: `Money transaction source "${sourceType}" has invalid field "${field}": ${reason}.`,
    sourceType,
    field,
    reason,
    value,
  });
}

function isMoneyTransactionSourceType(value: unknown): value is MoneyTransactionSourceType {
  return Object.values(MoneyTransactionSourceType).includes(value as MoneyTransactionSourceType);
}

function isNonNegativeSafeInteger(value: number): boolean {
  return Number.isFinite(value) && Number.isSafeInteger(value) && value >= 0;
}

function replaceById<TItem, TKey extends keyof TItem>(
  items: readonly TItem[],
  key: TKey,
  id: TItem[TKey],
  replacement: TItem,
): readonly TItem[] {
  return Object.freeze(items.map((item) => (item[key] === id ? replacement : item)));
}

function describeValueType(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    return "an array";
  }

  return `a ${typeof value}`;
}

const INCOME_CATEGORIES = new Set<MoneyTransactionCategory>([
  MoneyTransactionCategory.OperationReward,
  MoneyTransactionCategory.RecurringIncome,
  MoneyTransactionCategory.BusinessIncome,
  MoneyTransactionCategory.RecoveryIncome,
  MoneyTransactionCategory.OtherIncome,
]);

const CATEGORY_SOURCE_COMPATIBILITY: Readonly<
  Record<MoneyTransactionCategory, readonly MoneyTransactionSourceType[]>
> = {
  [MoneyTransactionCategory.OperationReward]: [MoneyTransactionSourceType.OperationGrossReward],
  [MoneyTransactionCategory.RecurringIncome]: [MoneyTransactionSourceType.RecurringIncome],
  [MoneyTransactionCategory.BusinessIncome]: [MoneyTransactionSourceType.BusinessIncome],
  [MoneyTransactionCategory.RecoveryIncome]: [MoneyTransactionSourceType.Recovery],
  [MoneyTransactionCategory.OtherIncome]: [MoneyTransactionSourceType.Generic],
  [MoneyTransactionCategory.OperationCost]: [MoneyTransactionSourceType.OperationStartCost],
  [MoneyTransactionCategory.CrewUpkeep]: [MoneyTransactionSourceType.CrewUpkeep],
  [MoneyTransactionCategory.BusinessUpkeep]: [MoneyTransactionSourceType.BusinessUpkeep],
  [MoneyTransactionCategory.HideoutUpkeep]: [MoneyTransactionSourceType.HideoutUpkeep],
  [MoneyTransactionCategory.RecruitmentCost]: [
    MoneyTransactionSourceType.RecruitmentCharacterCost,
    MoneyTransactionSourceType.RecruitmentOpportunityCost,
  ],
  [MoneyTransactionCategory.PressureManagementCost]: [
    MoneyTransactionSourceType.PressureManagement,
  ],
  [MoneyTransactionCategory.RecoveryCost]: [MoneyTransactionSourceType.Recovery],
  [MoneyTransactionCategory.OtherExpense]: [MoneyTransactionSourceType.Generic],
};
