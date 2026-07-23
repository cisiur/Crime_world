import {
  canonicalMvpCityDefinition,
  localCollectionConsequenceDefinition,
  localCollectionOperationTemplateDefinition,
  localCollectionOutcomeBands,
} from "@crimeworld/content";
import {
  DomainEventType,
  OperationStatus,
  applyLocalCollectionConsequences,
  classifyOperationOutcome,
  createBusinessState,
  createCharacterState,
  createCityState,
  createOrganizationState,
  createPlanOperationCommand,
  createRandomState,
  evaluateOperationAvailability,
  parseBusinessId,
  parseCharacterId,
  parseOperationId,
  parseOrganizationId,
  parseRandomSeed,
  parseSimulationTick,
  parseTransactionId,
  planOperation,
  advanceOperationLifecycles,
  type AppliedOperationConsequences,
  type BusinessState,
  type CharacterId,
  type CharacterState,
  type ClassifiedOperationOutcome,
  type DomainEvent,
  type LocationId,
  type LocationState,
  type MoneyTransaction,
  type OperationAvailabilityReason,
  type OperationAvailabilityResult,
  type OperationOutcomeCategory,
  type OperationOutcomeModifierContributions,
  type OperationState,
  type OrganizationState,
  type RandomState,
  type SimulationTick,
} from "@crimeworld/domain";

export type LocalCollectionPlaytestPhase =
  | "setup"
  | "planned"
  | "running"
  | "resolved"
  | "classified"
  | "settled";

export type LocalCollectionPlaytestAction =
  | { readonly type: "select-character"; readonly characterId: CharacterId }
  | { readonly type: "select-target"; readonly locationId: LocationId }
  | { readonly type: "set-seed"; readonly seed: number }
  | { readonly type: "set-initial-exposure"; readonly exposure: number }
  | { readonly type: "plan-operation" }
  | { readonly type: "advance-one-tick" }
  | { readonly type: "advance-to-start" }
  | { readonly type: "advance-to-completion" }
  | { readonly type: "classify-outcome" }
  | { readonly type: "apply-consequences" }
  | { readonly type: "run-full-operation" }
  | { readonly type: "reset"; readonly seed?: number; readonly initialExposure?: number }
  | { readonly type: "dismiss-error" };

export interface LocalCollectionPlaytestError {
  readonly code: string;
  readonly message: string;
  readonly detail?: string;
}

export type LocalCollectionPlaytestActionResult =
  | {
      readonly ok: true;
      readonly session: LocalCollectionPlaytestSession;
    }
  | {
      readonly ok: false;
      readonly session: LocalCollectionPlaytestSession;
      readonly error: LocalCollectionPlaytestError;
    };

export type CreateLocalCollectionPlaytestSessionResult =
  | {
      readonly ok: true;
      readonly session: LocalCollectionPlaytestSession;
    }
  | {
      readonly ok: false;
      readonly error: LocalCollectionPlaytestError;
    };

export interface LocalCollectionPlaytestSession {
  readonly phase: LocalCollectionPlaytestPhase;
  readonly phaseLabel: string;
  readonly currentTick: SimulationTick;
  readonly seed: number;
  readonly initialExposure: number;
  readonly selectedCharacterId: CharacterId | null;
  readonly selectedTargetLocationId: LocationId | null;
  readonly organization: LocalCollectionOrganizationView;
  readonly characters: readonly LocalCollectionCharacterView[];
  readonly target: LocalCollectionTargetView;
  readonly operation: LocalCollectionOperationView;
  readonly organizations: readonly OrganizationState[];
  readonly characterStates: readonly CharacterState[];
  readonly locations: readonly LocationState[];
  readonly businesses: readonly BusinessState[];
  readonly operations: readonly OperationState[];
  readonly transactions: readonly MoneyTransaction[];
  readonly randomState: RandomState;
  readonly classifiedOutcome: ClassifiedOperationOutcome | null;
  readonly appliedConsequences: readonly AppliedOperationConsequences[];
  readonly events: readonly DomainEvent[];
  readonly eventTimeline: readonly LocalCollectionEventTimelineItem[];
  readonly availability: OperationAvailabilityResult;
  readonly lastError: LocalCollectionPlaytestError | null;
}

export interface LocalCollectionOrganizationView {
  readonly id: string;
  readonly name: string;
  readonly money: number;
  readonly operationalCapacity: number;
  readonly initialOperationalCapacity: number;
  readonly reservedOperationalCapacity: number;
  readonly capacityLabel: string;
}

