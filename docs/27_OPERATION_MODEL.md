# Operation Model

## Purpose

This document describes how criminal organizations execute actions in the world.

Operations are the link between organization structure and world impact.
Without operations, an organization is a static list of properties.
With operations, it becomes an active force that changes the city.

## Core idea

An operation is an intentional action taken by an organization
to achieve a specific goal in a specific place at a specific time.

Operations consume resources, create risk, and produce outcomes.
Outcomes change the city — or fail trying.

## Operation properties

Each operation should have:
- type
- target (district, business, person, route, or rival)
- assigned assets (crew members, vehicles, resources)
- cost (money, manpower, exposure)
- duration
- success probability
- risk level
- outcome (success, partial success, failure, critical failure)
- visibility (how much heat it generates)

## Operation types

### Income operations
Operations that extract value from the city.
- protection racket — demand payments from businesses
- drug distribution run — move product through a district
- loan sharking collection — collect from debtors
- gambling income — run an illegal gambling spot
- smuggling run — move goods across territory

### Control operations
Operations that expand or defend territorial presence.
- takeover bid — pressure a district asset to submit
- rival disruption — sabotage a competing organization
- supply chain lock — cut off a rival's resources
- corruption payment — keep an official on the payroll
- intimidation campaign — lower civilian resistance in an area

### Intelligence operations
Operations that gather information.
- surveillance — observe a target or rival activity
- informant recruitment — turn someone into an asset
- counter-intelligence — detect infiltration or leaks
- police monitoring — track law enforcement movement

### Crisis operations
Operations triggered in response to external pressure.
- evidence destruction — remove traces before a police move
- retaliation strike — respond to an attack by a rival
- extraction — pull a compromised member out safely
- bribe under pressure — pay to suppress an active investigation

### Investment operations
Operations that build long-term capacity.
- front business establishment — create a legitimate cover
- recruitment drive — grow the crew
- safe house setup — secure a location for future use
- weapon acquisition — improve operational capability

## Operation flow

1. Organization identifies a goal
2. Goal is matched to an operation type
3. Assets are assigned (crew, money, vehicles)
4. Operation runs over a time window (ticks)
5. Outcome is resolved based on probability, assets, and context
6. World state is updated
7. Heat and reputation change accordingly

## Outcome resolution

Outcomes should not be binary.

### Success gradients
- Critical success — goal achieved, no exposure, side benefit
- Full success — goal achieved, minimal traces
- Partial success — goal partially achieved, some cost incurred
- Failure — goal not achieved, resources lost
- Critical failure — goal failed, organization exposed, heat spike

### Outcome modifiers
Outcomes should be affected by:
- district tension (high tension = harder operations)
- district loyalty (familiar territory = advantage)
- rival presence (contested space = more resistance)
- police activity level (high patrol = more risk)
- crew quality (experienced crew = better odds)
- resource quality (well-funded operations = higher ceiling)
- organization reputation (feared organizations face less resistance)

## Operations and heat

Every operation generates some level of heat.
Heat is a measure of law enforcement attention.

Principles:
- violent operations generate more heat than economic ones
- failed operations generate more heat than successful ones
- repeated operations in the same area accumulate heat
- heat decays over time if the organization stays quiet
- some operations can reduce heat (bribery, misdirection)

## Operations and the district

Operations do not happen in a vacuum.
They interact with the district model.

- a protection racket in a poor district generates less income but less resistance
- a drug run through a high-police district increases risk dramatically
- a takeover in a district with strong rival presence requires more resources
- a front business works better in a commercially active district

## Operations and rival organizations

Rival organizations react to operations that affect them.

- if an organization is disrupted, rivals may retaliate
- if an organization weakens a rival, others may move in
- if an organization operates too visibly, rivals may inform on them
- a successful string of operations may make rivals seek negotiation

## Operation limits

Organizations should not be able to run unlimited operations.

Limits should come from:
- available crew (each crew member can only do so much)
- available capital
- current heat level (too much heat pauses aggressive operations)
- leadership capacity (fewer lieutenants = fewer parallel operations)
- district resistance

This creates genuine resource management and strategic tradeoffs.

## Player perspective

The player's organization runs operations like all others.
The difference is that the player chooses which operations to run, when, and with what resources.

The player should be able to:
- plan an operation before committing
- see estimated risk and reward
- assign specific assets to increase odds
- abort an operation in progress (with a cost)
- chain operations for compound effects

## Design principle

An operation is well designed if it has a meaningful tradeoff.
If the player can always run the best operation with no downside, the system is broken.
Every operation should cost something real and threaten something real.
