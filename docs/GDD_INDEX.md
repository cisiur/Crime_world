# GDD Index

This file is the entry point to the CrimeWorld design documentation.

For active implementation work, begin with:

1. `../CONTEXT.md` — current project state and AI-assisted workflow
2. `BUILD_ROADMAP.md` — implementation epics and accepted build order
3. `PROJECT_ARCHITECTURE.md` — architecture constitution
4. this index — full game-design reading order

## Recommended read order

### Vision and foundations

1. `00_VISION.md` — overall concept and player fantasy
2. `01_CORE_PILLARS.md` — non-negotiable design principles

### Core simulation systems

3. `02_WORLD_SIMULATION.md` — how the world functions as a simulation
4. `03_ECONOMY.md` — money, sectors, and influence
5. `04_ORGANIZATIONS.md` — criminal groups and rivals
6. `05_NPCS.md` — important character simulation
7. `06_SUCCESSION.md` — death, prison, heirs, and internal power struggles
8. `07_GAMEPLAY_LOOP.md` — early-to-late game flow
9. `08_INFLUENCE_AND_EXPANSION.md` — local, regional, and global influence
10. `09_OPERATIONS.md` — the action system
11. `10_POLICE_AND_PRESSURE.md` — law enforcement and reaction systems
12. `11_CITY_GENERATION.md` — converting map data into gameplay
13. `12_UI_AND_CONTROLS.md` — interface and player controls
14. `13_SAVE_AND_SIMULATION_TICKS.md` — save structure and simulation timing

### MVP definition

15. `14_MVP_SCOPE.md` — what the MVP must prove and what it excludes
16. `15_MVP_GAME_LOOP.md` — the first playable loop
17. `16_MVP_CONTENT_LIST.md` — content required for the MVP
18. `17_MVP_TECH_PLAN.md` — implementation plan for the MVP
19. `18_MVP_BALANCING.md` — balance targets and tuning principles

### Deep simulation models

20. `19_WORLD_DEPENDENCY_GRAPH.md` — dependency graph of the game systems
21. `20_LIVING_WORLD_BEHAVIOR.md` — how the world behaves without player input
22. `21_AI_PRIORITY_MODEL.md` — how organizations and institutions select actions
23. `22_CRIME_ECOSYSTEM.md` — criminal supply chains and the illegal economy
24. `23_EMERGENT_STORY_SYSTEM.md` — how memorable stories emerge from systems

### Component models

25. `24_CITY_ECONOMY_MODEL.md` — how the city generates and distributes economic value
26. `25_DISTRICT_MODEL.md` — districts as local simulation nodes
27. `26_ORGANIZATION_MODEL.md` — organizations as living strategic entities
28. `27_OPERATION_MODEL.md` — operations as the link between organizations and the world
29. `28_PRESSURE_REACTION_MODEL.md` — layered reaction of institutions, districts, and rivals
30. `29_PLAYER_MODEL.md` — the player character as a vulnerable entity inside the simulation
31. `30_DIPLOMACY_MODEL.md` — relations, deals, coercion, alliances, and betrayal
32. `31_PROGRESSION_MODEL.md` — growth through capability, access, people, and influence
33. `32_ENDGAME_MODEL.md` — endless play, collapse, recovery, succession, and optional goals
34. `33_ORGANIZATION_HISTORY_AND_LEGACY.md` — campaign history, reigns, legends, and organizational memory

## Supporting project documents

- `../README.md` — repository overview and primary entry points
- `../CONTEXT.md` — current implementation context and PM / Codex workflow
- `BUILD_ROADMAP.md` — executable implementation roadmap
- `PROJECT_ARCHITECTURE.md` — architecture philosophy and boundaries
- `PLANNING_ROADMAP.md` — design-planning history and constraints

## Current project status

The high-level game design, MVP definition, implementation architecture, repository foundation, deterministic domain kernel, controlled city shell, characters-and-organizations foundation, and first Local Collection operation vertical slice are complete.

The project has completed EPIC 4 and is now in EPIC 5.

E4-01 is complete as documentation only. E4-02 is complete as a schema-only implementation. E4-03 is complete as availability/prerequisite evaluation. E4-04 is complete as deterministic domain planning and resource reservation for Local Collection. E4-05 is complete as deterministic operation lifecycle timing for `planned -> running -> resolved`. E4-06 is complete as seeded weighted operation outcome rolling. E4-07 is complete as typed Local Collection outcome classification. E4-08 is complete as bounded Local Collection consequence application. E4-09 is complete as deterministic full vertical-slice integration coverage. E4-10 is complete as a developer playtest UI runnable in the desktop/browser shell. The accepted first operation is **Local Collection**, and its authoritative detailed specification is recorded under EPIC 4 in `BUILD_ROADMAP.md`.