export interface LocalCollectionCharacterView {
  readonly id: CharacterId;
  readonly name: string;
  readonly competence: number;
  readonly loyalty: number;
  readonly capabilityTags: readonly string[];
  readonly healthState: CharacterState["healthState"];
  readonly legalState: CharacterState["legalState"];
  readonly assignmentState: CharacterState["assignmentState"];
  readonly personalExposure: number;
  readonly selected: boolean;
}

export interface LocalCollectionTargetView {
  readonly id: LocationId;
  readonly name: string;
  readonly kind: string;
  readonly districtName: string;
  readonly districtId: string;
  readonly businessId: string;
  readonly selected: boolean;
}

export interface LocalCollectionOperationView {
  readonly id: string;
  readonly displayName: string;
  readonly category: string;
  readonly status: OperationState["status"] | "not-planned";
  readonly startCost: number;
  readonly durationMinutes: number;
  readonly operationalCapacityCost: number;
  readonly grossRewardRange: string;
  readonly riskSummary: string;
  readonly plannedCompletionTick: SimulationTick | null;
  readonly canEditSetup: boolean;
  readonly canPlan: boolean;
  readonly canAdvanceOneTick: boolean;
  readonly canAdvanceToStart: boolean;
  readonly canAdvanceToCompletion: boolean;
  readonly canClassify: boolean;
  readonly canApplyConsequences: boolean;
  readonly canRunFullOperation: boolean;
  readonly disabledReason: string | null;
  readonly availabilityReasons: readonly OperationAvailabilityReason[];
  readonly outcomePreview: readonly LocalCollectionOutcomePreview[];
  readonly consequenceSummary: AppliedOperationConsequences | null;
}

export interface LocalCollectionOutcomePreview {
  readonly category: OperationOutcomeCategory;
  readonly label: string;
  readonly probabilityPercent: number;
  readonly grossReward: number;
  readonly exposureDelta: number;
  readonly healthConsequence: string;
}

export interface LocalCollectionEventTimelineItem {
  readonly sequence: number;
  readonly type: DomainEvent["type"];
  readonly summary: string;
  readonly event: DomainEvent;
}

export interface CreateLocalCollectionPlaytestSessionInput {
  readonly seed?: number;
  readonly initialExposure?: number;
}

const DEFAULT_SEED = 32;
const DEFAULT_INITIAL_EXPOSURE = 0;
const INITIAL_TICK = parseSimulationTick(4);
const INITIAL_MONEY = 100;
const INITIAL_OPERATIONAL_CAPACITY = 1;
const ORGANIZATION_ID = parseOrganizationId("organization:starter_crew");
const CHARACTER_ID = parseCharacterId("character:boss_001");
const BUSINESS_ID = parseBusinessId("business:corner_store");
const OPERATION_ID = parseOperationId("operation:local_collection_playtest");
const START_COST_TRANSACTION_ID = parseTransactionId(
  "transaction:local_collection_playtest:start_cost",
);
const GROSS_REWARD_TRANSACTION_ID = parseTransactionId(
  "transaction:local_collection_playtest:gross_reward",
);
const NEUTRAL_MODIFIERS: OperationOutcomeModifierContributions = Object.freeze({
  base: 0,
  competence: 0,
  capability: 0,
  district: 0,
  exposure: 0,
});

export const LOCAL_COLLECTION_PLAYTEST_SEED_PRESETS = Object.freeze([
  Object.freeze({
    label: "Success",
    seed: 32,
    expectedRoll: 1,
    expectedCategory: "success",
  }),
  Object.freeze({
    label: "Partial success",
    seed: 153,
    expectedRoll: 46,
    expectedCategory: "partial-success",
  }),
  Object.freeze({
    label: "Failure",
    seed: 20,
    expectedRoll: 76,
    expectedCategory: "failure",
  }),
  Object.freeze({
    label: "Critical failure",
    seed: 64,
    expectedRoll: 96,
    expectedCategory: "critical-failure",
  }),
]);

