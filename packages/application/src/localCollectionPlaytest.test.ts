import { describe, expect, it } from "vitest";

import {
  DomainEventType,
  OperationOutcomeCategory,
  OperationStatus,
  parseSimulationTick,
} from "@crimeworld/domain";

import {
  LOCAL_COLLECTION_PLAYTEST_SEED_PRESETS,
  applyLocalCollectionPlaytestConsequences,
  advanceLocalCollectionPlaytestTime,
  classifyLocalCollectionPlaytestOutcome,
  createLocalCollectionPlaytestSession,
  planLocalCollectionPlaytestOperation,
  reduceLocalCollectionPlaytestSession,
  resetLocalCollectionPlaytestSession,
  runFullLocalCollectionPlaytestOperation,
  setLocalCollectionPlaytestInitialExposure,
  setLocalCollectionPlaytestSeed,
  type LocalCollectionPlaytestSession,
} from "./localCollectionPlaytest";

describe("Local Collection playtest application harness", () => {
  it("creates the canonical initial session and authored operation view", () => {
    const session = createSession();

    expect(session.phase).toBe("setup");
    expect(session.phaseLabel).toBe("Setup");
    expect(session.currentTick).toBe(parseSimulationTick(4));
    expect(session.seed).toBe(32);
    expect(session.organization).toMatchObject({
      name: "Starter Crew",
      money: 100,
      operationalCapacity: 1,
      initialOperationalCapacity: 1,
      reservedOperationalCapacity: 0,
    });
    expect(session.characters[0]).toMatchObject({
      name: "Mara Voss",
      healthState: "healthy",
      legalState: "free",
      assignmentState: "idle",
      competence: 50,
      loyalty: 50,
      personalExposure: 0,
      capabilityTags: ["streetwise"],
      selected: true,
    });
    expect(session.target).toMatchObject({
      name: "Corner Store",
      kind: "shop-or-service",
      selected: true,
    });
    expect(session.operation).toMatchObject({
      displayName: "Local Collection",
      category: "one-off-income",
      startCost: 20,
      durationMinutes: 60,
      operationalCapacityCost: 1,
      grossRewardRange: "0-80",
      canPlan: true,
    });
    expect(session.operation.outcomePreview.map((outcome) => outcome.category)).toEqual([
      OperationOutcomeCategory.Success,
      OperationOutcomeCategory.PartialSuccess,
      OperationOutcomeCategory.Failure,
      OperationOutcomeCategory.CriticalFailure,
    ]);
    expect(session.operation.outcomePreview.map((outcome) => outcome.probabilityPercent)).toEqual([
      45, 30, 20, 5,
    ]);
    expect(session.availability.available).toBe(true);
  });

  it("rejects invalid seed and initial exposure without changing setup state", () => {
    expect(createLocalCollectionPlaytestSession({ seed: -1 })).toMatchObject({
      ok: false,
      error: { code: "INVALID_SEED" },
    });
    expect(createLocalCollectionPlaytestSession({ initialExposure: 101 })).toMatchObject({
      ok: false,
      error: { code: "INVALID_INITIAL_EXPOSURE" },
    });

    const session = createSession();
    const seedResult = setLocalCollectionPlaytestSeed(session, Number.NaN);
    const exposureResult = setLocalCollectionPlaytestInitialExposure(session, -1);

    expect(seedResult.ok).toBe(false);
    expect(exposureResult.ok).toBe(false);
    expect(seedResult.session.seed).toBe(32);
    expect(seedResult.session.organization.money).toBe(100);
    expect(exposureResult.session.characters[0]?.personalExposure).toBe(0);
    expect(exposureResult.session.operations).toEqual([]);
  });

  it("plans through the real domain API and reserves cost, assignment, and capacity once", () => {
    const planned = plan(createSession());

    expect(planned.phase).toBe("planned");
    expect(planned.operations).toHaveLength(1);
    expect(planned.operations[0]).toMatchObject({
      status: OperationStatus.Planned,
      plannedAtTick: parseSimulationTick(4),
      plannedCompletionTick: parseSimulationTick(10),
    });
    expect(planned.organization.money).toBe(80);
    expect(planned.organization.operationalCapacity).toBe(0);
    expect(planned.characters[0]?.assignmentState).toBe("assigned");
    expect(planned.eventTimeline.map((event) => event.type)).toEqual([
      DomainEventType.OperationPlanned,
      DomainEventType.CharacterAssignedToOperation,
      DomainEventType.OrganizationOperationalCapacityReserved,
      DomainEventType.OrganizationMoneyChanged,
    ]);

    const rejected = planLocalCollectionPlaytestOperation(planned);
    expect(rejected.ok).toBe(false);
    expect(rejected.session.organization.money).toBe(80);
    expect(rejected.session.events).toHaveLength(4);
  });

  it("advances lifecycle to running and resolved without duplicate lifecycle events", () => {
    const planned = plan(createSession());
    const stillPlanned = reduceLocalCollectionPlaytestSession(planned, {
      type: "advance-to-start",
    });

    expect(stillPlanned.ok).toBe(true);
    if (!stillPlanned.ok) {
      throw new Error("expected start advance to succeed");
    }
    expect(stillPlanned.session.phase).toBe("running");
    expect(stillPlanned.session.operations[0]?.status).toBe(OperationStatus.Running);
    expect(stillPlanned.session.currentTick).toBe(parseSimulationTick(5));

    const resolved = advanceLocalCollectionPlaytestTime(stillPlanned.session, "to-completion");
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) {
      throw new Error("expected completion advance to succeed");
    }
    expect(resolved.session.phase).toBe("resolved");
    expect(resolved.session.operations[0]?.status).toBe(OperationStatus.Resolved);
    expect(resolved.session.currentTick).toBe(parseSimulationTick(10));
    expect(resolved.session.eventTimeline.map((event) => event.type)).toEqual([
      DomainEventType.OperationPlanned,
      DomainEventType.CharacterAssignedToOperation,
      DomainEventType.OrganizationOperationalCapacityReserved,
      DomainEventType.OrganizationMoneyChanged,
      DomainEventType.OperationStarted,
      DomainEventType.OperationLifecycleCompleted,
    ]);

    const duplicate = advanceLocalCollectionPlaytestTime(resolved.session, "one-tick");
    expect(duplicate.ok).toBe(false);
    expect(duplicate.session.events).toHaveLength(6);
  });

  it("classifies, advances RNG, and settles all four fixed seed outcomes", () => {
    const cases = [
      {
        seed: 32,
        category: OperationOutcomeCategory.Success,
        roll: 1,
        finalMoney: 160,
        exposure: 4,
        health: "healthy",
      },
      {
        seed: 153,
        category: OperationOutcomeCategory.PartialSuccess,
        roll: 46,
        finalMoney: 120,
        exposure: 10,
        health: "healthy",
      },
      {
        seed: 20,
        category: OperationOutcomeCategory.Failure,
        roll: 76,
        finalMoney: 80,
        exposure: 14,
        health: "healthy",
      },
      {
        seed: 64,
        category: OperationOutcomeCategory.CriticalFailure,
        roll: 96,
        finalMoney: 80,
        exposure: 25,
        health: "injured",
      },
    ] as const;

    for (const testCase of cases) {
      const result = runFullLocalCollectionPlaytestOperation(
        createSession({ seed: testCase.seed }),
      );

      expect(result.ok).toBe(true);
      if (!result.ok) {
        throw new Error("expected full run to succeed");
      }
      expect(result.session.phase).toBe("settled");
      expect(result.session.classifiedOutcome).toMatchObject({
        category: testCase.category,
        percentileRoll: testCase.roll,
      });
      expect(result.session.randomState).toEqual(result.session.classifiedOutcome?.nextRandomState);
      expect(result.session.organization.money).toBe(testCase.finalMoney);
      expect(result.session.organization.operationalCapacity).toBe(1);
      expect(result.session.characters[0]?.assignmentState).toBe("idle");
      expect(result.session.characters[0]?.personalExposure).toBe(testCase.exposure);
      expect(result.session.characters[0]?.healthState).toBe(testCase.health);
      expect(result.session.characters[0]?.legalState).toBe("free");
      expect(result.session.appliedConsequences).toHaveLength(1);
    }
  });

  it("keeps clamped exposure diagnostics from setup through settlement", () => {
    const setup = createSession({ seed: 64 });
    const exposureResult = setLocalCollectionPlaytestInitialExposure(setup, 90);

    expect(exposureResult.ok).toBe(true);
    if (!exposureResult.ok) {
      throw new Error("expected exposure setup to succeed");
    }

    const settled = runFullLocalCollectionPlaytestOperation(exposureResult.session);
    expect(settled.ok).toBe(true);
    if (!settled.ok) {
      throw new Error("expected full run to succeed");
    }
    expect(settled.session.characters[0]?.personalExposure).toBe(100);
    expect(settled.session.appliedConsequences[0]).toMatchObject({
      requestedPersonalExposureDelta: 25,
      actualPersonalExposureDelta: 10,
      previousPersonalExposure: 90,
      currentPersonalExposure: 100,
      personalExposureClamped: true,
    });
  });

  it("rejects invalid phase actions without changing gameplay state", () => {
    const session = createSession();
    const rejected = classifyLocalCollectionPlaytestOutcome(session);

    expect(rejected.ok).toBe(false);
    if (rejected.ok) {
      throw new Error("expected classification to fail");
    }
    expect(rejected.error.code).toBe("CLASSIFY_OUTCOME_INVALID_PHASE");
    expect(rejected.session.phase).toBe("setup");
    expect(rejected.session.organization.money).toBe(100);
    expect(rejected.session.events).toEqual([]);
    expect(rejected.session.lastError?.code).toBe("CLASSIFY_OUTCOME_INVALID_PHASE");
  });

  it("resets to a clean setup state and blocks normal duplicate settlement", () => {
    const settled = runFull(createSession());
    const duplicate = applyLocalCollectionPlaytestConsequences(settled);

    expect(duplicate.ok).toBe(false);
    expect(duplicate.session.phase).toBe("settled");
    expect(duplicate.session.appliedConsequences).toHaveLength(1);

    const reset = resetLocalCollectionPlaytestSession(settled, { seed: 153, initialExposure: 0 });

    expect(reset.ok).toBe(true);
    if (!reset.ok) {
      throw new Error("expected reset to succeed");
    }
    expect(reset.session.phase).toBe("setup");
    expect(reset.session.seed).toBe(153);
    expect(reset.session.organization.money).toBe(100);
    expect(reset.session.characters[0]?.assignmentState).toBe("idle");
    expect(reset.session.characters[0]?.personalExposure).toBe(0);
    expect(reset.session.events).toEqual([]);
    expect(reset.session.appliedConsequences).toEqual([]);
  });

  it("matches manual step-by-step and full-run convenience observable results", () => {
    const manual = apply(classify(resolve(start(plan(createSession({ seed: 153 }))))));
    const full = runFull(createSession({ seed: 153 }));

    expect(toObservable(manual)).toEqual(toObservable(full));
    expect(manual.eventTimeline.map((event) => event.type)).toEqual([
      DomainEventType.OperationPlanned,
      DomainEventType.CharacterAssignedToOperation,
      DomainEventType.OrganizationOperationalCapacityReserved,
      DomainEventType.OrganizationMoneyChanged,
      DomainEventType.OperationStarted,
      DomainEventType.OperationLifecycleCompleted,
      DomainEventType.OperationOutcomeRolled,
      DomainEventType.OperationOutcomeClassified,
      DomainEventType.OrganizationMoneyChanged,
      DomainEventType.CharacterPersonalExposureChanged,
      DomainEventType.CharacterAssignmentReleased,
      DomainEventType.OrganizationOperationalCapacityReleased,
      DomainEventType.OperationConsequencesApplied,
    ]);
  });

  it("exposes the fixed seed presets for the UI", () => {
    expect(LOCAL_COLLECTION_PLAYTEST_SEED_PRESETS).toEqual([
      { label: "Success", seed: 32, expectedRoll: 1, expectedCategory: "success" },
      {
        label: "Partial success",
        seed: 153,
        expectedRoll: 46,
        expectedCategory: "partial-success",
      },
      { label: "Failure", seed: 20, expectedRoll: 76, expectedCategory: "failure" },
      {
        label: "Critical failure",
        seed: 64,
        expectedRoll: 96,
        expectedCategory: "critical-failure",
      },
    ]);
  });
});

