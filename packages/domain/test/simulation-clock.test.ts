import { describe, expect, it } from "vitest";

import {
  InvalidSimulationTimeError,
  MINUTES_PER_TICK,
  SimulationClockOverflowError,
  SimulationSpeed,
  advanceSimulationClockOneTick,
  createInitialSimulationClock,
  getTicksPerUpdate,
  parseSimulationMinute,
  parseSimulationTick,
  pauseSimulationClock,
  resumeSimulationClock,
  setSimulationSpeed,
} from "../src/index";
import type { SimulationClockState } from "../src/index";

describe("simulation clock", () => {
  it("starts paused at minute 0, tick 0, and Normal speed", () => {
    expect(createInitialSimulationClock()).toEqual({
      currentMinute: 0,
      currentTick: 0,
      paused: true,
      speed: SimulationSpeed.Normal,
    });
  });

  it("accepts valid simulation minutes unchanged", () => {
    expect(parseSimulationMinute(1440)).toBe(1440);
  });

  it("accepts valid simulation ticks unchanged", () => {
    expect(parseSimulationTick(144)).toBe(144);
  });

  it.each([-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "rejects invalid numeric simulation minute values: %s",
    (value) => {
      expect(() => parseSimulationMinute(value)).toThrow(InvalidSimulationTimeError);
    },
  );

  it.each([-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "rejects invalid numeric simulation tick values: %s",
    (value) => {
      expect(() => parseSimulationTick(value)).toThrow(InvalidSimulationTimeError);
    },
  );

  it("rejects unsafe integers", () => {
    expect(() => parseSimulationMinute(Number.MAX_SAFE_INTEGER + 1)).toThrow(
      InvalidSimulationTimeError,
    );
    expect(() => parseSimulationTick(Number.MAX_SAFE_INTEGER + 1)).toThrow(
      InvalidSimulationTimeError,
    );
  });

  it.each(["10", {}, null, undefined])("rejects non-number values: %s", (value) => {
    expect(() => parseSimulationMinute(value)).toThrow(InvalidSimulationTimeError);
    expect(() => parseSimulationTick(value)).toThrow(InvalidSimulationTimeError);
  });

  it("pauses without changing minute, tick, or speed", () => {
    const runningClock = resumeSimulationClock(createInitialSimulationClock());
    const clock = setSimulationSpeed(runningClock, SimulationSpeed.Fast);
    const pausedClock = pauseSimulationClock(clock);

    expect(pausedClock).toEqual({
      ...clock,
      paused: true,
    });
  });

  it("resumes without changing minute, tick, or speed", () => {
    const pausedClock = setSimulationSpeed(
      createInitialSimulationClock(),
      SimulationSpeed.VeryFast,
    );
    const resumedClock = resumeSimulationClock(pausedClock);

    expect(resumedClock).toEqual({
      ...pausedClock,
      paused: false,
    });
  });

  it("keeps repeated pause and resume stable", () => {
    const pausedClock = pauseSimulationClock(pauseSimulationClock(createInitialSimulationClock()));
    const resumedClock = resumeSimulationClock(resumeSimulationClock(pausedClock));

    expect(pausedClock.paused).toBe(true);
    expect(resumedClock.paused).toBe(false);
    expect(resumedClock.currentMinute).toBe(0);
    expect(resumedClock.currentTick).toBe(0);
  });

  it("does not mutate input state when pausing or resuming", () => {
    const clock = createInitialSimulationClock();
    const snapshot = { ...clock };

    const pausedClock = pauseSimulationClock(clock);
    const resumedClock = resumeSimulationClock(clock);

    expect(clock).toEqual(snapshot);
    expect(pausedClock).not.toBe(clock);
    expect(resumedClock).not.toBe(clock);
  });

  it("maps all simulation speeds to the accepted tick counts", () => {
    expect(getTicksPerUpdate(SimulationSpeed.Normal)).toBe(1);
    expect(getTicksPerUpdate(SimulationSpeed.Fast)).toBe(3);
    expect(getTicksPerUpdate(SimulationSpeed.VeryFast)).toBe(6);
    expect(getTicksPerUpdate(SimulationSpeed.Maximum)).toBe(12);
  });

  it("changes speed without advancing time or changing pause state", () => {
    const clock = createInitialSimulationClock();
    const fastClock = setSimulationSpeed(clock, SimulationSpeed.Fast);

    expect(fastClock).toEqual({
      ...clock,
      speed: SimulationSpeed.Fast,
    });
  });

  it("stores speed while paused", () => {
    const clock = setSimulationSpeed(createInitialSimulationClock(), SimulationSpeed.Maximum);

    expect(clock.paused).toBe(true);
    expect(clock.speed).toBe(SimulationSpeed.Maximum);
  });

  it("does not mutate input state when changing speed", () => {
    const clock = createInitialSimulationClock();
    const snapshot = { ...clock };

    const fastClock = setSimulationSpeed(clock, SimulationSpeed.Fast);

    expect(clock).toEqual(snapshot);
    expect(fastClock).not.toBe(clock);
  });

  it("does not advance while paused", () => {
    const clock = createInitialSimulationClock();
    const advancedClock = advanceSimulationClockOneTick(clock);

    expect(advancedClock).toEqual(clock);
    expect(advancedClock).not.toBe(clock);
  });

  it("advances a running clock by exactly one tick and 10 minutes", () => {
    const clock = resumeSimulationClock(createInitialSimulationClock());
    const advancedClock = advanceSimulationClockOneTick(clock);

    expect(advancedClock.currentTick).toBe(1);
    expect(advancedClock.currentMinute).toBe(MINUTES_PER_TICK);
    expect(advancedClock.paused).toBe(false);
    expect(advancedClock.speed).toBe(SimulationSpeed.Normal);
  });

  it("repeated one-tick calls remain deterministic", () => {
    const clock = resumeSimulationClock(createInitialSimulationClock());
    const firstRun = advanceSimulationClockOneTick(advanceSimulationClockOneTick(clock));
    const secondRun = advanceSimulationClockOneTick(advanceSimulationClockOneTick(clock));

    expect(firstRun).toEqual(secondRun);
    expect(firstRun.currentTick).toBe(2);
    expect(firstRun.currentMinute).toBe(20);
  });

  it("does not let speed affect the result of one tick", () => {
    const normalClock = resumeSimulationClock(createInitialSimulationClock());
    const maximumClock = setSimulationSpeed(normalClock, SimulationSpeed.Maximum);

    expect(advanceSimulationClockOneTick(normalClock)).toEqual({
      currentMinute: 10,
      currentTick: 1,
      paused: false,
      speed: SimulationSpeed.Normal,
    });
    expect(advanceSimulationClockOneTick(maximumClock)).toEqual({
      currentMinute: 10,
      currentTick: 1,
      paused: false,
      speed: SimulationSpeed.Maximum,
    });
  });

  it("does not mutate input state when advancing", () => {
    const clock = resumeSimulationClock(createInitialSimulationClock());
    const snapshot = { ...clock };

    const advancedClock = advanceSimulationClockOneTick(clock);

    expect(clock).toEqual(snapshot);
    expect(advancedClock).not.toBe(clock);
  });

  it("preserves the tick and minute invariant", () => {
    const clock = advanceSimulationClockOneTick(
      advanceSimulationClockOneTick(resumeSimulationClock(createInitialSimulationClock())),
    );

    expect(clock.currentMinute).toBe(clock.currentTick * MINUTES_PER_TICK);
  });

  it("serializes simulation minute and tick as numbers", () => {
    expect(
      JSON.stringify({ minute: parseSimulationMinute(60), tick: parseSimulationTick(6) }),
    ).toBe('{"minute":60,"tick":6}');
  });

  it("serializes the clock state as plain JSON data", () => {
    const clock = setSimulationSpeed(createInitialSimulationClock(), SimulationSpeed.Fast);

    expect(JSON.stringify(clock)).toBe(
      '{"currentMinute":0,"currentTick":0,"paused":true,"speed":"Fast"}',
    );
  });

  it("requires deserialized values to be parsed again before use", () => {
    const clock = advanceSimulationClockOneTick(
      resumeSimulationClock(createInitialSimulationClock()),
    );
    const parsedJson = JSON.parse(JSON.stringify(clock)) as {
      currentMinute: unknown;
      currentTick: unknown;
    };

    expect(typeof parsedJson.currentMinute).toBe("number");
    expect(typeof parsedJson.currentTick).toBe("number");
    expect(parseSimulationMinute(parsedJson.currentMinute)).toBe(clock.currentMinute);
    expect(parseSimulationTick(parsedJson.currentTick)).toBe(clock.currentTick);
  });

  it("fails explicitly when advancement would overflow the safe integer range", () => {
    const overflowingClock: SimulationClockState = {
      currentMinute: parseSimulationMinute(Number.MAX_SAFE_INTEGER - 1),
      currentTick: parseSimulationTick((Number.MAX_SAFE_INTEGER - 1) / MINUTES_PER_TICK),
      paused: false,
      speed: SimulationSpeed.Normal,
    };

    expect(() => advanceSimulationClockOneTick(overflowingClock)).toThrow(
      SimulationClockOverflowError,
    );
  });

  it("rejects inconsistent clock states instead of creating another invalid state", () => {
    const inconsistentClock: SimulationClockState = {
      currentMinute: parseSimulationMinute(10),
      currentTick: parseSimulationTick(0),
      paused: false,
      speed: SimulationSpeed.Normal,
    };

    expect(() => pauseSimulationClock(inconsistentClock)).toThrow(InvalidSimulationTimeError);
    expect(() => advanceSimulationClockOneTick(inconsistentClock)).toThrow(
      InvalidSimulationTimeError,
    );
  });
});
