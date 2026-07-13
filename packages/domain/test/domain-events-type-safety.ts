import {
  DomainEventType,
  createDomainExecution,
  createInitialGameState,
  createSimulationResumedEvent,
  createSimulationTickAdvancedEvent,
  parseSimulationMinute,
  parseSimulationTick,
} from "../src/index";
import type {
  DomainEvent,
  DomainExecution,
  SimulationResumedEvent,
  SimulationTickAdvancedEvent,
} from "../src/index";

const gameState = createInitialGameState({
  campaignId: "campaign:test",
  randomSeed: 123,
});
const tick = parseSimulationTick(1);
const minute = parseSimulationMinute(10);
const resumedEvent = createSimulationResumedEvent(tick, minute);
const tickAdvancedEvent = createSimulationTickAdvancedEvent({
  previousTick: parseSimulationTick(0),
  currentTick: tick,
  previousMinute: parseSimulationMinute(0),
  currentMinute: minute,
});
const eventUnionA: DomainEvent = resumedEvent;
const eventUnionB: DomainEvent = tickAdvancedEvent;
const execution = createDomainExecution(gameState, [resumedEvent, tickAdvancedEvent]);
const typedExecution: DomainExecution = execution;

// @ts-expect-error Arbitrary objects cannot be SimulationResumedEvent.
const invalidResumedEvent: SimulationResumedEvent = {
  type: DomainEventType.SimulationResumed,
  tick,
  minute,
};

// @ts-expect-error Arbitrary objects cannot be SimulationTickAdvancedEvent.
const invalidTickAdvancedEvent: SimulationTickAdvancedEvent = {
  type: DomainEventType.SimulationTickAdvanced,
  previousTick: parseSimulationTick(0),
  currentTick: tick,
  previousMinute: parseSimulationMinute(0),
  currentMinute: minute,
};

// @ts-expect-error Arbitrary objects cannot be DomainExecution.
const invalidExecution: DomainExecution = {
  gameState,
  events: [],
};

// @ts-expect-error Event tick fields must use branded SimulationTick.
createSimulationResumedEvent(1, minute);

// @ts-expect-error Event minute fields must use branded SimulationMinute.
createSimulationResumedEvent(tick, 10);

createSimulationTickAdvancedEvent({
  // @ts-expect-error previousTick must use branded SimulationTick.
  previousTick: 0,
  currentTick: tick,
  previousMinute: parseSimulationMinute(0),
  currentMinute: minute,
});

// @ts-expect-error DomainExecution events are readonly.
execution.events.push(resumedEvent);

function assertDomainEventUnion(event: DomainEvent): string {
  switch (event.type) {
    case DomainEventType.SimulationResumed:
      return event.type;
    case DomainEventType.SimulationTickAdvanced:
      return event.type;
    default: {
      const exhaustiveEvent: never = event;
      return exhaustiveEvent;
    }
  }
}

void eventUnionA;
void eventUnionB;
void typedExecution;
void invalidResumedEvent;
void invalidTickAdvancedEvent;
void invalidExecution;
void assertDomainEventUnion;
