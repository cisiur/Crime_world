# Planning Roadmap

## Purpose

This document is CrimeWorld's planning memory.

It records:

- the decisions that led to the current MVP,
- the boundary between long-term design and accepted MVP scope,
- the implementation principles that must survive future sessions,
- known decisions that still need to be made,
- and the current implementation priority.

This document is not the authoritative implementation backlog.

For current build order and task status, use:

1. `../CONTEXT.md`,
2. `BUILD_ROADMAP.md`,
3. `PROJECT_ARCHITECTURE.md`.

Earlier revisions of this file described an MVP validation pass. That pass has been completed. Documents `14_MVP_SCOPE.md` through `18_MVP_BALANCING.md` were revised and aligned with the later component models before the implementation roadmap was created.

---

# 1. Project summary

CrimeWorld is an open-ended grand-strategy crime sandbox set in living cities.

The player begins as a single unknown character and builds a criminal organization through planning, delegation, recruitment, operations, business control, pressure management, diplomacy, influence, and long-term organizational survival.

The player is a vulnerable actor inside the simulation rather than an omnipotent map cursor.

The game is entertainment-focused and must not become a realistic criminal training simulator.

---

# 2. Core decisions already established

## Core fantasy

- The player starts as one character with almost no power.
- The player plans and delegates most operations to NPCs and crews.
- The game is about building an organization, not completing a linear mission campaign.
- The world acts and reacts without waiting for the player.
- Growth changes the player's problems rather than removing risk permanently.
- Long-term organization continuity and succession belong to the full game, but full succession is outside the MVP.

## World structure

- Cities are the strategic board.
- Buildings, routes, districts, businesses, institutions, and important actors are strategic objects.
- OpenStreetMap is a long-term source for city definitions, not a dependency of the first playable version.
- The MVP uses one controlled, handcrafted city definition.
- Background population remains aggregated unless an individual creates meaningful decisions.

## Gameplay structure

- Time passes continuously from the player's perspective and can be paused or accelerated.
- Operations are the atomic intentional actions of organizations.
- Outcomes are not purely binary and must create persistent consequences.
- Economy, people, assets, exposure, district tension, investigations, and rival reactions are connected.
- Pressure must not be collapsed into one generic `heat` value.
- The UI explains and projects simulation state; it does not own authoritative gameplay rules.

## Campaign structure

- CrimeWorld is an endless sandbox without a mandatory victory condition.
- Optional milestones recognize achievements but do not end the campaign.
- Most setbacks should change the player's strategic position rather than immediately end the run.
- The full game ends only when the current boss dies without a valid continuation mechanism.
- The MVP may treat boss death as a run-ending state because full succession is excluded.

---

# 3. Documentation status

## Validated implementation baseline

The following MVP documents have completed their validation pass and are the accepted design baseline for implementation:

- `14_MVP_SCOPE.md`,
- `15_MVP_GAME_LOOP.md`,
- `16_MVP_CONTENT_LIST.md`,
- `17_MVP_TECH_PLAN.md`,
- `18_MVP_BALANCING.md`.

The following documents define the current implementation process and architecture:

- `../CONTEXT.md`,
- `BUILD_ROADMAP.md`,
- `PROJECT_ARCHITECTURE.md`,
- `GDD_INDEX.md`.

The high-level and long-term documents `00`–`13` and `19`–`33` remain useful design references. They are not automatic MVP commitments.

## Status hierarchy

When documents appear to disagree, use this priority:

1. an explicit decision accepted by the project owner in the current task,
2. `BUILD_ROADMAP.md` for build order and task status,
3. `PROJECT_ARCHITECTURE.md` for technical boundaries,
4. `14_MVP_SCOPE.md` through `18_MVP_BALANCING.md` for accepted MVP behavior and content,
5. long-term GDD documents for future direction.

`PLANNING_ROADMAP.md` preserves intent and constraints but must not override newer accepted implementation decisions.

---

# 4. Current phase

The broad design phase is closed.

The project is now in:

> **EPIC 4 — First End-to-End Operation Vertical Slice planning**

The current task is:

> **E4-01 — Finalize the first operation specification and outcome table.**

EPIC 0, EPIC 1, EPIC 2, and EPIC 3 are complete.

The immediate sequence is:

1. finalize the first operation specification and outcome table,
2. define the minimal operation template and runtime state required for that slice,
3. implement operation availability and prerequisite checks,
4. implement planning and crew assignment through the accepted command boundary,
5. implement the smallest operation lifecycle and resolver needed for one complete flow,
6. keep the full operation catalogue, economy simulation, recruitment actions, pressure systems, rival AI, save/load, and full UI work out of scope until their epics.

---

# 5. MVP purpose

The MVP must answer one central question:

> Is the repeated loop of reading the city, identifying an opportunity, planning and assigning an operation, receiving a systemic outcome, managing pressure, reacting to rivals, and expanding capability compelling enough to support repeated play?

The MVP is not intended to prove every long-term CrimeWorld system.

A system belongs in the MVP only when it is required to prove the repeated strategic loop or to prevent that loop from producing misleading results.

Systems that mainly support multi-generation play, global scale, large content variety, advanced politics, or speculative future extensibility must be excluded, simplified, or deferred.

---

# 6. First playable versus MVP feature-complete

The project must distinguish two milestones.

## First playable vertical slice

The first playable slice proves one complete operation cycle:

1. inspect a controlled city state,
2. identify one opportunity,
3. configure one operation,
4. assign an available character,
5. advance simulation time,
6. resolve a deterministic seeded outcome,
7. apply persistent money, availability, and exposure consequences,
8. display a readable result and changed state.

