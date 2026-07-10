export const CRIMEWORLD_TEST_SEED_ENV = "CRIMEWORLD_TEST_SEED";
export const DEFAULT_TEST_SEED = 12648430;
export const MIN_TEST_SEED = 1;
export const MAX_TEST_SEED = 4_294_967_295;

export function parseCrimeWorldTestSeed(value: string | null | undefined): number {
  if (value === null || value === undefined || value.trim() === "") {
    return DEFAULT_TEST_SEED;
  }

  const trimmedValue = value.trim();

  if (!/^\d+$/.test(trimmedValue)) {
    throw createInvalidTestSeedError(value);
  }

  const parsedSeed = Number(trimmedValue);

  if (
    !Number.isSafeInteger(parsedSeed) ||
    parsedSeed < MIN_TEST_SEED ||
    parsedSeed > MAX_TEST_SEED
  ) {
    throw createInvalidTestSeedError(value);
  }

  return parsedSeed;
}

function createInvalidTestSeedError(value: string): Error {
  return new Error(
    `${CRIMEWORLD_TEST_SEED_ENV} must be an integer from ${MIN_TEST_SEED} to ${MAX_TEST_SEED}; received "${value}". Default test seed is ${DEFAULT_TEST_SEED}.`,
  );
}
