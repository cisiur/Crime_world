export interface CrewUpkeepDefinition {
  readonly amountPerCharacter: number;
  readonly periodTicks: number;
}

export type InvalidCrewUpkeepDefinitionField = "amountPerCharacter" | "periodTicks";

export class InvalidCrewUpkeepDefinitionError extends Error {
  public constructor(
    public readonly field: InvalidCrewUpkeepDefinitionField,
    public readonly reason: string,
    public readonly value: unknown,
  ) {
    super(`Invalid crew upkeep definition field "${field}": ${reason}.`);
    this.name = "InvalidCrewUpkeepDefinitionError";
  }
}

export const canonicalMvpCrewUpkeepDefinition = createCrewUpkeepDefinition({
  amountPerCharacter: 5,
  periodTicks: 144,
});

export function createCrewUpkeepDefinition(input: CrewUpkeepDefinition): CrewUpkeepDefinition {
  validatePositiveSafeInteger("amountPerCharacter", input.amountPerCharacter);
  validatePositiveSafeInteger("periodTicks", input.periodTicks);

  return Object.freeze({
    amountPerCharacter: input.amountPerCharacter,
    periodTicks: input.periodTicks,
  });
}

function validatePositiveSafeInteger(
  field: InvalidCrewUpkeepDefinitionField,
  value: unknown,
): asserts value is number {
  if (typeof value !== "number") {
    throw new InvalidCrewUpkeepDefinitionError(
      field,
      `expected a number, received ${describeValueType(value)}`,
      value,
    );
  }

  if (!Number.isFinite(value)) {
    throw new InvalidCrewUpkeepDefinitionError(field, "expected a finite number", value);
  }

  if (!Number.isSafeInteger(value)) {
    throw new InvalidCrewUpkeepDefinitionError(field, "expected a safe integer", value);
  }

  if (value <= 0) {
    throw new InvalidCrewUpkeepDefinitionError(field, "expected a positive value", value);
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
