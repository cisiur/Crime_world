import {
  CRIMEWORLD_TEST_SEED_ENV,
  DEFAULT_TEST_SEED,
  MAX_TEST_SEED,
  MIN_TEST_SEED,
  parseCrimeWorldTestSeed,
} from "../packages/domain/test-support/testSeed";

export {
  CRIMEWORLD_TEST_SEED_ENV,
  DEFAULT_TEST_SEED,
  MAX_TEST_SEED,
  MIN_TEST_SEED,
  parseCrimeWorldTestSeed,
};

export interface TestSeedEnvironment {
  readonly [CRIMEWORLD_TEST_SEED_ENV]?: string;
}

export function getCrimeWorldTestSeed(environment: TestSeedEnvironment = readProcessEnv()): number {
  return parseCrimeWorldTestSeed(environment[CRIMEWORLD_TEST_SEED_ENV]);
}

function readProcessEnv(): TestSeedEnvironment {
  const runtimeGlobal = globalThis as {
    readonly process?: {
      readonly env?: TestSeedEnvironment;
    };
  };

  return runtimeGlobal.process?.env ?? {};
}
