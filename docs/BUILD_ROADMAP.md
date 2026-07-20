# Build Roadmap — CrimeWorld

> **Status:** EPIC 0, EPIC 1, EPIC 2, and EPIC 3 complete; EPIC 4 specification and prerequisite evaluation work has started, but no EPIC 4 gameplay execution exists yet.
> **Active branch:** `main`  
> **Workflow:** project owner decides, ChatGPT acts as PM / Technical Lead, Codex implements, ChatGPT reviews every pushed task.  
> **Current phase:** First Operation Slice availability milestone complete; next accepted scope implements planning and crew assignment.

---

## 1. Purpose

This roadmap converts the CrimeWorld design bible into an implementation sequence that can be executed safely with Codex.

It is not a feature wishlist.
It is the authoritative build order for reaching a playable MVP without prematurely implementing the full long-term simulation.

The roadmap should be updated after accepted implementation batches, not after every minor code change.

---

## 2. Role legend

| Symbol | Role | Responsibility |
|---|---|---|
| `[OWNER]` | Project owner | Product decisions, priorities, manual playtests, final UX acceptance |
| `[PM]` | ChatGPT PM / Technical Lead | Repository analysis, scope definition, architecture decisions, acceptance criteria, Codex prompts, implementation review |
| `[CODEX]` | Codex | Code and repository implementation within the accepted scope |
| `[BOTH]` | PM specification followed by Codex implementation | Tasks requiring design or architecture acceptance before coding |
| `[MANUAL]` | Project owner | Local setup, platform-specific verification, subjective gameplay evaluation |

---

## 3. Mandatory workflow

### Before every implementation task

1. ChatGPT checks the current `main` branch and relevant source and documentation.
2. ChatGPT explains the proposed scope, rationale, risks, and acceptance criteria.
3. The project owner accepts or changes the scope.
4. Only after acceptance does ChatGPT create an English Codex prompt ready to paste.

### Every Codex prompt must require

- work only on the accepted scope,
- no unrelated refactors,
- preserve documented architecture boundaries,
- add or update tests where relevant,
- run the repository test command,
- run the repository build command,
- report test and build results,
- create a focused commit,
- push to `main`.

Until the stack is selected in EPIC 0, command names remain unresolved.
After EPIC 0, `CONTEXT.md` and this roadmap must record the exact commands.

### After every Codex push

1. ChatGPT reads the pushed commit and changed files.
2. ChatGPT reviews implementation against the accepted scope.
3. ChatGPT classifies the result:
   - **Approved**,
   - **Approved with follow-up**,
   - **Changes required**.
4. The next task is not started until blocking review findings are resolved.
5. Documentation is updated when a completed batch changes architecture, behavior, scope, or project status.

---

## 4. Non-negotiable implementation principles

- Build a **headless, deterministic simulation first**.
- Use a **modular monolith** for the MVP.
- Keep domain logic independent from UI and platform APIs.
- UI reads projections of simulation state; it is not the source of truth.
- Operations are the atomic player actions.
- Every system must create meaningful player decisions.
- Prefer bounded abstractions over detailed simulation of irrelevant entities.
- Use stable IDs and serializable state from the beginning.
- Randomness must be seedable and testable.
- Content definitions must be data-driven where practical.
- Do not make OpenStreetMap a dependency of the first playable build.
- Do not implement multi-city, dynasty, global politics, or full legacy systems during MVP construction.

---

## 5. Current project status

### Completed design foundation

- Vision and core pillars: complete.
- Core simulation documentation: complete.
- MVP scope, game loop, content list, technical plan, and balancing baseline: validated.
- Component models for city, districts, organizations, operations, pressure, player, diplomacy, progression, endgame, and history: complete.
- Project architecture: aligned with the MVP technical plan.

### Implementation status

```text
Design Bible                 ██████████ 100%
MVP Definition               ██████████ 100%
Technical Stack Decision     ██████████ 100%
Repository Foundation        ██████████ 100%
Headless Simulation          ██████████ 100%
Controlled City Shell        ██████████ 100%
Characters & Organizations   ██████████ 100%
First Operation Slice        ░░░░░░░░░░   0% gameplay implemented; E4-01 specification, E4-02 schemas, and E4-03 availability evaluation complete
Economy & Recruitment        ░░░░░░░░░░   0%
Pressure & Investigations    ░░░░░░░░░░   0%
Rival AI                     ░░░░░░░░░░   0%
Playable UI                  ░░░░░░░░░░   0%
Save / Load                  ░░░░░░░░░░   0%
MVP Content & Balance        ░░░░░░░░░░   0%
```

