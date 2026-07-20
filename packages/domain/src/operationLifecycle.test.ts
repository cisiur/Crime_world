import { describe, expect, it } from "vitest";

import {
  DomainEventType,
  OperationStatus,
  advanceOperationLifecycles,
  assertDomainEventInvariant,
  createOperationState,
  parseCharacterId,
  parseLocationId,
  parseOperationId,
  parseOperationTemplateId,
  parseOrganizationId,
  parseSimulationTick,
  type DomainEvent,
  type OperationLifecycleCompletedEvent,
  type OperationState,
  type OperationStartedEvent,
} from "./index";

describe("operation lifecycle advancement", () => {
  it("leaves a planned operation planned at its planning tick", () => {
    const plannedOperation = createTestOperation({ status: OperationStatus.Planned });
    const result = advanceOperationLifecycles({
      currentTick: PLANNED_AT_TICK,
      operations: [plannedOperation],
    });

    expect(result.operations).toEqual([plannedOperation]);
    expect(result.operations[0]).toBe(plannedOperation);
    expect(result.events).toEqual([]);
  });

  it("starts a planned operation at the first later tick before completion", () => {
    const plannedOperation = createTestOperation({ status: OperationStatus.Planned });
    const result = advanceOperationLifecycles({
      currentTick: parseSimulationTick(5),
      operations: [plannedOperation],
    });

    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).not.toBe(plannedOperation);
    expect(result.operations[0]).toEqual({
      ...plannedOperation,
      status: OperationStatus.Running,
    });
    expect(result.events).toEqual([
      {
        type: DomainEventType.OperationStarted,
        operationId: LOCAL_COLLECTION_OPERATION_ID,
        operationTemplateId: LOCAL_COLLECTION_TEMPLATE_ID,
        organizationId: STARTER_ORGANIZATION_ID,
        targetLocationId: CORNER_STORE_LOCATION_ID,
        assignedCharacterIds: [BOSS_ID],
        previousStatus: OperationStatus.Planned,
        currentStatus: OperationStatus.Running,
        transitionTick: parseSimulationTick(5),
        plannedCompletionTick: COMPLETION_TICK,
      },
    ]);
  });

  it("uses post-clock-advance timing without starting on the planning tick", () => {
    const plannedOperation = createTestOperation({ status: OperationStatus.Planned });
    const sameTickResult = advanceOperationLifecycles({
      currentTick: PLANNED_AT_TICK,
      operations: [plannedOperation],
    });
    const nextTickResult = advanceOperationLifecycles({
      currentTick: parseSimulationTick(5),
      operations: sameTickResult.operations,
    });

    expect(sameTickResult.operations[0]!.status).toBe(OperationStatus.Planned);
    expect(nextTickResult.operations[0]!.status).toBe(OperationStatus.Running);
  });

  it("leaves a running operation running before completion", () => {
    const runningOperation = createTestOperation({ status: OperationStatus.Running });
    const result = advanceOperationLifecycles({
      currentTick: parseSimulationTick(9),
      operations: [runningOperation],
    });

    expect(result.operations).toEqual([runningOperation]);
    expect(result.operations[0]).toBe(runningOperation);
    expect(result.events).toEqual([]);
  });

  it("resolves a running operation exactly at its planned completion tick", () => {
    const runningOperation = createTestOperation({ status: OperationStatus.Running });
    const result = advanceOperationLifecycles({
      currentTick: COMPLETION_TICK,
      operations: [runningOperation],
    });

    expect(result.operations[0]).not.toBe(runningOperation);
    expect(result.operations[0]).toEqual({
      ...runningOperation,
      status: OperationStatus.Resolved,
    });
    expect(result.events).toEqual([
      {
        type: DomainEventType.OperationLifecycleCompleted,
        operationId: LOCAL_COLLECTION_OPERATION_ID,
        operationTemplateId: LOCAL_COLLECTION_TEMPLATE_ID,
        organizationId: STARTER_ORGANIZATION_ID,
        targetLocationId: CORNER_STORE_LOCATION_ID,
        assignedCharacterIds: [BOSS_ID],
        previousStatus: OperationStatus.Running,
        currentStatus: OperationStatus.Resolved,
        transitionTick: COMPLETION_TICK,
        plannedCompletionTick: COMPLETION_TICK,
      },
    ]);
    expect(result.events.map((event) => event.type)).not.toContain("OperationResolved");
    expect(result.events.map((event) => event.type)).not.toContain("OrganizationMoneyChanged");
    expect(result.events.map((event) => event.type)).not.toContain("CharacterAssignedToOperation");
  });

  it("resolves an overdue running operation and does not emit duplicate completion later", () => {
    const runningOperation = createTestOperation({ status: OperationStatus.Running });
    const overdueResult = advanceOperationLifecycles({
      currentTick: parseSimulationTick(12),
      operations: [runningOperation],
    });
    const laterResult = advanceOperationLifecycles({
      currentTick: parseSimulationTick(13),
      operations: overdueResult.operations,
    });

    expect(overdueResult.operations[0]!.status).toBe(OperationStatus.Resolved);
    expect(overdueResult.events.map((event) => event.type)).toEqual([
      DomainEventType.OperationLifecycleCompleted,
    ]);
    expect(laterResult.operations[0]).toBe(overdueResult.operations[0]);
    expect(laterResult.events).toEqual([]);
  });

  it("advances a planned operation at completion tick through start and completion", () => {
    const plannedOperation = createTestOperation({ status: OperationStatus.Planned });
    const result = advanceOperationLifecycles({
      currentTick: COMPLETION_TICK,
      operations: [plannedOperation],
    });

    expect(result.operations[0]!.status).toBe(OperationStatus.Resolved);
    expect(result.events.map((event) => event.type)).toEqual([
      DomainEventType.OperationStarted,
      DomainEventType.OperationLifecycleCompleted,
    ]);
    expect(result.events[0]).toEqual({
      type: DomainEventType.OperationStarted,
      operationId: LOCAL_COLLECTION_OPERATION_ID,
      operationTemplateId: LOCAL_COLLECTION_TEMPLATE_ID,
      organizationId: STARTER_ORGANIZATION_ID,
      targetLocationId: CORNER_STORE_LOCATION_ID,
      assignedCharacterIds: [BOSS_ID],
      previousStatus: OperationStatus.Planned,
      currentStatus: OperationStatus.Running,
      transitionTick: COMPLETION_TICK,
      plannedCompletionTick: COMPLETION_TICK,
    });
    expect(result.events[1]).toEqual({
      type: DomainEventType.OperationLifecycleCompleted,
      operationId: LOCAL_COLLECTION_OPERATION_ID,
      operationTemplateId: LOCAL_COLLECTION_TEMPLATE_ID,
      organizationId: STARTER_ORGANIZATION_ID,
      targetLocationId: CORNER_STORE_LOCATION_ID,
      assignedCharacterIds: [BOSS_ID],
      previousStatus: OperationStatus.Running,
      currentStatus: OperationStatus.Resolved,
      transitionTick: COMPLETION_TICK,
      plannedCompletionTick: COMPLETION_TICK,
    });
  });

  it("advances a planned operation after completion tick through start and completion", () => {
    const plannedOperation = createTestOperation({ status: OperationStatus.Planned });
    const result = advanceOperationLifecycles({
      currentTick: parseSimulationTick(12),
      operations: [plannedOperation],
    });

    expect(result.operations[0]!.status).toBe(OperationStatus.Resolved);
    expect(result.events.map((event) => event.type)).toEqual([
      DomainEventType.OperationStarted,
      DomainEventType.OperationLifecycleCompleted,
    ]);
    expect(result.events.map((event) => lifecycleEventSummary(event).transitionTick)).toEqual([
      parseSimulationTick(12),
      parseSimulationTick(12),
    ]);
  });

  it("leaves an already resolved operation unchanged without events", () => {
    const resolvedOperation = createTestOperation({ status: OperationStatus.Resolved });
    const result = advanceOperationLifecycles({
      currentTick: parseSimulationTick(12),
      operations: [resolvedOperation],
    });

    expect(result.operations).toEqual([resolvedOperation]);
    expect(result.operations[0]).toBe(resolvedOperation);
    expect(result.events).toEqual([]);
  });

  it("returns frozen empty collections for no operations", () => {
    const result = advanceOperationLifecycles({
      currentTick: PLANNED_AT_TICK,
      operations: [],
    });

    expect(result.operations).toEqual([]);
    expect(result.events).toEqual([]);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.operations)).toBe(true);
    expect(Object.isFrozen(result.events)).toBe(true);
  });

  it("preserves operation order and emits events in operation then transition order", () => {
    const starts = createTestOperation({
      operationId: parseOperationId("operation:starts"),
      status: OperationStatus.Planned,
    });
    const resolved = createTestOperation({
      operationId: parseOperationId("operation:already_resolved"),
      status: OperationStatus.Resolved,
    });
    const overduePlanned = createTestOperation({
      operationId: parseOperationId("operation:overdue_planned"),
      status: OperationStatus.Planned,
    });
    const completes = createTestOperation({
      operationId: parseOperationId("operation:completes"),
      status: OperationStatus.Running,
    });

    const result = advanceOperationLifecycles({
      currentTick: COMPLETION_TICK,
      operations: [starts, resolved, overduePlanned, completes],
    });

    expect(result.operations.map((operation) => operation.operationId)).toEqual([
      starts.operationId,
      resolved.operationId,
      overduePlanned.operationId,
      completes.operationId,
    ]);
    expect(result.operations.map((operation) => operation.status)).toEqual([
      OperationStatus.Resolved,
      OperationStatus.Resolved,
      OperationStatus.Resolved,
      OperationStatus.Resolved,
    ]);
    expect(result.operations[1]).toBe(resolved);
    expect(
      result.events.map((event) => {
        const lifecycleEvent = lifecycleEventSummary(event);
        return [lifecycleEvent.operationId, lifecycleEvent.type];
      }),
    ).toEqual([
      [starts.operationId, DomainEventType.OperationStarted],
      [starts.operationId, DomainEventType.OperationLifecycleCompleted],
      [overduePlanned.operationId, DomainEventType.OperationStarted],
      [overduePlanned.operationId, DomainEventType.OperationLifecycleCompleted],
      [completes.operationId, DomainEventType.OperationLifecycleCompleted],
    ]);
  });

  it("does not mutate input operations or arrays", () => {
    const plannedOperation = createTestOperation({ status: OperationStatus.Planned });
    const operations = [plannedOperation];
    const snapshot = JSON.stringify(operations);

    const result = advanceOperationLifecycles({
      currentTick: parseSimulationTick(5),
      operations,
    });

    expect(JSON.stringify(operations)).toBe(snapshot);
    expect(operations).toEqual([plannedOperation]);
    expect(result.operations).not.toBe(operations);
  });

  it("returns structurally identical results for structurally identical inputs", () => {
    expect(
      advanceOperationLifecycles({
        currentTick: COMPLETION_TICK,
        operations: [createTestOperation({ status: OperationStatus.Planned })],
      }),
    ).toEqual(
      advanceOperationLifecycles({
        currentTick: COMPLETION_TICK,
        operations: [createTestOperation({ status: OperationStatus.Planned })],
      }),
    );
  });

  it("does not duplicate start or completion events when re-evaluated at the same tick", () => {
    const firstResult = advanceOperationLifecycles({
      currentTick: parseSimulationTick(5),
      operations: [createTestOperation({ status: OperationStatus.Planned })],
    });
    const secondResult = advanceOperationLifecycles({
      currentTick: parseSimulationTick(5),
      operations: firstResult.operations,
    });

    expect(firstResult.events.map((event) => event.type)).toEqual([
      DomainEventType.OperationStarted,
    ]);
    expect(secondResult.events).toEqual([]);
  });

  it("has a bounded lifecycle API with no resource, random, dispatcher, or campaign output", () => {
    const result = advanceOperationLifecycles({
      currentTick: COMPLETION_TICK,
      operations: [createTestOperation({ status: OperationStatus.Running })],
    });

    expect(Object.keys(result).sort()).toEqual(["events", "operations"]);
    expect("organizations" in result).toBe(false);
    expect("characters" in result).toBe(false);
    expect("money" in result).toBe(false);
    expect("capacity" in result).toBe(false);
    expect("randomState" in result).toBe(false);
    expect("gameState" in result).toBe(false);
  });

  it("creates lifecycle events that satisfy domain invariants", () => {
    const result = advanceOperationLifecycles({
      currentTick: COMPLETION_TICK,
      operations: [createTestOperation({ status: OperationStatus.Planned })],
    });

    for (const event of result.events) {
      expect(() => assertDomainEventInvariant(event)).not.toThrow();
    }
  });
});

