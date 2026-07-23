# Project Architecture

## Purpose

This document defines the top-level product and technical architecture of CrimeWorld.

It is the project's architecture constitution.
It explains:
- what the game is,
- which systems are authoritative,
- how the simulation is structured,
- how code boundaries should be drawn,
- how the MVP should be implemented,
- and how future expansion should remain compatible with the core design.

## Core identity

CrimeWorld is a grand-strategy crime sandbox built around cities.

The player starts as a single unknown character and builds a criminal organization through:
- planning,
- recruitment,
- operations,
- business control,
- pressure management,
- territorial influence,
- diplomacy,
- and long-term organizational growth.

The game is not centered on direct action combat.
It is centered on strategic decisions, systemic consequences, and emergent stories.

## Architectural priorities

The architecture should optimize for:
1. a testable simulation,
2. deterministic behavior where practical,
3. clear module boundaries,
4. data-driven content,
5. save compatibility,
6. controlled complexity,
7. and future replacement of the handcrafted MVP city with generated real-world cities.

The architecture should not optimize early for:
- global scale,
- distributed services,
- maximum entity count,
- or speculative future systems that are not needed by the MVP.

## Source of truth

The authoritative source of truth is the simulation state.

The UI is a projection of that state.
Mission text, event descriptions, and notifications explain simulation changes but do not replace them.

A mechanic belongs in the project when it can be expressed as:
- a command or decision,
- a state transition,
- a resolved outcome,
- and consequences visible to other systems.

## Product layers

CrimeWorld is designed as connected product layers.

### 1. City layer

Represents:
- districts,
- roads and connections,
- strategic locations,
- businesses,
- police presence,
- and local economic conditions.

The MVP uses a controlled city dataset.
Future city generation may use OpenStreetMap, but the simulation must not depend directly on raw OSM data.

### 2. Actor layer

Represents:
- the player character,
- named NPCs,
- recruits,
- lieutenants,
- rival leaders,
- officials,
- and other important intermediaries.

Only actors who create meaningful decisions require detailed persistent simulation.
Background population should remain aggregated or content-driven.

### 3. Organization layer

Represents:
- criminal organizations,
- membership,
- hierarchy,
- money,
- assets,
- influence,
- relationships,
- operational capacity,
- and internal stability.

The player controls an organization through people and plans, not as an omnipotent map cursor.

### 4. Operation layer

Operations are the primary active unit of gameplay.

They connect:
- opportunities,
- targets,
- assigned actors,
- costs,
- duration,
- risk,
- outcome resolution,
- and consequences.

All operation types should use one shared lifecycle and resolver wherever possible.

### 5. Reaction layer

Represents how the world responds through:
- exposure,
- district tension,
- investigations,
- law-enforcement action,
- rival responses,
- civilian reactions,
- and political or institutional pressure.

Reaction systems should create readable chains of consequences rather than arbitrary punishment.

### 6. History layer

Records meaningful events such as:
- major operations,
- rivalries,
- collapses,
- recoveries,
- leadership changes,
- and optional milestone achievements.

History is produced from simulation events.
It must not become a separate permanent-bonus progression tree.

## Technical architecture

The MVP should be implemented as a modular monolith.

This means:
- one deployable application,
- one authoritative simulation process,
- explicit internal modules,
- no microservices,
- and no network boundaries between core gameplay systems.

A modular monolith gives the project strong separation without the cost of distributed architecture.

## Technical layers

### 1. Content layer

Contains authored or generated definitions:
- city definitions,
- district templates,
- operation templates,
- business archetypes,
- NPC archetypes,
- event definitions,
- and balancing values.

Content definitions should be data-driven and validated at load time.
They should not contain mutable campaign state.