export function createLocalCollectionPlaytestSession(
  input: CreateLocalCollectionPlaytestSessionInput = {},
): CreateLocalCollectionPlaytestSessionResult {
  const seed = input.seed ?? DEFAULT_SEED;
  const initialExposure = input.initialExposure ?? DEFAULT_INITIAL_EXPOSURE;
  const validation = validateSetupInput(seed, initialExposure);
  if (validation !== null) {
    return Object.freeze({ ok: false, error: validation });
  }

  const randomState = createRandomState(parseRandomSeed(seed));
  const cityState = createCityState(canonicalMvpCityDefinition);
  const targetDefinition = getTargetDefinition();
  const locationStates = cityState.locationStates.map((locationState) =>
    locationState.locationId === targetDefinition.id
      ? Object.freeze({ ...locationState, businessId: BUSINESS_ID })
      : locationState,
  );
  const organizations = Object.freeze([
    createOrganizationState({
      organizationId: ORGANIZATION_ID,
      displayName: "Starter Crew",
      leaderCharacterId: CHARACTER_ID,
      memberCharacterIds: [CHARACTER_ID],
      money: INITIAL_MONEY,
      operationalCapacity: INITIAL_OPERATIONAL_CAPACITY,
    }),
  ]);
  const characters = Object.freeze([
    createCharacterState({
      characterId: CHARACTER_ID,
      displayName: "Mara Voss",
      capabilityTags: ["streetwise"],
      healthState: "healthy",
      legalState: "free",
      assignmentState: "idle",
      competence: 50,
      loyalty: 50,
      personalExposure: initialExposure,
    }),
  ]);
  const businesses = Object.freeze([
    createBusinessState({
      businessId: BUSINESS_ID,
      locationId: targetDefinition.id,
      ownerOrganizationId: null,
    }),
  ]);

  return Object.freeze({
    ok: true,
    session: createSession({
      phase: "setup",
      currentTick: INITIAL_TICK,
      seed,
      initialExposure,
      selectedCharacterId: CHARACTER_ID,
      selectedTargetLocationId: targetDefinition.id,
      organizations,
      characterStates: characters,
      locations: Object.freeze(locationStates),
      businesses,
      operations: Object.freeze([]),
      transactions: Object.freeze([]),
      randomState,
      classifiedOutcome: null,
      appliedConsequences: Object.freeze([]),
      events: Object.freeze([]),
      lastError: null,
    }),
  });
}

export function resetLocalCollectionPlaytestSession(
  session: LocalCollectionPlaytestSession,
  input: CreateLocalCollectionPlaytestSessionInput = {},
): LocalCollectionPlaytestActionResult {
  const result = createLocalCollectionPlaytestSession({
    seed: input.seed ?? session.seed,
    initialExposure: input.initialExposure ?? DEFAULT_INITIAL_EXPOSURE,
  });

  if (!result.ok) {
    return fail(session, result.error);
  }

  return succeed(result.session);
}

export function reduceLocalCollectionPlaytestSession(
  session: LocalCollectionPlaytestSession,
  action: LocalCollectionPlaytestAction,
): LocalCollectionPlaytestActionResult {
  switch (action.type) {
    case "select-character":
      return selectLocalCollectionCharacter(session, action.characterId);
    case "select-target":
      return selectLocalCollectionTarget(session, action.locationId);
    case "set-seed":
      return setLocalCollectionPlaytestSeed(session, action.seed);
    case "set-initial-exposure":
      return setLocalCollectionPlaytestInitialExposure(session, action.exposure);
    case "plan-operation":
      return planLocalCollectionPlaytestOperation(session);
    case "advance-one-tick":
      return advanceLocalCollectionPlaytestTime(session, "one-tick");
    case "advance-to-start":
      return advanceLocalCollectionPlaytestTime(session, "to-start");
    case "advance-to-completion":
      return advanceLocalCollectionPlaytestTime(session, "to-completion");
    case "classify-outcome":
      return classifyLocalCollectionPlaytestOutcome(session);
    case "apply-consequences":
      return applyLocalCollectionPlaytestConsequences(session);
    case "run-full-operation":
      return runFullLocalCollectionPlaytestOperation(session);
    case "reset":
      return resetLocalCollectionPlaytestSession(
        session,
        createOptionalSetupInput(action.seed, action.initialExposure),
      );
    case "dismiss-error":
      return succeed(createSession({ ...session, lastError: null }));
  }
}

export function selectLocalCollectionCharacter(
  session: LocalCollectionPlaytestSession,
  characterId: CharacterId,
): LocalCollectionPlaytestActionResult {
  if (session.phase !== "setup") {
    return fail(session, invalidPhase("SELECT_CHARACTER_INVALID_PHASE", session.phase));
  }

  if (!session.characterStates.some((character) => character.characterId === characterId)) {
    return fail(session, {
      code: "CHARACTER_NOT_AVAILABLE",
      message: "That character is not part of this playtest scenario.",
    });
  }

  return succeed(createSession({ ...session, selectedCharacterId: characterId, lastError: null }));
}

