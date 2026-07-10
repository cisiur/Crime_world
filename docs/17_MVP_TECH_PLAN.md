# MVP Technical Plan

## Purpose

This document translates the validated MVP design into a buildable technical plan.

The MVP must prove the core loop:

> observe opportunity → plan operation → assign people and resources → resolve outcome → receive world reaction → adapt

The technical architecture should support that loop first. It should not attempt to implement the full long-term simulation before the loop is playable.

## Core technical principles

### 1. Simulation first, presentation second

The city should continue to produce useful state changes even when no screen is open.
UI reads and commands the simulation; it does not contain the game rules.

### 2. Deterministic domain logic

Given the same initial state, commands, seed, and elapsed ticks, the simulation should produce the same result.

This makes:
- save/load reliable,
- balancing reproducible,
- bugs easier to investigate,
- automated simulation tests possible.

### 3. Data-driven content

Districts, operations, businesses, organizations, NPC roles, and reactions should be described by data rather than hard-coded per instance.

The MVP may use JSON, YAML, scriptable resources, or engine-native data assets, but content definitions must remain separate from domain logic.

### 4. Coarse simulation

Do not simulate every civilian, vehicle, customer, police officer, or transaction.
Simulate only strategic entities and aggregate state that can change a player decision.

### 5. Single-city boundary

The MVP architecture may leave extension points for multiple cities, but it must not introduce multi-city runtime complexity.

### 6. No premature OSM dependency

The MVP uses a handcrafted or controlled city data set.
The simulation should depend on a neutral city model, not directly on OpenStreetMap structures.

A future importer may convert OSM data into the same city model.

## Recommended architecture shape

Use a modular monolith for the MVP.

The project should be one deployable game application with clearly separated modules rather than microservices, networked services, or independent simulation processes.

Suggested layers:

1. **Content definitions** — templates and authored city data.
2. **Domain simulation** — authoritative game rules and mutable state.
3. **Application layer** — commands, queries, orchestration, and save/load.
4. **Presentation layer** — map, panels, notifications, and input.
5. **Infrastructure** — persistence, logging, random seeds, and development tools.

Dependencies should point inward:

```text
Presentation → Application → Domain
Infrastructure → Application / Domain interfaces
Content loader → Domain definitions
```

The domain layer must not depend on UI classes.

## Core runtime modules

### City module

Responsibilities:
- city definition,
- district registry,
- location registry,
- district adjacency,
- strategic routes,
- aggregate city state.

MVP entities:
- one city,
- four districts,
- approximately 20–30 strategic locations.

### District module

Responsibilities:
- district properties,
- local tension,
- organization influence,
- police presence,
- economic profile,
- opportunity modifiers,
- reaction thresholds.

The district should be a local simulation node, not just a visual polygon.

### Character module

Responsibilities:
- player character,
- named NPCs,
- role and organization membership,
- competence tags,
- loyalty,
- availability,
- injury or arrest state,
- personal exposure.

The MVP should simulate only named or strategically important characters individually.
Generic population remains aggregated.

### Organization module

Responsibilities:
- membership,
- leadership,
- money and resources,
- controlled assets,
- district influence,
- reputation,
- operational capacity,
- rival relationships.

The MVP requires:
- one player organization,
- two rival organizations.

### Business and location module

Responsibilities:
- ownership,
- business archetype,
- legal or illegal function,
- income and upkeep,
- cover value,
- storage or operational utility,
- district relationship.

A location may exist without being a business.
A business should reference a strategic location rather than duplicate map identity.

### Opportunity module

Responsibilities:
- detect eligible opportunities from world state,
- present player-facing opportunity information,
- expire or change opportunities over time,
- connect opportunities to operation templates.

Opportunities should be generated from conditions, not only scripted sequences.
The first-session opportunities may be curated to protect pacing.

### Operation module

Responsibilities:
- operation templates,
- planning state,
- assigned people and resources,
- duration,
- risk estimate,
- resolution,
- outcome effects,
- cancellation and interruption.