Current implementation:
- `packages/content` owns the neutral `CityDefinition` schema and the canonical MVP city definition.
- The canonical MVP city contains four districts, 29 strategic locations, and five routes.
- The content package owns immutable rival organization seed definitions for the current MVP rivals.
- The content package owns the minimal authored `OperationTemplateDefinition` schema for operation templates.
- The content package exports the canonical Local Collection operation template as `localCollectionOperationTemplateDefinition`, with id `operation-template:local_collection`, target `location:corner_store`, target kind `shop-or-service`, duration `60` minutes, start cost `20`, and operational capacity cost `1`.
- The content package owns the immutable canonical Local Collection outcome-band definition in `localCollectionOutcomeDefinition.ts`, with ordered category weights `success 45`, `partial-success 30`, `failure 20`, and `critical-failure 5`.
- The content package exports the canonical Local Collection consequence definition as `localCollectionConsequenceDefinition`, with gross rewards `80/40/0/0`, exposure deltas `4/10/14/25`, critical-failure health consequence `injured`, and one operational-capacity release for each category.
- The content package exports the canonical MVP city definition as `canonicalMvpCityDefinition`.
- City validation is structural and headless; it checks schema version, required collections, duplicate IDs, route validity, orphan locations, and district graph connectivity.
- The content package owns authored immutable definitions, not runtime operation instances or already-applied consequences. It may use branded ID parsers and shared pure types from `packages/domain`, but it must not own mutable campaign state. This dependency direction is allowed; `packages/domain` must not import `packages/content`.

### 2. Domain layer

Contains authoritative simulation entities and rules.

Primary domain modules:
- `City`
- `Districts`
- `LocationsAndBusinesses`
- `Characters`
- `Organizations`
- `Operations`
- `Economy`
- `PressureAndInvestigations`
- `Diplomacy`
- `RivalAI`
- `History`
- `Progression`

Domain code should not depend on UI frameworks, storage implementations, or external map formats.

Current implementation:
- `packages/domain` owns stable entity IDs, deterministic simulation time, seeded randomness, root `GameState`, command/result/event foundations, the ordered tick pipeline, invariant helpers, runtime city state, district property derivation, runtime character state, runtime organization state, runtime business state, derived character availability, operation availability, planning, lifecycle, seeded outcome resolution, typed Local Collection classification, bounded consequence application, applied-consequence records, the standalone E5-02A money-ledger foundation, semantic domain events, and event invariants.
- Runtime city state stores IDs and mutable shell values only. Authored city names, tags, location kinds, route endpoints, and baseline profiles remain content definitions.
- `LocationState` and `BusinessState` contain explicit nullable ownership references. `OrganizationState` does not store derived owned-location or owned-business collections.
- `CharacterState` stores assignment state, health, legal state, competence, loyalty, and personal exposure. Availability is derived and not cached.
- `OperationState` stores the minimal runtime operation instance schema. The domain package also owns pure operation availability and prerequisite evaluation with typed operation availability results and rejection reasons. The evaluator is synchronous, deterministic, accumulates failures, accepts only the structural authored fields needed for evaluation, and does not mutate state.
- The domain package now owns bounded deterministic operation planning through `PlanOperationCommand` and `planOperation(...)`. Planning accepts explicit runtime collections and narrow authored structural template/location inputs, validates through the existing availability evaluator, creates immutable planned operation state, reserves character assignment, reserves operational capacity, deducts the operation start cost, and emits semantic events.
- The domain package now owns bounded operation lifecycle transitions through `advanceOperationLifecycles(...)`. The function accepts an explicit current simulation tick and immutable operation collection, advances `planned -> running -> resolved` timing deterministically, preserves collection order, handles overdue planned operations in one evaluation, recreates changed operation states through the operation-state validation path, and emits lifecycle events.
- The domain package now owns generic seeded weighted outcome resolution through `resolveOperationOutcome(...)`. The resolver accepts one lifecycle-resolved operation, immutable `RandomState`, ordered weighted bands totaling exactly 100, and explicit modifier diagnostics. It uses the existing seeded PCG32 random service, advances and returns `RandomState`, emits `OperationOutcomeRolled`, and does not apply consequences.
- The domain package now owns typed runtime outcome categories and Local Collection outcome classification through `classifyOperationOutcome(...)`. The classifier validates supplied Local Collection bands, delegates RNG and weighted selection to the centralized E4-06 resolver, maps the selected band to `success`, `partial-success`, `failure`, or `critical-failure`, preserves resolver diagnostics, and emits `OperationOutcomeClassified` after the roll event.
- The domain package now owns bounded Local Collection consequence application through `applyLocalCollectionConsequences(...)`. Consequence application accepts caller-supplied authored consequence definitions, explicit runtime organization and character collections, a resolved operation, the actual classified outcome, and immutable applied-consequence records. It applies gross reward only during consequence application, clamps personal exposure to `0..100`, changes health only for `critical-failure` `healthy -> injured`, releases the assigned character to `idle`, restores exactly one operational-capacity point, appends one applied-consequence record, rejects duplicate application, and does not consume RNG.
- Consequence events include `OrganizationMoneyChanged`, `CharacterPersonalExposureChanged`, `CharacterHealthChanged`, `CharacterAssignmentReleased`, `OrganizationOperationalCapacityReleased`, and `OperationConsequencesApplied`. The gross-reward money event is emitted only when reward is greater than zero. Event invariants enforce requested versus actual exposure deltas, clamp semantics, injury only for critical failure, and category-consistent completion health consequence.
- Modifier diagnostics for base, competence, capability, district, and exposure are currently supplied explicitly to the resolver/classifier. No formula calculates them yet, and they do not alter probabilities.
- Planning, lifecycle, resolver, classification, and consequence application are not integrated with root `GameState` or the global command dispatcher. Application-layer orchestration currently exists only for the developer playtest; a general campaign service remains future work.
- `createPlayerOrganization` delegates to the base organization factory and creates the leader as the only initial member.
- Domain currently has no dependency on React, Konva, Tauri, filesystem APIs, browser APIs, application, presentation, infrastructure, or content packages.