Local Collection now has a canonical authored template, validated availability, planning, lifecycle, deterministic outcome classification, immediate consequences, deterministic integration coverage, and a developer playtest UI. Deterministic planning creates planned operations, reserves the assigned character, reserves operational capacity, records the start cost through the money ledger, and emits semantic planning events. Lifecycle timing advances operations through the existing `planned`, `running`, and `resolved` statuses. Seeded weighted rolling uses the central resolver and existing deterministic random service. Typed outcome classification maps Local Collection rolls to `success`, `partial-success`, `failure`, or `critical-failure`, with canonical authored probabilities `45/30/20/5` in `packages/content`. Consequence application applies the accepted gross reward, exposure delta, critical-failure injury, assignment release, capacity release, and applied-consequence record without consuming RNG. Accepted consequence values are `success +80 money/+4 exposure/no injury`, `partial-success +40/+10/no injury`, `failure 0/+14/no injury`, and `critical-failure 0/+25/healthy -> injured`; fixed deterministic seeds are `32 -> success roll 1`, `153 -> partial-success roll 46`, `20 -> failure roll 76`, and `64 -> critical-failure roll 96`.

E5-01 is complete as a documentation/specification task only. The accepted money-flow, upkeep, and transaction-ledger contract is recorded authoritatively in `BUILD_ROADMAP.md`. E5-02 is complete after bounded increments E5-02A through E5-02F: the standalone domain money-ledger foundation exists, Local Collection start cost and non-zero gross rewards use it, the recurring cost foundation exists, the first application recurring runtime exists, the crew-upkeep flow can generate schedules and execute one due period for one explicit character, and the MVP recurring-income flow can generate one schedule per organization and execute one due period. Global tick-loop economy integration, business gameplay, business and hideout upkeep, and production UI remain unimplemented.

This is an implemented developer vertical slice plus accepted EPIC 5 financial specification, ledger, Local Collection ledger migration, recurring schedule, crew-upkeep, and provisional organization-level recurring-income flows. It is not final balance, business income, a complete economy, a reusable operation catalogue, a full campaign loop, final UI, or player-facing production readiness. Campaign creation, root `GameState` operation integration, global tick-loop economy execution, save/load, recruitment, pressure/investigation systems, rival AI, business archetypes, business gameplay, and reusable operation catalogue expansion remain unimplemented.

Previous documentation synchronization baseline after E4-05 through E4-07:

```text
718307042f58bf86528a5235a758d558f75f260d
```

Accepted gameplay implementation baseline through E4-08, E4-09, and E4-10:

```text
9769a6ba3a9ba06559a3c81bc6536b054e519ab1
```

Current priority:

1. review and accept E5-03 before implementation,
2. build on the accepted E5-01 money-flow, upkeep, and transaction-ledger contract plus the E5-02A through E5-02F foundation,
3. preserve the existing package boundaries, including no `packages/content` dependency from `packages/domain`,
4. keep business control, recruitment, pressure systems, rival AI, save/load, campaign creation, and final UI pending until their accepted tasks.

Do not add another large design system unless implementation reveals a real design gap.

## Reading paths

### To understand the game vision quickly

Read:
- `00_VISION.md`
- `01_CORE_PILLARS.md`
- `07_GAMEPLAY_LOOP.md`
- `14_MVP_SCOPE.md`
- `15_MVP_GAME_LOOP.md`

### To understand the simulation architecture

Read:
- `PROJECT_ARCHITECTURE.md`
- `17_MVP_TECH_PLAN.md`
- `19_WORLD_DEPENDENCY_GRAPH.md`
- `20_LIVING_WORLD_BEHAVIOR.md`
- `21_AI_PRIORITY_MODEL.md`
- `24_CITY_ECONOMY_MODEL.md`
- `25_DISTRICT_MODEL.md`
- `26_ORGANIZATION_MODEL.md`
- `27_OPERATION_MODEL.md`
- `28_PRESSURE_REACTION_MODEL.md`

### To implement the MVP

Read:
- `../CONTEXT.md`
- `BUILD_ROADMAP.md`
- `PROJECT_ARCHITECTURE.md`
- `14_MVP_SCOPE.md`
- `15_MVP_GAME_LOOP.md`
- `16_MVP_CONTENT_LIST.md`
- `17_MVP_TECH_PLAN.md`
- `18_MVP_BALANCING.md`

### To understand long-term campaign play

Read:
- `06_SUCCESSION.md`
- `29_PLAYER_MODEL.md`
- `30_DIPLOMACY_MODEL.md`
- `31_PROGRESSION_MODEL.md`
- `32_ENDGAME_MODEL.md`
- `33_ORGANIZATION_HISTORY_AND_LEGACY.md`

## Maintenance rule

Whenever implementation changes scope, architecture, or accepted behavior, review:

- `../CONTEXT.md`,
- `BUILD_ROADMAP.md`,
- `PROJECT_ARCHITECTURE.md`,
- and the directly affected design document.

Documentation must not claim that implementation exists before a post-push review confirms it.
