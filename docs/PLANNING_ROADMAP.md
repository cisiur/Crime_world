# Planning Roadmap

## Purpose

This document is the project's working memory.

It records:
- what CrimeWorld is,
- what has already been decided,
- which design layers are complete,
- what is currently in scope,
- what should be planned or implemented next,
- and what should not be expanded yet.

This is not the final design bible. It is the planning guide that keeps future work aligned with the current project state.

---

# 1. Project summary

CrimeWorld is an open-ended grand-strategy crime sandbox set in real-world-inspired cities.

The player begins as a single unknown character and builds a criminal organization through planning, recruitment, legal and illegal businesses, pressure management, diplomacy, territorial influence, succession, and long-term organizational survival.

The long-term fantasy is not merely committing crimes. It is building and maintaining an organization that can survive leadership changes, collapse, betrayal, institutional pressure, and decades of history.

The game is entertainment-focused and must not become a realistic criminal training simulator.

---

# 2. Core decisions already established

## Core fantasy

- The player starts as one character with no meaningful power.
- The player plans actions while NPCs and crews execute most operations.
- The player is a vulnerable character inside the simulation, not a detached cursor.
- The game is about building an organization, not completing a linear mission campaign.
- The world continues to act and react without waiting for the player.
- The organization can outlive individual bosses through succession.

## World structure

- Cities are the strategic board.
- OpenStreetMap is the long-term map source, but it is not a prerequisite for the first playable version.
- The world is abstracted at strategy level rather than simulated as detailed interiors.
- Buildings, roads, districts, businesses, routes, and institutions are strategic objects.
- Districts are local simulation nodes with distinct economic, political, social, and criminal identities.

## Gameplay structure

- Time passes continuously and can be paused or accelerated.
- Operations are the atomic intentional actions of organizations.
- Economy, crime, legal business, diplomacy, pressure, and territorial influence are interconnected.
- Pressure is broader than a single police heat meter.
- Outcomes are not purely binary and should create world-state consequences.
- Growth increases capability while also creating exposure, complexity, and new threats.

## Campaign structure

- CrimeWorld is an endless sandbox without a mandatory victory condition.
- Optional milestones recognize achievements but do not end or fundamentally alter the campaign.
- Bankruptcy, imprisonment, loss of territory, and organizational collapse are recoverable setbacks.
- The only true game-over condition is the death of the current boss when no valid successor or transfer mechanism exists.
- Organization history, leadership reigns, wars, betrayals, collapse, and recovery should persist as campaign memory.

## MVP decisions

- MVP uses one controlled city or city shell.
- MVP must prove the loop of planning, operations, growth, pressure, reaction, and survival.
- MVP does not need full OpenStreetMap generation.
- MVP does not need full dynasty, family, global politics, or multi-city systems.
- MVP should contain only enough content to validate repeated strategic decisions.
- The start should be difficult and vulnerable without becoming arbitrary or frustrating.

---

# 3. Documentation status

## Vision and foundations

Completed:
- `00_VISION.md`
- `01_CORE_PILLARS.md`

## Core simulation systems

Completed:
- `02_WORLD_SIMULATION.md`
- `03_ECONOMY.md`
- `04_ORGANIZATIONS.md`
- `05_NPCS.md`
- `06_SUCCESSION.md`
- `07_GAMEPLAY_LOOP.md`
- `08_INFLUENCE_AND_EXPANSION.md`
- `09_OPERATIONS.md`
- `10_POLICE_AND_PRESSURE.md`
- `11_CITY_GENERATION.md`
- `12_UI_AND_CONTROLS.md`
- `13_SAVE_AND_SIMULATION_TICKS.md`

## Existing MVP planning

Present but requiring validation and revision:
- `14_MVP_SCOPE.md`
- `15_MVP_GAME_LOOP.md`
- `16_MVP_CONTENT_LIST.md`
- `17_MVP_TECH_PLAN.md`
- `18_MVP_BALANCING.md`

## Deep simulation models

Completed:
- `19_WORLD_DEPENDENCY_GRAPH.md`
- `20_LIVING_WORLD_BEHAVIOR.md`
- `21_AI_PRIORITY_MODEL.md`
- `22_CRIME_ECOSYSTEM.md`
- `23_EMERGENT_STORY_SYSTEM.md`