---

# EPIC 0 — Technology Decision and Repository Foundation

## Goal

Select a buildable technology stack and establish a repository that Codex can modify, test, build, and validate consistently.

This epic is a hard gate. No gameplay implementation should begin before it is complete.

| ID | Task | Who | Status |
|---|---|---|---|
| E0-01 | Compare suitable stacks against CrimeWorld requirements | `[PM]` | Done |
| E0-02 | Owner selects the implementation stack | `[OWNER]` | Done |
| E0-03 | Record the decision in `docs/TECH_STACK.md` | `[PM]` | Done |
| E0-04 | Scaffold the project and package structure | `[CODEX]` | Done |
| E0-05 | Configure formatter, linter, tests, and production build | `[CODEX]` | Done |
| E0-06 | Add CI for tests and build on pushes / pull requests if desired | `[CODEX]` | Done |
| E0-07 | Add deterministic test seed support | `[CODEX]` | Done |
| E0-08 | Add repository-level developer instructions if required by the selected tooling | `[BOTH]` | Done |
| E0-09 | Update `CONTEXT.md` with exact commands and source structure | `[PM]` | Done |

### Stack evaluation criteria

The selected stack must support:

- desktop-first delivery,
- a UI-heavy strategic map and management interface,
- deterministic headless domain tests,
- local save files,
- future real-map rendering or OSM-derived city definitions,
- data-driven content,
- good Codex ergonomics,
- practical solo-development iteration.

### Acceptance criteria

- Fresh clone can be installed with one documented command.
- Tests can be run with one documented command.
- Production build can be created with one documented command.
- A minimal application launches locally.
- Domain tests run without launching the UI.
- `CONTEXT.md` contains exact commands and directories.

EPIC 0 is complete. The repository uses Node.js `24.15.0`, GitHub Actions CI runs on pushes and pull requests targeting `main`, and deterministic test seed infrastructure is available through `CRIMEWORLD_TEST_SEED`.

---

# EPIC 1 — Domain Kernel and Deterministic Simulation Clock

## Goal

Create the headless foundation that all later systems use.

| ID | Task | Who | Status |
|---|---|---|---|
| E1-01 | Define branded IDs / stable entity identifiers | `[CODEX]` | Done |
| E1-02 | Define simulation time, tick, pause, and speed model | `[BOTH]` | Done |
| E1-03 | Implement seeded random service behind an interface | `[CODEX]` | Done |
| E1-04 | Define root `GameState` and version metadata | `[BOTH]` | Done |
| E1-05 | Implement command dispatch and domain result pattern | `[CODEX]` | Done |
| E1-06 | Implement ordered tick pipeline skeleton | `[CODEX]` | Done |
| E1-07 | Implement domain event collection | `[CODEX]` | Done |
| E1-08 | Add deterministic replay tests for identical seed and commands | `[CODEX]` | Done |
| E1-09 | Add invariant validation helpers for tests and debug builds | `[CODEX]` | Done |

### Acceptance criteria

- The same initial state, seed, and commands always produce the same result.
- Tick phases execute in an explicit documented order.
- Domain code does not import UI, filesystem, network, or platform APIs.
- Invalid commands return explicit failures rather than corrupting state.

EPIC 1 is complete. The domain kernel now includes branded stable entity identifiers, deterministic simulation minute and tick state, pause/resume and speed state, a seeded PCG32 random service with immutable serializable `RandomState`, root versioned `GameState`, command dispatch with explicit `DomainResult` success/failure, an ordered single-tick pipeline, deterministic domain event collection, deterministic replay tests, and invariant validation helpers.

Accepted single-tick order:

1. `BeforeTick`
2. advance the clock exactly once
3. `AfterClockAdvance`
4. systems placeholder
5. `AfterSystems`

Current command behavior:

- `ResumeSimulationCommand` resumes a paused simulation.
- Resuming an already running simulation is a successful no-op.
- `AdvanceSimulationTickCommand` advances exactly one tick when running.
- Advancing while paused returns `SIMULATION_PAUSED`.

Command dispatch returns `DomainResult<DomainExecution>`, where `DomainExecution` contains the resulting `gameState` and ordered domain events.

---

# EPIC 2 — Controlled City Shell

## Goal

Represent one handcrafted MVP city with four strategically distinct districts and a limited set of locations.

