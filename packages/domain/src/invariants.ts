import {
  DomainEventType,
  type DomainEvent,
  type DomainExecution,
  type SimulationResumedEvent,
  type SimulationTickAdvancedEvent,
} from "./domainEvents";
import type { GameState } from "./gameState";
import { parseCampaignId } from "./entityIds";
import { parseSchemaVersion } from "./gameState";
import { parseRandomState, type RandomState } from "./randomService";
import {
  MINUTES_PER_TICK,
  SimulationSpeed,
  parseSimulationMinute,
  parseSimulationTick,
  type SimulationClockState,
} from "./simulationClock";

export class InvariantViolationError extends Error {
  public constructor(
    public readonly invariantName: string,
    public readonly description: string,
    public readonly value?: unknown,
  ) {
    super(`Invariant violation [${invariantName}]: ${description}.`);
    this.name = "InvariantViolationError";
  }
}

export function assertSimulationClockInvariant(clock: SimulationClockState): void {
  assertObject("SimulationClock", clock);
  assertInvariant(
    "SimulationClock.currentMinute",
    () => parseSimulationMinute(clock.currentMinute),
    clock,
  );
  assertInvariant(
    "SimulationClock.currentTick",
    () => parseSimulationTick(clock.currentTick),
    clock,
  );

  if (typeof clock.paused !== "boolean") {
    throw new InvariantViolationError("SimulationClock.paused", "paused must be a boolean", clock);
  }

  if (!isSimulationSpeed(clock.speed)) {
    throw new InvariantViolationError(
      "SimulationClock.speed",
      "speed must be one of the supported SimulationSpeed values",
      clock,
    );
  }

  if (clock.currentMinute !== clock.currentTick * MINUTES_PER_TICK) {
    throw new InvariantViolationError(
      "SimulationClock.minuteTickRelation",
      `currentMinute must equal currentTick * ${MINUTES_PER_TICK}`,
      clock,
    );
  }
}

export function assertRandomStateInvariant(randomState: RandomState): void {
  assertObject("RandomState", randomState);

  for (const fieldName of ["stateHigh", "stateLow", "incrementHigh", "incrementLow"] as const) {
    const value = randomState[fieldName];

    if (typeof value !== "number") {
      throw new InvariantViolationError(
        "RandomState",
        `${fieldName} must be a number`,
        randomState,
      );
    }

    if (!Number.isFinite(value)) {
      throw new InvariantViolationError("RandomState", `${fieldName} must be finite`, randomState);
    }

    if (!Number.isSafeInteger(value)) {
      throw new InvariantViolationError(
        "RandomState",
        `${fieldName} must be a safe integer`,
        randomState,
      );
    }
  }

  assertInvariant("RandomState.structure", () => parseRandomState(randomState), randomState);
}

export function assertGameStateInvariant(gameState: GameState): void {
  assertObject("GameState", gameState);
  assertInvariant(
    "GameState.schemaVersion",
    () => parseSchemaVersion(gameState.schemaVersion),
    gameState,
  );
  assertInvariant("GameState.campaignId", () => parseCampaignId(gameState.campaignId), gameState);
  assertSimulationClockInvariant(gameState.clock);
  assertRandomStateInvariant(gameState.randomState);
}

export function assertDomainExecutionInvariant(execution: DomainExecution): void {
  assertObject("DomainExecution", execution);
  assertGameStateInvariant(execution.gameState);

  if (!Array.isArray(execution.events)) {
    throw new InvariantViolationError(
      "DomainExecution.events",
      "events must be an array",
      execution,
    );
  }

  if (!Object.isFrozen(execution.events)) {
    throw new InvariantViolationError(
      "DomainExecution.events",
      "events array must be frozen",
      execution.events,
    );
  }

  for (const event of execution.events) {
    if (!Object.isFrozen(event)) {
      throw new InvariantViolationError(
        "DomainExecution.event",
        "each event object must be frozen",
        event,
      );
    }

    assertDomainEventInvariant(event);
  }
}

export function assertDomainEventInvariant(event: DomainEvent): void {
  assertObject("DomainEvent", event);

  switch (event.type) {
    case DomainEventType.SimulationResumed:
      assertSimulationResumedEventInvariant(event);
      return;
    case DomainEventType.SimulationTickAdvanced:
      assertSimulationTickAdvancedEventInvariant(event);
      return;
    default:
      throw new InvariantViolationError("DomainEvent.type", "event type must be supported", event);
  }
}

function assertSimulationResumedEventInvariant(event: SimulationResumedEvent): void {
  assertInvariant("SimulationResumed.tick", () => parseSimulationTick(event.tick), event);
  assertInvariant("SimulationResumed.minute", () => parseSimulationMinute(event.minute), event);
}

function assertSimulationTickAdvancedEventInvariant(event: SimulationTickAdvancedEvent): void {
  assertInvariant(
    "SimulationTickAdvanced.previousTick",
    () => parseSimulationTick(event.previousTick),
    event,
  );
  assertInvariant(
    "SimulationTickAdvanced.currentTick",
    () => parseSimulationTick(event.currentTick),
    event,
  );
  assertInvariant(
    "SimulationTickAdvanced.previousMinute",
    () => parseSimulationMinute(event.previousMinute),
    event,
  );
  assertInvariant(
    "SimulationTickAdvanced.currentMinute",
    () => parseSimulationMinute(event.currentMinute),
    event,
  );

  if (event.currentTick !== event.previousTick + 1) {
    throw new InvariantViolationError(
      "SimulationTickAdvanced.tickProgression",
      "currentTick must equal previousTick + 1",
      event,
    );
  }

  if (event.currentMinute !== event.previousMinute + MINUTES_PER_TICK) {
    throw new InvariantViolationError(
      "SimulationTickAdvanced.minuteProgression",
      `currentMinute must equal previousMinute + ${MINUTES_PER_TICK}`,
      event,
    );
  }
}

function assertObject(invariantName: string, value: unknown): asserts value is object {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new InvariantViolationError(invariantName, "value must be an object", value);
  }
}

function assertInvariant(invariantName: string, assertion: () => void, value: unknown): void {
  try {
    assertion();
  } catch (error) {
    const description = error instanceof Error ? error.message : "nested invariant failed";
    throw new InvariantViolationError(invariantName, description, value);
  }
}

function isSimulationSpeed(value: unknown): value is SimulationSpeed {
  return (
    value === SimulationSpeed.Normal ||
    value === SimulationSpeed.Fast ||
    value === SimulationSpeed.VeryFast ||
    value === SimulationSpeed.Maximum
  );
}
