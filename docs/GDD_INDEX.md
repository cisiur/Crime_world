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

The high-level game design, MVP definition, implementation architecture, repository foundation, deterministic domain kernel, controlled city shell, and characters-and-organizations foundation are complete.

The project has moved from characters-and-organizations implementation into EPIC 4 availability planning.

E4-01 is complete as documentation only. E4-02 is complete as a schema-only implementation. The accepted first operation is **Local Collection**, and its authoritative detailed specification is recorded under EPIC 4 in `BUILD_ROADMAP.md`. No EPIC 4 gameplay implementation exists yet.

Current priority:

1. implement operation availability and prerequisite evaluation for Local Collection,
2. use the accepted Local Collection specification in `BUILD_ROADMAP.md` and the E4-02 schemas as the source of truth,
3. preserve the existing package boundaries,
4. reuse derived character availability and existing organization state,
5. avoid expanding into the full operation catalogue, economy simulation, recruitment, pressure systems, rival AI, save/load, or full UI before their accepted tasks.

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
