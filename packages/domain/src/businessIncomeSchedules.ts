import {
  DomainErrorCode,
  failure,
  success,
  type DomainError,
  type DomainResult,
} from "./domainResult";
import type { BusinessState } from "./businessState";
import type { BusinessId, OrganizationId, RecurringEconomyScheduleId } from "./entityIds";
import { InvalidEntityIdError, parseRecurringEconomyScheduleId } from "./entityIds";
import {
  MoneyTransactionCategory,
  MoneyTransactionSourceType,
  type MoneyTransactionSource,
} from "./moneyLedger";
import type { OrganizationState } from "./organizationState";
import { createRecurringEconomySchedule, type RecurringEconomySchedule } from "./recurringEconomy";
import { parseSimulationTick, type SimulationTick } from "./simulationClock";

export interface BusinessIncomeScheduleDefinition {
  readonly businessId: BusinessId;
  readonly ownerOrganizationId: OrganizationId;
  readonly amount: number;
  readonly periodTicks: number;
}

export type BusinessIncomeScheduleIdByBusinessId = Readonly<
  Record<string, RecurringEconomyScheduleId>
>;

export interface GenerateBusinessIncomeSchedulesInput {
  readonly businesses: readonly BusinessState[];
  readonly organizations: readonly OrganizationState[];
  readonly schedules: readonly RecurringEconomySchedule[];
  readonly definitions: readonly BusinessIncomeScheduleDefinition[];
  readonly firstDueTick: SimulationTick;
  readonly scheduleIdsByBusinessId: BusinessIncomeScheduleIdByBusinessId;
}

export interface GenerateBusinessIncomeSchedulesSuccess {
  readonly generatedSchedules: readonly RecurringEconomySchedule[];
  readonly reusedSchedules: readonly RecurringEconomySchedule[];
  readonly schedules: readonly RecurringEconomySchedule[];
}

export interface BusinessIncomeScheduleGenerationMissingBusinessError extends DomainError {
  readonly code: typeof DomainErrorCode.BusinessIncomeScheduleGenerationMissingBusiness;
  readonly businessId: BusinessId;
}

export interface BusinessIncomeScheduleGenerationMissingOrganizationError extends DomainError {
  readonly code: typeof DomainErrorCode.BusinessIncomeScheduleGenerationMissingOrganization;
  readonly businessId: BusinessId;
  readonly organizationId: OrganizationId;
}

export interface BusinessIncomeScheduleGenerationInvalidDefinitionError extends DomainError {
  readonly code: typeof DomainErrorCode.BusinessIncomeScheduleGenerationInvalidDefinition;
  readonly businessId?: BusinessId;
  readonly field: "businessId" | "ownerOrganizationId" | "amount" | "periodTicks";
  readonly reason: string;
  readonly value: unknown;
}

export interface BusinessIncomeScheduleGenerationInvalidFirstDueTickError extends DomainError {
  readonly code: typeof DomainErrorCode.BusinessIncomeScheduleGenerationInvalidFirstDueTick;
  readonly reason: string;
  readonly value: unknown;
}

export interface BusinessIncomeScheduleGenerationInvalidScheduleIdError extends DomainError {
  readonly code: typeof DomainErrorCode.BusinessIncomeScheduleGenerationInvalidScheduleId;
  readonly businessId: BusinessId;
  readonly reason: string;
  readonly value: unknown;
}

export interface BusinessIncomeScheduleGenerationScheduleConflictError extends DomainError {
  readonly code: typeof DomainErrorCode.BusinessIncomeScheduleGenerationScheduleConflict;
  readonly businessId?: BusinessId;
  readonly scheduleId?: RecurringEconomyScheduleId;
  readonly reason:
    | "duplicate-definition-business"
    | "duplicate-generated-schedule-id"
    | "duplicate-existing-business-schedule"
    | "expected-schedule-id-used-by-another-source"
    | "business-schedule-id-mismatch"
    | "matching-schedule-incompatible";
}

export type BusinessIncomeScheduleGenerationError =
  | BusinessIncomeScheduleGenerationInvalidDefinitionError
  | BusinessIncomeScheduleGenerationInvalidFirstDueTickError
  | BusinessIncomeScheduleGenerationInvalidScheduleIdError
  | BusinessIncomeScheduleGenerationMissingBusinessError
  | BusinessIncomeScheduleGenerationMissingOrganizationError
  | BusinessIncomeScheduleGenerationScheduleConflictError;