Operations are the main commands that modify the world.

Minimum lifecycle:

```text
Available
→ Planned
→ Prepared
→ Active
→ Resolved
→ Consequences Applied
→ Archived
```

The MVP may merge `Planned` and `Prepared` in the UI, but the domain should keep enough separation to support preparation modifiers.

### Economy module

Responsibilities:
- organization money,
- operation costs,
- business income,
- business upkeep,
- periodic cash flow,
- financial consequences of pressure and disruption.

The MVP should use aggregate transactions recorded in a ledger.
It should not simulate individual customers or full market pricing.

### Pressure and investigation module

Responsibilities:
- exposure generated by operations,
- district tension,
- organization pressure state,
- active investigations,
- reaction thresholds,
- pressure decay,
- raids, arrests, and warnings.

Keep these concepts separate:
- `Exposure` — visibility created by activity.
- `Tension` — unstable local district condition.
- `Investigation` — persistent institutional process with a target and progress.
- `PressureState` — derived strategic severity shown to the player.

Silence may reduce exposure but must not automatically erase investigations or evidence.

### Rival AI module

Responsibilities:
- periodically evaluate organizational priorities,
- select one strategic intent,
- create or execute an operation,
- react to player pressure and expansion,
- avoid obviously self-destructive actions.

MVP AI should be utility-based or score-based, not planning-heavy.

Suggested intents:
- earn income,
- defend an asset,
- expand influence,
- retaliate,
- recover from pressure,
- disrupt the player.

### Relationship module

Responsibilities:
- limited trust,
- fear,
- dependency,
- hostility,
- visible relationship state,
- simple pacts or truces if included.

Full diplomacy is outside MVP.
The module exists so rival reactions are not based on one hostility number only.

### Event and notification module

Responsibilities:
- domain events emitted by systems,
- event history,
- player notifications,
- reaction chains,
- debug inspection.

Examples:
- `OperationResolved`,
- `ExposureChanged`,
- `InvestigationOpened`,
- `BusinessIncomeGenerated`,
- `CharacterArrested`,
- `InfluenceChanged`,
- `RivalIntentSelected`.

Domain events should communicate completed facts, not directly manipulate UI.

### Time and scheduler module

Responsibilities:
- pause,
- speed controls,
- fixed simulation ticks,
- scheduled jobs,
- operation completion,
- periodic economy and AI updates.

### Persistence module

Responsibilities:
- save snapshots,
- load validation,
- schema version,
- random seed state,
- active operation restoration,
- development migration strategy.

## Core entity model

The exact language types depend on the chosen engine and stack, but the MVP needs at least the following stable identities.

### CityState

```text
id
name
districtIds
locationIds
simulationTime
seed
```

### DistrictState

```text
id
name
profile
economicActivity
policePresence
tension
organizationInfluence
locationIds
adjacentDistrictIds
```

### LocationState

```text
id
districtId
archetype
ownerOrganizationId?
businessId?
strategicTags
status
```

### CharacterState

```text
id
name
role
organizationId?
competenceTags
loyalty
availability
healthState
legalState
personalExposure
```

### OrganizationState

```text
id
name
leaderCharacterId
memberIds
money
reputation
capacity
controlledLocationIds
relationships
pressureState
```

### BusinessState

```text
id
locationId
archetype
ownerOrganizationId?
legalStatus
incomeRate
upkeepRate
coverValue
operationalState
```

### OperationInstance

```text
id
templateId
initiatorOrganizationId
targetRefs
assignedCharacterIds
assignedResources
state
startTime
endTime
resolutionSeed
estimatedRisk
outcome?
```

### InvestigationState

```text
id
targetType
targetId
originDistrictId?
evidence
progress
severity
status
lastActivityTime
```

### OpportunityState

```text
id
templateId
targetRefs
createdTime
expiryTime?
knownInformation
status
```

### WorldEvent

```text
id
timestamp
type
actorRefs
targetRefs
payload
visibility
```

## Identity and references

All persistent entities should use stable IDs.