### 3. Application layer

Coordinates use cases through commands and queries.

Examples of commands:
- recruit character,
- start operation,
- assign crew,
- cancel operation,
- acquire business,
- propose deal,
- lay low,
- advance simulation time.

Examples of queries:
- district overview,
- available operations,
- organization capacity,
- visible pressure state,
- known rival information,
- operation forecast,
- and event history.

The application layer validates access and orchestration.
Core outcome rules remain in the domain layer.

Current implementation:
- `packages/application` imports domain and content for the Local Collection developer playtest/session harness in `localCollectionPlaytest.ts`.
- The playtest composes canonical authored content with explicit runtime state, exposes application-only phases `setup`, `planned`, `running`, `resolved`, `classified`, and `settled`, and provides actions for selecting character/target, setting seed and initial exposure, planning, advancing time, rolling/classifying, applying consequences, running the full operation, and reset.
- The full-run action uses the same public application actions as manual step-by-step play.
- This harness is not a general campaign service, does not calculate authoritative outcomes or consequences itself, and does not introduce a backend, filesystem, network, database, save/load, or root campaign aggregate.

### 4. Presentation layer

Contains:
- map interaction,
- panels,
- overlays,
- notifications,
- tooltips,
- operation planning UI,
- and time controls.

The presentation layer may request projections and send commands.
It must not directly mutate domain state.

Current implementation:
- `packages/presentation/src/AppShell.tsx` renders the developer Local Collection playtest.
- It displays application read models, setup controls, seed presets, operation status, outcome previews, RNG diagnostics, consequence records, errors, and a timeline built from real domain events.
- React submits application actions only. It does not calculate authoritative availability, outcomes, rewards, exposure, health, assignment release, or capacity release.

### 5. Infrastructure layer

Contains replaceable technical concerns:
- save/load,
- content loading,
- logging,
- telemetry,
- random seed persistence,
- and future map import adapters.

Infrastructure implements interfaces owned by the inner layers.

### 6. Desktop shell

The desktop/browser shell hosts the React playtest. The current Local Collection playtest requires no Rust command backend; Tauri remains the desktop shell and future platform boundary for persistence and native integration.

## Runtime modules and ownership

### City and districts

Own:
- district state,
- location references,
- adjacency,
- local modifiers,
- tension,
- and district influence summaries.

Do not own organization treasury, NPC loyalty, or operation resolution.

### Characters

Own:
- identity,
- skills or capabilities,
- health and availability,
- loyalty,
- relationships,
- personal exposure,
- and assignment state.

A character cannot be assigned to incompatible simultaneous activities.

### Organizations

Own:
- membership,
- hierarchy,
- treasury,
- controlled assets,
- operational capacity,
- reputation,
- and organizational relationships.

### Operations

Own:
- operation instances,
- lifecycle state,
- assigned resources,
- timing,
- forecast data,
- resolution,
- and immediate generated consequences.

The operation resolver must be centralized and shared across player and AI operations.

### Economy

Own:
- income and expenses,
- business cash flow,
- operation costs,
- maintenance,
- and scheduled financial updates.

Money changes should be recorded as transactions or traceable events for debugging.

### Pressure and investigations

Own:
- organization exposure,
- personal exposure,
- district tension,
- investigation state,
- escalation thresholds,
- decay rules,
- and institutional reactions.

Long-term evidence and active investigations must not disappear merely because the player waits.