export type GenerateBusinessIncomeSchedulesResult = DomainResult<
  GenerateBusinessIncomeSchedulesSuccess,
  BusinessIncomeScheduleGenerationError
>;

export function generateBusinessIncomeSchedules(
  input: GenerateBusinessIncomeSchedulesInput,
): GenerateBusinessIncomeSchedulesResult {
  const firstDueTickResult = validateFirstDueTick(input.firstDueTick);
  if (!firstDueTickResult.ok) {
    return firstDueTickResult;
  }

  const definitionResult = validateDefinitions(input.definitions);
  if (!definitionResult.ok) {
    return definitionResult;
  }

  const definitionsByBusinessId = new Map(
    input.definitions.map((definition) => [definition.businessId, definition]),
  );
  const organizationIds = new Set(
    input.organizations.map((organization) => organization.organizationId),
  );

  for (const definition of input.definitions) {
    const business = input.businesses.find(
      (candidate) => candidate.businessId === definition.businessId,
    );
    if (business === undefined) {
      return failure({
        code: DomainErrorCode.BusinessIncomeScheduleGenerationMissingBusiness,
        message: `Business "${definition.businessId}" was not found for business income schedule generation.`,
        businessId: definition.businessId,
      });
    }

    if (business.ownerOrganizationId !== definition.ownerOrganizationId) {
      return invalidDefinition(
        "ownerOrganizationId",
        "expected the definition owner to match the current business owner",
        definition.ownerOrganizationId,
        definition.businessId,
      );
    }

    if (!organizationIds.has(definition.ownerOrganizationId)) {
      return failure({
        code: DomainErrorCode.BusinessIncomeScheduleGenerationMissingOrganization,
        message: `Organization "${definition.ownerOrganizationId}" was not found for business income schedule generation.`,
        businessId: definition.businessId,
        organizationId: definition.ownerOrganizationId,
      });
    }
  }

  const eligibleBusinesses = input.businesses.filter(
    (business) =>
      business.ownerOrganizationId !== null && definitionsByBusinessId.has(business.businessId),
  );
  const expectedScheduleIds = new Map<BusinessId, RecurringEconomyScheduleId>();
  const seenScheduleIds = new Map<RecurringEconomyScheduleId, BusinessId>();

  for (const business of eligibleBusinesses) {
    const scheduleIdResult = parseMappedScheduleId(
      business.businessId,
      input.scheduleIdsByBusinessId,
    );
    if (!scheduleIdResult.ok) {
      return scheduleIdResult;
    }

    const existingBusinessId = seenScheduleIds.get(scheduleIdResult.value);
    if (existingBusinessId !== undefined && existingBusinessId !== business.businessId) {
      return scheduleConflict({
        businessId: business.businessId,
        scheduleId: scheduleIdResult.value,
        reason: "duplicate-generated-schedule-id",
      });
    }

    expectedScheduleIds.set(business.businessId, scheduleIdResult.value);
    seenScheduleIds.set(scheduleIdResult.value, business.businessId);
  }

  const existingResult = classifyExistingSchedules({
    eligibleBusinesses,
    schedules: input.schedules,
    expectedScheduleIds,
    definitionsByBusinessId,
    firstDueTick: input.firstDueTick,
  });
  if (!existingResult.ok) {
    return existingResult;
  }

  const generatedSchedules: RecurringEconomySchedule[] = [];
  for (const business of eligibleBusinesses) {
    if (existingResult.value.reusedByBusinessId.has(business.businessId)) {
      continue;
    }

    const definition = definitionsByBusinessId.get(business.businessId);
    const scheduleId = expectedScheduleIds.get(business.businessId);
    if (
      definition === undefined ||
      scheduleId === undefined ||
      business.ownerOrganizationId === null
    ) {
      continue;
    }

    const scheduleResult = createRecurringEconomySchedule({
      scheduleId,
      organizationId: business.ownerOrganizationId,
      category: MoneyTransactionCategory.BusinessIncome,
      source: Object.freeze({
        type: MoneyTransactionSourceType.BusinessIncome,
        businessId: business.businessId,
      }),
      amount: definition.amount,
      periodTicks: definition.periodTicks,
      nextDueTick: input.firstDueTick,
      active: true,
    });
    if (!scheduleResult.ok) {
      return invalidDefinition(
        "amount",
        scheduleResult.error.message,
        definition.amount,
        business.businessId,
      );
    }

    generatedSchedules.push(scheduleResult.value);
  }

  return success(
    Object.freeze({
      generatedSchedules: Object.freeze(generatedSchedules),
      reusedSchedules: Object.freeze(existingResult.value.reusedSchedules),
      schedules: Object.freeze([...input.schedules, ...generatedSchedules]),
    }),
  );
}

