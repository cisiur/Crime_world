export interface RecurringIncomeDefinition {
  readonly amount: number;
  readonly periodTicks: number;
}

export type InvalidRecurringIncomeDefinitionField = "amount" | "periodTicks";

export class InvalidRecurringIncomeDefinitionError extends Error {
  public constructor(
    public readonly field: InvalidRecurringIncomeDefinitionField,
    public readonly reason: string,
    public readonly value: unknown,
  ) {
    super(`Invalid recurring income definition field "${field}": ${reason}.`);
    this.name = "InvalidRecurringIncomeDefinitionError";
  }
}

export const canonicalMvpRecurringIncomeDefinition = createRecurringIncomeDefinition({
  amount: 15,
  periodTicks: 144,
});

export function createRecurringIncomeDefinition(
  input: RecurringIncomeDefinition,
): RecurringIncomeDefinition {
  validatePositiveSafeInteger("amount", input.amount);
  validatePositiveSafeInteger("periodTicks", input.periodTicks);

  return Object.freeze({
    amount: input.amount,
    periodTicks: input.periodTicks,
  });
}

function validatePositiveSafeInteger(
  field: InvalidRecurringIncomeDefinitionField,
  value: unknown,
): asserts value is number {
  if (typeof value !== "number") {
    throw new InvalidRecurringIncomeDefinitionError(
      field,
      `expected a number, received ${describeValueType(value)}`,
      value,
    );
  }

  if (!Number.isFinite(value)) {
    throw new InvalidRecurringIncomeDefinitionError(field, "expected a finite number", value);
  }

  if (!Number.isSafeInteger(value)) {
    throw new InvalidRecurringIncomeDefinitionError(field, "expected a safe integer", value);
  }

  if (value <= 0) {
    throw new InvalidRecurringIncomeDefinitionError(field, "expected a positive value", value);
  }
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
