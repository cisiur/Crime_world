# MVP Technical Plan

## Goal

This document describes the technical shape of the MVP so the project stays buildable.

## Core technical principle

The MVP should be built with layered simulation and heavy abstraction.

Do not simulate everything.
Simulate only what the player can meaningfully interact with.

## Simulation layers

### Layer 1: Map layer

- city geometry
- roads
- major buildings
- district boundaries
- navigation and selection

### Layer 2: Strategic layer

- districts
- businesses
- organizations
- police pressure
- influence
- active operations

### Layer 3: Character layer

- player character
- key NPCs
- recruits
- rivals
- police leaders

### Layer 4: Event layer

- operations
- arrests
- retaliation
- income events
- pressure changes
- territory changes

## Update frequency

Different systems should update at different rates.

### High frequency
- active operations
- player decisions
- immediate combat or encounter resolution if present

### Medium frequency
- district pressure
- business income
- recruitment progress
- police investigations

### Low frequency
- reputation shifts
- organization evolution
- rival strategic moves
- map-wide background changes

## Performance rule

The MVP must stay lightweight enough to run on a single city without heavy simulation costs.

## Technical shortcuts allowed in MVP

- placeholder map instead of full OSM parsing
- simple district generation rules
- limited NPC simulation for non-key characters
- simplified economy model
- abstract business ownership
- batch updates instead of continuous per-entity simulation

## Systems to avoid in MVP code

- country-scale simulation
- deep family simulation
- global politics
- advanced media model
- massive world persistence complexity
- complex real-time logistics across multiple cities

## Data model priorities

The save format should prioritize:
- player state
- organization state
- district state
- business state
- NPC state
- operations state
- police pressure state

## Prototype recommendation

Build the MVP in this order:
1. map and city shell
2. district system
3. player and organization state
4. simple operations
5. income and pressure loops
6. rival AI
7. save/load
8. UI pass

## Design goal

The technical plan should make the MVP small enough to finish and clear enough to extend later into the full OSM-based vision.