function validateDefinitions(
  definitions: readonly BusinessIncomeScheduleDefinition[],
): DomainResult<
  undefined,
  | BusinessIncomeScheduleGenerationInvalidDefinitionError
  | BusinessIncomeScheduleGenerationScheduleConflictError
> {
  const seenBusinessIds = new Set<BusinessId>();
  for (const definition of definitions) {
    if (seenBusinessIds.has(definition.businessId)) {
      return scheduleConflict({
        businessId: definition.businessId,
        reason: "duplicate-definition-business",
      });
    }
    seenBusinessIds.add(definition.businessId);

    const amountResult = validatePositiveSafeInteger(
      "amount",
      definition.amount,
      definition.businessId,
    );
    if (!amountResult.ok) {
      return amountResult;
    }

    const periodResult = validatePositiveSafeInteger(
      "periodTicks",
      definition.periodTicks,
      definition.businessId,
    );
    if (!periodResult.ok) {
      return periodResult;
    }
  }

  return success(undefined);
}

function classifyExistingSchedules(input: {
  readonly eligibleBusinesses: readonly BusinessState[];
  readonly schedules: readonly RecurringEconomySchedule[];
  readonly expectedScheduleIds: ReadonlyMap<BusinessId, RecurringEconomyScheduleId>;
  readonly definitionsByBusinessId: ReadonlyMap<BusinessId, BusinessIncomeScheduleDefinition>;
  readonly firstDueTick: SimulationTick;
}): DomainResult<
  {
    readonly reusedSchedules: readonly RecurringEconomySchedule[];
    readonly reusedByBusinessId: ReadonlySet<BusinessId>;
  },
  BusinessIncomeScheduleGenerationScheduleConflictError
> {
  const reusedSchedules: RecurringEconomySchedule[] = [];
  const reusedByBusinessId = new Set<BusinessId>();

  for (const business of input.eligibleBusinesses) {
    const expectedScheduleId = input.expectedScheduleIds.get(business.businessId);
    const matchingSchedules = input.schedules.filter((schedule) =>
      isBusinessIncomeSourceForBusiness(schedule.source, business.businessId),
    );

    if (matchingSchedules.length > 1) {
      return scheduleConflict({
        businessId: business.businessId,
        reason: "duplicate-existing-business-schedule",
      });
    }

    const expectedIdSchedule = input.schedules.find(
      (schedule) => schedule.scheduleId === expectedScheduleId,
    );
    const existingMatch = matchingSchedules[0];
    if (existingMatch !== undefined) {
      if (existingMatch.scheduleId !== expectedScheduleId) {
        return scheduleConflict({
          businessId: business.businessId,
          scheduleId: existingMatch.scheduleId,
          reason: "business-schedule-id-mismatch",
        });
      }

      const definition = input.definitionsByBusinessId.get(business.businessId);
      if (
        definition === undefined ||
        !isExpectedBusinessIncomeSchedule(existingMatch, definition, input.firstDueTick)
      ) {
        return scheduleConflict({
          businessId: business.businessId,
          scheduleId: existingMatch.scheduleId,
          reason: "matching-schedule-incompatible",
        });
      }

      reusedSchedules.push(existingMatch);
      reusedByBusinessId.add(business.businessId);
      continue;
    }

    if (expectedIdSchedule !== undefined) {
      return scheduleConflict({
        businessId: business.businessId,
        scheduleId: expectedIdSchedule.scheduleId,
        reason: "expected-schedule-id-used-by-another-source",
      });
    }
  }

  return success(
    Object.freeze({ reusedSchedules: Object.freeze(reusedSchedules), reusedByBusinessId }),
  );
}

