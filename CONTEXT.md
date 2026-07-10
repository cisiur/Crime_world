# Context — CrimeWorld

> This file is used to resume CrimeWorld work in a new AI session.  
> Read this file before planning, implementation prompting, or code review.  
> The project owner makes product decisions, ChatGPT acts as PM / Technical Lead, and Codex implements.

---

## 1. What is this project

CrimeWorld is a desktop-first grand-strategy crime sandbox set in living cities.

The player starts as a single unknown character with almost no resources and gradually builds a criminal organization through:

- planning and delegating operations,
- recruiting people,
- controlling businesses and strategic locations,
- managing money and organizational capacity,
- competing and negotiating with rival organizations,
- managing exposure, investigations, and wider pressure,
- recovering from setbacks,
- and eventually building a long-lived criminal institution.

The game is not centered on action combat.
It is centered on strategic decisions, systemic consequences, organization management, and emergent campaign stories.

The long-term vision includes real-city structures derived from OpenStreetMap, multiple cities, succession, and organizational legacy.
The MVP deliberately uses one controlled city definition and does not depend on OSM.

---

## 2. Repository

- **Repository:** `https://github.com/cisiur/Crime_world`
- **Active branch:** `main`
- **Documentation:** `/docs/`
- **Build roadmap:** `/docs/BUILD_ROADMAP.md`
- **Design entry point:** `/docs/GDD_INDEX.md`
- **Project architecture:** `/docs/PROJECT_ARCHITECTURE.md`
- **Planning memory:** `/docs/PLANNING_ROADMAP.md`

### Branch workflow

- Active work happens directly on `main` unless the project owner explicitly changes the workflow.
- Do not create or target a `dev` branch without explicit approval.
- Codex should commit and push accepted tasks to `main`.
- ChatGPT reviews every pushed task before the next task starts.

---

## 3. Roles and working agreement

### Project owner

The project owner:

- makes product decisions,
- accepts or changes proposed scope,
- chooses priorities,
- performs manual playtests,
- gives final UX and gameplay acceptance.

### ChatGPT — PM / Technical Lead

ChatGPT:

- reads the repository and relevant documentation first,
- checks the actual current state instead of relying on old conversation context,
- proposes the next task with rationale, risks, and acceptance criteria,
- does not generate implementation code directly unless explicitly requested,
- creates Codex prompts only after owner acceptance,
- writes Codex prompts in English and ready to paste,
- reviews every Codex push against the accepted scope,
- identifies regressions, architecture violations, missing tests, and documentation changes,
- updates roadmap and context after accepted task batches.

### Codex — implementation engineer

Codex:

- implements only the accepted scope,
- does not perform unrelated refactors,
- follows documented module boundaries,
- adds or updates tests where relevant,
- runs tests and production build,
- reports results,
- commits the change,
- pushes to `main`.

---

## 4. Mandatory PM → Codex workflow

### Phase A — repository analysis

Before proposing work, ChatGPT should inspect:

1. `CONTEXT.md`,
2. `docs/BUILD_ROADMAP.md`,
3. `docs/PROJECT_ARCHITECTURE.md`,
4. the design documents relevant to the requested system,
5. current source code and tests once implementation exists,
6. the latest commits when reviewing a push.

### Phase B — planning

ChatGPT presents:

- the current verified state,
- one bounded proposed task,
- why it is the correct next step,
- in-scope work,
- out-of-scope work,
- acceptance criteria,
- test expectations,
- architecture or migration risks.

The project owner accepts or adjusts the scope.

### Phase C — Codex prompt

Only after acceptance, ChatGPT produces an English prompt containing:

- repository and branch,
- exact task scope,
- relevant files and architecture constraints,
- required behavior,
- acceptance criteria,
- tests to add or update,
- exact test command,
- exact build command,
- required commit message,
- instruction to push to `main`,
- instruction to avoid unrelated changes.

### Phase D — implementation review

After Codex pushes, ChatGPT:

1. verifies the current branch / commit,
2. reads all changed files,
3. compares the implementation with the accepted scope,
4. verifies test and build claims where repository evidence is available,
5. checks architecture boundaries and save compatibility,
6. returns one result:
   - **Approved**,
   - **Approved with follow-up**,
   - **Changes required**.

