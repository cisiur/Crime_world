import { describe, expect, it } from "vitest";

import {
  EmptyCollectionError,
  InvalidRandomRangeError,
  InvalidRandomSeedError,
  createRandomState,
  nextBool,
  nextFloat,
  nextInt,
  nextUInt32,
  parseRandomSeed,
  parseRandomState,
  pickOne,
  shuffle,
} from "../src/index";

function createTestRandomState(seed = 123) {
  return createRandomState(parseRandomSeed(seed));
}

function nextUInt32Sequence(seed: number, count: number): readonly number[] {
  const values: number[] = [];
  let state = createTestRandomState(seed);

  for (let index = 0; index < count; index += 1) {
    const result = nextUInt32(state);
    state = result.state;
    values.push(result.value);
  }

  return values;
}

describe("random service", () => {
  it("creates immutable JSON-safe random state", () => {
    const state = createTestRandomState();

    expect(Object.isFrozen(state)).toBe(true);
    expect(state).toEqual({
      stateHigh: expect.any(Number),
      stateLow: expect.any(Number),
      incrementHigh: expect.any(Number),
      incrementLow: expect.any(Number),
    });
    expect(JSON.stringify(state)).toBe(JSON.stringify({ ...state }));
  });

  it("produces identical sequences for the same seed", () => {
    expect(nextUInt32Sequence(123, 5)).toEqual(nextUInt32Sequence(123, 5));
  });

  it("produces different sequences for different seeds", () => {
    expect(nextUInt32Sequence(123, 5)).not.toEqual(nextUInt32Sequence(456, 5));
  });

  it("uses a stable PCG32 output sequence for a known seed", () => {
    expect(nextUInt32Sequence(123, 5)).toEqual([
      2687722209, 1816963689, 3697582466, 208249202, 16058544,
    ]);
  });

  it("advances state and does not mutate the input state", () => {
    const state = createTestRandomState();
    const snapshot = { ...state };
    const result = nextUInt32(state);

    expect(result.state).not.toBe(state);
    expect(result.state).not.toEqual(state);
    expect(state).toEqual(snapshot);
  });

  it("round-trips state through JSON and continues the same sequence after parsing", () => {
    const state = createTestRandomState();
    const firstResult = nextUInt32(state);
    const parsedState = parseRandomState(JSON.parse(JSON.stringify(firstResult.state)));

    expect(nextUInt32(parsedState)).toEqual(nextUInt32(firstResult.state));
  });

  it("returns uint32 values in the accepted range", () => {
    let state = createTestRandomState();

    for (let index = 0; index < 100; index += 1) {
      const result = nextUInt32(state);
      state = result.state;

      expect(result.value).toBeGreaterThanOrEqual(0);
      expect(result.value).toBeLessThanOrEqual(4_294_967_295);
      expect(Number.isInteger(result.value)).toBe(true);
    }
  });

  it("returns float values in the accepted range", () => {
    let state = createTestRandomState();

    for (let index = 0; index < 100; index += 1) {
      const result = nextFloat(state);
      state = result.state;

      expect(result.value).toBeGreaterThanOrEqual(0);
      expect(result.value).toBeLessThan(1);
    }
  });

  it("returns nextInt values within inclusive bounds", () => {
    let state = createTestRandomState();
    const seenValues = new Set<number>();

    for (let index = 0; index < 100; index += 1) {
      const result = nextInt(state, 1, 3);
      state = result.state;
      seenValues.add(result.value);

      expect(result.value).toBeGreaterThanOrEqual(1);
      expect(result.value).toBeLessThanOrEqual(3);
    }

    expect(seenValues).toEqual(new Set([1, 2, 3]));
  });

  it("supports equal inclusive nextInt bounds", () => {
    const result = nextInt(createTestRandomState(), 7, 7);

    expect(result.value).toBe(7);
  });

  it("rejects invalid nextInt ranges", () => {
    const state = createTestRandomState();

    expect(() => nextInt(state, 3, 1)).toThrow(InvalidRandomRangeError);
    expect(() => nextInt(state, 0.5, 3)).toThrow(InvalidRandomRangeError);
    expect(() => nextInt(state, 0, Number.NaN)).toThrow(InvalidRandomRangeError);
    expect(() => nextInt(state, 0, 4_294_967_296)).toThrow(InvalidRandomRangeError);
  });

  it("returns deterministic booleans", () => {
    const collectBools = () => {
      const values: boolean[] = [];
      let state = createTestRandomState();

      for (let index = 0; index < 8; index += 1) {
        const result = nextBool(state);
        state = result.state;
        values.push(result.value);
      }

      return values;
    };

    expect(collectBools()).toEqual(collectBools());
    expect(collectBools()).toContain(true);
    expect(collectBools()).toContain(false);
  });

  it("picks one value deterministically", () => {
    const collection = ["alpha", "bravo", "charlie", "delta"];

    expect(pickOne(createTestRandomState(), collection)).toEqual(
      pickOne(createTestRandomState(), collection),
    );
  });

  it("rejects picking from an empty array", () => {
    expect(() => pickOne(createTestRandomState(), [])).toThrow(EmptyCollectionError);
  });

  it("shuffles deterministically without mutating the input array", () => {
    const collection = ["alpha", "bravo", "charlie", "delta", "echo"];
    const snapshot = [...collection];
    const shuffled = shuffle(createTestRandomState(), collection);

    expect(shuffled).toEqual(shuffle(createTestRandomState(), collection));
    expect(collection).toEqual(snapshot);
    expect(shuffled.value).toHaveLength(collection.length);
    expect([...shuffled.value].sort()).toEqual([...collection].sort());
  });

  it("produces the same shuffled order for the same seed", () => {
    const collection = [1, 2, 3, 4, 5, 6];

    expect(shuffle(createTestRandomState(123), collection).value).toEqual(
      shuffle(createTestRandomState(123), collection).value,
    );
  });

  it("produces a different shuffled order for a different seed", () => {
    const collection = [1, 2, 3, 4, 5, 6];

    expect(shuffle(createTestRandomState(123), collection).value).not.toEqual(
      shuffle(createTestRandomState(456), collection).value,
    );
  });

  it("validates random seeds", () => {
    expect(parseRandomSeed(0)).toBe(0);
    expect(parseRandomSeed(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);

    expect(() => parseRandomSeed(-1)).toThrow(InvalidRandomSeedError);
    expect(() => parseRandomSeed(0.5)).toThrow(InvalidRandomSeedError);
    expect(() => parseRandomSeed(Number.NaN)).toThrow(InvalidRandomSeedError);
    expect(() => parseRandomSeed(Number.POSITIVE_INFINITY)).toThrow(InvalidRandomSeedError);
    expect(() => parseRandomSeed(Number.NEGATIVE_INFINITY)).toThrow(InvalidRandomSeedError);
    expect(() => parseRandomSeed(Number.MAX_SAFE_INTEGER + 1)).toThrow(InvalidRandomSeedError);
    expect(() => parseRandomSeed("123")).toThrow(InvalidRandomSeedError);
  });
});
