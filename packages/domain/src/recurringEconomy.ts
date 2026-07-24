import { createRecurringEconomyPeriodProcessedEvent, type DomainEvent } from "./domainEvents";
import {
  DomainErrorCode,
  failure,
  success,
  type DomainError,
  type DomainResult,
} from "./domainResult";
import type { OrganizationId, RecurringEconomyScheduleId, TransactionId } from "./entityIds";
import {
  InvalidEntityIdError,
  parseOrganizationId,
  parseRecurringEconomyScheduleId,
  parseTransactionId,
} from "./entityIds";
import {
  MoneyTransactionCategory,
  createMoneyTransaction,
  recordMoneyTransaction,
  type MoneyTransaction,
  type MoneyTransactionCategory as MoneyTransactionCategoryType,
  type MoneyTransactionError,
  type MoneyTransactionSource,
} from "./moneyLedger";
import type { OrganizationState } from "./organizationState";
import { parseSimulationTick, type SimulationTick } from "./simulationClock";

export const RecurringEconomyProcessingStatus = {
  Applied: "applied",
  Unpaid: "unpaid",
} as const;

export type RecurringEconomyProcessingStatus =
  (typeof RecurringEconomyProcessingStatus)[keyof typeof RecurringEconomyProcessingStatus];

export interface RecurringEconomySchedule {
  readonly scheduleId: RecurringEconomyScheduleId;
  readonly organizationId: OrganizationId;
  readonly category: RecurringEconomyScheduleCategory;
  readonly source: MoneyTransactionSource;
  readonly amount: number;
  readonly periodTicks: number;
  readonly nextDueTick: SimulationTick;
  readonly active: boolean;
}

export type RecurringEconomyScheduleCategory =
  | typeof MoneyTransactionCategory.RecurringIncome
  | typeof MoneyTransactionCategory.BusinessIncome
  | typeof MoneyTransactionCategory.CrewUpkeep
  | typeof MoneyTransactionCategory.BusinessUpkeep
  | typeof MoneyTransactionCategory.HideoutUpkeep;

export interface RecurringEconomyProcessingRecord {
  readonly scheduleId: RecurringEconomyScheduleId;
  readonly organizationId: OrganizationId;
  readonly dueTick: SimulationTick;
  readonly processedAtTick: SimulationTick;
  readonly status: RecurringEconomyProcessingStatus;
  readonly amount: number;
  readonly category: RecurringEconomyScheduleCategory;
  readonly source: MoneyTransactionSource;
  readonly transactionId?: TransactionId;
}

export interface CreateRecurringEconomyScheduleInput {
  readonly scheduleId: RecurringEconomyScheduleId;
  readonly organizationId: OrganizationId;
  readonly category: RecurringEconomyScheduleCategory;
  readonly source: MoneyTransactionSource;
  readonly amount: number;
  readonly periodTicks: number;
  readonly nextDueTick: SimulationTick;
  readonly active: boolean;
}

export interface CreateRecurringEconomyProcessingRecordInput {
  readonly scheduleId: RecurringEconomyScheduleId;
  readonly organizationId: OrganizationId;
  readonly dueTick: SimulationTick;
  readonly processedAtTick: SimulationTick;
  readonly status: RecurringEconomyProcessingStatus;
  readonly amount: number;
  readonly category: RecurringEconomyScheduleCategory;
  readonly source: MoneyTransactionSource;
  readonly transactionId?: TransactionId;
}

export interface ProcessRecurringEconomyDuePeriodInput {
  readonly scheduleId: RecurringEconomyScheduleId;
  readonly currentTick: SimulationTick;
  readonly transactionId: TransactionId;
  readonly organizations: readonly OrganizationState[];
  readonly transactions: readonly MoneyTransaction[];
  readonly processingRecords: readonly RecurringEconomyProcessingRecord[];
  readonly schedules: readonly RecurringEconomySchedule[];
}

export interface ProcessRecurringEconomyDuePeriodSuccess {
  readonly schedule: RecurringEconomySchedule;
  readonly schedules: readonly RecurringEconomySchedule[];
  readonly processingRecord: RecurringEconomyProcessingRecord;
  readonly processingRecords: readonly RecurringEconomyProcessingRecord[];
  readonly organization?: OrganizationState;
  readonly organizations: readonly OrganizationState[];
  readonly transaction?: MoneyTransaction;
  readonly transactions: readonly MoneyTransaction[];
  readonly events: readonly DomainEvent[];
}

export interface RecurringEconomyScheduleNotFoundError extends DomainError {
  readonly code: typeof DomainErrorCode.RecurringEconomyScheduleNotFound;
  readonly scheduleId: RecurringEconomyScheduleId;
}