| ID | Task | Who | Status |
|---|---|---|---|
| E2-01 | Define `CityDefinition`, district, route, and location content schemas | `[BOTH]` | Done |
| E2-02 | Define runtime city and district state | `[CODEX]` | Done |
| E2-03 | Create the four MVP district definitions | `[BOTH]` | Done |
| E2-04 | Create 20–30 strategic MVP locations | `[BOTH]` | Done |
| E2-05A | Implement district adjacency derivation | `[CODEX]` | Done |
| E2-05B | Implement route and city-definition validation | `[CODEX]` | Done |
| E2-06 | Implement district properties used by operations and pressure | `[CODEX]` | Done |
| E2-07 | Add city-definition validation tests | `[CODEX]` | Done |
| E2-08 | Add a headless city-state inspection / debug output | `[CODEX]` | Done |

### Completion criteria

- The canonical controlled city is represented as data and can be validated headlessly.
- Runtime city state can be created from the authored city definition shape.
- Districts differ in opportunity, risk, economy, and rival presence.
- No UI-specific coordinates are required by domain rules.
- Future OSM import can produce the same neutral `CityDefinition` format.

EPIC 2 is complete as a controlled city shell. The content package owns immutable authored city definitions and the canonical MVP city. The domain package owns ID-only runtime city state and derived district properties. Validation and debug reporting are headless and deterministic. Campaign creation from the canonical city remains future work.

### EPIC 2 follow-up notes

- Campaign creation still needs an application-level use case that validates `canonicalMvpCityDefinition` and creates runtime city state when the operation slice or save/load work requires it.
- City validation currently reports structural content errors; runtime invariants that compare `CityState` against an authored definition should be added when city state becomes part of root `GameState`.
- The debug report is a developer formatter, not a UI read model. Do not treat it as the future map or district overview API.

---

# EPIC 3 — Characters & Organizations Foundation

## Goal

Create the minimal runtime foundation for characters, organizations, rival organization seeds, ownership references, and basic capacity values.

| ID | Task | Who | Status |
|---|---|---|---|
| E3-01 | Define MVP character state and traits | `[BOTH]` | Done |
| E3-02 | Define organization state, leader, members, money, and capacity | `[BOTH]` | Done |
| E3-03 | Implement player organization creation | `[CODEX]` | Done |
| E3-04 | Implement two rival organization seeds | `[CODEX]` | Done |
| E3-05 | Implement location and business ownership references | `[CODEX]` | Done |
| E3-06 | Implement crew availability and assignment rules | `[CODEX]` | Done |
| E3-07 | Implement loyalty and competence as minimal MVP values | `[CODEX]` | Done |
| E3-08 | Add organization invariant and lifecycle tests | `[CODEX]` | Done |

### Acceptance criteria

- `CharacterState` represents the minimal MVP character runtime fields, including capability tags, health, legal state, assignment state, competence, loyalty, and personal exposure.
- `OrganizationState` represents one leader, ordered members, money, and operational capacity; player organization creation starts with the leader as the only member.
- `BusinessState` and `LocationState` expose explicit nullable ownership references without derived organization asset collections.
- Character availability is derived from health, legal state, and assignment state rather than stored.
- The content package provides two immutable rival organization seeds.
- Cross-model tests verify current references without implementing campaign creation, recruitment, ownership transfer, character removal, operation lifecycle behavior, or a global invariant engine.

EPIC 3 is complete as the Characters & Organizations Foundation. The domain package owns runtime `CharacterState`, `OrganizationState`, `BusinessState`, city ownership references, player organization creation, and derived character availability. The content package owns immutable rival organization seeds. Lifecycle tests verify the current cross-model relationships without introducing campaign creation, operation gameplay, recruitment, economy simulation, ownership transfer, character removal, or a global invariant engine.

---

# EPIC 4 — First End-to-End Operation Vertical Slice

## Goal

Prove the central loop with one complete operation before implementing a catalogue of actions.

Recommended first slice: a small income operation against a local target, selected from the map and delegated to an available character.

| ID | Task | Who | Status |
|---|---|---|---|
| E4-01 | Finalize the first operation specification and outcome table | `[PM]` | Done |
| E4-02 | Define operation template and runtime instance schemas | `[BOTH]` | Done |
| E4-03 | Implement operation availability and prerequisite evaluation | `[CODEX]` | Done |
| E4-04 | Implement planning and crew assignment command | `[CODEX]` | Pending |
| E4-05 | Implement operation lifecycle: planned → active → resolved | `[CODEX]` | Pending |
| E4-06 | Implement centralized outcome resolver with seeded randomness | `[CODEX]` | Pending |
| E4-07 | Implement success, partial success, failure, and critical failure | `[CODEX]` | Pending |
| E4-08 | Apply money, exposure, injury, and event consequences | `[CODEX]` | Pending |
| E4-09 | Add full vertical-slice integration tests | `[CODEX]` | Pending |
| E4-10 | Add minimal developer UI or debug harness to run the slice | `[CODEX]` | Pending |