export function selectLocalCollectionTarget(
  session: LocalCollectionPlaytestSession,
  locationId: LocationId,
): LocalCollectionPlaytestActionResult {
  if (session.phase !== "setup") {
    return fail(session, invalidPhase("SELECT_TARGET_INVALID_PHASE", session.phase));
  }

  if (locationId !== getTargetDefinition().id) {
    return fail(session, {
      code: "TARGET_NOT_AVAILABLE",
      message: "Only the canonical Corner Store target is available in this playtest.",
    });
  }

  return succeed(
    createSession({ ...session, selectedTargetLocationId: locationId, lastError: null }),
  );
}

export function setLocalCollectionPlaytestSeed(
  session: LocalCollectionPlaytestSession,
  seed: number,
): LocalCollectionPlaytestActionResult {
  if (session.phase !== "setup") {
    return fail(session, invalidPhase("SET_SEED_INVALID_PHASE", session.phase));
  }

  const error = validateSeed(seed);
  if (error !== null) {
    return fail(session, error);
  }

  return createFromSetup(session, seed, session.initialExposure);
}

export function setLocalCollectionPlaytestInitialExposure(
  session: LocalCollectionPlaytestSession,
  exposure: number,
): LocalCollectionPlaytestActionResult {
  if (session.phase !== "setup") {
    return fail(session, invalidPhase("SET_INITIAL_EXPOSURE_INVALID_PHASE", session.phase));
  }

  const error = validateInitialExposure(exposure);
  if (error !== null) {
    return fail(session, error);
  }

  return createFromSetup(session, session.seed, exposure);
}

export function planLocalCollectionPlaytestOperation(
  session: LocalCollectionPlaytestSession,
): LocalCollectionPlaytestActionResult {
  if (session.phase !== "setup") {
    return fail(session, invalidPhase("PLAN_OPERATION_INVALID_PHASE", session.phase));
  }

  if (session.selectedCharacterId === null || session.selectedTargetLocationId === null) {
    return fail(session, {
      code: "SELECTION_REQUIRED",
      message: "Select both Mara Voss and the Corner Store before planning.",
    });
  }

  const result = planOperation({
    command: createPlanOperationCommand({
      operationId: OPERATION_ID,
      operationTemplateId: localCollectionOperationTemplateDefinition.id,
      organizationId: ORGANIZATION_ID,
      targetLocationId: session.selectedTargetLocationId,
      assignedCharacterId: session.selectedCharacterId,
      startCostTransactionId: START_COST_TRANSACTION_ID,
    }),
    currentTick: session.currentTick,
    operationTemplates: [localCollectionOperationTemplateDefinition],
    organizations: session.organizations,
    characters: session.characterStates,
    locationStates: session.locations,
    locationDefinitions: getAvailabilityLocationDefinitions(),
    businessStates: session.businesses,
    operations: session.operations,
    transactions: session.transactions,
  });

  if (!result.ok) {
    return fail(
      session,
      createError({
        code: result.error.code,
        message: result.error.message,
        detail: "reasons" in result.error ? result.error.reasons.join(", ") : undefined,
      }),
    );
  }

  return succeed(
    createSession({
      ...session,
      phase: "planned",
      organizations: result.value.organizations,
      characterStates: result.value.characters,
      operations: result.value.operations,
      transactions: result.value.transactions,
      events: appendEvents(session.events, result.value.events),
      lastError: null,
    }),
  );
}

export function advanceLocalCollectionPlaytestTime(
  session: LocalCollectionPlaytestSession,
  mode: "one-tick" | "to-start" | "to-completion" = "one-tick",
): LocalCollectionPlaytestActionResult {
  if (session.phase !== "planned" && session.phase !== "running") {
    return fail(session, invalidPhase("ADVANCE_TIME_INVALID_PHASE", session.phase));
  }

  const operation = getCurrentOperation(session);
  if (operation === undefined) {
    return fail(session, {
      code: "OPERATION_MISSING",
      message: "No operation is available to advance.",
    });
  }

  const currentTick = deriveAdvanceTick(session.currentTick, operation, mode);
  const lifecycle = advanceOperationLifecycles({
    currentTick,
    operations: session.operations,
  });
  const nextOperation = lifecycle.operations.find(
    (candidate) => candidate.operationId === operation.operationId,
  );
  if (nextOperation === undefined) {
    return fail(session, {
      code: "OPERATION_MISSING_AFTER_LIFECYCLE",
      message: "Lifecycle processing did not return the active operation.",
    });
  }

  return succeed(
    createSession({
      ...session,
      phase: phaseFromOperationStatus(nextOperation.status),
      currentTick,
      operations: lifecycle.operations,
      events: appendEvents(session.events, lifecycle.events),
      lastError: null,
    }),
  );
}

