declare const randomSeedBrand: unique symbol;
declare const randomStateBrand: unique symbol;

export type RandomSeed = number & {
  readonly [randomSeedBrand]: "RandomSeed";
};

export interface RandomStateData {
  readonly stateHigh: number;
  readonly stateLow: number;
  readonly incrementHigh: number;
  readonly incrementLow: number;
}

export type RandomState = RandomStateData & {
  readonly [randomStateBrand]: "RandomState";
};

export interface RandomResult<TValue> {
  readonly state: RandomState;
  readonly value: TValue;
}

const UINT32_SIZE = 0x1_0000_0000;
const UINT32_MAX = UINT32_SIZE - 1;
const UINT64_MASK = (1n << 64n) - 1n;
const PCG32_MULTIPLIER = 6364136223846793005n;
const PCG32_DEFAULT_SEQUENCE = 0xda3e_39cb_94b9_5bdbn;

export class InvalidRandomSeedError extends Error {
  public constructor(
    public readonly reason: string,
    public readonly value: unknown,
  ) {
    super(`Invalid random seed: expected a non-negative finite safe integer; ${reason}.`);
    this.name = "InvalidRandomSeedError";
  }
}

export class InvalidRandomStateError extends Error {
  public constructor(
    public readonly reason: string,
    public readonly value: unknown,
  ) {
    super(
      `Invalid random state: expected primitive unsigned 32-bit PCG32 state fields; ${reason}.`,
    );
    this.name = "InvalidRandomStateError";
  }
}

export class InvalidRandomRangeError extends Error {
  public constructor(
    public readonly reason: string,
    public readonly min: unknown,
    public readonly max: unknown,
  ) {
    super(`Invalid random range: expected inclusive safe integer bounds; ${reason}.`);
    this.name = "InvalidRandomRangeError";
  }
}

export class EmptyCollectionError extends Error {
  public constructor(public readonly operation: "pickOne" | "shuffle") {
    super(`${operation} requires a non-empty collection.`);
    this.name = "EmptyCollectionError";
  }
}

export function parseRandomSeed(value: unknown): RandomSeed {
  if (typeof value !== "number") {
    throw new InvalidRandomSeedError(`received ${describeValueType(value)}`, value);
  }

  if (!Number.isFinite(value)) {
    throw new InvalidRandomSeedError("received a non-finite number", value);
  }

  if (!Number.isSafeInteger(value)) {
    throw new InvalidRandomSeedError("received a non-safe integer", value);
  }

  if (value < 0) {
    throw new InvalidRandomSeedError("received a negative value", value);
  }

  return value as RandomSeed;
}

export function createRandomState(seed: RandomSeed): RandomState {
  const parsedSeed = parseRandomSeed(seed);
  const seed64 = BigInt(parsedSeed);
  const increment = (((seed64 ^ PCG32_DEFAULT_SEQUENCE) << 1n) | 1n) & UINT64_MASK;
  const initialState = createRandomStateFromBigInts(0n, increment);
  const warmedState = advancePcg32State(initialState).state;
  const seededState = createRandomStateFromBigInts(
    (randomStateToBigInt(warmedState) + seed64) & UINT64_MASK,
    increment,
  );

  return advancePcg32State(seededState).state;
}

export function parseRandomState(value: unknown): RandomState {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new InvalidRandomStateError(`received ${describeValueType(value)}`, value);
  }

  const candidate = value as Partial<RandomStateData>;

  validateUInt32StateField("stateHigh", candidate.stateHigh, value);
  validateUInt32StateField("stateLow", candidate.stateLow, value);
  validateUInt32StateField("incrementHigh", candidate.incrementHigh, value);
  validateUInt32StateField("incrementLow", candidate.incrementLow, value);

  if (candidate.incrementLow % 2 !== 1) {
    throw new InvalidRandomStateError("incrementLow must be odd", value);
  }

  return createRandomStateObject({
    stateHigh: candidate.stateHigh,
    stateLow: candidate.stateLow,
    incrementHigh: candidate.incrementHigh,
    incrementLow: candidate.incrementLow,
  });
}