export interface RecurringEconomyScheduleInactiveError extends DomainError {
  readonly code: typeof DomainErrorCode.RecurringEconomyScheduleInactive;
  readonly scheduleId: RecurringEconomyScheduleId;
}

export interface RecurringEconomyPeriodNotDueError extends DomainError {
  readonly code: typeof DomainErrorCode.RecurringEconomyPeriodNotDue;
  readonly scheduleId: RecurringEconomyScheduleId;
  readonly currentTick: SimulationTick;
  readonly nextDueTick: SimulationTick;
}

export interface RecurringEconomyPeriodAlreadyProcessedError extends DomainError {
  readonly code: typeof DomainErrorCode.RecurringEconomyPeriodAlreadyProcessed;
  readonly scheduleId: RecurringEconomyScheduleId;
  readonly dueTick: SimulationTick;
  readonly existingRecordIndex: number;
}

export interface RecurringEconomyScheduleInvalidError extends DomainError {
  readonly code: typeof DomainErrorCode.RecurringEconomyScheduleInvalid;
  readonly field: string;
  readonly reason: string;
  readonly value: unknown;
}

export interface RecurringEconomyProcessingRecordInvalidError extends DomainError {
  readonly code: typeof DomainErrorCode.RecurringEconomyProcessingRecordInvalid;
  readonly field: string;
  readonly reason: string;
  readonly value: unknown;
}

export interface RecurringEconomyScheduleAdvanceInvalidError extends DomainError {
  readonly code: typeof DomainErrorCode.RecurringEconomyScheduleAdvanceInvalid;
  readonly scheduleId: RecurringEconomyScheduleId;
  readonly nextDueTick: SimulationTick;
  readonly periodTicks: number;
  readonly reason: "overflow";
}

export type RecurringEconomyError =
  | MoneyTransactionError
  | RecurringEconomyPeriodAlreadyProcessedError
  | RecurringEconomyPeriodNotDueError
  | RecurringEconomyProcessingRecordInvalidError
  | RecurringEconomyScheduleAdvanceInvalidError
  | RecurringEconomyScheduleInactiveError
  | RecurringEconomyScheduleInvalidError
  | RecurringEconomyScheduleNotFoundError;

export type CreateRecurringEconomyScheduleResult = DomainResult<
  RecurringEconomySchedule,
  MoneyTransactionError | RecurringEconomyScheduleInvalidError
>;

export type CreateRecurringEconomyProcessingRecordResult = DomainResult<
  RecurringEconomyProcessingRecord,
  MoneyTransactionError | RecurringEconomyProcessingRecordInvalidError
>;

export type ProcessRecurringEconomyDuePeriodResult = DomainResult<
  ProcessRecurringEconomyDuePeriodSuccess,
  RecurringEconomyError
>;

const SCHEDULE_VALIDATION_TRANSACTION_ID = parseTransactionId(
  "transaction:recurring_economy_validation",
);

const SUPPORTED_RECURRING_CATEGORIES = new Set<MoneyTransactionCategoryType>([
  MoneyTransactionCategory.RecurringIncome,
  MoneyTransactionCategory.BusinessIncome,
  MoneyTransactionCategory.CrewUpkeep,
  MoneyTransactionCategory.BusinessUpkeep,
  MoneyTransactionCategory.HideoutUpkeep,
]);

export function createRecurringEconomySchedule(
  input: CreateRecurringEconomyScheduleInput,
): CreateRecurringEconomyScheduleResult {
  const idResult = validateScheduleEntityIds(input.scheduleId, input.organizationId);
  if (!idResult.ok) {
    return idResult;
  }

  const tickResult = validateSimulationTickField("nextDueTick", input.nextDueTick);
  if (!tickResult.ok) {
    return tickResult;
  }

  const periodResult = validatePeriodTicks(input.periodTicks);
  if (!periodResult.ok) {
    return periodResult;
  }

  if (typeof input.active !== "boolean") {
    return invalidSchedule("active", "expected a boolean", input.active);
  }

  const sourceResult = validateRecurringMoneyContract({
    organizationId: input.organizationId,
    category: input.category,
    source: input.source,
    amount: input.amount,
    recordedAtTick: input.nextDueTick,
  });
  if (!sourceResult.ok) {
    return sourceResult;
  }

  return success(
    Object.freeze({
      scheduleId: input.scheduleId,
      organizationId: input.organizationId,
      category: input.category,
      source: sourceResult.value,
      amount: input.amount,
      periodTicks: input.periodTicks,
      nextDueTick: input.nextDueTick,
      active: input.active,
    }),
  );
}