export function classifyLocalCollectionPlaytestOutcome(
  session: LocalCollectionPlaytestSession,
): LocalCollectionPlaytestActionResult {
  if (session.phase !== "resolved") {
    return fail(session, invalidPhase("CLASSIFY_OUTCOME_INVALID_PHASE", session.phase));
  }

  const operation = getCurrentOperation(session);
  if (operation === undefined) {
    return fail(session, {
      code: "OPERATION_MISSING",
      message: "No resolved operation is available to classify.",
    });
  }

  const result = classifyOperationOutcome({
    operation,
    randomState: session.randomState,
    outcomeBands: localCollectionOutcomeBands,
    modifierContributions: NEUTRAL_MODIFIERS,
  });

  if (!result.ok) {
    return fail(session, {
      code: result.error.code,
      message: result.error.message,
    });
  }

  return succeed(
    createSession({
      ...session,
      phase: "classified",
      randomState: result.value.nextRandomState,
      classifiedOutcome: result.value,
      events: appendEvents(session.events, result.value.events),
      lastError: null,
    }),
  );
}

export function applyLocalCollectionPlaytestConsequences(
  session: LocalCollectionPlaytestSession,
): LocalCollectionPlaytestActionResult {
  if (session.phase !== "classified") {
    return fail(session, invalidPhase("APPLY_CONSEQUENCES_INVALID_PHASE", session.phase));
  }

  const operation = getCurrentOperation(session);
  if (operation === undefined || session.classifiedOutcome === null) {
    return fail(session, {
      code: "CLASSIFIED_OPERATION_MISSING",
      message: "Classify a resolved operation before applying consequences.",
    });
  }

  const grossRewardTransactionId = getGrossRewardTransactionId(session.classifiedOutcome.category);
  const result = applyLocalCollectionConsequences({
    operation,
    classifiedOutcome: session.classifiedOutcome,
    consequenceDefinition: localCollectionConsequenceDefinition,
    organizations: session.organizations,
    characters: session.characterStates,
    appliedConsequences: session.appliedConsequences,
    transactions: session.transactions,
    recordedAtTick: session.currentTick,
    ...(grossRewardTransactionId === undefined ? {} : { grossRewardTransactionId }),
  });

  if (!result.ok) {
    return fail(session, {
      code: result.error.code,
      message: result.error.message,
    });
  }

  return succeed(
    createSession({
      ...session,
      phase: "settled",
      organizations: result.value.organizations,
      characterStates: result.value.characters,
      appliedConsequences: result.value.appliedConsequences,
      transactions: result.value.transactions,
      events: appendEvents(session.events, result.value.events),
      lastError: null,
    }),
  );
}

export function runFullLocalCollectionPlaytestOperation(
  session: LocalCollectionPlaytestSession,
): LocalCollectionPlaytestActionResult {
  if (session.phase !== "setup") {
    return fail(session, invalidPhase("RUN_FULL_OPERATION_INVALID_PHASE", session.phase));
  }

  const actions: readonly LocalCollectionPlaytestAction[] = Object.freeze([
    { type: "plan-operation" },
    { type: "advance-one-tick" },
    { type: "advance-to-completion" },
    { type: "classify-outcome" },
    { type: "apply-consequences" },
  ]);

  let current = session;
  for (const action of actions) {
    const result = reduceLocalCollectionPlaytestSession(current, action);
    if (!result.ok) {
      return result;
    }
    current = result.session;
  }

  return succeed(current);
}

function createFromSetup(
  session: LocalCollectionPlaytestSession,
  seed: number,
  initialExposure: number,
): LocalCollectionPlaytestActionResult {
  const result = createLocalCollectionPlaytestSession({ seed, initialExposure });
  if (!result.ok) {
    return fail(session, result.error);
  }

  return succeed(result.session);
}