### Acceptance criteria

- The player can identify an opportunity, plan an operation, assign a character, advance time, and receive a result.
- Outcome probabilities are explainable from state and modifiers.
- Partial success is materially different from both success and failure.
- Consequences persist in `GameState`.
- The entire loop is covered by deterministic tests.

### Current EPIC 4 implementation status

E4-03 is complete. Minimal operation schemas now exist: `packages/domain` owns immutable runtime `OperationState`, and `packages/content` owns immutable authored `OperationTemplateDefinition`. `packages/domain` also owns deterministic, pure operation availability and prerequisite evaluation.

The availability evaluator returns typed rejection reasons rather than only a boolean, accumulates multiple independent failures deterministically, reuses existing derived character availability, and enforces the accepted Local Collection rule that exactly one character is assigned. It evaluates money, operational capacity, organization membership, character availability, target validity, target restrictions, and ownership prerequisites without mutating state.

No EPIC 4 gameplay execution exists yet. There are still no operation planning commands, lifecycle execution, resolver, forecasts, money or exposure consequences, assignment locking, `GameState` integration, campaign creation, or UI for operations.

### E4-01 accepted first operation specification

This subsection is the authoritative detailed specification for the first EPIC 4 operation. It records accepted design scope only. E4-01 does not implement operation schemas, runtime state, commands, lifecycle code, resolver code, campaign creation, UI, or production tests.

The accepted first operation is **Local Collection**: a small one-off income operation against a neutral local service location. It exists to prove the first operation vertical slice without introducing recurring income, business control, recruitment, investigations, rival AI, or the complete economy system.

#### Operation identity

| Field | Accepted value |
|---|---|
| Name | `Local Collection` |
| Category | one-off income operation |
| Canonical first target | `location:corner_store` |
| Target reference type | `LocationId` |
| Target district | Starting Residential District |
| Required assigned characters | exactly 1 |
| Start cost | 20 organization money |
| Duration | 60 simulation minutes |
| Operational capacity cost | 1 |
| Main reward | one-time organization money change |
| Main risks | personal exposure and injury |
| Outcomes | `success`, `partial-success`, `failure`, `critical-failure` |

This operation must not create recurring income, business ownership, location ownership, territory control, rival relationship changes, investigations, arrests, imprisonment, death, or new recruits.

#### Target requirements

Future implementation must validate that the target:

- exists in the active authored `CityDefinition`,
- has corresponding runtime location state,
- has authored kind `shop-or-service`,
- is not owned by any organization,
- is not connected to a business owned by the acting organization,
- is currently eligible for this operation.

For the first vertical slice, the authored template may explicitly allow only `location:corner_store`. Runtime operation state must still reference the target through `LocationId`, not through a special hardcoded target enum.

#### Character requirements

The assigned character must:

- belong to the acting organization,
- be available according to the existing derived availability rule,
- have `healthState: "healthy"`,
- have `legalState: "free"`,
- have `assignmentState: "idle"`.

Capability tags are modifiers, not hard prerequisites. Accepted positive capability modifiers are `streetwise` and `social`. Other existing capability tags are neutral for this first operation. The first starting operation must not become impossible merely because the starting character lacks one specific capability tag.

#### Organization requirements

The acting organization must:

- exist,
- contain the assigned character as a member,
- have at least 20 money,
- have at least one free operational capacity slot,
- not already use the same character in another incompatible assignment.

#### Outcome baseline

For a character with competence 50, no positive capability modifier, neutral district conditions, and neutral exposure conditions, the initial vertical-slice outcome distribution is:

| Outcome | Baseline probability |
|---|---:|
| Success | 45% |
| Partial success | 30% |
| Failure | 20% |
| Critical failure | 5% |

These are initial vertical-slice tuning values, not final game-wide balance values.

The future centralized resolver should conceptually evaluate:

- base outcome distribution or base score,
- competence modifier,
- capability modifier,
- district modifier,
- personal exposure modifier,
- seeded deterministic random roll.