Blocking findings must be fixed before the next roadmap task.

---

## 5. Current project status

### Design status

The design foundation is complete enough to begin implementation.

Completed document groups:

- vision and core pillars,
- world simulation,
- economy,
- organizations and NPCs,
- succession,
- gameplay loop,
- influence and expansion,
- operations,
- police and pressure,
- city generation,
- UI and controls,
- save and simulation ticks,
- MVP scope and content,
- MVP game loop,
- MVP technical plan,
- MVP balancing,
- world dependency graph,
- living world behavior,
- AI priority model,
- crime ecosystem,
- emergent story system,
- city economy model,
- district model,
- organization model,
- operation model,
- pressure reaction model,
- player model,
- diplomacy model,
- progression model,
- endgame model,
- organization history and legacy model.

### Implementation status

- No application scaffold has been accepted yet.
- No production source structure exists yet.
- No technology stack has been selected and recorded.
- No automated test or build commands exist yet.
- No gameplay code has been implemented.

Current roadmap phase:

> **EPIC 0 — Technology Decision and Repository Foundation**

Current next task:

> **E0-01 — Compare suitable implementation stacks for CrimeWorld.**

No scaffold should be created until the owner accepts the stack decision.

---

## 6. Product identity and non-negotiable design rules

CrimeWorld should remain:

- a strategic organization-management game,
- a living simulation rather than a mission list,
- a sandbox with optional goals,
- deterministic enough to test and debug,
- systemic enough to produce emergent stories,
- abstract enough to remain buildable by a small team / solo developer.

CrimeWorld should not drift into:

- an action combat game,
- a fully simulated city-population sandbox,
- a pure city builder,
- a scripted campaign game,
- a pure map visualizer,
- a feature pile with unrelated minigames,
- a detailed criminal training simulator.

### Core decision test for every feature

A proposed feature should answer:

1. What meaningful decision does it create?
2. Which existing systems does it affect?
3. Which systems affect it?
4. What emergent story can it generate?
5. What implementation and balancing complexity does it add?
6. Is it required for the current roadmap phase?

Features that fail these questions should be rejected, reduced, or postponed.

---

## 7. MVP definition

The MVP must prove this loop:

```text
Read the city and opportunities
        ↓
Choose a goal
        ↓
Plan an operation
        ↓
Assign people and resources
        ↓
Advance time
        ↓
Resolve the outcome
        ↓
Gain or lose money, influence, people, or access
        ↓
The city, rivals, and institutions react
        ↓
Adapt, recover, expand, or reduce exposure
        ↓
Choose the next operation
```

The MVP should contain:

- one controlled city,
- four distinct districts,
- 20–30 strategic locations,
- one player boss,
- a small recruitable crew,
- two rival organizations,
- 10–15 named important NPCs,
- ten operation templates,
- six business / location archetypes,
- basic economy and recurring costs,
- recruitment,
- limited business control,
- exposure and district tension,
- one investigation lifecycle,
- limited rival AI,
- readable strategic UI,
- pause and speed controls,
- versioned save / load,
- boss death as the MVP run-ending state,
- recoverable non-terminal setbacks.

The MVP excludes:

- full OpenStreetMap ingestion,
- multiple cities,
- regional or international simulation,
- full succession and dynasty gameplay,
- advanced organization history UI,
- global politics,
- deep family simulation,
- detailed logistics across cities,
- advanced institutional diplomacy,
- hundreds of businesses or anonymous simulated citizens.

---

## 8. Architecture baseline

The accepted architecture direction is a **modular monolith** with a **headless deterministic domain simulation**.

Technology is still unresolved, but the architecture must preserve these layers:

### Content layer

Static and data-driven definitions:

- city definitions,
- districts and routes,
- locations,
- operation templates,
- business archetypes,
- NPC and organization seeds,
- balance values.

### Domain layer

Pure gameplay state and rules:

- game state,
- simulation clock,
- city and districts,
- characters,
- organizations,
- operations,
- economy,
- pressure and investigations,
- rival AI decisions,
- domain events.

