import {
  processRecurringEconomyDuePeriod,
  failure,
  success,
  DomainErrorCode,
  MoneyTransactionCategory,
  MoneyTransactionSourceType,
  type CharacterId,
  type DomainError,
  type DomainEvent,
  type DomainResult,
  type MoneyTransaction,
  type OrganizationState,
  type RecurringEconomyError,
  type RecurringEconomyProcessingRecord,
  type RecurringEconomyProcessingStatus,
  type RecurringEconomySchedule,
  type RecurringEconomyScheduleId,
  type SimulationTick,
  type TransactionId,
} from "@crimeworld/domain";

export interface ExecuteRecurringEconomyRuntimeInput {
  readonly currentTick: SimulationTick;
  readonly transactionId: TransactionId;
  readonly scheduleId: RecurringEconomyScheduleId;
  readonly organizations: readonly OrganizationState[];
  readonly transactions: readonly MoneyTransaction[];
  readonly processingRecords: readonly RecurringEconomyProcessingRecord[];
  readonly schedules: readonly RecurringEconomySchedule[];
}

export interface ExecuteRecurringEconomyRuntimeSuccess {
  readonly schedules: readonly RecurringEconomySchedule[];
  readonly processingRecords: readonly RecurringEconomyProcessingRecord[];
  readonly organizations: readonly OrganizationState[];
  readonly transactions: readonly MoneyTransaction[];
  readonly events: readonly DomainEvent[];
  readonly processingStatus: RecurringEconomyProcessingStatus;
}

export type ExecuteRecurringEconomyRuntimeResult = DomainResult<
  ExecuteRecurringEconomyRuntimeSuccess,
  RecurringEconomyError
>;

export interface ExecuteCrewUpkeepPeriodInput {
  readonly currentTick: SimulationTick;
  readonly transactionId: TransactionId;
  readonly organizationId: OrganizationState["organizationId"];
  readonly characterId: CharacterId;
  readonly organizations: readonly OrganizationState[];
  readonly transactions: readonly MoneyTransaction[];
  readonly processingRecords: readonly RecurringEconomyProcessingRecord[];
  readonly schedules: readonly RecurringEconomySchedule[];
}

export interface CrewUpkeepRuntimeScheduleNotFoundError extends DomainError {
  readonly code: typeof DomainErrorCode.CrewUpkeepRuntimeScheduleNotFound;
  readonly organizationId: OrganizationState["organizationId"];
  readonly characterId: CharacterId;
}

export interface CrewUpkeepRuntimeScheduleConflictError extends DomainError {
  readonly code: typeof DomainErrorCode.CrewUpkeepRuntimeScheduleConflict;
  readonly organizationId: OrganizationState["organizationId"];
  readonly characterId: CharacterId;
  readonly matchingScheduleCount: number;
}

export type ExecuteCrewUpkeepPeriodError =
  | CrewUpkeepRuntimeScheduleConflictError
  | CrewUpkeepRuntimeScheduleNotFoundError
  | RecurringEconomyError;

export type ExecuteCrewUpkeepPeriodResult = DomainResult<
  ExecuteRecurringEconomyRuntimeSuccess,
  ExecuteCrewUpkeepPeriodError
>;

export interface ExecuteRecurringIncomePeriodInput {
  readonly currentTick: SimulationTick;
  readonly transactionId: TransactionId;
  readonly organizationId: OrganizationState["organizationId"];
  readonly organizations: readonly OrganizationState[];
  readonly transactions: readonly MoneyTransaction[];
  readonly processingRecords: readonly RecurringEconomyProcessingRecord[];
  readonly schedules: readonly RecurringEconomySchedule[];
}

export interface RecurringIncomeRuntimeScheduleNotFoundError extends DomainError {
  readonly code: typeof DomainErrorCode.RecurringIncomeRuntimeScheduleNotFound;
  readonly organizationId: OrganizationState["organizationId"];
}

export interface RecurringIncomeRuntimeScheduleConflictError extends DomainError {
  readonly code: typeof DomainErrorCode.RecurringIncomeRuntimeScheduleConflict;
  readonly organizationId: OrganizationState["organizationId"];
  readonly matchingScheduleCount: number;
}

export type ExecuteRecurringIncomePeriodError =
  | RecurringEconomyError
  | RecurringIncomeRuntimeScheduleConflictError
  | RecurringIncomeRuntimeScheduleNotFoundError;

export type ExecuteRecurringIncomePeriodResult = DomainResult<
  ExecuteRecurringEconomyRuntimeSuccess,
  ExecuteRecurringIncomePeriodError