E4-01 does not finalize a generic mathematical framework. Later E4 implementation should specify only what is required to make the first resolver deterministic, testable, explainable, and extensible without destructive migration.

#### Outcome table

| Outcome | Gross reward | Net money result after start cost | Personal exposure | Health consequence |
|---|---:|---:|---:|---|
| Success | +80 | +60 | +4 | none |
| Partial success | +40 | +20 | +10 | none |
| Failure | 0 | -20 | +14 | none |
| Critical failure | 0 | -20 | +25 | `healthy -> injured` |

Additional rules:

- Start cost is paid exactly once.
- Gross reward is applied only during resolution.
- Personal exposure remains clamped to the existing valid `0-100` range.
- This operation cannot kill a character.
- This operation cannot move a character to `critical`.
- This operation cannot detain or imprison a character.
- Partial success must remain materially different from both success and failure.
- Critical failure must be serious but recoverable.

#### Forecast and explainability requirements

The future forecast or read model must be able to present:

- operation name,
- target,
- assigned character,
- cost,
- duration,
- operational capacity requirement,
- expected gross reward range: `0-80`,
- estimated risk category,
- known positive and negative modifiers,
- visible possible consequences: loss of the start cost, personal exposure increase, possible injury.

Exact hidden random rolls do not need to be shown. The player or developer must be able to understand which known factors influenced the estimate.

The future resolution result should retain enough diagnostic information to explain:

- base contribution,
- competence contribution,
- capability contribution,
- district contribution,
- exposure contribution,
- random roll,
- final outcome band.

Debug-only presentation text does not need to be persisted in authoritative state.

#### Package ownership

`packages/content` owns authored immutable operation template data, eventually including template ID, display metadata, allowed target criteria or explicit target IDs, cost, duration, operational capacity requirement, base outcome table, and authored modifier configuration.

It must not own mutable operation instances, assigned characters, runtime target state, current lifecycle state, random state, actual outcome, or applied rewards.

`packages/domain` owns authoritative operation rules and runtime state, eventually including stable operation IDs, operation instances, lifecycle state, actor and target references, reservations and assignments, timing, prerequisite rules that are independent from application orchestration, centralized outcome resolution, immediate consequences, and operation domain events.

The resolver must ultimately be reusable by both player and rival AI operations. The domain package must not depend on `packages/content`, UI frameworks, filesystem APIs, browser APIs, Tauri, or infrastructure implementations.

`packages/application` owns orchestration, eventually including locating the authored template, combining authored definition data with runtime state, locating the organization, target, and assigned character, invoking domain validation and commands, preparing forecasts/read models, and coordinating campaign creation when introduced.

The application layer must not independently calculate operation outcomes or directly own authoritative money, exposure, health, or assignment rules.

`packages/presentation` has no implementation in E4-01. Future presentation or developer harness work may display forecasts, submit commands, display operation status, display result explanations, and display changed state. It must not own operation rules or directly mutate authoritative state.

#### Root `GameState` dependency

The current EPIC 2 and EPIC 3 standalone runtime models are not yet attached to one complete campaign state. E4-01 must not implement that integration.

The following EPIC 4 implementation tasks depend on a minimal root campaign state that can hold the active city state, runtime locations, characters, organizations, businesses when needed, operation instances, and deterministic random state. Do not prematurely decide a broad final campaign aggregate beyond what the first operation slice needs.

#### Temporary EPIC 4 money rule

EPIC 5 will introduce the explicit transaction ledger. For the first operation slice, it is acceptable for the domain operation consequence to update `OrganizationState.money` directly, provided that:

- the change is deterministic,
- the reason and delta are represented by an explicit domain event or equivalent traceable result,
- the implementation does not create a competing generic economy system,
- the future ledger migration remains straightforward.

This is an intentional temporary vertical-slice boundary.

#### Exposure boundary

EPIC 4 may update existing `CharacterState.personalExposure`.

EPIC 4 must not introduce organization-wide exposure, district tension updates, police pressure, investigation state, evidence state, exposure decay, or law-enforcement reactions. Those belong to EPIC 6 unless a later accepted scope explicitly changes the roadmap.

#### Expected future domain events

Future implementation should document or emit semantic events for:

- operation planned or started,
- operation resolved,
- organization money changed because of the operation,
- character personal exposure changed,
- character injured when applicable,
- character assignment released after resolution.

Events must describe facts that occurred, not commands or player intent.

#### Deterministic test expectations for later E4 tasks

Future implementation must cover at minimum:

- identical initial state, seed, commands, and content produce identical outcomes,
- all four outcome bands can be reached through controlled deterministic tests,
- start cost is paid exactly once,
- reward is applied exactly once,
- exposure is applied exactly once and clamped,
- critical failure changes healthy to injured,
- non-critical outcomes do not change health,
- the operation cannot cause death, critical health, detention, or imprisonment,
- unavailable characters are rejected,
- non-member characters are rejected,
- insufficient money is rejected,
- insufficient capacity is rejected,
- invalid or ineligible targets are rejected,
- already assigned characters are rejected,
- valid planning reserves the character and capacity,
- resolved operations release the assignment and capacity,
- consequences persist in authoritative game state,
- result diagnostics explain the final outcome,
- authored content and runtime state remain separate,
- domain code does not import the content package.

Do not add production tests during E4-01 because no production behavior is being implemented.

#### Explicit exclusions

E4-01 must not specify or implement the full operation catalogue, generic operation scripting, critical success, multiple assigned characters, equipment selection, approach selection, operation cancellation or aborting, recurring income, transaction ledger implementation, business control, ownership transfer, recruitment, recovery mechanics, district tension, investigations, police reactions, rival reactions, rival AI, save/load, full playable UI, or long-term balancing.

---

# EPIC 5 — Economy, Businesses, and Recruitment

## Goal

Turn the first operation into a repeatable growth loop with recurring costs, recurring income, recruits, and simple business control.

| ID | Task | Who | Status |
|---|---|---|---|
| E5-01 | Define money flow, upkeep, and transaction ledger | `[BOTH]` | Pending |
| E5-02 | Implement recurring income and recurring costs | `[CODEX]` | Pending |
| E5-03 | Define six MVP business / location archetypes | `[BOTH]` | Pending |
| E5-04 | Implement basic business control and income generation | `[CODEX]` | Pending |
| E5-05 | Implement recruitment opportunity generation | `[CODEX]` | Pending |
| E5-06 | Implement recruitment operation / action | `[CODEX]` | Pending |
| E5-07 | Implement limited crew growth and role assignment | `[CODEX]` | Pending |
| E5-08 | Implement bankruptcy and low-resource recovery safeguards | `[CODEX]` | Pending |
| E5-09 | Add economy simulation and conservation tests | `[CODEX]` | Pending |

### Acceptance criteria

- Money changes only through explicit ledger entries.
- Businesses create benefits and liabilities rather than passive free profit.
- Recruiting creates opportunity cost and capacity growth.
- The player can recover from an early financial setback.

---

# EPIC 6 — Exposure, Pressure, and Investigations

## Goal

Implement the world's core reaction loop without collapsing all consequences into one generic heat value.

| ID | Task | Who | Status |
|---|---|---|---|
| E6-01 | Define MVP exposure, district tension, and investigation state | `[BOTH]` | Pending |
| E6-02 | Implement exposure generation from operation outcomes | `[CODEX]` | Pending |
| E6-03 | Implement district reaction thresholds | `[CODEX]` | Pending |
| E6-04 | Implement one active investigation lifecycle | `[CODEX]` | Pending |
| E6-05 | Implement evidence / progress accumulation abstraction | `[CODEX]` | Pending |
| E6-06 | Implement patrol, surveillance, and raid reactions | `[CODEX]` | Pending |
| E6-07 | Implement lay-low and evidence-management responses | `[CODEX]` | Pending |
| E6-08 | Implement decay rules that do not erase persistent evidence | `[CODEX]` | Pending |
| E6-09 | Add reaction-chain integration tests | `[CODEX]` | Pending |

### Acceptance criteria

- Loud or repeated activity changes future decisions.
- Going quiet reduces short-term attention but does not erase an established investigation automatically.
- Pressure reactions are readable and causally linked to player behavior.
- A raid or arrest is preceded by observable warning state unless caused by an explicitly understood critical failure.

---

# EPIC 7 — Rival Organization AI

## Goal

Create two bounded AI rivals that act from the same simulation state and make the city contested.

| ID | Task | Who | Status |
|---|---|---|---|
| E7-01 | Define rival goals, priorities, and action candidates | `[BOTH]` | Pending |
| E7-02 | Implement utility scoring with deterministic tie-breaking | `[CODEX]` | Pending |
| E7-03 | Implement rival income and recruitment behavior | `[CODEX]` | Pending |
| E7-04 | Implement rival expansion and defensive behavior | `[CODEX]` | Pending |
| E7-05 | Implement retaliation trigger and cooldown | `[CODEX]` | Pending |
| E7-06 | Implement limited truce / hostility state | `[CODEX]` | Pending |
| E7-07 | Implement AI action logs and debug explanations | `[CODEX]` | Pending |
| E7-08 | Add long-run headless simulation tests | `[CODEX]` | Pending |