### Rival AI

Own:
- strategic priorities,
- candidate action generation,
- utility evaluation,
- action selection,
- and cooldown or capacity rules.

AI must use the same operation and consequence systems as the player.
It should not receive hidden rule-breaking actions unless explicitly documented as an MVP simplification.

### History

Own:
- durable major-event records,
- organization chronology,
- boss reign summaries,
- milestone records,
- and campaign report data.

## Core state model

The MVP campaign state should contain at minimum:
- campaign metadata and schema version,
- current simulation time,
- deterministic random state or seed data,
- city state,
- district states,
- location and business states,
- character states,
- organization states,
- relationship states,
- active operation states,
- economy state,
- pressure and investigation states,
- AI planning state where required,
- event queue,
- and history records.

Stable IDs should connect entities.
Runtime objects should not rely on direct serialized object references.

Current implementation note:
- The root `GameState` foundation exists, but EPIC 2 and EPIC 3 runtime state has not yet been attached to campaign creation or save/load.
- `CityState`, `DistrictState`, `LocationState`, `RouteState`, `CharacterState`, `OrganizationState`, and `BusinessState` exist as standalone domain types for the controlled city and organization foundation.

## Time and tick architecture

Time is continuous from the player's perspective but processed in deterministic simulation steps.

The player may:
- pause,
- resume,
- and change speed.

The simulation should advance through an explicit phase order.

Recommended tick phases:
1. accept validated player commands,
2. advance simulation clock,
3. update active operations,
4. resolve completed operations,
5. apply immediate outcome effects,
6. update economy and recurring costs when due,
7. update exposure, investigations, and district tension,
8. evaluate rival AI when due,
9. execute selected AI commands through normal systems,
10. update opportunities and event chains,
11. append history and notifications,
12. publish a stable read model for the UI.

The order must be documented and tested because changing it may change campaign outcomes.

## Determinism and randomness

Randomness should be seedable and reproducible in tests.

Random rolls should:
- originate from a controlled random service,
- be separated by purpose where practical,
- and record enough diagnostic information to explain operation outcomes during development.

Save/load must preserve the information needed to continue without changing future outcomes unexpectedly.

## Event architecture

Domain events communicate meaningful changes between modules.

Examples:
- `OperationStarted`
- `OperationResolved`
- `CharacterRecruited`
- `BusinessAcquired`
- `OrganizationExposureChanged`
- `InvestigationOpened`
- `DistrictTensionChanged`
- `RivalActionSelected`
- `MilestoneCompleted`
- `BossDied`

Events should contain facts that occurred.
Commands express intent and must remain separate from events.

The MVP may process events in-process and synchronously while preserving explicit event contracts.

## Operation lifecycle

All operation instances should follow a common lifecycle:

1. opportunity identified,
2. operation configured,
3. prerequisites validated,
4. people and resources reserved,
5. operation started,
6. time advanced,
7. outcome resolved,
8. effects emitted,
9. assigned resources released or changed,
10. reaction systems updated.

Operation templates should provide configurable rules.
They should not each implement a completely separate execution engine.

