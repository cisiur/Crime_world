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

- Technology stack has been selected and recorded in `docs/TECH_STACK.md`.
- Repository scaffold exists as a TypeScript workspace / modular monolith.
- Minimal React + Vite + Tauri desktop shell exists in `apps/desktop`.
- Package boundaries exist for domain, application, content, infrastructure, and presentation.
- Formatter, linter, unit test framework, production web build, Tauri executable build, and GitHub Actions CI are configured.
- GitHub Actions CI verifies pushes and pull requests targeting `main`.
- Deterministic test seed infrastructure exists for tests through `CRIMEWORLD_TEST_SEED`.
- Root-level `AGENTS.md` records repository workflow and package-boundary rules for coding agents.
- Stable branded IDs exist in the domain package, including `TransactionId`.
- Deterministic simulation clock, pause/resume, speed, and fixed tick duration exist.
- Deterministic PCG32 seeded random service and immutable serializable `RandomState` exist.
- Versioned immutable root `GameState` exists.
- Command dispatcher and explicit `DomainResult` success/failure pattern exist.
- Ordered single-tick pipeline exists.
- Domain events are collected into `DomainExecution`; they are not published or persisted.
- Deterministic replay scenarios exist as tests only.
- Invariant validation helpers exist and are manually callable; they are not automatically run after commands.
- Neutral content-owned `CityDefinition`, district, route, and location schemas exist.
- The canonical MVP city content exists with four authored districts, 29 strategic locations, and five routes.
- City definition validation exists for schema version, required collections, duplicate IDs, route endpoints, self-loop routes, duplicate route connections, orphan locations, and disconnected district graphs.
- Runtime city state exists in the domain package as ID-only city, district, location, and route state.
- Location runtime state includes nullable organization and business ownership references; new locations default to unowned and unassigned.
- District property derivation exists in the domain package for combining authored baseline profiles with runtime tension, exposure, and police-presence modifiers.
- A deterministic headless city debug report formatter exists in the content package.
- Minimal runtime character state exists with capability tags, health, legal state, assignment state, competence, loyalty, and personal exposure.
- Character availability is derived from health, legal state, and assignment state; it is not stored as separate state.
- Minimal runtime organization state exists with leader, members, money, and operational capacity.
- Player organization creation delegates to the base organization factory and starts with the leader as the only member.
- Minimal business state exists with location and nullable owner references.
- Authored rival organization seeds exist in the content package.
- Cross-model organization lifecycle tests cover current EPIC 3 relationships without introducing a global validator.
- The accepted E4-01 Local Collection first operation specification is recorded in `docs/BUILD_ROADMAP.md`.
- Minimal immutable runtime `OperationState` exists in the domain package.
- Minimal immutable authored `OperationTemplateDefinition` exists in the content package.
- Pure deterministic `evaluateOperationAvailability(...)` exists in the domain package.
- Typed operation availability rejection reasons exist.
- Local Collection availability requires exactly one assigned character.
- Operation prerequisite evaluation is deterministic and side-effect free.
- Bounded immutable `PlanOperationCommand` and pure deterministic `planOperation(...)` exist in the domain package.
- Operation planning accepts explicit runtime collections and narrow authored template/location inputs rather than expanding root `GameState` or importing content definitions.
- Valid planning creates exactly one immutable planned `OperationState`, reserves exactly one assigned character by changing `assignmentState` from `idle` to `assigned`, reserves operational capacity, records the start cost immediately and exactly once through the money ledger, and emits ordered semantic planning events.
- Operation planning rejects duplicate `OperationId` values explicitly and preserves typed `OperationAvailabilityReason` values in availability failures.
- Pure deterministic `advanceOperationLifecycles(...)` exists in the domain package for bounded `planned -> running -> resolved` operation lifecycle transitions over explicit immutable operation collections.
- Lifecycle evaluation preserves collection order, emits `OperationStarted` and `OperationLifecycleCompleted` events, handles overdue planned operations in one evaluation, and treats `resolved` as "ready for outcome resolution" rather than "consequences applied".
- Pure deterministic `resolveOperationOutcome(...)` exists in the domain package as a centralized seeded percentile resolver. It accepts one lifecycle-resolved operation, immutable `RandomState`, ordered weighted bands totaling exactly 100, and explicit modifier diagnostics for base, competence, capability, district, and exposure.
- The outcome resolver uses the existing seeded PCG32 service through one `nextInt(randomState, 1, 100)` call per successful resolution, preserves caller band order, returns roll/range/band/RNG diagnostics, and emits `OperationOutcomeRolled`.
- Runtime operation outcome categories now exist for `success`, `partial-success`, `failure`, and `critical-failure`.
- Pure deterministic `classifyOperationOutcome(...)` exists in the domain package for Local Collection outcome classification. It validates supplied Local Collection bands, delegates seeded weighted resolution to E4-06, maps the selected band to a typed category, preserves resolver diagnostics, returns the advanced random state, and emits `OperationOutcomeRolled` followed by `OperationOutcomeClassified`.
- The canonical immutable Local Collection outcome band definition exists in `packages/content/src/localCollectionOutcomeDefinition.ts` with the accepted ordered weights `success 45`, `partial-success 30`, `failure 20`, and `critical-failure 5`.
- Generic classification-band validation remains reusable for other valid 100-total distributions, while canonical Local Collection validation additionally enforces all four categories, their accepted order, and exact `45/30/20/5` weights.
- Pure deterministic `applyLocalCollectionConsequences(...)` exists in the domain package for bounded Local Collection money, personal exposure, critical-failure injury, assignment-release, operational-capacity release, and applied-consequence record updates.
- Local Collection consequence application uses caller-supplied authored consequence definitions, does not consume RNG, rejects duplicate application through immutable applied-consequences records, emits semantic consequence events, and leaves `OperationState.status` as `resolved`.
- Accepted Local Collection consequence values are `success +80 money/+4 exposure/no injury`, `partial-success +40/+10/no injury`, `failure 0/+14/no injury`, and `critical-failure 0/+25/healthy -> injured`.
- The canonical immutable Local Collection consequence definition exists in `packages/content/src/localCollectionConsequenceDefinition.ts` with accepted rewards, exposure deltas, health consequence, and one capacity release for all four outcome categories.
- A deterministic repository-level Local Collection vertical-slice integration test exists at `tests/integration/localCollectionVerticalSlice.integration.test.ts`. It composes availability, planning, lifecycle, seeded classification, and consequence application using the real public APIs and fixed seeds `32 -> success roll 1`, `153 -> partial-success roll 46`, `20 -> failure roll 76`, and `64 -> critical-failure roll 96`.
- The application package now owns a Local Collection developer playtest harness in `packages/application/src/localCollectionPlaytest.ts`. It imports domain and content, composes authored definitions with explicit runtime state, exposes setup/planned/running/resolved/classified/settled playtest phases, and is not a general campaign service.
- The presentation package renders the developer Local Collection playtest in `packages/presentation/src/AppShell.tsx`, including setup controls, seed presets, step-by-step and full-run actions, consequence diagnostics, RNG state, and an event timeline built from real domain events.
- The first end-to-end Local Collection vertical slice is manually runnable through the desktop/browser developer UI with `npm.cmd run dev` or `npm.cmd run desktop:dev`.
- No campaign creation flow loads the canonical city, characters, organizations, businesses, or rival seeds yet.
- A standalone domain money-ledger foundation exists with immutable money transactions, typed categories and sources, atomic `recordMoneyTransaction(...)`, typed failures, and `OrganizationMoneyTransactionRecorded` events.
- Local Collection start cost and non-zero gross rewards now use the standalone domain money ledger. Recurring economy schedules and one-period application runtimes exist for crew upkeep, provisional organization recurring income, and business income, but they are not globally integrated into the simulation tick loop. E5-05 recruitment opportunity generation exists for concrete candidates, E5-06 can execute one active opportunity through ledger payment, membership append, and opportunity consumption, and E5-07 can finalize post-recruit crew growth by assigning an operator role, creating or reusing the recruit's canonical crew-upkeep schedule, and promoting one existing operator to lieutenant for exactly one operational-capacity increase. No operation `GameState` integration, event bus, save/load, AI, pressure, investigations, role removal, lieutenant replacement, rival behavior, generic campaign orchestration, reusable operation catalogue, or player-facing production UI exists yet.
- The root `GameState` still contains only the current domain-kernel fields and is not yet a complete campaign aggregate.