Do not rely on:
- array position,
- UI object references,
- display names,
- engine scene hierarchy paths

as persistent identity.

Cross-module references should use IDs and validated lookup services.

## Commands and queries

The presentation layer should interact with the application through explicit commands and queries.

Example commands:
- `RecruitCharacter`
- `PlanOperation`
- `AssignCharacterToOperation`
- `StartOperation`
- `CancelOperation`
- `AcquireBusiness`
- `SetTimeSpeed`
- `SaveGame`

Example queries:
- `GetDistrictOverview`
- `GetAvailableOpportunities`
- `GetOperationRiskPreview`
- `GetOrganizationSummary`
- `GetPressureSummary`
- `GetCharacterAvailability`

This prevents UI panels from mutating domain state directly.

## Simulation clock

Use a fixed logical simulation tick independent from rendering frame rate.

A useful MVP model is:
- UI and input update every frame,
- simulation advances through fixed ticks,
- several fixed ticks may run during accelerated time,
- paused time runs no domain ticks,
- expensive low-frequency jobs run on scheduled intervals.

The exact real-time-to-game-time ratio remains a balancing value.

## Tick phases

Each simulation tick should run in a stable order.

Recommended order:

1. Advance simulation time.
2. Process queued player and AI commands.
3. Advance active operations.
4. Resolve completed operations.
5. Apply direct outcome effects.
6. Update exposure and district tension.
7. Advance investigations and institutional reactions.
8. Process economic schedules when due.
9. Process rival AI schedules when due.
10. Generate or expire opportunities.
11. Emit and record world events.
12. Recalculate derived summaries used by UI.

Systems should not depend on accidental iteration order.

## Update frequencies

Not every system needs to run on every tick.

### Every simulation tick
- active operation timers,
- queued commands,
- immediate outcome effects,
- critical scheduled events.

### Short interval
- opportunity expiry,
- local exposure changes,
- investigation progress,
- character availability.

### Medium interval
- business income and upkeep,
- pressure decay,
- district tension recovery,
- rival intent evaluation.

### Long interval
- reputation drift,
- broad district changes,
- organization strategic review.

Intervals must be configuration values.

## Operation resolution

Operation resolution should be centralized and testable.

A resolver should receive:
- immutable operation definition,
- current relevant world snapshot,
- assigned assets,
- known modifiers,
- deterministic random source.

It should return an outcome object rather than directly changing every system.

Example:

```text
OperationOutcome
- grade: criticalSuccess | success | partialSuccess | failure | criticalFailure
- rewards
- losses
- exposureGenerated
- injuries
- evidenceCreated
- influenceChanges
- followUpEventTags
```

An application service then applies the outcome through domain systems and emits events.

## Risk preview

The UI should not expose the exact hidden resolution roll.
It should receive a player-facing estimate calculated from known information.

The technical model must distinguish:
- true internal probability,
- player-known estimate,
- uncertainty caused by missing intelligence.

This prevents the UI from becoming a perfect calculator.

## Rival AI implementation

Use a bounded decision cycle.

Suggested process:

1. Build a compact context snapshot.
2. Score available intents.
3. Select an intent using weighted choice among strong candidates.
4. Select an eligible operation template and target.
5. Reserve required assets.
6. Execute through the same operation system used by the player.

AI should not bypass operation costs, capacity, pressure, or availability rules.

For MVP performance and readability:
- evaluate rivals on intervals,
- limit one main intent per organization,
- cap concurrent AI operations,
- log scores in debug mode.

## Content definitions

The following should be data-driven:
- district profiles,
- operation templates,
- business archetypes,
- location archetypes,
- NPC role definitions,
- organization archetypes,
- reaction definitions,
- balancing values,
- first-session curated opportunities.

Each definition should have:
- stable ID,
- display metadata,
- prerequisites,
- effects or references to effect handlers,
- validation rules.

Avoid embedding executable arbitrary scripts in content during MVP unless the chosen engine already provides a safe, testable pattern.

