import {
  DomainErrorCode,
  failure,
  success,
  type DomainError,
  type DomainResult,
} from "./domainResult";
import type { OrganizationId, RecurringEconomyScheduleId } from "./entityIds";
import { InvalidEntityIdError, parseRecurringEconomyScheduleId } from "./entityIds";
import {
  MoneyTransactionCategory,
  MoneyTransactionSourceType,
  parseMoneySourceId,
  type MoneySourceId,
} from "./moneyLedger";
import { createRecurringEconomySchedule, type RecurringEconomySchedule } from "./recurringEconomy";
import { parseSimulationTick, type SimulationTick } from "./simulationClock";

export interface RecurringIncomeScheduleDefinition {
  readonly amount: number;
  readonly periodTicks: number;
}

export interface GenerateRecurringIncomeScheduleInput {
  readonly organizationId: OrganizationId;
  readonly schedules: readonly RecurringEconomySchedule[];
  readonly scheduleId: RecurringEconomyScheduleId;
  readonly definition: RecurringIncomeScheduleDefinition;
  readonly firstDueTick: SimulationTick;
}

export interface GenerateRecurringIncomeScheduleSuccess {
  readonly generatedSchedules: readonly RecurringEconomySchedule[];
  readonly reusedSchedules: readonly RecurringEconomySchedule[];
  readonly schedules: readonly RecurringEconomySchedule[];
}

export interface RecurringIncomeScheduleGenerationInvalidDefinitionError extends DomainError {
  readonly code: typeof DomainErrorCode.RecurringIncomeScheduleGenerationInvalidDefinition;
  readonly field: "amount" | "periodTicks";
  readonly reason: string;
  readonly value: unknown;
}

export interface RecurringIncomeScheduleGenerationInvalidFirstDueTickError extends DomainError {
  readonly code: typeof DomainErrorCode.RecurringIncomeScheduleGenerationInvalidFirstDueTick;
  readonly reason: string;
  readonly value: unknown;
}

export interface RecurringIncomeScheduleGenerationInvalidScheduleIdError extends DomainError {
  readonly code: typeof DomainErrorCode.RecurringIncomeScheduleGenerationInvalidScheduleId;
  readonly reason: string;
  readonly value: unknown;
}

export interface RecurringIncomeScheduleGenerationScheduleConflictError extends DomainError {
  readonly code: typeof DomainErrorCode.RecurringIncomeScheduleGenerationScheduleConflict;
  readonly organizationId: OrganizationId;
  readonly scheduleId?: RecurringEconomyScheduleId;
  readonly reason:
    | "duplicate-existing-income-schedule"
    | "expected-schedule-id-used-by-another-source"
    | "income-schedule-id-mismatch"
    | "matching-schedule-definition-mismatch";
}

export type RecurringIncomeScheduleGenerationError =
  | RecurringIncomeScheduleGenerationInvalidDefinitionError
  | RecurringIncomeScheduleGenerationInvalidFirstDueTickError
  | RecurringIncomeScheduleGenerationInvalidScheduleIdError
  | RecurringIncomeScheduleGenerationScheduleConflictError;

export type GenerateRecurringIncomeScheduleResult = DomainResult<
  GenerateRecurringIncomeScheduleSuccess,
  RecurringIncomeScheduleGenerationError
>;

export function generateRecurringIncomeSchedule(
  input: GenerateRecurringIncomeScheduleInput,
): GenerateRecurringIncomeScheduleResult {
  const definitionResult = validateRecurringIncomeDefinition(input.definition);
  if (!definitionResult.ok) {
    return definitionResult;
  }

  const firstDueTickResult = validateFirstDueTick(input.firstDueTick);
  if (!firstDueTickResult.ok) {
    return firstDueTickResult;
  }

  let scheduleId: RecurringEconomyScheduleId;
  try {
    scheduleId = parseRecurringEconomyScheduleId(input.scheduleId);
  } catch (error) {
    return invalidScheduleId(
      error instanceof InvalidEntityIdError ? error.reason : "schedule ID parser rejected",
      input.scheduleId,
    );
  }

  const sourceId = createRecurringIncomeSourceId(input.organizationId);
  const matchingSchedules = input.schedules.filter(
    (schedule) =>
      schedule.organizationId === input.organizationId &&
      schedule.category === MoneyTransactionCategory.RecurringIncome &&
      schedule.source.type === MoneyTransactionSourceType.RecurringIncome,
  );

  if (matchingSchedules.length > 1) {
    return scheduleConflict({
      organizationId: input.organizationId,
      reason: "duplicate-existing-income-schedule",
    });
  }

  const expectedIdSchedule = input.schedules.find((schedule) => schedule.scheduleId === scheduleId);
  const existingMatch = matchingSchedules[0];
  if (existingMatch !== undefined) {
    if (existingMatch.scheduleId !== scheduleId) {
      return scheduleConflict({
        organizationId: input.organizationId,
        scheduleId: existingMatch.scheduleId,
        reason: "income-schedule-id-mismatch",
      });
    }

    if (
      !isExpectedRecurringIncomeSchedule(
        existingMatch,
        input.definition,
        input.firstDueTick,
        sourceId,
      )
    ) {
      return scheduleConflict({
        organizationId: input.organizationId,
        scheduleId: existingMatch.scheduleId,
        reason: "matching-schedule-definition-mismatch",
      });
    }

    return success(
      Object.freeze({
        generatedSchedules: Object.freeze([] satisfies RecurringEconomySchedule[]),
        reusedSchedules: Object.freeze([existingMatch]),
        schedules: freezeCollection(input.schedules),
      }),
    );
  }

  if (expectedIdSchedule !== undefined) {
    return scheduleConflict({
      organizationId: input.organizationId,
      scheduleId: expectedIdSchedule.scheduleId,
      reason: "expected-schedule-id-used-by-another-source",
    });
  }

  const scheduleResult = createRecurringEconomySchedule({
    scheduleId,
    organizationId: input.organizationId,
    category: MoneyTransactionCategory.RecurringIncome,
    source: Object.freeze({
      type: MoneyTransactionSourceType.RecurringIncome,
      sourceId,
    }),
    amount: input.definition.amount,
    periodTicks: input.definition.periodTicks,
    nextDueTick: input.firstDueTick,
    active: true,
  });

  if (!scheduleResult.ok) {
    return invalidDefinition("amount", scheduleResult.error.message, input.definition.amount);
  }

  return success(
    Object.freeze({
      generatedSchedules: Object.freeze([scheduleResult.value]),
      reusedSchedules: Object.freeze([] satisfies RecurringEconomySchedule[]),
      schedules: Object.freeze([...input.schedules, scheduleResult.value]),
    }),
  );
}

