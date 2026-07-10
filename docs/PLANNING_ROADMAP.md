# Planning Roadmap

## Purpose

This document is the project's working memory.

It exists so that a future session can quickly understand:
- what the game is,
- what has already been decided,
- what is currently in scope,
- what should be planned next,
- what should not be expanded yet.

This document is not a final design bible.
It is the planning guide for how the design bible should continue to evolve.

---

# 1. Project summary

CrimeWorld is a grand-strategy crime sandbox set in real-world cities.
The player starts as a single nobody and builds a criminal organization through planning, recruitment, legal and illegal businesses, pressure management, and territorial influence.

The long-term fantasy is not just crime.
It is the growth of a criminal dynasty or empire that can spread from a district to a city, then to a region, and eventually to larger networks.

The game is entertainment-focused and does not try to be a realistic criminal training simulator.

---

# 2. What has already been decided

## Core fantasy

- The player starts as one character with no power.
- The player grows from a tiny base of operations.
- The player plans actions while NPCs execute them.
- The game is about building an organization, not just completing missions.
- The world should keep reacting even when the player is not directly acting.

## World structure

- Real cities are the strategic board.
- OpenStreetMap is the long-term map source.
- The world is abstracted at strategy level, not fully simulated at interior level.
- Buildings exist as map objects and strategic targets.
- Roads from real maps should matter.

## Gameplay structure

- Time passes continuously.
- Time can be paused and sped up.
- The player starts with one character and a minimal base.
- Operations are the atomic actions of the game.
- Legal and illegal systems are interconnected.
- Pressure systems are broader than simple police heat.

## Progression structure

- The player can grow from small operations to larger influence.
- Expansion is local first, then regional, then global.
- The model is hybrid: local control matters, but reputation, logistics, and reach can carry across regions.

## MVP decisions

- MVP uses one city only.
- MVP should prove the core loop.
- MVP should not include global politics.
- MVP should not include full succession systems.
- MVP should not depend on full OpenStreetMap generation first.
- A controlled map or simplified city shell is acceptable for MVP.
- The start should be difficult but not frustrating.

---

# 3. Existing documentation in the repository

All documents are in `docs/`. Below is the full list organized by category.

## Vision and foundations

- `00_VISION.md` — overall concept and player fantasy
- `01_CORE_PILLARS.md` — non-negotiable design principles
- `GDD_INDEX.md` — entry point and read order for the design bible
- `README.md` — project overview
- `PROJECT_ARCHITECTURE.md` — technical architecture overview

## Core simulation systems (v1)

- `02_WORLD_SIMULATION.md` — how the world works as a simulation
- `03_ECONOMY.md` — money, sectors, and influence
- `04_ORGANIZATIONS.md` — criminal groups and rivals
- `05_NPCS.md` — important character simulation
- `06_SUCCESSION.md` — death, prison, heirs, internal power struggles
- `07_GAMEPLAY_LOOP.md` — early to late game flow
- `08_INFLUENCE_AND_EXPANSION.md` — local, regional, and global influence
- `09_OPERATIONS.md` — the action system
- `10_POLICE_AND_PRESSURE.md` — the reaction systems
- `11_CITY_GENERATION.md` — converting real map data into gameplay
- `12_UI_AND_CONTROLS.md` — interface and player controls
- `13_SAVE_AND_SIMULATION_TICKS.md` — save structure and time ticks

## MVP documents

- `14_MVP_SCOPE.md` — what the MVP must prove and what it excludes
- `15_MVP_GAME_LOOP.md` — the playable loop for MVP
- `16_MVP_CONTENT_LIST.md` — content required for MVP
- `17_MVP_TECH_PLAN.md` — technology and implementation plan for MVP
- `18_MVP_BALANCING.md` — balance targets and tuning principles

## Deep system models (v2 — added after initial MVP planning)

- `19_WORLD_DEPENDENCY_GRAPH.md` — full dependency graph of all game systems
- `20_LIVING_WORLD_BEHAVIOR.md` — how the world behaves without player input
- `21_AI_PRIORITY_MODEL.md` — how organizations, gangs, and police choose actions
- `22_CRIME_ECOSYSTEM.md` — criminal supply chains and the illegal economy
- `23_EMERGENT_STORY_SYSTEM.md` — how memorable stories emerge from systems

## City, district, and organization models (v3 — current layer)

- `24_CITY_ECONOMY_MODEL.md` — how the city generates and distributes economic value
- `25_DISTRICT_MODEL.md` — districts as local simulation nodes with strategic identity
- `26_ORGANIZATION_MODEL.md` — organizations as living strategic entities
- `27_OPERATION_MODEL.md` — operations as the active link between organizations and the world
- `28_PRESSURE_REACTION_MODEL.md` — how the city, institutions, and rivals react to pressure

