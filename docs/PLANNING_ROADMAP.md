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

## Vision and foundations

- `docs/00_VISION.md`
- `docs/01_CORE_PILLARS.md`
- `docs/GDD_INDEX.md`

## Simulation and systems

- `docs/02_WORLD_SIMULATION.md`
- `docs/03_ECONOMY.md`
- `docs/04_ORGANIZATIONS.md`
- `docs/05_NPCS.md`
- `docs/06_SUCCESSION.md`
- `docs/07_GAMEPLAY_LOOP.md`
- `docs/08_INFLUENCE_AND_EXPANSION.md`
- `docs/09_OPERATIONS.md`
- `docs/10_POLICE_AND_PRESSURE.md`
- `docs/11_CITY_GENERATION.md`
- `docs/12_UI_AND_CONTROLS.md`
- `docs/13_SAVE_AND_SIMULATION_TICKS.md`

## MVP documents

- `docs/14_MVP_SCOPE.md`
- `docs/15_MVP_GAME_LOOP.md`
- `docs/16_MVP_CONTENT_LIST.md`
- `docs/17_MVP_TECH_PLAN.md`
- `docs/18_MVP_BALANCING.md`

---

# 4. What still needs to be designed

This is the current open planning list.

## A. Living World Bible

We still need a document that explains how the world behaves when the player is not actively interacting with it.

Questions to answer:
- What does a district do over time?
- How do gangs behave without player input?
- How does a city evolve organically?
- What background changes happen between sessions?
- How do businesses, police, and organizations move independently?

## B. AI Bible

We still need a deeper model for how important NPCs and organizations make decisions.

Questions to answer:
- What are the AI priorities?
- How do organizations choose targets?
- How do police decide where to focus?
- How do rivals expand, defend, retaliate, or negotiate?
- How do important NPCs weigh risk, profit, loyalty, and fear?

## C. Story Generator / Emergence Bible

We still need a document describing how memorable stories emerge from systems rather than from fixed quests.

Questions to answer:
- What kinds of long-term story arcs can emerge naturally?
- How do betrayals happen?
- How do succession crises happen?
- How do rivalries evolve across years?
- How can the game create repeatable but different campaigns?

## D. Psychological Model

We still need a deeper model for important characters.

Questions to answer:
- Which character traits matter most?
- How do fear, ambition, greed, loyalty, stress, trauma, and family change behavior?
- How do these traits affect alliance stability and betrayal risk?

## E. Crime System Bible

We still need a more complete system description of the criminal ecosystem itself.

Questions to answer:
- How do illegal goods move?
- Where do resources come from?
- What are the main criminal supply chains?
- How does laundering work in the game model?
- How do different crime types connect to the economy?

## F. Economy Graph

We need to define the actual dependency graph of the game.

Questions to answer:
- Which systems cause which other systems?
- Which systems reinforce each other?
- Which systems create risk, opportunity, or scarcity?
- Which dependencies are local and which are global?

This is likely the most important next planning step.

---

# 5. Current design philosophy

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

# 6. Recommended next planning steps

## Step 1: Economy graph

Create a full dependency graph of the city/world economy.
This should show how goods, money, pressure, businesses, logistics, crime, corruption, and police influence one another.

## Step 2: Living world behavior

Define what happens each day or tick when the player does nothing.

## Step 3: AI priorities

Define how gangs, police, and important NPCs choose actions.

## Step 4: Crime ecosystem

Define the criminal supply chains and how the illegal economy plugs into the legal one.

## Step 5: Story emergence

Define what kinds of organic narratives the system should be able to produce.

## Step 6: MVP validation pass

After the above is clear, revisit the MVP and check whether it still proves the correct core loop.

---

# 7. What should not happen yet

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

# 8. Session instructions for future work

When continuing this project in a new session, begin by checking:
1. `docs/PLANNING_ROADMAP.md`
2. `docs/GDD_INDEX.md`
3. the current MVP documents

Then continue the design from the next unresolved planning step, not by adding random new features.

The current priority order is:
- economy graph,
- living world behavior,
- AI priorities,
- crime ecosystem,
- story emergence.