### Acceptance criteria

- AI decisions can be inspected and explained.
- Rivals do not require scripted mission sequences.
- Rivals can grow, fail, retreat, and react to the player.
- Fixed-seed simulation runs remain deterministic.
- AI cannot perform actions unavailable under the same domain rules.

---

# EPIC 8 — MVP Operation Catalogue and Opportunities

## Goal

Expand the proven operation framework to the ten MVP operation templates without creating special-case engines.

Planned MVP catalogue:

1. small robbery / theft,
2. extortion,
3. recruitment,
4. business takeover,
5. smuggling run,
6. surveillance,
7. bribery / influence action,
8. evidence destruction,
9. rival disruption,
10. lay-low / relocation response.

| ID | Task | Who | Status |
|---|---|---|---|
| E8-01 | Finalize template list and prerequisites | `[PM]` | Pending |
| E8-02 | Implement remaining income operations | `[CODEX]` | Pending |
| E8-03 | Implement control operations | `[CODEX]` | Pending |
| E8-04 | Implement intelligence operations | `[CODEX]` | Pending |
| E8-05 | Implement defensive / crisis operations | `[CODEX]` | Pending |
| E8-06 | Implement opportunity generation and expiry | `[CODEX]` | Pending |
| E8-07 | Validate that all templates use shared lifecycle and resolver | `[CODEX]` | Pending |
| E8-08 | Add operation catalogue regression tests | `[CODEX]` | Pending |

### Acceptance criteria

- New operations are data definitions plus bounded domain handlers, not independent minigames.
- Every operation has cost, risk, reward, prerequisites, visibility, and world consequences.
- No operation is an always-correct dominant choice.

---

# EPIC 9 — Playable Strategic UI

## Goal

Expose the completed simulation through a readable desktop-first interface.

| ID | Task | Who | Status |
|---|---|---|---|
| E9-01 | Define UI information architecture and screen flow | `[PM]` | Pending |
| E9-02 | Implement application shell and campaign start flow | `[CODEX]` | Pending |
| E9-03 | Implement city / district map view | `[CODEX]` | Pending |
| E9-04 | Implement location selection and opportunity display | `[CODEX]` | Pending |
| E9-05 | Implement operation planning panel | `[CODEX]` | Pending |
| E9-06 | Implement organization and character panels | `[CODEX]` | Pending |
| E9-07 | Implement economy and business panels | `[CODEX]` | Pending |
| E9-08 | Implement pressure and investigation panel | `[CODEX]` | Pending |
| E9-09 | Implement timeline / event feed | `[CODEX]` | Pending |
| E9-10 | Implement pause and speed controls | `[CODEX]` | Pending |
| E9-11 | Implement warnings and consequence previews | `[CODEX]` | Pending |
| E9-12 | Conduct first complete manual playtest | `[MANUAL]` | Pending |

### Acceptance criteria

- The full core loop can be played without developer tools.
- The UI explains why actions are available or blocked.
- The player can distinguish money, exposure, district tension, and active investigations.
- UI state is rebuilt from domain read models and does not own simulation rules.

---

# EPIC 10 — Save, Load, and Campaign Lifecycle

## Goal

Make the MVP safely persistent and compatible with future schema evolution.

| ID | Task | Who | Status |
|---|---|---|---|
| E10-01 | Define versioned save envelope | `[BOTH]` | Pending |
| E10-02 | Implement new campaign creation from content definitions | `[CODEX]` | Pending |
| E10-03 | Implement save and load services behind platform boundary | `[CODEX]` | Pending |
| E10-04 | Implement migration / normalization entry point | `[CODEX]` | Pending |
| E10-05 | Persist seed, clock, RNG state, and active operations | `[CODEX]` | Pending |
| E10-06 | Implement autosave policy if accepted | `[BOTH]` | Pending |
| E10-07 | Implement boss death and MVP run-end summary | `[CODEX]` | Pending |
| E10-08 | Add round-trip and compatibility tests | `[CODEX]` | Pending |

### Acceptance criteria

- Saving and loading produces an equivalent playable state.
- Active operations and deterministic continuation survive reload.
- Unsupported or corrupted saves fail safely with a useful message.
- Save format contains an explicit version.