The domain layer must not depend on UI, filesystem, network, map renderer, or desktop APIs.

### Application layer

Use cases and orchestration:

- campaign creation,
- commands,
- queries / read models,
- tick execution,
- operation planning,
- save / load coordination.

### Presentation layer

- strategic map,
- panels and workflows,
- event feed,
- warnings,
- time controls,
- campaign start and end screens.

Presentation must not own authoritative gameplay rules.

### Infrastructure layer

- local save files,
- serialization and migrations,
- platform APIs,
- future OSM import adapters,
- logging and telemetry.

---

## 9. Determinism and simulation rules

- All gameplay randomness must use an injected seeded random service.
- The same initial state, seed, and command sequence must produce the same result.
- Simulation tick phases must have a stable documented order.
- Entity iteration must not depend on unstable collection order.
- Saves must persist enough state to continue deterministically where required.
- Operation outcomes must use a centralized resolver.
- AI decisions must be inspectable in debug logs.
- Invalid state transitions must fail explicitly.

Recommended tick responsibilities from the current architecture:

1. accept validated commands,
2. start eligible planned operations,
3. advance active operations,
4. resolve completed operations,
5. apply economic changes,
6. update exposure, tension, and investigations,
7. evaluate AI decisions,
8. apply delayed reactions and events,
9. rebuild read models / notifications,
10. run invariant checks in tests or debug mode.

Exact phase names may change during E1 specification, but their order must remain explicit and tested.

---

## 10. Domain terminology

Use these terms consistently:

- **Pressure** — the wider reaction of the city, institutions, civilians, and rivals.
- **Exposure** — how visible an activity, organization, or person currently is.
- **Investigation** — a concrete persistent law-enforcement process.
- **District tension** — local instability and readiness to react.
- **Personal exposure** — risk attached to a specific character.
- **Operation** — an intentional action planned and executed through the organization.
- **Opportunity** — a time- or state-dependent reason an operation is currently available.
- **Organization capacity** — how much coordinated work the organization can sustain.
- **Influence** — partial, non-binary ability to affect a place, actor, route, or institution.

Do not collapse all law-enforcement and world responses into one generic `heat` number.

---

## 11. Product decisions already made

- The game is an endless sandbox.
- Optional goals recognize achievements but do not end the campaign.
- In the full game, the only true game over is boss death without a valid successor.
- With a successor, boss death ends a reign rather than the campaign.
- The MVP does not implement full succession; boss death may end the MVP run.
- Bankruptcy, territorial collapse, arrests, and organization shrinkage should be recoverable when a plausible path remains.
- Long-term power creates new threats rather than permanent safety.
- Player growth comes from capability, people, assets, information, reputation, and influence rather than conventional XP levels.
- Diplomacy between criminal organizations is distinct from corruption or influence over institutions.
- Institutions are affected through people, procedures, leverage, corruption, and political pressure; they do not behave like gangs signing symmetrical alliances.
- Organization history is a campaign record and source of real consequences, not a permanent-stat bonus tree.

---

## 12. Documentation map

### Start here

1. `CONTEXT.md`
2. `docs/BUILD_ROADMAP.md`
3. `docs/PROJECT_ARCHITECTURE.md`
4. `docs/GDD_INDEX.md`

### MVP implementation sources

- `docs/14_MVP_SCOPE.md`
- `docs/15_MVP_GAME_LOOP.md`
- `docs/16_MVP_CONTENT_LIST.md`
- `docs/17_MVP_TECH_PLAN.md`
- `docs/18_MVP_BALANCING.md`

### Core domain sources

- `docs/24_CITY_ECONOMY_MODEL.md`
- `docs/25_DISTRICT_MODEL.md`
- `docs/26_ORGANIZATION_MODEL.md`
- `docs/27_OPERATION_MODEL.md`
- `docs/28_PRESSURE_REACTION_MODEL.md`
- `docs/29_PLAYER_MODEL.md`
- `docs/30_DIPLOMACY_MODEL.md`
- `docs/31_PROGRESSION_MODEL.md`
- `docs/32_ENDGAME_MODEL.md`
- `docs/33_ORGANIZATION_HISTORY_AND_LEGACY.md`