function isExpectedBusinessIncomeSchedule(
  schedule: RecurringEconomySchedule,
  definition: BusinessIncomeScheduleDefinition,
  firstDueTick: SimulationTick,
): boolean {
  return (
    schedule.organizationId === definition.ownerOrganizationId &&
    schedule.category === MoneyTransactionCategory.BusinessIncome &&
    schedule.amount === definition.amount &&
    schedule.periodTicks === definition.periodTicks &&
    schedule.nextDueTick === firstDueTick &&
    schedule.active === true &&
    isBusinessIncomeSourceForBusiness(schedule.source, definition.businessId)
  );
}

function isBusinessIncomeSourceForBusiness(
  source: MoneyTransactionSource,
  businessId: BusinessId,
): boolean {
  return (
    source.type === MoneyTransactionSourceType.BusinessIncome && source.businessId === businessId
  );
}

function parseMappedScheduleId(
  businessId: BusinessId,
  scheduleIdsByBusinessId: BusinessIncomeScheduleIdByBusinessId,
): DomainResult<
  RecurringEconomyScheduleId,
  BusinessIncomeScheduleGenerationInvalidScheduleIdError
> {
  const value = scheduleIdsByBusinessId[businessId];
  try {
    return success(parseRecurringEconomyScheduleId(value));
  } catch (error) {
    return failure({
      code: DomainErrorCode.BusinessIncomeScheduleGenerationInvalidScheduleId,
      message: `Business income schedule ID for business "${businessId}" is invalid.`,
      businessId,
      reason: error instanceof InvalidEntityIdError ? error.reason : "schedule ID parser rejected",
      value,
    });
  }
}

function validateFirstDueTick(
  firstDueTick: SimulationTick,
): DomainResult<undefined, BusinessIncomeScheduleGenerationInvalidFirstDueTickError> {
  try {
    parseSimulationTick(firstDueTick);
  } catch (error) {
    return failure({
      code: DomainErrorCode.BusinessIncomeScheduleGenerationInvalidFirstDueTick,
      message: "Business income first due tick is invalid.",
      reason: error instanceof Error ? error.message : "simulation tick parser rejected",
      value: firstDueTick,
    });
  }

  return success(undefined);
}

function validatePositiveSafeInteger(
  field: "amount" | "periodTicks",
  value: unknown,
  businessId: BusinessId,
): DomainResult<undefined, BusinessIncomeScheduleGenerationInvalidDefinitionError> {
  if (typeof value !== "number") {
    return invalidDefinition(
      field,
      `expected a number, received ${describeValueType(value)}`,
      value,
      businessId,
    );
  }

  if (!Number.isFinite(value)) {
    return invalidDefinition(field, "expected a finite number", value, businessId);
  }

  if (!Number.isSafeInteger(value)) {
    return invalidDefinition(field, "expected a safe integer", value, businessId);
  }

  if (value <= 0) {
    return invalidDefinition(field, "expected a positive value", value, businessId);
  }

  return success(undefined);
}

function invalidDefinition<TValue = undefined>(
  field: BusinessIncomeScheduleGenerationInvalidDefinitionError["field"],
  reason: string,
  value: unknown,
  businessId?: BusinessId,
): DomainResult<TValue, BusinessIncomeScheduleGenerationInvalidDefinitionError> {
  return failure({
    code: DomainErrorCode.BusinessIncomeScheduleGenerationInvalidDefinition,
    message: `Business income definition field "${field}" is invalid: ${reason}.`,
    field,
    reason,
    value,
    ...(businessId === undefined ? {} : { businessId }),
  });
}

function scheduleConflict(input: {
  readonly businessId?: BusinessId;
  readonly scheduleId?: RecurringEconomyScheduleId;
  readonly reason: BusinessIncomeScheduleGenerationScheduleConflictError["reason"];
}): DomainResult<never, BusinessIncomeScheduleGenerationScheduleConflictError> {
  return failure({
    code: DomainErrorCode.BusinessIncomeScheduleGenerationScheduleConflict,
    message: `Business income schedule conflict: ${input.reason}.`,
    ...(input.businessId === undefined ? {} : { businessId: input.businessId }),
    ...(input.scheduleId === undefined ? {} : { scheduleId: input.scheduleId }),
    reason: input.reason,
  });
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