Previous documentation synchronization baseline after E4-05 through E4-07:

```text
718307042f58bf86528a5235a758d558f75f260d
```

Accepted gameplay implementation baseline through E4-08, E4-09, and E4-10:

```text
9769a6ba3a9ba06559a3c81bc6536b054e519ab1
```

Final accepted EPIC 1 commit:

```text
feat(domain): add invariant validation helpers
```

Final verification:

```text
GitHub Actions run 29232731045 — success
```

Latest reviewed gameplay implementation baseline before E4-01 specification:

```text
e9974fc9fbf00cf91f21bb5729b48241de2dad5d
```

Current roadmap phase:

> **EPIC 5 in progress**

Current next task:

> **E5-08 - Implement bankruptcy and low-resource recovery safeguards**

EPIC 4 is complete as the first end-to-end operation vertical slice. E4-01 through E4-10 are accepted: Local Collection now has canonical authored content, availability, planning, lifecycle, seeded outcome classification, bounded immediate consequences, deterministic integration coverage, and a developer playtest UI. E5-01 is complete as a documentation/specification task only: the accepted money-flow, upkeep, and transaction-ledger contract is authoritative in `docs/BUILD_ROADMAP.md`. E5-02 is complete after accepted bounded increments E5-02A through E5-02F: money ledger -> recurring schedule domain -> due-period processing -> application runtime -> crew upkeep and MVP recurring-income flows. E5-03 is complete as authored content only: `packages/content` now has six canonical immutable MVP business / location archetype definitions, a deterministic `LocationKind` resolver, and focused validation. E5-04 is complete as one bounded business ownership and income vertical slice: one runtime business can transfer to an organization, owned income-generating businesses can generate deterministic recurring schedules from caller-supplied content values, and one explicit due business-income period can execute through the recurring economy processor and money ledger. E5-05 is complete as a bounded recruitment-opportunity foundation: authored content defines four concrete persistent recruitable NPC candidates, domain can deterministically generate and expire active recruitment opportunities for a target organization, and application exposes a read-only visible opportunity projection. E5-06 is complete as one deterministic recruitment action: an active unexpired opportunity can be executed when trust and candidate eligibility pass, recruitment cost is paid through the ledger, the candidate is appended to organization membership, and the opportunity is marked consumed. E5-07 is complete as limited crew growth and role assignment: domain owns explicit `boss`/`operator`/`lieutenant` organization-member role assignments and the one-lieutenant capacity rule; content owns the minimal canonical role-capacity values; application can assign a recruit as operator, sync exactly one canonical crew-upkeep schedule for that recruit, and promote one operator to lieutenant. Business upkeep, hideout upkeep, global tick integration, campaign aggregate integration, save/load, pressure effects, rival behavior, role removal, lieutenant replacement, broader hierarchy, production, inventory, storage capacity, UI, and final balancing are not implemented yet.

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