---

# 4. Design layer summary

The documentation has been built in three layers.

| Layer | Documents | What it establishes |
|---|---|---|
| v1 — Core | 00–13 | Vision, world rules, core systems, UI, save |
| MVP | 14–18 | Scope, loop, content, tech, balance |
| v2 — Deep models | 19–23 | Dependency graph, living world, AI, crime economy, story |
| v3 — Component models | 24–28 | City, district, organization, operation, pressure |

The v3 layer closes the loop between the abstract systems (v1/v2) and the concrete mechanics that will be implemented.

---

# 5. What still needs to be designed

The v3 layer is now complete for the core simulation.
The following areas remain open.

## A. Player model

A dedicated document defining the player character as a game entity.

Questions to answer:
- What stats or properties does the player character have?
- How does the player grow and change over time?
- What does the player risk personally (arrest, death, betrayal)?
- How does the player character differ from NPC bosses?
- What is the player's relationship to their organization?

## B. Diplomacy and inter-organization relations

Organizations interact with each other and with the player.
A dedicated document is needed for how these relationships are modeled.

Questions to answer:
- What relationship states exist between organizations (neutral, allied, hostile, subordinate)?
- How are truces, deals, and betrayals structured?
- How do organizations negotiate?
- How does reputation affect diplomatic options?
- Can the player use diplomacy offensively?

## C. Progression and unlock model

How does the player advance beyond the early game?

Questions to answer:
- What gates late-game content (scale, reputation, influence, time)?
- How does the organization grow in capability, not just size?
- Are there research or upgrade trees?
- How do milestones work?

## D. Endgame and win/loss conditions

What does it mean to win, lose, or end a campaign?

Questions to answer:
- Is the game open-ended or does it have campaign goals?
- What causes a game over?
- What constitutes a meaningful victory?
- Can the player recover from near-collapse?

## E. Technical architecture update

`PROJECT_ARCHITECTURE.md` should be reviewed and updated to reflect the v3 models.

Questions to answer:
- How do the component models (district, organization, operation, pressure) map to code modules?
- What is the data model for each component?
- How are ticks structured now that operations, pressure, and districts interact?

---

# 6. Current design philosophy

## Avoid overbuilding isolated systems

A new feature should only be added if it creates a meaningful decision or a new strategic interaction.

## Prefer dependencies over standalone bonuses

A system should be both a cause and a consequence.

## Prefer abstraction over over-simulation

The game should simulate enough to create interesting outcomes, but not so much that the project becomes impossible to build.

## Prefer one strong loop over many weak loops

The core loop is more important than content volume.

## Build the game as a simulation first

The UI, mission structure, and content are only interfaces to the simulation.

---

# 7. Recommended next planning steps

## Step 1: Player model

Create `29_PLAYER_MODEL.md`.
Define the player character as a concrete entity within the simulation — properties, risks, growth, and relationship to the organization.

## Step 2: Diplomacy model

Create `30_DIPLOMACY_MODEL.md`.
Define how organizations form alliances, negotiate, betray, and compete diplomatically.

## Step 3: Progression and unlock model

Create `31_PROGRESSION_MODEL.md`.
Define how the player advances from small crew to major power — what gates growth and how capability expands.

## Step 4: Endgame conditions

Create `32_ENDGAME_MODEL.md`.
Define win/loss states, campaign goals, and recovery mechanics.

## Step 5: MVP validation pass

After steps 1–4 are clear, revisit `14_MVP_SCOPE.md` and `15_MVP_GAME_LOOP.md`.
Verify that the MVP still proves the correct core loop given the deeper models now in place.

## Step 6: Technical architecture update

Update `PROJECT_ARCHITECTURE.md` to align with the v3 component models.

---

# 8. What should not happen yet

Do not expand into:
- multi-country politics,
- global warfare systems,
- full dynasty simulation,
- advanced family trees,
- huge OSM technical work before the core loop is proven,
- dozens of business types,
- dozens of organization archetypes,
- large-scale systems that do not change player decisions.

---

# 9. Session instructions for future work

When continuing this project in a new session, begin by reading:
1. `docs/PLANNING_ROADMAP.md` (this file)
2. `docs/GDD_INDEX.md`
3. `docs/27_OPERATION_MODEL.md` and `docs/28_PRESSURE_REACTION_MODEL.md` — the most recently completed documents

Then continue from the next unresolved planning step in section 7 above.

Do not add random new features.
Do not restart from scratch.
Always build on what exists.

The current priority order is:
- player model,
- diplomacy model,
- progression model,
- endgame conditions,
- MVP validation pass.