export function createRecurringIncomeSourceId(organizationId: OrganizationId): MoneySourceId {
  return parseMoneySourceId(`recurring-income:${organizationId}`);
}

function validateRecurringIncomeDefinition(
  definition: RecurringIncomeScheduleDefinition,
): DomainResult<undefined, RecurringIncomeScheduleGenerationInvalidDefinitionError> {
  const amountResult = validatePositiveSafeInteger("amount", definition.amount);
  if (!amountResult.ok) {
    return amountResult;
  }

  return validatePositiveSafeInteger("periodTicks", definition.periodTicks);
}

function validatePositiveSafeInteger(
  field: "amount" | "periodTicks",
  value: unknown,
): DomainResult<undefined, RecurringIncomeScheduleGenerationInvalidDefinitionError> {
  if (typeof value !== "number") {
    return invalidDefinition(
      field,
      `expected a number, received ${describeValueType(value)}`,
      value,
    );
  }

  if (!Number.isFinite(value)) {
    return invalidDefinition(field, "expected a finite number", value);
  }

  if (!Number.isSafeInteger(value)) {
    return invalidDefinition(field, "expected a safe integer", value);
  }

  if (value <= 0) {
    return invalidDefinition(field, "expected a positive value", value);
  }

  return success(undefined);
}

function validateFirstDueTick(
  firstDueTick: SimulationTick,
): DomainResult<undefined, RecurringIncomeScheduleGenerationInvalidFirstDueTickError> {
  try {
    parseSimulationTick(firstDueTick);
  } catch (error) {
    return failure({
      code: DomainErrorCode.RecurringIncomeScheduleGenerationInvalidFirstDueTick,
      message: "Recurring income first due tick is invalid.",
      reason: error instanceof Error ? error.message : "simulation tick parser rejected",
      value: firstDueTick,
    });
  }

  return success(undefined);
}

function isExpectedRecurringIncomeSchedule(
  schedule: RecurringEconomySchedule,
  definition: RecurringIncomeScheduleDefinition,
  firstDueTick: SimulationTick,
  sourceId: MoneySourceId,
): boolean {
  return (
    schedule.amount === definition.amount &&
    schedule.periodTicks === definition.periodTicks &&
    schedule.nextDueTick === firstDueTick &&
    schedule.active === true &&
    schedule.source.type === MoneyTransactionSourceType.RecurringIncome &&
    schedule.source.sourceId === sourceId
  );
}

function invalidScheduleId<TValue = never>(
  reason: string,
  value: unknown,
): DomainResult<TValue, RecurringIncomeScheduleGenerationInvalidScheduleIdError> {
  return failure({
    code: DomainErrorCode.RecurringIncomeScheduleGenerationInvalidScheduleId,
    message: `Recurring income schedule ID is invalid: ${reason}.`,
    reason,
    value,
  });
}

function scheduleConflict(input: {
  readonly organizationId: OrganizationId;
  readonly scheduleId?: RecurringEconomyScheduleId;
  readonly reason: RecurringIncomeScheduleGenerationScheduleConflictError["reason"];
}): DomainResult<never, RecurringIncomeScheduleGenerationScheduleConflictError> {
  return failure({
    code: DomainErrorCode.RecurringIncomeScheduleGenerationScheduleConflict,
    message: `Recurring income schedule conflict: ${input.reason}.`,
    organizationId: input.organizationId,
    ...(input.scheduleId === undefined ? {} : { scheduleId: input.scheduleId }),
    reason: input.reason,
  });
}

function invalidDefinition<TValue = undefined>(
  field: "amount" | "periodTicks",
  reason: string,
  value: unknown,
): DomainResult<TValue, RecurringIncomeScheduleGenerationInvalidDefinitionError> {
  return failure({
    code: DomainErrorCode.RecurringIncomeScheduleGenerationInvalidDefinition,
    message: `Recurring income definition field "${field}" is invalid: ${reason}.`,
    field,
    reason,
    value,
  });
}

function freezeCollection<TItem>(items: readonly TItem[]): readonly TItem[] {
  return Object.isFrozen(items) ? items : Object.freeze([...items]);
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
