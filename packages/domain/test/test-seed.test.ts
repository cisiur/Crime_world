import { describe, expect, it } from "vitest";

import {
  CRIMEWORLD_TEST_SEED_ENV,
  DEFAULT_TEST_SEED,
  MAX_TEST_SEED,
  parseCrimeWorldTestSeed,
} from "../test-support/testSeed";

describe("test seed support", () => {
  it("uses a stable default seed", () => {
    expect(DEFAULT_TEST_SEED).toBe(12648430);
    expect(parseCrimeWorldTestSeed(undefined)).toBe(DEFAULT_TEST_SEED);
  });

  it("accepts a valid override", () => {
    expect(parseCrimeWorldTestSeed("8675309")).toBe(8675309);
  });

  it("returns the same seed for repeated parsing of the same value", () => {
    expect(parseCrimeWorldTestSeed("123456")).toBe(parseCrimeWorldTestSeed("123456"));
  });

  it("rejects non-numeric input with a readable error", () => {
    expect(() => parseCrimeWorldTestSeed("not-a-number")).toThrow(
      `${CRIMEWORLD_TEST_SEED_ENV} must be an integer`,
    );
  });

  it("rejects values outside the accepted range", () => {
    expect(() => parseCrimeWorldTestSeed("0")).toThrow(`${CRIMEWORLD_TEST_SEED_ENV} must be`);
    expect(() => parseCrimeWorldTestSeed(String(MAX_TEST_SEED + 1))).toThrow(
      `${CRIMEWORLD_TEST_SEED_ENV} must be`,
    );
  });

  it("uses the default seed for empty or missing input", () => {
    expect(parseCrimeWorldTestSeed("")).toBe(DEFAULT_TEST_SEED);
    expect(parseCrimeWorldTestSeed("   ")).toBe(DEFAULT_TEST_SEED);
    expect(parseCrimeWorldTestSeed(null)).toBe(DEFAULT_TEST_SEED);
    expect(parseCrimeWorldTestSeed(undefined)).toBe(DEFAULT_TEST_SEED);
  });
});