const STARTER_ORGANIZATION_ID = parseOrganizationId("organization:starter_crew");
const BOSS_ID = parseCharacterId("character:boss_001");
const CORNER_STORE_LOCATION_ID = parseLocationId("location:corner_store");
const LOCAL_COLLECTION_TEMPLATE_ID = parseOperationTemplateId(
  "operation-template:local_collection",
);
const LOCAL_COLLECTION_OPERATION_ID = parseOperationId("operation:local_collection_001");
const PLANNED_AT_TICK = parseSimulationTick(4);
const COMPLETION_TICK = parseSimulationTick(10);

function createTestOperation(
  overrides: Partial<Parameters<typeof createOperationState>[0]> = {},
): OperationState {
  return createOperationState({
    operationId: LOCAL_COLLECTION_OPERATION_ID,
    operationTemplateId: LOCAL_COLLECTION_TEMPLATE_ID,
    organizationId: STARTER_ORGANIZATION_ID,
    targetLocationId: CORNER_STORE_LOCATION_ID,
    assignedCharacterIds: [BOSS_ID],
    status: OperationStatus.Planned,
    plannedAtTick: PLANNED_AT_TICK,
    plannedCompletionTick: COMPLETION_TICK,
    ...overrides,
  });
}

function lifecycleEventSummary(
  event: DomainEvent,
): OperationStartedEvent | OperationLifecycleCompletedEvent {
  if (
    event.type !== DomainEventType.OperationStarted &&
    event.type !== DomainEventType.OperationLifecycleCompleted
  ) {
    throw new Error(`Expected operation lifecycle event, received ${event.type}`);
  }

  return event;
}
