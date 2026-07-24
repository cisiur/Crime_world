# MVP Scope

## Purpose

This document defines the smallest playable version of CrimeWorld that can validate the core design.

The MVP is not a miniature version of the entire long-term game.
It is a focused test of whether planning criminal operations inside a reactive city creates enough tension, consequence, and replay value to justify further development.

## MVP goal

The MVP must answer one primary question:

> Is the loop of observing opportunities, planning operations, assigning people and resources, resolving consequences, managing pressure, and expanding local influence fun enough to support repeated play?

A successful MVP should make the player want to run one more operation, recruit one more useful person, secure one more income source, or take one more calculated risk.

## Core player fantasy in the MVP

The player starts as an unknown individual with:
- almost no money,
- one basic safe location,
- one weak but reliable contact,
- no territory,
- no legal protection,
- and no established organization.

During play, the player should be able to:
- recruit a small crew,
- perform low-level criminal operations,
- earn and reinvest money,
- build influence in a limited set of districts,
- acquire or establish basic businesses,
- manage exposure and police reaction,
- respond to rival activity,
- and stabilize a small local organization.

The MVP ends as a test session when the player either stabilizes a local operation, suffers collapse, or chooses to stop. It does not need a formal campaign victory.

## Playable scope

### City

The MVP contains:
- one playable city,
- three to five districts,
- a controlled or handcrafted map,
- a small number of strategically relevant roads or routes,
- and a limited pool of buildings and locations.

The city should demonstrate meaningful district differences without depending on full OpenStreetMap generation.

Example district roles:
- low-income residential district,
- commercial district,
- industrial or logistics district,
- entertainment district,
- higher-income district with stronger institutional reaction.

### Player character

The MVP contains one playable boss with:
- name and basic identity,
- personal money,
- personal reputation,
- personal exposure,
- a small contact network,
- and basic physical availability.

The player character should matter as a vulnerable person, but the MVP does not require full psychological simulation, dynasty traits, or advanced succession.

### Organization

The MVP supports one player-controlled organization with:
- the boss,
- a small number of members,
- simple roles,
- one or more crews,
- basic loyalty,
- limited operation capacity,
- money and recurring income,
- and influence in districts.

The organization should be able to grow from one person into a small local group.

The MVP does not need:
- multi-layered hierarchy,
- subordinate organizations,
- regional administration,
- formal dynasties,
- or international logistics.

### NPCs

The MVP includes a small pool of meaningful NPCs:
- recruitable crew members,
- one or two lieutenants or specialist candidates,
- rival leaders,
- business owners or local targets,
- and selected police or institutional actors.

NPCs should have enough identity to create meaningful choices through:
- competence,
- loyalty,
- relationships,
- exposure,
- and role suitability.

Implementation status after E5-05: the repository now contains four concrete persistent recruitable NPC candidates and deterministic recruitment opportunity generation/expiration for them. Recruitment execution is still not implemented: no candidate joins an organization, no money is deducted, no upkeep schedule is created, no role or operational capacity changes occur, and no UI, global tick-loop, campaign integration, save/load, pressure effect, or rival behavior is attached to this foundation yet.

The MVP does not require full life simulation for every citizen.

### Rival organizations

The MVP contains two or three AI-controlled criminal organizations.

Each rival should have:
- a basic identity and strategy,
- district interests,
- one or more income sources,
- simple relationships with other actors,
- and the ability to perform operations independently of the player.

Rivals should be able to:
- compete for targets,
- increase district tension,
- retaliate,
- exploit player weakness,
- and temporarily reduce aggression under pressure.

### Operations

Operations are the central playable system of the MVP.

The MVP should include a small but distinct operation set.

Required operation categories:
- income,
- recruitment,
- control,
- intelligence,
- pressure management.

Suggested first operation set:
- small theft or robbery,
- protection demand,
- basic illegal distribution run,
- recruit a local contact,
- scout a district or target,
- intimidate a business owner,
- disrupt a rival operation,
- establish a basic front business,
- destroy or hide evidence,
- lay low or relocate activity.

Every operation should support:
- a target,
- assigned people,
- assigned resources,
- estimated reward,
- estimated risk,
- duration,
- outcome gradients,
- exposure generation,
- and world-state consequences.

The MVP should prove planning and tradeoffs, not content volume.

### Economy

The MVP economy includes:
- personal and organization money,
- operation costs,
- recurring income,
- crew upkeep,
- simple business income,
- and losses from failed operations or pressure.

The city economy should provide different opportunities by district.

The MVP does not need:
- complex banking,
- detailed tax simulation,
- hundreds of commodities,
- or a complete macroeconomic model.

### Businesses

The MVP includes a limited set of legal and illegal business functions.

Required business roles:
- income source,
- legal cover,
- operational location,
- or strategic district asset.

A small number of business archetypes is sufficient.
Examples:
- convenience store,
- bar or nightclub,
- warehouse,
- workshop,
- small logistics company.

Businesses should create tradeoffs through profitability, visibility, location, and vulnerability.

### Districts and influence

Districts are the primary local simulation units.

The MVP should support:
- district identity,
- wealth or opportunity level,
- police presence,
- criminal activity,
- rival influence,
- business value,
- tension,
- and player influence.

Influence should be gradual rather than purely binary.
The player may have weak presence, contested influence, or local dominance.

The MVP does not require complete territorial conquest mechanics.

### Pressure and reaction

The MVP requires a minimal layered reaction system.

It should distinguish:
- operation exposure,
- district tension,
- organization-level pressure,
- personal exposure,
- and active investigation state.

