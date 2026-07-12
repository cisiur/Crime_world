declare const simulationTimeBrand: unique symbol;

type SimulationTimeValue<TValueType extends string> = number & {
  readonly [simulationTimeBrand]: TValueType;
};

type SimulationTimeValueType = "SimulationMinute" | "SimulationTick";

export type SimulationMinute = SimulationTimeValue<"SimulationMinute">;
export type SimulationTick = SimulationTimeValue<"SimulationTick">;

export const MINUTES_PER_TICK = 10;

export const SimulationSpeed = {
  Normal: "Normal",
  Fast: "Fast",
  VeryFast: "VeryFast",
  Maximum: "Maximum",
} as const;

export type SimulationSpeed = (typeof SimulationSpeed)[keyof typeof SimulationSpeed];

export interface SimulationClockState {
  readonly currentMinute: SimulationMinute;
  readonly currentTick: SimulationTick;
  readonly paused: boolean;
  readonly speed: SimulationSpeed;
}

const INITIAL_SIMULATION_MINUTE = parseSimulationMinute(0);
const INITIAL_SIMULATION_TICK = parseSimulationTick(0);

export class InvalidSimulationTimeError extends Error {
  public constructor(
    public readonly valueType: SimulationTimeValueType | "SimulationClockState",
    public readonly reason: string,
    public readonly value: unknown,
  ) {
    super(
      `Invalid ${valueType}: expected a finite safe integer greater than or equal to 0; ${reason}.`,
    );
    this.name = "InvalidSimulationTimeError";
  }
}

export class SimulationClockOverflowError extends Error {
  public constructor(public readonly reason: string) {
    super(`Simulation clock overflow: ${reason}.`);
    this.name = "SimulationClockOverflowError";
  }
}

export function parseSimulationMinute(value: unknown): SimulationMinute {
  validateSimulationTimeValue("SimulationMinute", value);
  return value as SimulationMinute;
}

export function parseSimulationTick(value: unknown): SimulationTick {
  validateSimulationTimeValue("SimulationTick", value);
  return value as SimulationTick;
}

export function parseSimulationClockState(value: unknown): SimulationClockState {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new InvalidSimulationTimeError(
      "SimulationClockState",
      `received ${describeValueType(value)}`,
      value,
    );
  }

  const candidate = value as Partial<SimulationClockState>;

  if (typeof candidate.paused !== "boolean") {
    throw new InvalidSimulationTimeError("SimulationClockState", "paused must be a boolean", value);
  }

  if (
    candidate.speed !== SimulationSpeed.Normal &&
    candidate.speed !== SimulationSpeed.Fast &&
    candidate.speed !== SimulationSpeed.VeryFast &&
    candidate.speed !== SimulationSpeed.Maximum
  ) {
    throw new InvalidSimulationTimeError(
      "SimulationClockState",
      "speed must be a valid SimulationSpeed",
      value,
    );
  }

  return createSimulationClockState({
    currentMinute: parseSimulationMinute(candidate.currentMinute),
    currentTick: parseSimulationTick(candidate.currentTick),
    paused: candidate.paused,
    speed: candidate.speed,
  });
}

export function getTicksPerUpdate(speed: SimulationSpeed): number {
  switch (speed) {
    case SimulationSpeed.Normal:
      return 1;
    case SimulationSpeed.Fast:
      return 3;
    case SimulationSpeed.VeryFast:
      return 6;
    case SimulationSpeed.Maximum:
      return 12;
  }
}

export function createInitialSimulationClock(): SimulationClockState {
  return createSimulationClockState({
    currentMinute: INITIAL_SIMULATION_MINUTE,
    currentTick: INITIAL_SIMULATION_TICK,
    paused: true,
    speed: SimulationSpeed.Normal,
  });
}

export function pauseSimulationClock(clock: SimulationClockState): SimulationClockState {
  assertValidSimulationClockState(clock);

  return createSimulationClockState({
    ...clock,
    paused: true,
  });
}

export function resumeSimulationClock(clock: SimulationClockState): SimulationClockState {
  assertValidSimulationClockState(clock);

  return createSimulationClockState({
    ...clock,
    paused: false,
  });
}

export function setSimulationSpeed(
  clock: SimulationClockState,
  speed: SimulationSpeed,
): SimulationClockState {
  assertValidSimulationClockState(clock);

  return createSimulationClockState({
    ...clock,
    speed,
  });
}

export function advanceSimulationClockOneTick(clock: SimulationClockState): SimulationClockState {
  assertValidSimulationClockState(clock);

  if (clock.paused) {
    return createSimulationClockState(clock);
  }

  const nextTick = clock.currentTick + 1;
  if (!Number.isSafeInteger(nextTick)) {
    throw new SimulationClockOverflowError("next tick would exceed Number.MAX_SAFE_INTEGER");
  }

  const nextMinute = nextTick * MINUTES_PER_TICK;
  if (!Number.isSafeInteger(nextMinute)) {
    throw new SimulationClockOverflowError("next minute would exceed Number.MAX_SAFE_INTEGER");
  }

  return createSimulationClockState({
    currentMinute: parseSimulationMinute(nextMinute),
    currentTick: parseSimulationTick(nextTick),
    paused: false,
    speed: clock.speed,
  });
}

function validateSimulationTimeValue(
  valueType: SimulationTimeValueType,
  value: unknown,
): asserts value is number {
  if (typeof value !== "number") {
    throw new InvalidSimulationTimeError(valueType, `received ${describeValueType(value)}`, value);
  }

  if (!Number.isFinite(value)) {
    throw new InvalidSimulationTimeError(valueType, "received a non-finite number", value);
  }

  if (!Number.isSafeInteger(value)) {
    throw new InvalidSimulationTimeError(valueType, "received a non-safe integer", value);
  }

  if (value < 0) {
    throw new InvalidSimulationTimeError(valueType, "received a negative value", value);
  }
}

function assertValidSimulationClockState(clock: SimulationClockState): void {
  const expectedMinute = clock.currentTick * MINUTES_PER_TICK;

  if (!Number.isSafeInteger(expectedMinute)) {
    throw new SimulationClockOverflowError(
      "current tick cannot be represented as a safe simulation minute",
    );
  }

  if (clock.currentMinute !== expectedMinute) {
    throw new InvalidSimulationTimeError(
      "SimulationClockState",
      `currentMinute must equal currentTick * ${MINUTES_PER_TICK}`,
      clock,
    );
  }
}

function createSimulationClockState(clock: SimulationClockState): SimulationClockState {
  assertValidSimulationClockState(clock);
  return Object.freeze({ ...clock });
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