## Handcrafted city format

The controlled MVP city should be stored as authored data containing:
- district IDs and display geometry,
- adjacency,
- strategic routes,
- location IDs,
- location positions,
- location archetypes,
- initial ownership,
- initial organization influence,
- starting NPC placement,
- initial opportunities.

The simulation should treat visual geometry as presentation data and strategic adjacency as domain data.

## Save format

Use snapshot saves for MVP.

A save should contain:
- schema version,
- game version,
- simulation timestamp,
- random generator state or reproducible seeds,
- city state,
- districts,
- locations and businesses,
- characters,
- organizations and relationships,
- active and archived operations required by gameplay,
- opportunities,
- investigations,
- scheduled events,
- event history within a bounded retention policy.

Do not serialize UI state as authoritative game state.

## Save compatibility during MVP development

Permanent backward compatibility is not required before release.
However:
- every save must include a schema version,
- incompatible development saves should fail clearly,
- simple migrations may be added when cheap,
- silent corruption is unacceptable.

## Randomness

All simulation randomness should come from injected deterministic random sources.

Use separate streams or derived seeds for major contexts where practical:
- operation resolution,
- opportunity generation,
- AI selection,
- event variation.

Do not use uncontrolled global randomness inside domain systems.

## Testing strategy

### Unit tests

Prioritize:
- operation eligibility,
- operation resolution boundaries,
- outcome application,
- pressure transitions,
- investigation persistence,
- business cash flow,
- character availability,
- organization capacity,
- AI score calculations.

### Integration tests

Test complete loops such as:
- successful robbery creates money and exposure,
- repeated visible operations open an investigation,
- arrested character becomes unavailable,
- business takeover changes ownership and income,
- rival retaliation uses the normal operation path,
- laying low reduces exposure but preserves active evidence.

### Simulation tests

Run the city headlessly for many ticks with scripted or AI commands.
Track:
- money inflation or starvation,
- operation frequency,
- pressure distribution,
- organization collapse rate,
- rival inactivity,
- deadlocked opportunities,
- runaway snowballing.

### Save/load tests

A loaded simulation should continue consistently from the saved state.
At minimum, active operations, scheduled income, investigations, and random streams must survive correctly.

## Debug and balancing tools

The MVP should include developer-facing tools early.

Required debug capabilities:
- inspect any district, organization, NPC, operation, or investigation,
- view hidden values and modifiers,
- advance one tick or a chosen number of ticks,
- change time speed,
- inject money and pressure,
- force operation outcomes,
- spawn an opportunity,
- view AI intent scores,
- export a compact simulation report.

A simulation game without inspection tools will be difficult to balance.

## Logging

Use structured development logs for important state changes.

Each entry should include relevant IDs and simulation time.

Log categories:
- commands,
- operation lifecycle,
- operation outcomes,
- economy transactions,
- pressure and investigation changes,
- AI decisions,
- persistence errors.

Routine high-frequency details should be suppressible.

## UI implementation boundary

The MVP UI needs:
- strategic city map,
- district overview,
- opportunity list,
- operation planner,
- organization and character panel,
- business panel,
- pressure and investigation summary,
- event feed,
- time controls,
- save/load.

The first UI pass may be visually simple.
It must still communicate:
- what can be done,
- why it can or cannot be done,
- estimated reward and risk,
- who is available,
- what changed after resolution,
- why the world reacted.

## Technical implementation phases

### Phase 0: Project skeleton and test harness

Deliver:
- domain/application/presentation separation,
- stable ID pattern,
- content loading,
- deterministic clock and random source,
- automated test project,
- minimal debug console.

Exit condition:
- a headless simulation can load a tiny city and advance ticks deterministically.

### Phase 1: Static city and core state

Deliver:
- four authored districts,
- strategic locations and adjacency,
- player character,
- organizations,
- key NPCs,
- map selection and inspection.

Exit condition:
- the player can inspect the city and all core state survives save/load.

### Phase 2: Operation vertical slice

