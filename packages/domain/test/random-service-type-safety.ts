import { createRandomState, parseRandomSeed, parseSimulationMinute } from "../src/index";
import type { RandomSeed, RandomState, SimulationMinute } from "../src/index";

const seed = parseRandomSeed(123);
const state = createRandomState(seed);
const minute = parseSimulationMinute(123);

// @ts-expect-error RandomState cannot be assigned from arbitrary objects.
const invalidState: RandomState = {
  stateHigh: 1,
  stateLow: 2,
  incrementHigh: 3,
  incrementLow: 5,
};

// @ts-expect-error RandomSeed cannot be confused with SimulationMinute.
const invalidMinute: SimulationMinute = seed;

// @ts-expect-error SimulationMinute cannot be confused with RandomSeed.
const invalidSeed: RandomSeed = minute;

// @ts-expect-error A plain number cannot be assigned to RandomSeed.
const invalidPlainSeed: RandomSeed = 123;

void state;
void invalidState;
void invalidMinute;
void invalidSeed;
void invalidPlainSeed;
