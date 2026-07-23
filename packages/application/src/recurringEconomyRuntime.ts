import {
  processRecurringEconomyDuePeriod,
  success,
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