This slice may use:

- one minimal city dataset,
- one district or only the subset of districts needed by the operation,
- one player boss,
- one assignable helper if required by the accepted operation design,
- one operation template,
- one minimal reaction path,
- a developer UI or narrow playable interface.

It does not need the full MVP content budget.

## MVP feature-complete

The feature-complete MVP expands the validated slice to the accepted scope in documents `14`–`18`, including the controlled city, rivals, economy, recruitment, businesses, pressure, investigation lifecycle, save/load, and readable strategic UI.

The project must not use “MVP” as an excuse to postpone all playability until every documented MVP subsystem exists.

---

# 7. Vertical-slice implementation guardrail

`BUILD_ROADMAP.md` remains the authoritative epic order, but Epics 0–3 must implement only the minimum reusable foundation required to reach the first end-to-end operation slice in Epic 4.

Before the first operation slice works, do not build:

- a generic framework for systems not exercised by that slice,
- complete city simulation when a smaller city shell is sufficient,
- complete organization, diplomacy, history, succession, or progression models,
- abstractions created only for hypothetical OSM import,
- large content catalogues,
- speculative plugin systems,
- generalized event scripting beyond the needs of the tested flow.

A foundation task is justified only when at least one of these is true:

1. the first operation slice directly requires it,
2. deterministic testing requires it,
3. save-compatible stable state requires it from the beginning,
4. postponing it would create a known destructive migration before the slice.

“Useful later” is not sufficient justification.

---

# 8. Simulation order decision boundary

The simulation must use one explicit, deterministic tick pipeline.

`PROJECT_ARCHITECTURE.md` is the current source of truth for the recommended phase order. Other documents may summarize the phases at a higher level but must not define a competing order.

The exact executable phase names and boundaries are intentionally unresolved until **E1-02 — Define simulation time, tick, pause, and speed model**.

Before E1-06 implements the ordered tick pipeline, the project owner and PM must accept a single specification covering at minimum:

- when queued commands are validated and applied,
- when the simulation clock advances,
- when planned operations start,
- when active operations advance,
- when completed operations resolve,
- when immediate outcome effects apply,
- when recurring economy updates run,
- when exposure, tension, and investigations update,
- when rival AI evaluates and submits actions,
- when opportunities, events, history, notifications, and read models update.

The accepted order must then be:

- recorded in `PROJECT_ARCHITECTURE.md`,
- reflected in `CONTEXT.md`,
- implemented once in the domain/application orchestration,
- protected by deterministic ordering tests.

Until that task is accepted, summaries in documentation are architectural guidance rather than a finalized executable contract.

---

# 9. Technical alignment requirements

The implementation must preserve:

- a modular monolith,
- a headless deterministic domain simulation,
- stable serializable IDs,
- versioned authoritative game state,
- injected seeded randomness,
- explicit commands, results, and domain events,
- data-driven content where practical,
- UI read models rather than UI-owned rules,
- replaceable infrastructure for save/load and future map import.

The technology stack must support:

- desktop-first delivery,
- a UI-heavy strategic map and management interface,
- fast headless domain tests,
- local save files,
- a future neutral city-definition import path,
- practical solo-development iteration,
- strong Codex ergonomics.

The stack decision must be based on CrimeWorld's constraints rather than framework popularity.

---

# 10. What should not happen yet

Do not restart broad game design.

Do not add another large design document unless implementation reveals a concrete missing dependency that cannot be resolved in an existing file.

Do not expand into:

- full OpenStreetMap ingestion,
- multiple cities,
- regional or global simulation,
- advanced family trees or full dynasty simulation,
- detailed international law enforcement,
- advanced institutional politics,
- detailed tactical combat,
- dozens of business or organization archetypes,
- advanced banking or financial-market simulation,
- full organization history UI,
- systems that do not change the MVP's repeated decisions.

Do not implement every concept from documents `19`–`33`. Those documents preserve long-term direction, not the initial content commitment.

---

# 11. Decision standard for new work

Every proposed task or feature should answer:

1. What player decision does it create or support?
2. Which current MVP system requires it?
3. What persistent state transition does it introduce?
4. How will it be tested deterministically?
5. Is it required before the first operation slice or only before MVP feature completion?
6. What simpler version would prove the same assumption?

Work that cannot answer these questions should be rejected, reduced, or postponed.

---

# 12. Instructions for future sessions

Begin implementation-oriented sessions by reading:

1. `../CONTEXT.md`,
2. `BUILD_ROADMAP.md`,
3. `PROJECT_ARCHITECTURE.md`,
4. the directly relevant MVP or domain documents.

Use `GDD_INDEX.md` to locate supporting design material.

Do not rely on old conversation context when the repository can be checked.
Do not treat long-term design as accepted MVP scope.
Do not create a Codex prompt before the project owner accepts the task scope.
Do not begin the next roadmap task before blocking review findings are resolved.

---

# 13. Immediate next task

The next task is:

> **E4-01 — Finalize the first operation specification and outcome table.**

The task should define a small, stable first operation specification for the first playable path and produce:

- package ownership and dependency boundaries,
- the operation target, cost, duration, requirements, and outcome table,
- deterministic validation and test expectations,
- explicit exclusions for the full operation catalogue, economy simulation, recruitment, pressure systems, rival AI, save/load, and full UI.

E4-01 must not implement operation gameplay. It should prepare the accepted specification for the first vertical-slice implementation tasks.
