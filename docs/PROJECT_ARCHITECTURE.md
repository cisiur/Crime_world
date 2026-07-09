# Project Architecture

## Purpose

This document defines how CrimeWorld is designed and how future design decisions should be made.

It is the project's architecture and planning constitution.

If a future session opens only this document, it should still understand:
- what the game is,
- what the world simulation is supposed to do,
- what kind of systems are allowed,
- what kind of systems should be avoided,
- how new ideas should be evaluated.

## Core identity of the project

CrimeWorld is a grand-strategy crime sandbox built around real cities.

The player starts as a single nobody and builds a criminal organization through planning, recruitment, business control, pressure management, territorial influence, and long-term systemic growth.

The game is not centered on action combat.
It is centered on strategic control, consequences, and emergent stories.

## Fundamental design layers

CrimeWorld should be thought of as stacked layers.

### 1. World layer

The physical and geographic structure of the city.
This comes from real-world map data or a simplified city shell in MVP.

### 2. Simulation layer

The hidden logic of the world:
- districts
- wealth
- corruption
- police pressure
- businesses
- influence
- organizations
- supply chains
- local instability

### 3. Character layer

Important NPCs and the player character.
These characters have goals, loyalties, fears, ambitions, and relationships.

### 4. Organization layer

The player does not really control a list of isolated missions.
The player controls an organization that acts through plans, people, businesses, and influence.

### 5. Event layer

Operations, retaliation, investigations, recruitment, succession crises, and economic changes are the visible results of the simulation.

## Source of truth

The source of truth is the simulation model.

Not the UI.
Not a mission script.
Not a hand-authored quest chain.

If a mechanic cannot be expressed as a meaningful change in the simulation, it probably does not belong in the project.

## Design rules

### Rule 1: Prefer systemic interactions over isolated features

A feature should connect to existing systems.
If it only exists by itself, it is probably weak design.

### Rule 2: Every major system should create decisions

If the player cannot make meaningful choices because of a system, it is probably unnecessary.

### Rule 3: Every system should be both cause and consequence

Good systems change the world and are also changed by the world.

### Rule 4: Prefer abstraction over over-simulation

CrimeWorld should simulate enough to create believable and interesting outcomes.
It should not simulate every detail at full cost.

### Rule 5: Build for replayable stories, not only for numbers

The game should create situations the player remembers and wants to replay.

### Rule 6: Keep the project buildable

If a design idea makes the project too big, too expensive, or too hard to balance, it should be simplified or postponed.

## What the game should not become

CrimeWorld should not drift into:
- a pure action game,
- a pure city builder,
- a pure mission-based crime game,
- a pure political simulator,
- a pure dynasty simulator,
- a pure map visualizer,
- a feature pile with no common structure.

## How to evaluate new ideas

Every new feature proposal should answer these questions:

1. What decision does it create for the player?
2. Which existing systems does it connect to?
3. What kind of emergent story can it generate?
4. What does it cost in complexity?
5. Can it be abstracted without losing the important part?
6. Is it needed for the core loop or only for future expansion?

If a feature fails most of these questions, it should probably be rejected, reduced, or moved out of the current phase.

## Recommended implementation order

### Phase 1: prove the core loop

- one city
- one character
- one organization
- operations
- pressure
- income
- rival response
- save/load
- readable UI

### Phase 2: deepen the simulation

- stronger AI
- better city behavior
- stronger organization structure
- better business interactions
- more meaningful district differences

### Phase 3: expand the scope

- succession
- multiple cities
- regional influence
- broader economic chains
- cross-city logistics

### Phase 4: apply real-world map generation

- OpenStreetMap integration
- city-specific generation rules
- real-world map based strategic variations

## Relationship to other documents

- `docs/PLANNING_ROADMAP.md` is the working memory and navigation guide.
- `docs/GDD_INDEX.md` is the reading order for the design docs.
- `docs/PROJECT_ARCHITECTURE.md` is the top-level philosophy and architecture.
- `docs/19_WORLD_DEPENDENCY_GRAPH.md` should be the next major system model.

## Final principle

The project should be designed like a living simulation first and a game interface second.

The interface exists to let the player read the simulation, influence it, and create stories inside it.