>;

export function executeRecurringEconomyRuntime(
  input: ExecuteRecurringEconomyRuntimeInput,
): ExecuteRecurringEconomyRuntimeResult {
  const result = processRecurringEconomyDuePeriod({
    currentTick: input.currentTick,
    transactionId: input.transactionId,
    scheduleId: input.scheduleId,
    organizations: input.organizations,
    transactions: input.transactions,
    processingRecords: input.processingRecords,
    schedules: input.schedules,
  });

  if (!result.ok) {
    return result;
  }

  return success(
    Object.freeze({
      schedules: result.value.schedules,
      processingRecords: result.value.processingRecords,
      organizations: result.value.organizations,
      transactions: result.value.transactions,
      events: Object.freeze([...result.value.events]),
      processingStatus: result.value.processingRecord.status,
    }),
  );
}

export function executeCrewUpkeepPeriod(
  input: ExecuteCrewUpkeepPeriodInput,
): ExecuteCrewUpkeepPeriodResult {
  const matchingSchedules = input.schedules.filter(
    (schedule) =>
      schedule.organizationId === input.organizationId &&
      schedule.category === MoneyTransactionCategory.CrewUpkeep &&
      schedule.source.type === MoneyTransactionSourceType.CrewUpkeep &&
      schedule.source.characterId === input.characterId,
  );

  if (matchingSchedules.length === 0) {
    return failure({
      code: DomainErrorCode.CrewUpkeepRuntimeScheduleNotFound,
      message: `Crew upkeep schedule for character "${input.characterId}" in organization "${input.organizationId}" was not found.`,
      organizationId: input.organizationId,
      characterId: input.characterId,
    });
  }

  if (matchingSchedules.length > 1) {
    return failure({
      code: DomainErrorCode.CrewUpkeepRuntimeScheduleConflict,
      message: `Expected one crew upkeep schedule for character "${input.characterId}" in organization "${input.organizationId}", found ${matchingSchedules.length}.`,
      organizationId: input.organizationId,
      characterId: input.characterId,
      matchingScheduleCount: matchingSchedules.length,
    });
  }

  const schedule = matchingSchedules[0];
  if (schedule === undefined) {
    return failure({
      code: DomainErrorCode.CrewUpkeepRuntimeScheduleNotFound,
      message: `Crew upkeep schedule for character "${input.characterId}" in organization "${input.organizationId}" was not found.`,
      organizationId: input.organizationId,
      characterId: input.characterId,
    });
  }

  return executeRecurringEconomyRuntime({
    currentTick: input.currentTick,
    transactionId: input.transactionId,
    scheduleId: schedule.scheduleId,
    organizations: input.organizations,
    transactions: input.transactions,
    processingRecords: input.processingRecords,
    schedules: input.schedules,
  });
}

export function executeRecurringIncomePeriod(
  input: ExecuteRecurringIncomePeriodInput,
): ExecuteRecurringIncomePeriodResult {
  const matchingSchedules = input.schedules.filter(
    (schedule) =>
      schedule.organizationId === input.organizationId &&
      schedule.category === MoneyTransactionCategory.RecurringIncome &&
      schedule.source.type === MoneyTransactionSourceType.RecurringIncome,
  );

  if (matchingSchedules.length === 0) {
    return failure({
      code: DomainErrorCode.RecurringIncomeRuntimeScheduleNotFound,
      message: `Recurring income schedule for organization "${input.organizationId}" was not found.`,
      organizationId: input.organizationId,
    });
  }

  if (matchingSchedules.length > 1) {
    return failure({
      code: DomainErrorCode.RecurringIncomeRuntimeScheduleConflict,
      message: `Expected one recurring income schedule for organization "${input.organizationId}", found ${matchingSchedules.length}.`,
      organizationId: input.organizationId,
      matchingScheduleCount: matchingSchedules.length,
    });
  }

  const schedule = matchingSchedules[0];
  if (schedule === undefined) {
    return failure({
      code: DomainErrorCode.RecurringIncomeRuntimeScheduleNotFound,
      message: `Recurring income schedule for organization "${input.organizationId}" was not found.`,
      organizationId: input.organizationId,
    });
  }

  return executeRecurringEconomyRuntime({
    currentTick: input.currentTick,
    transactionId: input.transactionId,
    scheduleId: schedule.scheduleId,
    organizations: input.organizations,
    transactions: input.transactions,
    processingRecords: input.processingRecords,
    schedules: input.schedules,
  });
}