Current EPIC 4 specification status:
- E4-01 accepts **Local Collection** as the first operation and records the authoritative detailed specification in `BUILD_ROADMAP.md`.
- E4-02 adds minimal schemas: `packages/content` owns authored operation templates through `OperationTemplateDefinition`, and `packages/domain` owns runtime operation state through `OperationState`.
- E4-03 adds pure operation availability and prerequisite evaluation in `packages/domain`, with typed availability results and rejection reasons. Authored operation templates remain owned by `packages/content`; `packages/domain` accepts only the structural authored fields needed for evaluation and must not depend on `packages/content`.
- E4-04 adds bounded deterministic operation planning in `packages/domain`. `PlanOperationCommand` and `planOperation(...)` accept explicit runtime collections and narrow authored template/location inputs, reuse the E4-03 availability evaluator, reject duplicate `OperationId` values, create immutable planned operation state, reserve the assigned character, reserve operational capacity, deduct the start cost, and emit semantic planning events.
- E4-05 adds bounded deterministic operation lifecycle transitions in `packages/domain`. `advanceOperationLifecycles(...)` accepts the current tick and immutable operation collection, preserves collection order, advances `planned -> running -> resolved` timing, emits `OperationStarted` and `OperationLifecycleCompleted`, and treats `resolved` as ready for outcome resolution rather than consequence completion.
- E4-06 adds centralized seeded weighted outcome resolution in `packages/domain`. `resolveOperationOutcome(...)` validates lifecycle-resolved operation input, ordered opaque weighted bands, and explicit modifier diagnostics before consuming RNG, uses one `nextInt(randomState, 1, 100)` call per success, returns roll/range/band/RNG diagnostics, and emits `OperationOutcomeRolled`.
- E4-07 adds typed Local Collection outcome classification in `packages/domain` and the canonical immutable Local Collection outcome-band definition in `packages/content`. `classifyOperationOutcome(...)` delegates weighted selection to E4-06 and returns one of `success`, `partial-success`, `failure`, or `critical-failure` with diagnostics and `OperationOutcomeClassified`.
- E4-08 adds bounded Local Collection consequence application in `packages/domain` and the canonical immutable Local Collection consequence definition in `packages/content`. `applyLocalCollectionConsequences(...)` applies the accepted reward, exposure, critical injury, assignment release, capacity release, and applied-record updates without consuming RNG or importing content into domain.
- E4-09 adds deterministic repository-level integration coverage at `tests/integration/localCollectionVerticalSlice.integration.test.ts`, composing availability, planning, lifecycle, seeded classification, and consequence application.
- E4-10 adds an application-owned Local Collection developer playtest in `packages/application/src/localCollectionPlaytest.ts` and renders it through `packages/presentation/src/AppShell.tsx`.
- Accepted consequence values are `success +80 money/+4 exposure/no injury`, `partial-success +40/+10/no injury`, `failure 0/+14/no injury`, and `critical-failure 0/+25/healthy -> injured`. Fixed deterministic seeds are `32 -> success roll 1`, `153 -> partial-success roll 46`, `20 -> failure roll 76`, and `64 -> critical-failure roll 96`.
- Planning, lifecycle, resolver, classification, and consequence application are not integrated with root `GameState` or the global command dispatcher. The root `GameState` still contains only the current domain-kernel fields and is not the complete campaign aggregate.
- No campaign creation, save/load, recurring economy execution, pressure system, recruitment system, rival AI, reusable operation catalogue, or final player-facing UI exists yet.
- E5-02B migrates Local Collection planning start cost and non-zero gross rewards to the standalone money ledger. Failure and critical-failure outcomes create no zero-value reward transaction, and accepted EPIC 4 final money outcomes are preserved.
- The accepted money architecture keeps `OrganizationState.money` as the authoritative current organization balance while adding a durable append-only transaction ledger. E5-02A introduces `recordMoneyTransaction(...)` for successful money changes to update the balance, append exactly one ledger entry, and emit exactly one semantic money event as one atomic domain result.
- Future transaction entries, sources, categories, validation, balance arithmetic, typed failures, and semantic money events belong to `packages/domain`. Authored upkeep, recurring-income values, business tuning, and cadence definitions belong to `packages/content` where appropriate. Application orchestration may combine content with runtime state and invoke domain APIs, but must not calculate authoritative balances. Presentation may display financial projections but must not own money rules.
- EPIC 4 updates `CharacterState.personalExposure` during Local Collection consequence application, but organization-wide exposure, district tension changes, police pressure, investigations, evidence, decay, and law-enforcement reactions remain EPIC 6 scope unless later accepted scope changes the roadmap.

## Save architecture

The MVP should use versioned snapshot saves.

A save should include:
- complete authoritative campaign state,
- schema version,
- content version or compatibility identifier,
- simulation time,
- random state,
- and integrity metadata where practical.

Requirements:
- save and load must produce equivalent simulation state,
- IDs must remain stable,
- active operations must survive reload,
- future schema migrations must be possible,
- and UI-only state should be stored separately or omitted.

Full event sourcing is not required for MVP.

## City data boundary

The simulation should consume a neutral `CityDefinition` rather than raw OpenStreetMap entities.

A city definition should describe:
- districts,
- locations,
- location archetypes,
- district membership,
- connections,
- and strategic tags.

For MVP, this data is handcrafted.
Later, an OSM adapter may generate the same format.

This prevents map ingestion technology from controlling domain architecture.

Current implementation:
- The neutral city format is implemented as `CityDefinition` in `packages/content`.
- District definitions include strategic baseline profiles and tags, not UI geometry.
- Location and route definitions use stable IDs and district references without renderer-specific coordinates or Konva/Leaflet objects.
- Future OSM work should target this neutral schema or an explicitly versioned successor.

