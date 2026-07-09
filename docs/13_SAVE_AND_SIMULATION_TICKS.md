# Save System and Simulation Ticks

## Purpose

The game needs a reliable way to save a living simulation with many interacting systems.

## Time model

The game uses a continuous simulation with pause and speed controls.

Suggested speeds:
- paused
- 1x
- 2x
- 4x
- 8x

## Tick philosophy

Not every system needs to update every frame.
Different systems can update at different tick frequencies depending on importance and cost.

Examples:
- map reading can update slowly,
- local districts can update on a regular schedule,
- important NPCs can update more often,
- background organizations can update in batches.

## Save layers

The save should store:
- world geometry reference
- generated city state
- districts
- businesses
- organizations
- NPCs
- relationships
- pressure systems
- player state
- succession state
- active operations

## Persistence goal

A saved game should preserve the story state, not just static numbers.

The save file must be able to restore:
- ongoing conflicts
- active relationships
- unfinished operations
- pressure and investigation state
- inherited leadership structures