## Component and campaign models

Completed:
- `24_CITY_ECONOMY_MODEL.md`
- `25_DISTRICT_MODEL.md`
- `26_ORGANIZATION_MODEL.md`
- `27_OPERATION_MODEL.md`
- `28_PRESSURE_REACTION_MODEL.md`
- `29_PLAYER_MODEL.md`
- `30_DIPLOMACY_MODEL.md`
- `31_PROGRESSION_MODEL.md`
- `32_ENDGAME_MODEL.md`
- `33_ORGANIZATION_HISTORY_AND_LEGACY.md`

---

# 4. Design layer summary

| Layer | Documents | Status | Purpose |
|---|---|---|---|
| Vision | 00–01 | Complete | Defines the fantasy and non-negotiable principles |
| Core systems | 02–13 | Complete at high level | Defines the original simulation and player-facing systems |
| MVP planning | 14–18 | Needs validation | Defines the first playable version, but predates later models |
| Deep models | 19–23 | Complete at design level | Connects the world, AI, criminal economy, and emergent stories |
| Component models | 24–30 | Complete at design level | Defines city, district, organization, operations, pressure, player, and diplomacy |
| Campaign models | 31–33 | Complete at design level | Defines progression, endless play, succession continuity, and historical memory |

The high-level design phase is sufficiently complete to stop adding broad systems.

The project should now move from design expansion toward scope validation, technical alignment, and implementation planning.

---

# 5. Current priority: MVP validation pass

The next task is to revise documents `14`–`18` against the completed models `24`–`33`.

The MVP must answer one central question:

> Is the repeated loop of identifying an opportunity, planning and assigning an operation, receiving an outcome, managing pressure, reacting to rivals, and expanding capability compelling enough to support repeated play?

## MVP validation goals

The revised MVP documents must define:
- the exact starting state,
- the minimum map and district structure,
- the minimum player and organization data,
- the first available operations,
- operation planning and assignment,
- basic economic flows,
- the minimum rival AI loop,
- the minimum pressure and reaction loop,
- the first meaningful expansion decision,
- collapse and recovery boundaries,
- the first-session success criteria,
- and explicit exclusions.

## MVP inclusion principle

A system belongs in MVP only if it is required to prove the core strategic loop.

A system should be excluded or simplified if it mainly supports:
- long campaigns,
- multi-generation continuity,
- regional or global scale,
- advanced politics,
- large content variety,
- or simulation depth that does not change the first repeated decisions.

## Likely MVP simplifications

The validation pass should assume:
- one player character,
- one small player organization,
- a small number of districts,
- a limited set of buildings and businesses,
- one or two meaningful rivals,
- a small operation catalogue,
- simplified diplomacy,
- simplified personal exposure,
- simplified pressure reactions,
- no full succession gameplay,
- no multi-city expansion,
- no full organization history UI,
- and a controlled map rather than full OSM generation.

---

# 6. Required planning sequence

## Step 1: Revise MVP scope

Update `14_MVP_SCOPE.md`.

It must clearly define:
- the exact systems included,
- the systems represented only in simplified form,
- the systems excluded,
- and the measurable questions the MVP is meant to answer.

## Step 2: Revise MVP game loop

Update `15_MVP_GAME_LOOP.md`.

It must define:
- the starting situation,
- the first opportunities,
- the operation planning flow,
- world reaction timing,
- the first expansion choice,
- and a complete first-session arc.

## Step 3: Revise MVP content list

Update `16_MVP_CONTENT_LIST.md`.

It must specify a finite initial content budget, including:
- districts,
- organizations,
- NPC roles,
- businesses,
- operations,
- events,
- pressure reactions,
- and UI screens.

## Step 4: Revise MVP balancing

Update `18_MVP_BALANCING.md`.

It must define:
- operation durations,
- income and cost scales,
- pressure accumulation and decay,
- recruitment pacing,
- failure recovery,
- and expected session progression.

Numbers may remain provisional, but all important tuning relationships must be explicit.

## Step 5: Update technical architecture

Review and update:
- `17_MVP_TECH_PLAN.md`
- `PROJECT_ARCHITECTURE.md`

The architecture must map the validated MVP into concrete modules, data structures, simulation order, save state, and implementation boundaries.

