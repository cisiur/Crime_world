import { SimulationSpeed, parseSimulationMinute, parseSimulationTick } from "../src/index";
import type {
  SimulationMinute,
  SimulationSpeed as SimulationSpeedValue,
  SimulationTick,
} from "../src/index";

const minute = parseSimulationMinute(60);
const tick = parseSimulationTick(6);

const numberValue: number = minute;
const acceptsNumber = (value: number): number => value;
acceptsNumber(tick);

const speed: SimulationSpeedValue = SimulationSpeed.Normal;

// @ts-expect-error SimulationMinute cannot be assigned to SimulationTick.
const invalidTick: SimulationTick = minute;

// @ts-expect-error SimulationTick cannot be assigned to SimulationMinute.
const invalidMinute: SimulationMinute = tick;

// @ts-expect-error A plain number cannot be assigned to SimulationMinute.
const invalidPlainMinute: SimulationMinute = 60;

// @ts-expect-error A plain number cannot be assigned to SimulationTick.
const invalidPlainTick: SimulationTick = 6;

// @ts-expect-error Arbitrary strings are not valid SimulationSpeed values.
const invalidSpeed: SimulationSpeedValue = "Slow";

void numberValue;
void speed;
void invalidTick;
void invalidMinute;
void invalidPlainMinute;
void invalidPlainTick;
void invalidSpeed;