Required reactions include:
- increased patrol activity,
- higher operation risk,
- surveillance or investigation,
- arrests of exposed low-level members,
- disruption of businesses or operations,
- and rival exploitation of pressure.

Pressure should be manageable through:
- reduced activity,
- lower-visibility operations,
- relocation,
- evidence management,
- and limited corruption or influence where available.

Going quiet should reduce short-term exposure but should not automatically erase active investigations or existing evidence.

### Diplomacy

The MVP needs only a minimal relationship layer.

Supported organization-to-organization states may include:
- neutral,
- wary,
- hostile,
- temporary truce,
- and limited cooperation.

Required actions:
- negotiate a truce,
- demand or offer a concession,
- threaten,
- exchange a favor,
- and betray an agreement.

Full alliance networks, institutional diplomacy, subordinate organizations, and complex hidden treaties are outside the MVP.

### Progression

Progression in the MVP comes from actual capability.

The player progresses by gaining:
- trusted people,
- recurring income,
- district influence,
- useful contacts,
- better intelligence,
- operational capacity,
- and stronger legal cover.

The MVP should not use conventional XP levels or an abstract technology tree.

The playable progression range is:
- unknown individual,
- small crew,
- early local organization.

Regional, national, and global progression are outside the MVP.

### Time and simulation

The MVP includes:
- continuous time,
- pause,
- multiple speed settings,
- scheduled or timed operations,
- recurring economy updates,
- AI decisions,
- pressure decay and escalation,
- and save/load.

The simulation may use simplified ticks as long as player-facing outcomes remain understandable.

## Required player-facing loop

The MVP must support this complete loop:

1. Observe the city, district conditions, and available opportunities.
2. Select a goal or target.
3. Gather enough information to estimate risk and reward.
4. Choose an operation.
5. Assign people, money, locations, and other resources.
6. Commit and allow time to advance.
7. Resolve the operation with a graded outcome.
8. Apply money, reputation, injury, relationship, influence, and exposure consequences.
9. Observe reactions from police, civilians, rivals, and the district.
10. Decide whether to expand, recover, negotiate, relocate, or lay low.

If any of these steps is missing, the MVP does not yet prove the intended game.

## Minimum meaningful content

The MVP should target approximately:
- 3–5 districts,
- 2–3 rival organizations,
- 10–15 recruitable or strategically relevant NPCs,
- 8–12 operation types,
- 4–6 business or location archetypes,
- 3–5 pressure reactions,
- and several starting opportunities with different risk profiles.

These are planning targets, not commitments to content volume.
Quality and interaction density are more important than quantity.

## Explicitly outside MVP

The MVP does not include:
- multiple playable cities,
- regional or international expansion,
- global map gameplay,
- full OpenStreetMap generation,
- global politics,
- advanced media simulation,
- complex financial or banking systems,
- full family simulation,
- detailed dynasty management,
- multi-generation legacy gameplay,
- deep succession crises,
- subordinate criminal organizations,
- international supply chains,
- advanced intelligence agencies,
- dozens of business sectors,
- dozens of organization archetypes,
- or a final endgame system.

## Simplified but represented systems

Some long-term systems should be represented in reduced form rather than omitted completely.

| Long-term system | MVP representation |
|---|---|
| Player model | One vulnerable boss with basic personal exposure and reputation |
| Organization model | Small crew with simple roles, loyalty, money, and influence |
| District model | 3–5 districts with distinct opportunity and pressure profiles |
| Operation model | 8–12 reusable operation types with graded outcomes |
| Pressure model | Exposure, tension, investigation, and limited reactions |
| Diplomacy model | Basic rival states, truces, threats, and concessions |
| Progression model | Capability growth from individual to early local organization |
| Endgame model | No formal victory; collapse does not always end the session |
| Legacy model | Basic event log only, without mechanical legacy systems |

## Failure and recovery in the MVP

The MVP should allow significant setbacks without forcing immediate game over.

The player may continue after:
- losing money,
- losing a business,
- losing district influence,
- arrest of crew members,
- failed operations,
- or temporary organizational collapse.

The MVP may use a simplified session-ending condition if needed for testing, but the design truth remains:
- bankruptcy is not automatic game over,
- territorial loss is not automatic game over,
- and organization weakness is a recovery state.

Full successor-based continuation after boss death is not required in the MVP.
If the boss dies in the MVP build, the test run may end.

## MVP validation criteria

The MVP is successful if playtests show that players:
- understand how to find and plan operations,
- see why outcomes occurred,
- feel meaningful tension between reward and exposure,
- care about crew quality and availability,
- notice district differences,
- react strategically to pressure,
- perceive rivals as active participants,
- recover from at least some setbacks,
- and want to begin another run or continue expanding after stabilization.

The MVP is not validated by feature count.
It is validated by the strength of the decision loop.

## Development principle

When choosing between two MVP features, prefer the one that strengthens interaction between existing systems.

A new operation that changes economy, district influence, pressure, and rival behavior is more valuable than an isolated feature with no systemic consequences.

## Open Questions

- Should the first MVP map contain three dense districts or five simpler districts?
- Which exact 8–12 operations provide the strongest variety with the least custom logic?
- Should the player begin with one contact already loyal or recruit the first member during play?
- How much information should be visible before intelligence gathering?
- What is the appropriate length of one validation run?
- Should boss death be enabled in the first internal prototype or added after the core loop is stable?

## Future Extensions

- Full OSM-based city generation.
- Multi-city and regional progression.
- Advanced succession and dynasty continuation.
- Organization history and legacy systems.
- Deeper politics, media, and institutional influence.
- Large-scale criminal supply chains and international networks.