## Read models

The UI should consume read models designed for player decisions.

Examples:
- `CityMapView`
- `DistrictSummaryView`
- `OrganizationOverviewView`
- `OperationPlanningView`
- `OperationResultView`
- `PressureOverviewView`
- `CharacterRosterView`
- `BusinessPortfolioView`
- `KnownRivalView`

Hidden simulation values should not automatically appear in read models.
Information access depends on player knowledge and intelligence.

## Testing strategy

### Unit tests

Test isolated rules such as:
- operation prerequisite validation,
- outcome modifiers,
- money transfers,
- capacity reservation,
- pressure thresholds,
- and relationship state derivation.

### Integration tests

Test complete flows such as:
- starting and resolving an operation,
- operation consequences opening an investigation,
- acquiring a business and receiving income,
- rival retaliation after a player action,
- and collapse followed by recovery.

### Deterministic simulation tests

Run seeded campaigns for many ticks and assert invariants:
- no negative reserved capacity,
- no character in conflicting assignments,
- no missing entity references,
- no invalid operation lifecycle transitions,
- and no impossible treasury mutations.

### Save/load tests

Verify that:
- the loaded state equals the saved state,
- active processes continue correctly,
- and deterministic continuation remains stable.

## Debugging and telemetry

Development builds should expose:
- current tick and phase,
- active operations,
- recent domain events,
- operation calculations,
- pressure changes,
- AI candidate scores,
- economy transactions,
- and validation failures.

MVP playtest telemetry should focus on:
- time to first operation,
- operation choice distribution,
- failure and partial-success rates,
- time to first stable income,
- pressure escalation pace,
- recovery rate after setbacks,
- and reasons players restart or stop.

## MVP implementation sequence

### Phase 1: simulation foundation

- application shell,
- campaign state,
- deterministic clock,
- command/query boundary,
- content loader,
- and automated test setup.

### Phase 2: controlled city and core entities

- handcrafted city definition,
- four districts,
- strategic locations,
- player character,
- organizations,
- and basic persistence of IDs and state.

### Phase 3: first vertical slice

Implement one complete operation from planning through consequence:
- select target,
- assign actor,
- reserve cost,
- advance time,
- resolve outcome,
- change money,
- create exposure,
- show result.

### Phase 4: economy, recruitment, and capacity

- recurring income,
- expenses,
- business ownership,
- recruitment,
- character availability,
- and operational capacity.

### Phase 5: pressure and rival loop

- district tension,
- organization exposure,
- investigations,
- law-enforcement reactions,
- two rival organizations,
- and utility-based rival decisions.

### Phase 6: content-complete MVP

- all approved MVP operation templates,
- businesses,
- named actors,
- reactions,
- limited diplomacy,
- save/load,
- and required UI read models.

### Phase 7: balancing and validation

- playtest telemetry,
- seeded simulation runs,
- pacing adjustments,
- economy tuning,
- pressure tuning,
- and recovery validation.

## Design rules

### Rule 1: Prefer systemic interactions over isolated features

Every major feature should connect to existing state and consequences.

### Rule 2: Every major system must create decisions

A system that does not alter meaningful player choices is probably unnecessary.

### Rule 3: Every system should be both cause and consequence

Systems should change the world and be changed by it.

### Rule 4: Prefer abstraction over uncontrolled simulation

Simulate enough to create believable outcomes, not every possible detail.

### Rule 5: One rule path for player and AI

Player and rival actions should use the same domain systems wherever possible.

### Rule 6: Preserve explainability

The game must be able to explain why important outcomes occurred.

### Rule 7: Keep the project buildable

A future feature should be simplified or postponed when it threatens the core loop, implementation clarity, or balanceability.

## Explicitly rejected MVP architecture

The MVP should not use:
- microservices,
- multiplayer networking,
- full event sourcing,
- an ECS without a demonstrated need,
- a general scripting language for all gameplay,
- direct domain dependency on OSM schemas,
- separate simulation processes for districts,
- or detailed simulation of unnamed citizens.

## Relationship to other documents