Use `npm.cmd` from Windows PowerShell if script execution policy blocks `npm`.

Supported Node.js version:

```text
Node.js: 24.15.0
```

```text
Install:            npm.cmd install
Clean install:      npm.cmd ci
Run web shell:      npm.cmd run dev
Run Tauri shell:    npm.cmd run desktop:dev
Format check:       npm.cmd run format:check
Lint:               npm.cmd run lint
All tests:          npm.cmd run test
Domain tests:       npm.cmd run test:domain
Production build:   npm.cmd run build
Desktop executable: npm.cmd run desktop:build
Full check:         npm.cmd run check
```

The desktop executable command compiles the Tauri app with `tauri build --no-bundle`; installer packaging is not part of the current scaffold.

Test seed infrastructure:

```text
Environment variable: CRIMEWORLD_TEST_SEED
Default seed:         12648430
Accepted range:       1 to 4294967295
Definition:           packages/domain/test-support/testSeed.ts
Environment reader:   test-support/testSeed.ts
```

Invalid seed values fail with an explicit error during test seed resolution.

GitHub Actions CI runs on pushes to `main` and pull requests targeting `main` on `windows-latest`. It runs `npm ci`, formatting, linting, tests, production build, and the Tauri desktop executable build.

---

## 17. Current source structure

Current workspace structure:

```text
apps/
  desktop/          React + Vite + Tauri desktop shell

packages/
  domain/           pure headless domain package, runtime city, character, organization, and business state
  application/      commands, queries, use cases, read models
  content/          immutable content definitions, canonical MVP city, rival organization seeds, city validation/debug output
  infrastructure/   platform adapters and persistence boundary
  presentation/     React presentation components and map placeholder
```