---

# EPIC 11 — MVP Content Pass and Balancing

## Goal

Populate the controlled city to the budget in `16_MVP_CONTENT_LIST.md` and tune the loop using measured playtests.

| ID | Task | Who | Status |
|---|---|---|---|
| E11-01 | Finalize four district identities | `[BOTH]` | Pending |
| E11-02 | Finalize 20–30 locations and six archetypes | `[BOTH]` | Pending |
| E11-03 | Finalize 10–15 named NPCs | `[BOTH]` | Pending |
| E11-04 | Finalize two rival organizations | `[BOTH]` | Pending |
| E11-05 | Add 12–18 world reactions / event presentations | `[BOTH]` | Pending |
| E11-06 | Add gameplay telemetry required by balancing document | `[CODEX]` | Pending |
| E11-07 | Run repeated seeded simulation balance tests | `[CODEX]` | Pending |
| E11-08 | Run first-session manual playtests | `[MANUAL]` | Pending |
| E11-09 | Tune economy, risk, pressure, recruitment, and AI | `[BOTH]` | Pending |
| E11-10 | Record validated balance baseline | `[PM]` | Pending |

### Acceptance criteria

- The first meaningful operation is available quickly.
- The player reaches a foothold without guaranteed success.
- Pressure matters before the loop becomes repetitive.
- Early failure is recoverable.
- Rivals create competition without deterministic early defeat.
- Testers understand why major outcomes happened.

---

# EPIC 12 — MVP Stabilization and Release Candidate

## Goal

Turn the integrated MVP into a stable build suitable for external feedback.

| ID | Task | Who | Status |
|---|---|---|---|
| E12-01 | Full architecture and dependency audit | `[PM]` | Pending |
| E12-02 | Resolve critical correctness and save-safety findings | `[CODEX]` | Pending |
| E12-03 | Performance profiling on target campaign size | `[CODEX]` | Pending |
| E12-04 | Accessibility and readability pass | `[BOTH]` | Pending |
| E12-05 | Error handling and empty-state pass | `[CODEX]` | Pending |
| E12-06 | Automated regression suite stabilization | `[CODEX]` | Pending |
| E12-07 | Windows build smoke test | `[MANUAL]` | Pending |
| E12-08 | External playtest package and instructions | `[BOTH]` | Pending |
| E12-09 | MVP release candidate review | `[PM]` | Pending |

### MVP exit criteria

The MVP is ready for broader testing when:

- tests and production build pass,
- save/load round trips are stable,
- a full session can be played without developer tools,
- no known blocker corrupts campaign state,
- the operation → consequence → adaptation loop is understandable,
- at least one setback can be recovered from,
- the player wants to attempt another run or continue after stabilization.

---

## 6. Post-MVP order

Do not begin these until the MVP loop is validated.

Recommended order after MVP:

1. deeper diplomacy and subordinate organizations,
2. expanded investigations and institutional actors,
3. richer city economy and supply chains,
4. additional organization structures and operation content,
5. succession and multi-generation campaign continuity,
6. organization history and legacy UI,
7. multiple cities and inter-city logistics,
8. OSM ingestion into the neutral city-definition format,
9. regional and international expansion.

---

## 7. Documentation update policy

Update after accepted implementation batches:

- `CONTEXT.md` — current implementation state, commands, architecture, latest completed task, next recommended task.
- `docs/BUILD_ROADMAP.md` — task statuses and changed sequencing.
- `docs/PROJECT_ARCHITECTURE.md` — only when architecture boundaries change.
- Relevant design documents — only when product behavior changes.

Do not rewrite completed design documents merely to describe implementation details.

---

## 8. Codex task size rules

A normal Codex task should:

- implement one coherent capability,
- touch a bounded set of modules,
- have explicit acceptance criteria,
- include tests where domain behavior changes,
- avoid mixing refactors with features,
- be reviewable as one commit.

Split a task when it combines more than one of:

- new domain model,
- persistence migration,
- major UI workflow,
- architecture refactor,
- content batch,
- balancing pass.

---

## 9. Immediate next step

The next task is **E4-04 — Implement planning and crew assignment command**.

E4-04 should use the accepted **Local Collection** specification in the EPIC 4 section, the E4-02 schema milestone, and the E4-03 availability evaluator as inputs. It should implement only the planning and crew-assignment command, while keeping lifecycle execution, resolver behavior, economy systems, pressure systems, rival AI, save/load, and full UI pending.