function createSession(
  input: Omit<
    LocalCollectionPlaytestSession,
    | "phaseLabel"
    | "organization"
    | "characters"
    | "target"
    | "operation"
    | "availability"
    | "eventTimeline"
  >,
): LocalCollectionPlaytestSession {
  const organizationState = getOnly(input.organizations, "organization");
  const targetDefinition = getTargetDefinition();
  const districtDefinition = getDistrictDefinition(targetDefinition.districtId);
  const targetLocationState = input.locations.find(
    (location) => location.locationId === targetDefinition.id,
  );
  const operationState = getCurrentOperation(input);
  const availability = evaluateOperationAvailability({
    operationTemplateId: localCollectionOperationTemplateDefinition.id,
    organizationId: ORGANIZATION_ID,
    targetLocationId: input.selectedTargetLocationId ?? targetDefinition.id,
    assignedCharacterIds: input.selectedCharacterId === null ? [] : [input.selectedCharacterId],
    operationTemplates: [localCollectionOperationTemplateDefinition],
    organizations: input.organizations,
    characters: input.characterStates,
    locationStates: input.locations,
    locationDefinitions: getAvailabilityLocationDefinitions(),
    businessStates: input.businesses,
  });
  const organization = createOrganizationView(organizationState);
  const characters = Object.freeze(
    input.characterStates.map((character) =>
      Object.freeze({
        id: character.characterId,
        name: character.displayName,
        competence: character.competence,
        loyalty: character.loyalty,
        capabilityTags: Object.freeze([...character.capabilityTags]),
        healthState: character.healthState,
        legalState: character.legalState,
        assignmentState: character.assignmentState,
        personalExposure: character.personalExposure,
        selected: character.characterId === input.selectedCharacterId,
      }),
    ),
  );
  const target = Object.freeze({
    id: targetDefinition.id,
    name: targetDefinition.name,
    kind: targetDefinition.kind,
    districtName: districtDefinition.name,
    districtId: districtDefinition.id,
    businessId: String(targetLocationState?.businessId ?? BUSINESS_ID),
    selected: input.selectedTargetLocationId === targetDefinition.id,
  });
  const operation = createOperationView(input.phase, operationState, availability);

  return Object.freeze({
    ...input,
    phaseLabel: labelPhase(input.phase),
    organization,
    characters,
    target,
    operation,
    availability,
    eventTimeline: createEventTimeline(input.events),
  });
}

function createOrganizationView(organization: OrganizationState): LocalCollectionOrganizationView {
  const reserved = Math.max(0, INITIAL_OPERATIONAL_CAPACITY - organization.operationalCapacity);
  const capacityLabel =
    reserved > 0
      ? `${organization.operationalCapacity} available, ${reserved} reserved`
      : `${organization.operationalCapacity} available`;

  return Object.freeze({
    id: organization.organizationId,
    name: organization.displayName,
    money: organization.money,
    operationalCapacity: organization.operationalCapacity,
    initialOperationalCapacity: INITIAL_OPERATIONAL_CAPACITY,
    reservedOperationalCapacity: reserved,
    capacityLabel,
  });
}

function createOperationView(
  phase: LocalCollectionPlaytestPhase,
  operation: OperationState | undefined,
  availability: OperationAvailabilityResult,
): LocalCollectionOperationView {
  const canEditSetup = phase === "setup";
  const status = operation?.status ?? "not-planned";
  const canPlan = phase === "setup" && availability.available;
  const canAdvanceOneTick = phase === "planned" || phase === "running";
  const canAdvanceToStart = phase === "planned";
  const canAdvanceToCompletion = phase === "running";
  const canClassify = phase === "resolved";
  const canApplyConsequences = phase === "classified";
  const canRunFullOperation = phase === "setup" && availability.available;

  return Object.freeze({
    id: localCollectionOperationTemplateDefinition.id,
    displayName: localCollectionOperationTemplateDefinition.displayName,
    category: localCollectionOperationTemplateDefinition.category,
    status,
    startCost: localCollectionOperationTemplateDefinition.startCost,
    durationMinutes: localCollectionOperationTemplateDefinition.durationMinutes,
    operationalCapacityCost: localCollectionOperationTemplateDefinition.operationalCapacityCost,
    grossRewardRange: createGrossRewardRange(),
    riskSummary: "Seeded 45/30/20/5 Local Collection outcome table.",
    plannedCompletionTick: operation?.plannedCompletionTick ?? null,
    canEditSetup,
    canPlan,
    canAdvanceOneTick,
    canAdvanceToStart,
    canAdvanceToCompletion,
    canClassify,
    canApplyConsequences,
    canRunFullOperation,
    disabledReason: canPlan ? null : createDisabledReason(phase, availability),
    availabilityReasons: availability.reasons,
    outcomePreview: createOutcomePreview(),
    consequenceSummary: null,
  });
}

function createOutcomePreview(): readonly LocalCollectionOutcomePreview[] {
  return Object.freeze(
    localCollectionOutcomeBands.map((band) => {
      const consequence = localCollectionConsequenceDefinition.find(
        (entry) => entry.category === band.category,
      );
      if (consequence === undefined) {
        throw new Error(`Missing consequence for ${band.category}.`);
      }

      return Object.freeze({
        category: band.category,
        label: labelOutcomeCategory(band.category),
        probabilityPercent: band.weight,
        grossReward: consequence.grossReward,
        exposureDelta: consequence.personalExposureDelta,
        healthConsequence: consequence.healthConsequence,
      });
    }),
  );
}

