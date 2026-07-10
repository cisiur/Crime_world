import { describe, expect, it } from "vitest";

import { getCrimeWorldTestSeed, MAX_TEST_SEED, MIN_TEST_SEED } from "./testSeed";

describe("active test seed", () => {
  it("can be resolved from the current test environment", () => {
    const activeSeed = getCrimeWorldTestSeed();

    expect(Number.isInteger(activeSeed)).toBe(true);
    expect(activeSeed).toBeGreaterThanOrEqual(MIN_TEST_SEED);
    expect(activeSeed).toBeLessThanOrEqual(MAX_TEST_SEED);
  });
});