function createSession(input: { readonly seed?: number; readonly initialExposure?: number } = {}) {
  const result = createLocalCollectionPlaytestSession(input);

  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("expected session creation to succeed");
  }

  return result.session;
}

function runFull(session: LocalCollectionPlaytestSession): LocalCollectionPlaytestSession {
  const result = runFullLocalCollectionPlaytestOperation(session);

  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("expected full run to succeed");
  }

  return result.session;
}

function plan(session: LocalCollectionPlaytestSession): LocalCollectionPlaytestSession {
  const result = planLocalCollectionPlaytestOperation(session);

  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("expected planning to succeed");
  }

  return result.session;
}

function start(session: LocalCollectionPlaytestSession): LocalCollectionPlaytestSession {
  const result = advanceLocalCollectionPlaytestTime(session, "one-tick");

  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("expected start to succeed");
  }

  return result.session;
}

function resolve(session: LocalCollectionPlaytestSession): LocalCollectionPlaytestSession {
  const result = advanceLocalCollectionPlaytestTime(session, "to-completion");

  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("expected completion to succeed");
  }

  return result.session;
}

function classify(session: LocalCollectionPlaytestSession): LocalCollectionPlaytestSession {
  const result = classifyLocalCollectionPlaytestOutcome(session);

  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("expected classification to succeed");
  }

  return result.session;
}

function apply(session: LocalCollectionPlaytestSession): LocalCollectionPlaytestSession {
  const result = applyLocalCollectionPlaytestConsequences(session);

  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("expected consequence application to succeed");
  }

  return result.session;
}

function toObservable(session: LocalCollectionPlaytestSession) {
  return {
    phase: session.phase,
    currentTick: session.currentTick,
    organization: session.organization,
    character: session.characters[0],
    operation: session.operations[0],
    classifiedOutcome: session.classifiedOutcome,
    appliedConsequences: session.appliedConsequences,
    eventTypes: session.eventTimeline.map((event) => event.type),
    eventSummaries: session.eventTimeline.map((event) => event.summary),
  };
}