Deliver:
- opportunities,
- one operation template,
- planning and assignments,
- duration and resolution,
- outcome application,
- event feed.

Recommended first operation:
- low-level robbery or theft with money, exposure, and injury risk.

Exit condition:
- the full core loop works for one operation from UI command to world consequence.

### Phase 3: Economy and capacity

Deliver:
- operation costs,
- organization money,
- business ownership,
- periodic income and upkeep,
- character availability,
- operation capacity.

Exit condition:
- the player must choose how to spend limited people and money.

### Phase 4: Pressure and recovery

Deliver:
- exposure,
- district tension,
- pressure states,
- persistent investigation,
- warning and crackdown reactions,
- one pressure-reduction response.

Exit condition:
- repeated greed creates readable danger, and the player can deliberately stabilize.

### Phase 5: Rival organizations

Deliver:
- two rival organizations,
- scheduled intent evaluation,
- AI operations through shared rules,
- basic retaliation and expansion,
- visible world reactions.

Exit condition:
- the city changes without player commands and rivals create strategic interference.

### Phase 6: Complete MVP content

Deliver:
- all required operation templates,
- business archetypes,
- named NPC set,
- curated first-session opportunities,
- reaction and event set,
- recovery paths.

Exit condition:
- the MVP content checklist is complete without placeholder mechanics in the core loop.

### Phase 7: Balancing and usability

Deliver:
- playtest telemetry,
- balancing tools,
- readable warnings,
- improved operation preview,
- onboarding flow,
- performance review,
- save/load hardening.

Exit condition:
- new players can reach the first stable foothold and understand why they succeeded or failed.

## Implementation order inside a vertical slice

For each feature, prefer this order:

1. Define data and invariants.
2. Implement domain logic.
3. Add automated tests.
4. Add application command and query.
5. Add minimal UI.
6. Add logging and debug inspection.
7. Add content instances.
8. Playtest and tune.

Do not build complete UI panels around systems that do not yet work headlessly.

## Performance target philosophy

The MVP contains only dozens of strategic entities, not thousands of individually simulated agents.

Performance risk is more likely to come from:
- unnecessary per-frame domain work,
- excessive allocations,
- uncontrolled event chains,
- repeated full-world queries,
- UI rebuilding,
- save serialization errors

than from raw entity count.

Use profiling before introducing complex optimization.

## Explicit technical exclusions

Do not implement for MVP:
- live OSM downloading,
- procedural generation of arbitrary real cities,
- multiple active cities,
- global simulation,
- multiplayer or authoritative networking,
- microservices,
- individual civilian simulation,
- free-roaming character navigation,
- tactical combat simulation,
- full prison gameplay,
- full succession and dynasty runtime,
- advanced politics or media simulation,
- complex financial markets,
- modding API stability guarantees.

## Definition of technical MVP complete

The technical MVP is complete when:
- one controlled city loads reliably,
- time can pause and accelerate,
- opportunities appear from state or curated rules,
- the player can plan and run operations,
- people and money constrain decisions,
- operations change economy, influence, exposure, and availability,
- pressure escalates into persistent investigations and reactions,
- rivals independently act through the same operation rules,
- the player can recover from ordinary setbacks,
- the simulation saves and loads correctly,
- hidden state can be inspected with debug tools,
- the first-session loop is playable without developer intervention.

## Open Questions

- Which engine and language will implement the MVP?
- What game-time scale feels readable at normal and accelerated speeds?
- Should operation resolution occur only at completion or allow intermediate incidents?
- How much event history should remain in a save?
- Which telemetry can be collected during private playtests without building a large analytics system?
- Should content definitions use engine-native assets, JSON, YAML, or a hybrid?

## Future Extensions

- OSM import into the neutral city data model.
- Multiple loaded cities and regional scheduling.
- Full succession and organization history persistence.
- More sophisticated diplomatic agreements.
- Parallel or background simulation for inactive regions.
- Modding-oriented content schemas and validation tools.
- Replayable simulation logs for debugging and campaign chronicles.