function createGrossRewardRange(): string {
  const rewards = localCollectionConsequenceDefinition.map((entry) => entry.grossReward);
  return `${Math.min(...rewards)}-${Math.max(...rewards)}`;
}

function getGrossRewardTransactionId(
  category: OperationOutcomeCategory,
): typeof GROSS_REWARD_TRANSACTION_ID | undefined {
  const consequence = localCollectionConsequenceDefinition.find(
    (entry) => entry.category === category,
  );
  if (consequence === undefined || consequence.grossReward === 0) {
    return undefined;
  }

  return GROSS_REWARD_TRANSACTION_ID;
}

function createDisabledReason(
  phase: LocalCollectionPlaytestPhase,
  availability: OperationAvailabilityResult,
): string | null {
  if (phase !== "setup") {
    return null;
  }

  if (availability.available) {
    return null;
  }

  return availability.reasons.length === 0
    ? "Select the required character and target."
    : availability.reasons.join(", ");
}

function createEventTimeline(
  events: readonly DomainEvent[],
): readonly LocalCollectionEventTimelineItem[] {
  return Object.freeze(
    events.map((event, index) =>
      Object.freeze({
        sequence: index + 1,
        type: event.type,
        summary: summarizeDomainEvent(event),
        event,
      }),
    ),
  );
}

function summarizeDomainEvent(event: DomainEvent): string {
  switch (event.type) {
    case DomainEventType.OperationPlanned:
      return `Operation planned: ${localCollectionOperationTemplateDefinition.displayName} at ${getTargetDefinition().name}`;
    case DomainEventType.CharacterAssignedToOperation:
      return `Mara Voss assigned: ${event.previousAssignmentState} -> ${event.currentAssignmentState}`;
    case DomainEventType.OrganizationOperationalCapacityReserved:
      return `Operational capacity reserved: ${event.previousOperationalCapacity} -> ${event.currentOperationalCapacity}`;
    case DomainEventType.OrganizationMoneyChanged:
      return event.reason === "operation-start-cost-paid"
        ? `Start cost paid: ${event.previousMoney} -> ${event.currentMoney} (${formatSigned(
            event.delta,
          )})`
        : `Gross reward paid: ${event.previousMoney} -> ${event.currentMoney} (${formatSigned(
            event.delta,
          )})`;
    case DomainEventType.OrganizationMoneyTransactionRecorded:
      return `Money transaction recorded: ${event.previousMoney} -> ${event.currentMoney} (${formatSigned(
        event.amount,
      )})`;
    case DomainEventType.OperationStarted:
      return `Operation started at tick ${event.transitionTick}`;
    case DomainEventType.OperationLifecycleCompleted:
      return `Operation completed at tick ${event.transitionTick}`;
    case DomainEventType.OperationOutcomeRolled:
      return `Outcome rolled: ${event.percentileRoll}`;
    case DomainEventType.OperationOutcomeClassified:
      return `Outcome classified: ${labelOutcomeCategory(event.category)}`;
    case DomainEventType.CharacterPersonalExposureChanged:
      return `Personal exposure changed: ${event.previousPersonalExposure} -> ${event.currentPersonalExposure} (${formatSigned(
        event.actualDelta,
      )})${event.clamped ? " clamped" : ""}`;
    case DomainEventType.CharacterHealthChanged:
      return `Health changed: ${event.previousHealthState} -> ${event.currentHealthState}`;
    case DomainEventType.CharacterAssignmentReleased:
      return `Mara Voss assignment released: ${event.previousAssignmentState} -> ${event.currentAssignmentState}`;
    case DomainEventType.OrganizationOperationalCapacityReleased:
      return `Operational capacity released: ${event.previousOperationalCapacity} -> ${event.currentOperationalCapacity}`;
    case DomainEventType.OperationConsequencesApplied:
      return `Consequences applied: ${labelOutcomeCategory(event.category)}`;
    case DomainEventType.SimulationResumed:
      return `Simulation resumed at tick ${event.tick}`;
    case DomainEventType.SimulationTickAdvanced:
      return `Simulation tick advanced: ${event.previousTick} -> ${event.currentTick}`;
  }
}

function appendEvents(
  existing: readonly DomainEvent[],
  nextEvents: readonly DomainEvent[],
): readonly DomainEvent[] {
  return Object.freeze([...existing, ...nextEvents]);
}