export function nextUInt32(state: RandomState): RandomResult<number> {
  const currentState = randomStateToBigInt(state);
  const nextState = advancePcg32State(state).state;
  const xorshifted = Number((((currentState >> 18n) ^ currentState) >> 27n) & 0xffff_ffffn);
  const rotation = Number(currentState >> 59n);

  return {
    state: nextState,
    value: rotateRight32(xorshifted, rotation),
  };
}

export function nextFloat(state: RandomState): RandomResult<number> {
  const result = nextUInt32(state);

  return {
    state: result.state,
    value: result.value / UINT32_SIZE,
  };
}

export function nextInt(state: RandomState, min: number, max: number): RandomResult<number> {
  validateRandomRange(min, max);

  const rangeSize = max - min + 1;
  const acceptanceLimit = UINT32_SIZE - (UINT32_SIZE % rangeSize);
  let currentState = state;
  let candidate = 0;

  do {
    const result = nextUInt32(currentState);
    currentState = result.state;
    candidate = result.value;
  } while (candidate >= acceptanceLimit);

  return {
    state: currentState,
    value: min + (candidate % rangeSize),
  };
}

export function nextBool(state: RandomState): RandomResult<boolean> {
  const result = nextUInt32(state);

  return {
    state: result.state,
    value: result.value < UINT32_SIZE / 2,
  };
}

export function pickOne<TValue>(
  state: RandomState,
  collection: readonly TValue[],
): RandomResult<TValue> {
  if (collection.length === 0) {
    throw new EmptyCollectionError("pickOne");
  }

  const indexResult = nextInt(state, 0, collection.length - 1);

  return {
    state: indexResult.state,
    value: collection[indexResult.value] as TValue,
  };
}

export function shuffle<TValue>(
  state: RandomState,
  collection: readonly TValue[],
): RandomResult<readonly TValue[]> {
  const shuffled = [...collection];
  let currentState = state;

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndexResult = nextInt(currentState, 0, index);
    currentState = swapIndexResult.state;

    const swapValue = shuffled[index] as TValue;
    shuffled[index] = shuffled[swapIndexResult.value] as TValue;
    shuffled[swapIndexResult.value] = swapValue;
  }

  return {
    state: currentState,
    value: shuffled,
  };
}

function validateRandomRange(min: number, max: number): void {
  if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max)) {
    throw new InvalidRandomRangeError("bounds must be finite safe integers", min, max);
  }

  if (min > max) {
    throw new InvalidRandomRangeError("minimum must be less than or equal to maximum", min, max);
  }

  if (max - min + 1 > UINT32_SIZE) {
    throw new InvalidRandomRangeError(
      `range size must be no greater than ${UINT32_SIZE}`,
      min,
      max,
    );
  }
}

function advancePcg32State(state: RandomState): RandomResult<undefined> {
  const currentState = randomStateToBigInt(state);
  const increment = randomIncrementToBigInt(state);
  const nextState = (currentState * PCG32_MULTIPLIER + increment) & UINT64_MASK;

  return {
    state: createRandomStateFromBigInts(nextState, increment),
    value: undefined,
  };
}

function createRandomStateFromBigInts(state: bigint, increment: bigint): RandomState {
  return createRandomStateObject({
    stateHigh: Number((state >> 32n) & 0xffff_ffffn),
    stateLow: Number(state & 0xffff_ffffn),
    incrementHigh: Number((increment >> 32n) & 0xffff_ffffn),
    incrementLow: Number(increment & 0xffff_ffffn),
  });
}

function createRandomStateObject(state: RandomStateData): RandomState {
  return Object.freeze({ ...state }) as RandomState;
}

function randomStateToBigInt(state: RandomStateData): bigint {
  return (BigInt(state.stateHigh) << 32n) | BigInt(state.stateLow);
}

function randomIncrementToBigInt(state: RandomStateData): bigint {
  return (BigInt(state.incrementHigh) << 32n) | BigInt(state.incrementLow);
}

function rotateRight32(value: number, rotation: number): number {
  return ((value >>> rotation) | (value << ((32 - rotation) & 31))) >>> 0;
}

function validateUInt32StateField(
  fieldName: keyof RandomStateData,
  value: unknown,
  state: unknown,
): asserts value is number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > UINT32_MAX) {
    throw new InvalidRandomStateError(`${fieldName} must be an unsigned 32-bit integer`, state);
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