The full design reading order is maintained in `docs/GDD_INDEX.md`.

---

## 13. Testing policy

The exact framework and commands will be recorded after EPIC 0.

Required test categories:

### Unit tests

For pure rules such as:

- eligibility,
- modifiers,
- outcome calculation,
- money changes,
- pressure thresholds,
- AI utility scores,
- state transitions.

### Integration tests

For complete domain workflows such as:

- plan → execute → resolve operation,
- operation → exposure → investigation reaction,
- recruit → assign → consume capacity,
- business income → upkeep → financial state.

### Deterministic simulation tests

- same seed and commands produce the same result,
- long-run simulation preserves invariants,
- AI does not produce invalid actions,
- no orphaned references remain.

### Save / load tests

- round-trip equality where appropriate,
- active operation continuity,
- migration / normalization behavior,
- safe rejection of corrupted or unsupported saves.

### Manual tests

The project owner validates:

- readability,
- strategic clarity,
- pacing,
- whether consequences feel fair,
- whether the player wants to perform another operation.

---

## 14. Code and task quality rules

- Prefer small focused commits.
- Avoid unrelated cleanup in feature tasks.
- Do not duplicate domain rules in UI components.
- Do not add a second operation resolver.
- Do not use global uncontrolled randomness.
- Do not hardcode content throughout logic when a definition belongs in content data.
- Do not introduce microservices for the MVP.
- Do not introduce ECS unless profiling proves a real need.
- Do not use full event sourcing as the MVP persistence model.
- Do not optimize anonymous population simulation that the player cannot meaningfully observe.
- Every public domain transition should have explicit success / failure behavior.
- Every persistence format must be versioned.

---

## 15. Documentation update rules

After an accepted implementation batch, update:

### Always consider

- `CONTEXT.md` — current status, commands, source layout, completed task, next task.
- `docs/BUILD_ROADMAP.md` — task status and roadmap sequencing.

### Update only when relevant

- `docs/PROJECT_ARCHITECTURE.md` — architecture boundary changes.
- design model documents — changed gameplay behavior or accepted product decision.
- MVP documents — scope, content, pacing, or validation target changes.

Do not let documentation claim that a feature exists before implementation review confirms it.

---

## 16. Current commands

No implementation stack has been selected yet.

```text
Install:  TBD in EPIC 0
Test:     TBD in EPIC 0
Build:    TBD in EPIC 0
Run:      TBD in EPIC 0
```

These placeholders must be replaced immediately after project scaffolding.

---

## 17. Current source structure

No implementation source structure exists yet.

The expected conceptual ownership is:

```text
content/         static game definitions
src/domain/      pure simulation state and rules
src/application/ commands, queries, tick orchestration
src/presentation/ UI and read-model adapters
src/infrastructure/ persistence and platform adapters
tests/           unit, integration, deterministic simulation, save/load
```

The final directory names depend on the selected stack and must be recorded after EPIC 0.

---

## 18. Current roadmap position

Completed:

- full design documentation pass,
- MVP validation pass,
- implementation architecture planning,
- AI-assisted development roadmap,
- reusable project context.

Next:

> **E0-01 — Technology stack comparison and recommendation.**

Required PM output before implementation:

- compare realistic stack options,
- recommend one option,
- explain tradeoffs,
- define exact test, build, desktop, map, and persistence path,
- obtain project-owner acceptance,
- only then create `docs/TECH_STACK.md` and a Codex scaffold prompt.

---

## 19. New-session instruction

When a new ChatGPT session starts, the user can provide the repository and say:

> Continue CrimeWorld as PM / Technical Lead. Read `CONTEXT.md`, `docs/BUILD_ROADMAP.md`, and the relevant documentation. Verify the current `main` branch and actual repository state. Do not write implementation code. Propose the next bounded task and rationale first. Create an English Codex prompt only after my acceptance. After every Codex push, review the implementation before continuing.

The assistant should not restart design from scratch and should not invent a new roadmap when the current one remains valid.