export function createRecurringEconomyProcessingRecord(
  input: CreateRecurringEconomyProcessingRecordInput,
): CreateRecurringEconomyProcessingRecordResult {
  const idResult = validateScheduleEntityIds(input.scheduleId, input.organizationId);
  if (!idResult.ok) {
    return processingRecordInvalidFromScheduleInvalid(idResult.error);
  }

  for (const field of ["dueTick", "processedAtTick"] as const) {
    const tickResult = validateSimulationTickField(field, input[field]);
    if (!tickResult.ok) {
      return processingRecordInvalidFromScheduleInvalid(tickResult.error);
    }
  }

  if (
    input.status !== RecurringEconomyProcessingStatus.Applied &&
    input.status !== RecurringEconomyProcessingStatus.Unpaid
  ) {
    return invalidProcessingRecord("status", "expected applied or unpaid", input.status);
  }

  if (
    input.status === RecurringEconomyProcessingStatus.Applied &&
    input.transactionId === undefined
  ) {
    return invalidProcessingRecord(
      "transactionId",
      "applied processing requires a transaction ID",
      input.transactionId,
    );
  }

  if (
    input.status === RecurringEconomyProcessingStatus.Unpaid &&
    input.transactionId !== undefined
  ) {
    return invalidProcessingRecord(
      "transactionId",
      "unpaid processing must not reference a transaction ID",
      input.transactionId,
    );
  }

  if (input.transactionId !== undefined) {
    try {
      parseTransactionId(input.transactionId);
    } catch (error) {
      return invalidProcessingRecord(
        "transactionId",
        error instanceof InvalidEntityIdError ? error.reason : "transaction ID parser rejected",
        input.transactionId,
      );
    }
  }

  const sourceResult = validateRecurringMoneyContract({
    organizationId: input.organizationId,
    category: input.category,
    source: input.source,
    amount: input.amount,
    recordedAtTick: input.dueTick,
  });
  if (!sourceResult.ok) {
    const error = sourceResult.error;
    if (error.code === DomainErrorCode.RecurringEconomyScheduleInvalid) {
      return processingRecordInvalidFromScheduleInvalid(error);
    }

    return failure(error as MoneyTransactionError);
  }

  return success(
    Object.freeze({
      scheduleId: input.scheduleId,
      organizationId: input.organizationId,
      dueTick: input.dueTick,
      processedAtTick: input.processedAtTick,
      status: input.status,
      amount: input.amount,
      category: input.category,
      source: sourceResult.value,
      ...(input.transactionId === undefined ? {} : { transactionId: input.transactionId }),
    }),
  );
}

