# Build Roadmap — CrimeWorld

> **Status:** EPIC 0 and EPIC 1 complete; EPIC 2 ready for accepted task scoping
> **Active branch:** `main`  
> **Workflow:** project owner decides, ChatGPT acts as PM / Technical Lead, Codex implements, ChatGPT reviews every pushed task.  
> **Current phase:** Domain kernel complete; next accepted scope starts EPIC 2.

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
First Operation Slice        ░░░░░░░░░░   0%
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
| E2-01 | Define `CityDefinition`, district, route, and location content schemas | `[BOTH]` | Pending |
| E2-02 | Define runtime city and district state | `[CODEX]` | Pending |
| E2-03 | Create the four MVP district definitions | `[BOTH]` | Pending |
| E2-04 | Create 20–30 strategic MVP locations | `[BOTH]` | Pending |
| E2-05 | Implement district adjacency and route validation | `[CODEX]` | Pending |
| E2-06 | Implement district properties used by operations and pressure | `[CODEX]` | Pending |
| E2-07 | Add city-definition validation tests | `[CODEX]` | Pending |
| E2-08 | Add a headless city-state inspection / debug output | `[CODEX]` | Pending |

### Acceptance criteria

- A new campaign loads one valid controlled city from data.
- Districts differ in opportunity, risk, economy, and rival presence.
- No UI-specific coordinates are required by domain rules.
- Future OSM import can produce the same neutral `CityDefinition` format.

---

# EPIC 3 — Characters and Organizations

## Goal

Create the player boss, recruits, crews, rival organizations, ownership, and basic capacity constraints.

| ID | Task | Who | Status |
|---|---|---|---|
| E3-01 | Define MVP character state and traits | `[BOTH]` | Pending |
| E3-02 | Define organization state, membership, roles, money, and capacity | `[BOTH]` | Pending |
| E3-03 | Implement player organization creation | `[CODEX]` | Pending |
| E3-04 | Implement two rival organization seeds | `[CODEX]` | Pending |
| E3-05 | Implement location and business ownership references | `[CODEX]` | Pending |
| E3-06 | Implement crew availability and assignment rules | `[CODEX]` | Pending |
| E3-07 | Implement loyalty and competence as minimal MVP values | `[CODEX]` | Pending |
| E3-08 | Add organization invariant and lifecycle tests | `[CODEX]` | Pending |

### Acceptance criteria

- The player starts as one boss with a minimal base and no territory.
- Organizations have stable members, money, capacity, and owned assets.
- One character cannot be assigned to incompatible simultaneous work.
- Removing a character cannot leave invalid references.

---

# EPIC 4 — First End-to-End Operation Vertical Slice

## Goal

Prove the central loop with one complete operation before implementing a catalogue of actions.

Recommended first slice: a small income operation against a local target, selected from the map and delegated to an available character.

| ID | Task | Who | Status |
|---|---|---|---|
| E4-01 | Finalize the first operation specification and outcome table | `[PM]` | Pending |
| E4-02 | Define operation template and runtime instance schemas | `[BOTH]` | Pending |
| E4-03 | Implement operation availability and prerequisite evaluation | `[CODEX]` | Pending |
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

The next task is **E2-01 — define `CityDefinition`, district, route, and location content schemas**.

ChatGPT should prepare a bounded EPIC 2 task before Codex implementation, including:

- schema ownership and package boundaries,
- exact MVP city-content scope,
- validation and test expectations,
- and explicit exclusions to avoid implementing city runtime state or gameplay systems early.