- `PLANNING_ROADMAP.md` defines the current planning phase and next tasks.
- `GDD_INDEX.md` defines the documentation reading paths.
- `14_MVP_SCOPE.md` defines the validated MVP boundary.
- `15_MVP_GAME_LOOP.md` defines the playable MVP loop.
- `16_MVP_CONTENT_LIST.md` defines the content budget.
- `17_MVP_TECH_PLAN.md` defines the MVP implementation plan in greater detail.
- `18_MVP_BALANCING.md` defines tuning hypotheses and playtest targets.
- `19_WORLD_DEPENDENCY_GRAPH.md` describes the broader system dependency structure.
- `24_CITY_ECONOMY_MODEL.md` through `33_ORGANIZATION_HISTORY_AND_LEGACY.md` define the deeper long-term models from which MVP subsets are selected.

## Current architecture status

EPIC 0, EPIC 1, EPIC 2, EPIC 3, and EPIC 4 are complete. E4-01 is complete as a documentation/specification task, E4-02 is complete as a schema-only implementation task, E4-03 is complete as an availability/prerequisite evaluation task, E4-04 is complete as a bounded domain planning and reservation implementation, E4-05 is complete as operation lifecycle transitions, E4-06 is complete as centralized seeded weighted resolution, E4-07 is complete as typed Local Collection outcome classification, E4-08 is complete as bounded Local Collection consequence application, E4-09 is complete as deterministic vertical-slice integration coverage, and E4-10 is complete as the developer Local Collection playtest.

Previous documentation synchronization baseline after E4-05 through E4-07:

```text
718307042f58bf86528a5235a758d558f75f260d
```

Accepted gameplay implementation baseline through E4-08, E4-09, and E4-10:

```text
9769a6ba3a9ba06559a3c81bc6536b054e519ab1
```

The repository now contains the selected TypeScript / React / Tauri / Vite scaffold, the headless deterministic domain foundation, the controlled city shell, the minimal characters-and-organizations foundation, and the first end-to-end Local Collection vertical slice.

The architecture review after EPIC 4 found the package boundaries intact:
- domain remains pure and renderer/platform independent,
- content owns immutable authored city data, rival organization seeds, operation template, outcome bands, consequence definition, and structural validation,
- application owns the developer playtest/session orchestration and imports both domain and content,
- presentation owns the React playtest shell and displays application read models,
- infrastructure remains a thin scaffold,
- Konva remains confined to presentation dependencies,
- and no recruitment gameplay, recurring economy simulation, ownership transfer, pressure system, rival AI, save/load, root campaign aggregate, or final player-facing UI was added.

The E4-03 availability evaluator, E4-04 planning function, E4-05 lifecycle function, E4-06 resolver, E4-07 classifier, and E4-08 consequence application preserve the domain/content boundary: authored operation templates, canonical Local Collection outcome bands, and canonical consequence definitions remain in `packages/content`, while `packages/domain` owns pure prerequisite, planning, lifecycle, seeded resolution, classification, and consequence rules over explicit runtime state and structural authored inputs. The E4-10 application harness is an external composition layer, not a domain dependency.

The next architecture-sensitive E5-02 increment requires PM review and acceptance. It must use the accepted E5-01/E5-02A/E5-02B contract, preserve the accepted Local Collection outcomes, and avoid claiming that a complete economy, recurring economy execution, save/load, pressure system, recruitment system, rival AI, or full campaign service already exists.

## Technical debt and postponed work

- Campaign creation does not yet validate the canonical city and attach runtime `CityState` to root `GameState`.
- Campaign creation does not yet attach runtime character, organization, business, or rival seed state to root `GameState`.
- City-state invariants are not yet integrated with root invariant validation because city state is not part of campaign state.
- Cross-model organization lifecycle checks currently exist as tests only; there is no campaign-level invariant validator yet.
- The city debug report is a developer inspection formatter, not a stable application read model.
- Save/load, content compatibility checks, and migration policy still need concrete implementation when campaign state becomes persistent.

## Open Questions

- What is the final player-facing game-time scale for normal and accelerated play?
- Which persistence format best supports readable development saves and future migrations?
- Which read models are required for the first vertical slice?
- How much AI state must be persisted versus recomputed after load?

## Future Extensions

- OpenStreetMap import adapters producing neutral city definitions.
- Multi-city campaign coordination.
- Full succession and dynasty support.
- More advanced institutional and political simulation.
- Modding and user-authored content pipelines.
- Background simulation quality levels for large worlds.

## Final principle

CrimeWorld should be built as a deterministic, readable living simulation first and as a game interface second.

The interface exists to let the player understand the world, make plans, accept risk, and create a history through the consequences of those decisions.