## Step 6: Create implementation backlog

After the documents above are aligned, create a concrete development backlog organized into small testable vertical slices.

The first implementation slice should prove one complete operation cycle rather than build disconnected foundations.

---

# 7. MVP validation questions

The next documentation pass must resolve these questions.

## Starting state

- Does the player begin alone or with one helper?
- What assets and money exist at campaign start?
- What creates the first opportunity?
- Which risks are already active?

## First operations

- Which operation types best demonstrate planning, assignment, reward, and pressure?
- How much information is known before committing?
- Which resources and crew properties matter in the first version?
- How are partial success and failure represented?

## Rival behavior

- What is the smallest AI model that creates readable competition?
- Can rivals recruit, earn, operate, expand, and react using the same core rules?
- Which rival actions must be visible to the player?

## Pressure and recovery

- Which pressure layers are necessary in MVP?
- How quickly should consequences appear?
- What tools allow the player to stabilize after mistakes?
- How much failure is recoverable before the run becomes strategically lost?

## Expansion

- What is the first meaningful growth decision?
- Does the player recruit, acquire a business, claim influence, or establish a second operating location first?
- How does expansion increase both capability and risk?

## Session outcome

- What state represents a successful stabilized first run?
- What conditions create a soft failure without immediate game over?
- What should motivate the player to start another run?

---

# 8. Technical alignment requirements

The technical plan must eventually define at least these MVP entities:
- World
- City
- District
- Building or strategic location
- Character
- Organization
- Membership or role
- Business or income source
- Operation
- Opportunity
- Relationship
- Pressure state
- Investigation or reaction event
- Historical event record

It must also define:
- simulation tick order,
- operation lifecycle,
- AI decision cadence,
- event generation,
- save determinism,
- random seed handling,
- and which data is configuration-driven.

The architecture should preserve future extensibility without implementing non-MVP systems prematurely.

---

# 9. What should not happen yet

Do not add more broad design documents unless the MVP validation uncovers a specific missing dependency.

Do not expand into:
- multi-country politics,
- global warfare,
- detailed international law enforcement,
- advanced family trees,
- full dynasty simulation,
- large-scale historical-era simulation,
- full OSM generation before the controlled-map loop works,
- dozens of business categories,
- dozens of organization archetypes,
- advanced banking or financial-market simulation,
- detailed tactical combat,
- or systems that do not change the MVP's core decisions.

Do not implement every concept from documents `24`–`33` in the MVP.
Those documents define the long-term architecture, not the initial content commitment.

---

# 10. Current design philosophy

## Prefer a complete vertical loop over disconnected systems

The first playable build should let the player make one meaningful plan, execute it, receive consequences, and respond.

## Prefer dependencies over isolated bonuses

A mechanic should be both a cause and a consequence inside the simulation.

## Prefer abstraction over unbounded simulation

Simulate only enough detail to produce readable, interesting decisions and emergent outcomes.

## Preserve player agency under failure

Most setbacks should change the player's strategic position rather than immediately terminate the campaign.

## Make growth transform problems

Progression should replace early survival problems with coordination, exposure, dependency, and stability problems.

## Keep the interface explainable

The player should understand why an option is available, why an operation is risky, and why the world reacted.

---

# 11. Instructions for future sessions

When continuing this project, begin by reading:

1. `docs/PLANNING_ROADMAP.md`
2. `docs/GDD_INDEX.md`
3. `docs/14_MVP_SCOPE.md`
4. `docs/15_MVP_GAME_LOOP.md`
5. `docs/27_OPERATION_MODEL.md`
6. `docs/28_PRESSURE_REACTION_MODEL.md`
7. `docs/31_PROGRESSION_MODEL.md`

Then continue with the next unfinished step from section 6.

Do not restart the design from scratch.
Do not add random systems.
Do not treat every long-term design document as MVP scope.
Always build on the established model and move toward a testable playable loop.

---

# 12. Immediate next task

The next task is:

> Perform the MVP validation pass beginning with `14_MVP_SCOPE.md`.

Before rewriting the file, compare the existing MVP assumptions against the completed operation, pressure, player, diplomacy, progression, endgame, and legacy models.

The output should be a narrow, measurable MVP scope that can be translated into technical architecture and an implementation backlog.