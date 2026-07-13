import type { GameState } from "./gameState";
import type { SimulationMinute, SimulationTick } from "./simulationClock";

declare const domainEventBrand: unique symbol;
declare const domainExecutionBrand: unique symbol;

export const DomainEventType = {
  SimulationResumed: "SimulationResumed",
  SimulationTickAdvanced: "SimulationTickAdvanced",
} as const;

export type DomainEventType = (typeof DomainEventType)[keyof typeof DomainEventType];

export interface SimulationResumedEvent {
  readonly type: typeof DomainEventType.SimulationResumed;
  readonly tick: SimulationTick;
  readonly minute: SimulationMinute;
  readonly [domainEventBrand]: "SimulationResumedEvent";
}

export interface SimulationTickAdvancedEvent {
  readonly type: typeof DomainEventType.SimulationTickAdvanced;
  readonly previousTick: SimulationTick;
  readonly currentTick: SimulationTick;
  readonly previousMinute: SimulationMinute;
  readonly currentMinute: SimulationMinute;
  readonly [domainEventBrand]: "SimulationTickAdvancedEvent";
}

export type DomainEvent = SimulationResumedEvent | SimulationTickAdvancedEvent;

export interface DomainExecutionData {
  readonly gameState: GameState;
  readonly events: readonly DomainEvent[];
}

export type DomainExecution = DomainExecutionData & {
  readonly [domainExecutionBrand]: "DomainExecution";
};

export interface CreateSimulationTickAdvancedEventInput {
  readonly previousTick: SimulationTick;
  readonly currentTick: SimulationTick;
  readonly previousMinute: SimulationMinute;
  readonly currentMinute: SimulationMinute;
}

export function createSimulationResumedEvent(
  tick: SimulationTick,
  minute: SimulationMinute,
): SimulationResumedEvent {
  return Object.freeze({
    type: DomainEventType.SimulationResumed,
    tick,
    minute,
  }) as SimulationResumedEvent;
}

export function createSimulationTickAdvancedEvent(
  input: CreateSimulationTickAdvancedEventInput,
): SimulationTickAdvancedEvent {
  return Object.freeze({
    type: DomainEventType.SimulationTickAdvanced,
    previousTick: input.previousTick,
    currentTick: input.currentTick,
    previousMinute: input.previousMinute,
    currentMinute: input.currentMinute,
  }) as SimulationTickAdvancedEvent;
}

export function createDomainExecution(
  gameState: GameState,
  events: readonly DomainEvent[],
): DomainExecution {
  return Object.freeze({
    gameState,
    events: Object.freeze(events.map((event) => Object.freeze({ ...event }) as DomainEvent)),
  }) as DomainExecution;
}