export function processRecurringEconomyDuePeriod(
  input: ProcessRecurringEconomyDuePeriodInput,
): ProcessRecurringEconomyDuePeriodResult {
  const scheduleIndex = input.schedules.findIndex(
    (schedule) => schedule.scheduleId === input.scheduleId,
  );
  if (scheduleIndex === -1) {
    return failure({
      code: DomainErrorCode.RecurringEconomyScheduleNotFound,
      message: `Recurring economy schedule "${input.scheduleId}" was not found.`,
      scheduleId: input.scheduleId,
    });
  }

  const schedule = input.schedules[scheduleIndex];
  if (schedule === undefined) {
    return failure({
      code: DomainErrorCode.RecurringEconomyScheduleNotFound,
      message: `Recurring economy schedule "${input.scheduleId}" was not found.`,
      scheduleId: input.scheduleId,
    });
  }

  if (!schedule.active) {
    return failure({
      code: DomainErrorCode.RecurringEconomyScheduleInactive,
      message: `Recurring economy schedule "${schedule.scheduleId}" is inactive.`,
      scheduleId: schedule.scheduleId,
    });
  }

  if (input.currentTick < schedule.nextDueTick) {
    return failure({
      code: DomainErrorCode.RecurringEconomyPeriodNotDue,
      message: `Recurring economy schedule "${schedule.scheduleId}" is not due yet.`,
      scheduleId: schedule.scheduleId,
      currentTick: input.currentTick,
      nextDueTick: schedule.nextDueTick,
    });
  }

  const dueTick = schedule.nextDueTick;
  const duplicateRecordIndex = input.processingRecords.findIndex(
    (record) => record.scheduleId === schedule.scheduleId && record.dueTick === dueTick,
  );
  if (duplicateRecordIndex !== -1) {
    return failure({
      code: DomainErrorCode.RecurringEconomyPeriodAlreadyProcessed,
      message: `Recurring economy schedule "${schedule.scheduleId}" already processed due tick ${dueTick}.`,
      scheduleId: schedule.scheduleId,
      dueTick,
      existingRecordIndex: duplicateRecordIndex,
    });
  }

  const nextDueTick = schedule.nextDueTick + schedule.periodTicks;
  if (!Number.isSafeInteger(nextDueTick)) {
    return failure({
      code: DomainErrorCode.RecurringEconomyScheduleAdvanceInvalid,
      message: `Recurring economy schedule "${schedule.scheduleId}" cannot advance without overflow.`,
      scheduleId: schedule.scheduleId,
      nextDueTick: schedule.nextDueTick,
      periodTicks: schedule.periodTicks,
      reason: "overflow",
    });
  }

  const advancedScheduleResult = createRecurringEconomySchedule({
    ...schedule,
    nextDueTick: parseSimulationTick(nextDueTick),
  });
  if (!advancedScheduleResult.ok) {
    return advancedScheduleResult;
  }

  const ledgerResult = recordMoneyTransaction({
    transactionId: input.transactionId,
    organizationId: schedule.organizationId,
    recordedAtTick: input.currentTick,
    amount: schedule.amount,
    category: schedule.category,
    source: schedule.source,
    organizations: input.organizations,
    transactions: input.transactions,
  });

  if (!ledgerResult.ok) {
    if (ledgerResult.error.code !== DomainErrorCode.MoneyTransactionInsufficientFunds) {
      return ledgerResult;
    }

    const unpaidRecordResult = createRecurringEconomyProcessingRecord({
      scheduleId: schedule.scheduleId,
      organizationId: schedule.organizationId,
      dueTick,
      processedAtTick: input.currentTick,
      status: RecurringEconomyProcessingStatus.Unpaid,
      amount: schedule.amount,
      category: schedule.category,
      source: schedule.source,
    });
    if (!unpaidRecordResult.ok) {
      return unpaidRecordResult;
    }

    const processingRecords = Object.freeze([...input.processingRecords, unpaidRecordResult.value]);
    const schedules = replaceSchedule(input.schedules, scheduleIndex, advancedScheduleResult.value);
    const events = Object.freeze([
      createRecurringEconomyPeriodProcessedEvent({
        scheduleId: unpaidRecordResult.value.scheduleId,
        organizationId: unpaidRecordResult.value.organizationId,
        dueTick: unpaidRecordResult.value.dueTick,
        processedAtTick: unpaidRecordResult.value.processedAtTick,
        status: unpaidRecordResult.value.status,
        amount: unpaidRecordResult.value.amount,
        category: unpaidRecordResult.value.category,
        source: unpaidRecordResult.value.source,
      }),
    ]);

    return success(
      Object.freeze({
        schedule: advancedScheduleResult.value,
        schedules,
        processingRecord: unpaidRecordResult.value,
        processingRecords,
        organizations: freezeCollection(input.organizations),
        transactions: freezeCollection(input.transactions),
        events,
      }),
    );
  }

  const appliedRecordResult = createRecurringEconomyProcessingRecord({
    scheduleId: schedule.scheduleId,
    organizationId: schedule.organizationId,
    dueTick,
    processedAtTick: input.currentTick,
    status: RecurringEconomyProcessingStatus.Applied,
    amount: schedule.amount,
    category: schedule.category,
    source: schedule.source,
    transactionId: ledgerResult.value.transaction.transactionId,
  });
  if (!appliedRecordResult.ok) {
    return appliedRecordResult;
  }

  const processingRecords = Object.freeze([...input.processingRecords, appliedRecordResult.value]);
  const schedules = replaceSchedule(input.schedules, scheduleIndex, advancedScheduleResult.value);
  const recurringEvent = createRecurringEconomyPeriodProcessedEvent({
    scheduleId: appliedRecordResult.value.scheduleId,
    organizationId: appliedRecordResult.value.organizationId,
    dueTick: appliedRecordResult.value.dueTick,
    processedAtTick: appliedRecordResult.value.processedAtTick,
    status: appliedRecordResult.value.status,
    amount: appliedRecordResult.value.amount,
    category: appliedRecordResult.value.category,
    source: appliedRecordResult.value.source,
    transactionId: ledgerResult.value.transaction.transactionId,
  });

  return success(
    Object.freeze({
      schedule: advancedScheduleResult.value,
      schedules,
      processingRecord: appliedRecordResult.value,
      processingRecords,
      organization: ledgerResult.value.organization,
      organizations: ledgerResult.value.organizations,
      transaction: ledgerResult.value.transaction,
      transactions: ledgerResult.value.transactions,
      events: Object.freeze([...ledgerResult.value.events, recurringEvent]),
    }),
  );
}

