import {
  createOperationLifecycleCompletedEvent,
  createOperationStartedEvent,
  type DomainEvent,
} from "./domainEvents";
import { OperationStatus, createOperationState, type OperationState } from "./operationState";
import type { SimulationTick } from "./simulationClock";

export interface AdvanceOperationLifecyclesInput {
  readonly currentTick: SimulationTick;
  readonly operations: readonly OperationState[];
}

export interface AdvanceOperationLifecyclesResult {
  readonly operations: readonly OperationState[];
  readonly events: readonly DomainEvent[];
}

export function advanceOperationLifecycles(
  input: AdvanceOperationLifecyclesInput,
): AdvanceOperationLifecyclesResult {
  const operations: OperationState[] = [];
  const events: DomainEvent[] = [];

  for (const operation of input.operations) {
    if (operation.status === OperationStatus.Planned) {
      if (input.currentTick <= operation.plannedAtTick) {
        operations.push(operation);
        continue;
      }

      events.push(
        createOperationStartedEvent({
          operationId: operation.operationId,
          operationTemplateId: operation.operationTemplateId,
          organizationId: operation.organizationId,
          targetLocationId: operation.targetLocationId,
          assignedCharacterIds: operation.assignedCharacterIds,
          previousStatus: OperationStatus.Planned,
          currentStatus: OperationStatus.Running,
          transitionTick: input.currentTick,
          plannedCompletionTick: operation.plannedCompletionTick,
        }),
      );

      if (input.currentTick >= operation.plannedCompletionTick) {
        events.push(
          createOperationLifecycleCompletedEvent({
            operationId: operation.operationId,
            operationTemplateId: operation.operationTemplateId,
            organizationId: operation.organizationId,
            targetLocationId: operation.targetLocationId,
            assignedCharacterIds: operation.assignedCharacterIds,
            previousStatus: OperationStatus.Running,
            currentStatus: OperationStatus.Resolved,
            transitionTick: input.currentTick,
            plannedCompletionTick: operation.plannedCompletionTick,
          }),
        );
        operations.push(replaceOperationStatus(operation, OperationStatus.Resolved));
        continue;
      }

      operations.push(replaceOperationStatus(operation, OperationStatus.Running));
      continue;
    }

    if (
      operation.status === OperationStatus.Running &&
      input.currentTick >= operation.plannedCompletionTick
    ) {
      events.push(
        createOperationLifecycleCompletedEvent({
          operationId: operation.operationId,
          operationTemplateId: operation.operationTemplateId,
          organizationId: operation.organizationId,
          targetLocationId: operation.targetLocationId,
          assignedCharacterIds: operation.assignedCharacterIds,
          previousStatus: OperationStatus.Running,
          currentStatus: OperationStatus.Resolved,
          transitionTick: input.currentTick,
          plannedCompletionTick: operation.plannedCompletionTick,
        }),
      );
      operations.push(replaceOperationStatus(operation, OperationStatus.Resolved));
      continue;
    }

    operations.push(operation);
  }

  return Object.freeze({
    operations: Object.freeze(operations),
    events: Object.freeze(events),
  });
}

function replaceOperationStatus(
  operation: OperationState,
  status: OperationState["status"],
): OperationState {
  return createOperationState({
    operationId: operation.operationId,
    operationTemplateId: operation.operationTemplateId,
    organizationId: operation.organizationId,
    targetLocationId: operation.targetLocationId,
    assignedCharacterIds: operation.assignedCharacterIds,
    status,
    plannedAtTick: operation.plannedAtTick,
    plannedCompletionTick: operation.plannedCompletionTick,
  });
}