The current domain package contains the accepted EPIC 1 foundation, the minimal EPIC 2 runtime city shell, the EPIC 3 character, organization, business, ownership-reference, and availability foundations, the complete EPIC 4 Local Collection domain slice, the E5-02A standalone money-ledger foundation, the E5-02B Local Collection ledger migration, the E5-02C recurring economy scheduler foundation, the E5-02E crew-upkeep schedule generation rules, the E5-02F recurring-income schedule generation rules, the E5-04 business ownership and business-income schedule rules, the E5-05 recruitment opportunity ID/state/generation/expiration rules, the E5-06 deterministic recruitment action, and the E5-07 organization-member role assignment rules: runtime `OperationState`, availability, planning, lifecycle, seeded weighted outcome resolution, typed outcome classification, bounded consequence application, applied-consequence records, immutable money transactions, typed transaction categories and sources, atomic transaction recording, recurring schedules and processing records, recruitment opportunity records, recruitment execution validation, explicit `boss`/`operator`/`lieutenant` organization-member role assignments, one-lieutenant operational-capacity increase, semantic domain events, and invariants. Authored city data, rival organization seeds, the Local Collection operation template, canonical outcome bands, canonical consequence definition, canonical MVP crew-upkeep definition, canonical MVP recurring-income definition, canonical MVP role-capacity definition, canonical MVP business / location archetype definitions, canonical MVP business income definitions, and four canonical MVP recruitable candidate seeds/definitions remain in `packages/content`. The canonical E5-04 business income values are Small Shop or Service `20` money every `144` ticks, Restaurant or Nightlife Venue `60` every `144` ticks, and Workshop or Transport Business `40` every `144` ticks. The canonical E5-05 recruitable candidates are Vera Kade (`streetwise`, `force`, competence `75`, loyalty `35`, exposure `30`, cost `60`, trust `35`, maintenance preview `5`, duration `432` ticks), Eli Navarro (`social`, competence `35`, loyalty `80`, exposure `10`, cost `25`, trust `15`, maintenance preview `5`, duration `576` ticks), Nika Ross (`stealth`, `streetwise`, competence `50`, loyalty `50`, exposure `65`, cost `10`, trust `10`, maintenance preview `5`, duration `288` ticks), and Tomas Vek (`logistics`, `social`, competence `70`, loyalty `60`, exposure `15`, cost `90`, trust `45`, maintenance preview `5`, duration `720` ticks). The application package now contains the Local Collection developer playtest/session harness, the recurring economy runtime wrapper, controlled one-character crew-upkeep period execution, controlled one-organization recurring-income period execution, controlled one-business business-income period execution, a recruitment opportunity read model projection, a thin recruitment action runtime wrapper, and thin crew-growth/lieutenant-assignment wrappers; presentation renders the Local Collection playtest in the desktop/browser shell. The repository still does not contain campaign creation, operation or ledger persistence in root `GameState`, save/load, business or hideout upkeep, global tick-loop economy integration, pressure or investigation systems, rival AI, a reusable operation catalogue, production/inventory systems, role removal, lieutenant replacement, broader hierarchy, or a final player-facing UI.

---

## 18. Current roadmap position

Completed:

- full design documentation pass,
- MVP validation pass,
- implementation architecture planning,
- AI-assisted development roadmap,
- reusable project context,
- accepted technology stack decision,
- repository foundation scaffold,
- GitHub Actions CI,
- deterministic test seed support,
- repository-level developer instructions,
- EPIC 1 domain kernel and deterministic simulation clock foundation,
- EPIC 2 controlled city shell,
- EPIC 3 characters and organizations foundation,
- E4-01 first operation specification and outcome table,
- E4-02 operation template and runtime instance schemas,
- E4-03 operation availability and prerequisite evaluation,
- E4-04 planning and crew/resource reservation command,
- E4-05 operation lifecycle transitions,
- E4-06 centralized seeded operation outcome resolver,
- E4-07 Local Collection outcome classification,
- E4-08 Local Collection consequence application,
- E4-09 deterministic Local Collection vertical-slice integration tests,
- E4-10 developer Local Collection playtest UI.
- E5-01 money flow, upkeep, and transaction ledger specification.
- E5-02A money ledger foundation.
- E5-02B Local Collection ledger migration.
- E5-02C recurring economy scheduler foundation.
- E5-02D recurring economy runtime orchestration.
- E5-02E crew upkeep schedule generation and one-period runtime execution.
- E5-02F MVP recurring income generation and one-period runtime execution.
- E5-02 recurring income and recurring costs.
- E5-03 authored MVP business / location archetype definitions.
- E5-04 basic business ownership and income generation.
- E5-05 recruitment opportunity generation.
- E5-06 recruitment operation / action.
- E5-07 limited crew growth and role assignment.

Next:

> **E5-08 - Implement bankruptcy and low-resource recovery safeguards**

Required PM output before implementation:

- review and accept the E5-08 scope,
- preserve the accepted E5-01/E5-02A through E5-02F and E5-04 contracts and EPIC 4 Local Collection money outcomes,
- preserve the E5-03 content-only archetype boundary,
- preserve the E5-05 concrete persistent-candidate opportunity boundary,
- keep any further economy integration out of scope until its explicit accepted task,
- keep role removal, lieutenant replacement, broader hierarchy, pressure systems, rival AI, save/load, and broader campaign orchestration out of scope until explicitly accepted.

---

## 19. New-session instruction

When a new ChatGPT session starts, the user can provide the repository and say:

> Continue CrimeWorld as PM / Technical Lead. Read `CONTEXT.md`, `docs/BUILD_ROADMAP.md`, and the relevant documentation. Verify the current `main` branch and actual repository state. Do not write implementation code. Propose the next bounded task and rationale first. Create an English Codex prompt only after my acceptance. After every Codex push, review the implementation before continuing.

The assistant should not restart design from scratch and should not invent a new roadmap when the current one remains valid.