function validateRecurringMoneyContract(input: {
  readonly organizationId: OrganizationId;
  readonly category: RecurringEconomyScheduleCategory;
  readonly source: MoneyTransactionSource;
  readonly amount: number;
  readonly recordedAtTick: SimulationTick;
}): DomainResult<
  MoneyTransactionSource,
  MoneyTransactionError | RecurringEconomyScheduleInvalidError
> {
  if (!SUPPORTED_RECURRING_CATEGORIES.has(input.category)) {
    return invalidSchedule<MoneyTransactionSource>(
      "category",
      "expected a supported recurring economy category",
      input.category,
    );
  }

  const balanceBefore = input.amount > 0 ? 0 : Math.abs(input.amount);
  const balanceAfter = balanceBefore + input.amount;
  const transactionResult = createMoneyTransaction({
    transactionId: SCHEDULE_VALIDATION_TRANSACTION_ID,
    organizationId: input.organizationId,
    recordedAtTick: input.recordedAtTick,
    amount: input.amount,
    balanceBefore,
    balanceAfter,
    category: input.category,
    source: input.source,
  });
  if (!transactionResult.ok) {
    return transactionResult;
  }

  return success(transactionResult.value.source);
}

function validateScheduleEntityIds(
  scheduleId: RecurringEconomyScheduleId,
  organizationId: OrganizationId,
): DomainResult<undefined, RecurringEconomyScheduleInvalidError> {
  try {
    parseRecurringEconomyScheduleId(scheduleId);
  } catch (error) {
    return invalidSchedule(
      "scheduleId",
      error instanceof InvalidEntityIdError ? error.reason : "schedule ID parser rejected",
      scheduleId,
    );
  }

  try {
    parseOrganizationId(organizationId);
  } catch (error) {
    return invalidSchedule(
      "organizationId",
      error instanceof InvalidEntityIdError ? error.reason : "organization ID parser rejected",
      organizationId,
    );
  }

  return success(undefined);
}

function validateSimulationTickField(
  field: string,
  value: SimulationTick,
): DomainResult<undefined, RecurringEconomyScheduleInvalidError> {
  try {
    parseSimulationTick(value);
  } catch (error) {
    return invalidSchedule(field, error instanceof Error ? error.message : "invalid tick", value);
  }

  return success(undefined);
}

function validatePeriodTicks(
  periodTicks: number,
): DomainResult<undefined, RecurringEconomyScheduleInvalidError> {
  if (typeof periodTicks !== "number") {
    return invalidSchedule("periodTicks", "expected a number", periodTicks);
  }

  if (!Number.isFinite(periodTicks)) {
    return invalidSchedule("periodTicks", "expected a finite number", periodTicks);
  }

  if (!Number.isSafeInteger(periodTicks)) {
    return invalidSchedule("periodTicks", "expected a safe integer", periodTicks);
  }

  if (periodTicks <= 0) {
    return invalidSchedule("periodTicks", "expected a positive value", periodTicks);
  }

  return success(undefined);
}

function invalidSchedule<TValue = undefined>(
  field: string,
  reason: string,
  value: unknown,
): DomainResult<TValue, RecurringEconomyScheduleInvalidError> {
  return failure({
    code: DomainErrorCode.RecurringEconomyScheduleInvalid,
    message: `Recurring economy schedule field "${field}" is invalid: ${reason}.`,
    field,
    reason,
    value,
  });
}

function invalidProcessingRecord<TValue = undefined>(
  field: string,
  reason: string,
  value: unknown,
): DomainResult<TValue, RecurringEconomyProcessingRecordInvalidError> {
  return failure({
    code: DomainErrorCode.RecurringEconomyProcessingRecordInvalid,
    message: `Recurring economy processing record field "${field}" is invalid: ${reason}.`,
    field,
    reason,
    value,
  });
}

function processingRecordInvalidFromScheduleInvalid<TValue = never>(
  error: RecurringEconomyScheduleInvalidError,
): DomainResult<TValue, RecurringEconomyProcessingRecordInvalidError> {
  return invalidProcessingRecord<TValue>(error.field, error.reason, error.value);
}

function replaceSchedule(
  schedules: readonly RecurringEconomySchedule[],
  scheduleIndex: number,
  replacement: RecurringEconomySchedule,
): readonly RecurringEconomySchedule[] {
  return Object.freeze(
    schedules.map((schedule, index) => (index === scheduleIndex ? replacement : schedule)),
  );
}

function freezeCollection<TItem>(items: readonly TItem[]): readonly TItem[] {
  return Object.isFrozen(items) ? items : Object.freeze([...items]);
}