function deriveAdvanceTick(
  currentTick: SimulationTick,
  operation: OperationState,
  mode: "one-tick" | "to-start" | "to-completion",
): SimulationTick {
  if (mode === "to-completion") {
    return operation.plannedCompletionTick;
  }

  return parseSimulationTick(currentTick + 1);
}

function phaseFromOperationStatus(status: OperationState["status"]): LocalCollectionPlaytestPhase {
  if (status === OperationStatus.Planned) {
    return "planned";
  }

  if (status === OperationStatus.Running) {
    return "running";
  }

  return "resolved";
}

function getCurrentOperation(input: {
  readonly operations: readonly OperationState[];
}): OperationState | undefined {
  return input.operations[0];
}

function getTargetDefinition() {
  const targetId = localCollectionOperationTemplateDefinition.allowedTargetIds[0];
  const target = canonicalMvpCityDefinition.locations.find((location) => location.id === targetId);
  if (target === undefined) {
    throw new Error("Canonical Local Collection target is missing from the MVP city.");
  }

  return target;
}

function getDistrictDefinition(
  districtId: (typeof canonicalMvpCityDefinition.districts)[number]["id"],
) {
  const district = canonicalMvpCityDefinition.districts.find(
    (candidate) => candidate.id === districtId,
  );
  if (district === undefined) {
    throw new Error("Canonical Local Collection district is missing from the MVP city.");
  }

  return district;
}

function getAvailabilityLocationDefinitions() {
  return canonicalMvpCityDefinition.locations.map((location) => ({
    id: location.id,
    kind: location.kind,
  }));
}

function validateSetupInput(
  seed: number,
  initialExposure: number,
): LocalCollectionPlaytestError | null {
  return validateSeed(seed) ?? validateInitialExposure(initialExposure);
}

function validateSeed(seed: number): LocalCollectionPlaytestError | null {
  try {
    parseRandomSeed(seed);
  } catch (error) {
    return createError({
      code: "INVALID_SEED",
      message: "Seed must be a non-negative safe integer.",
      detail: error instanceof Error ? error.message : undefined,
    });
  }

  return null;
}

function createOptionalSetupInput(
  seed: number | undefined,
  initialExposure: number | undefined,
): CreateLocalCollectionPlaytestSessionInput {
  const input: { seed?: number; initialExposure?: number } = {};

  if (seed !== undefined) {
    input.seed = seed;
  }

  if (initialExposure !== undefined) {
    input.initialExposure = initialExposure;
  }

  return input;
}

function createError(input: {
  readonly code: string;
  readonly message: string;
  readonly detail?: string | undefined;
}): LocalCollectionPlaytestError {
  const error: { code: string; message: string; detail?: string } = {
    code: input.code,
    message: input.message,
  };

  if (input.detail !== undefined) {
    error.detail = input.detail;
  }

  return Object.freeze(error);
}

function validateInitialExposure(exposure: number): LocalCollectionPlaytestError | null {
  if (!Number.isSafeInteger(exposure) || exposure < 0 || exposure > 100) {
    return {
      code: "INVALID_INITIAL_EXPOSURE",
      message: "Initial exposure must be an integer from 0 to 100.",
    };
  }

  return null;
}

function invalidPhase(
  code: string,
  phase: LocalCollectionPlaytestPhase,
): LocalCollectionPlaytestError {
  return {
    code,
    message: `That action is not available during the ${labelPhase(phase)} phase.`,
  };
}

function fail(
  session: LocalCollectionPlaytestSession,
  error: LocalCollectionPlaytestError,
): LocalCollectionPlaytestActionResult {
  return Object.freeze({
    ok: false,
    session: createSession({ ...session, lastError: error }),
    error,
  });
}

function succeed(session: LocalCollectionPlaytestSession): LocalCollectionPlaytestActionResult {
  return Object.freeze({
    ok: true,
    session,
  });
}

function labelPhase(phase: LocalCollectionPlaytestPhase): string {
  switch (phase) {
    case "setup":
      return "Setup";
    case "planned":
      return "Planned";
    case "running":
      return "Running";
    case "resolved":
      return "Ready to resolve";
    case "classified":
      return "Outcome classified";
    case "settled":
      return "Settled";
  }
}

function labelOutcomeCategory(category: OperationOutcomeCategory): string {
  switch (category) {
    case "success":
      return "Success";
    case "partial-success":
      return "Partial success";
    case "failure":
      return "Failure";
    case "critical-failure":
      return "Critical failure";
  }
}

function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

function getOnly<TValue>(items: readonly TValue[], name: string): TValue {
  const item = items[0];
  if (item === undefined) {
    throw new Error(`Expected ${name} to exist.`);
  }

  return item;
}
