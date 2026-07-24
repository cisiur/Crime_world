# MVP Content List

## Purpose

This document turns the validated MVP scope and game loop into a concrete production checklist.

The list defines the minimum content required to test whether planning operations, growing a small organization, managing pressure, and reacting to rivals are fun.

Content that does not help validate that loop does not belong in the MVP.

## MVP content budget

The target content budget is:

- 1 handcrafted or controlled city map,
- 4 districts,
- 20–30 strategically relevant map locations,
- 10–15 persistent named NPCs,
- 3 organizations including the player organization,
- 10 core operation templates,
- 6 business and strategic location archetypes,
- 12–18 opportunity and reaction events,
- and a compact set of reusable UI panels.

These numbers are production limits, not goals to exceed.

## Playable city

The MVP uses one controlled city rather than full OpenStreetMap generation.

The city should be large enough to create spatial decisions but small enough that the player can understand it during the first session.

### Required district structure

The city contains four districts with clearly different strategic identities.

#### 1. Starting residential district

Role:
- player starting area,
- low-value opportunities,
- cheap recruitment,
- relatively low institutional attention.

Gameplay identity:
- low income,
- limited police presence,
- vulnerable residents and small businesses,
- weak but visible gang influence.

#### 2. Commercial district

Role:
- profitable businesses,
- extortion targets,
- higher-value theft opportunities,
- stronger police and civilian reaction.

Gameplay identity:
- higher income,
- higher visibility,
- more witnesses,
- stronger political sensitivity.

#### 3. Industrial and logistics district

Role:
- warehouses,
- workshops,
- transport routes,
- smuggling and storage opportunities.

Gameplay identity:
- strong logistics value,
- fewer civilians,
- route competition,
- sabotage and supply disruption potential.

#### 4. Contested nightlife or mixed-use district

Role:
- primary rival territory,
- high-risk expansion target,
- criminal income opportunities,
- first meaningful diplomacy or conflict decisions.

Gameplay identity:
- active rival presence,
- profitable but unstable businesses,
- high tension,
- fast pressure escalation.

## Map locations

The city should contain 20–30 relevant locations.

The map may include decorative buildings, but only strategically relevant locations need full gameplay data.

### Required strategic location archetypes

Implementation status: the six MVP archetypes below now have canonical immutable authored definitions in `packages/content`. These definitions record IDs, `LocationKind` mappings, display names, business/strategic-location classification, gameplay roles, and relative economic/risk profiles. E5-04 also adds canonical provisional authored business income definitions for income-generating archetypes only: Small Shop or Service `20` money every `144` ticks, Restaurant or Nightlife Venue `60` every `144` ticks, and Workshop or Transport Business `40` every `144` ticks. Hideout, safehouse, and warehouse/storage do not have business income definitions. Business upkeep, hideout upkeep, UI, tick integration, save/load, production, inventory, storage capacity, and final balancing remain unimplemented.

1. **Hideout**
   - stores crew and operational resources,
   - provides local presence,
   - can be exposed or lost.

2. **Safehouse**
   - reduces personal exposure,
   - supports recovery and low-profile play,
   - has limited capacity.

3. **Small shop or service business**
   - basic legal income,
   - extortion target,
   - possible front business.

4. **Restaurant or nightlife venue**
   - stronger cash flow,
   - access to contacts and information,
   - higher visibility and rival interest.

5. **Warehouse or storage site**
   - holds goods,
   - supports smuggling and logistics,
   - creates seizure and raid risk.

6. **Workshop or transport business**
   - supports vehicles and movement,
   - improves selected operations,
   - can become a strategic dependency.

### Required institutional locations

- one police station or district law-enforcement node,
- one medical or recovery location,
- one municipal or legal intermediary location,
- and one major district landmark per district.

Institutional locations do not need fully simulated staff or interiors in the MVP.

## Organizations

The MVP contains three organizations.

### 1. Player organization

Starting state:
- one boss,
- one hideout,
- minimal cash,
- no controlled businesses,
- no formal territory,
- one personal contact,
- and no established hierarchy.

The organization can grow to:
- 4–6 active members,
- one lieutenant,
- 1–3 businesses or strategic assets,
- and influence in multiple districts.

### 2. Local street gang

Role:
- first direct rival,
- visible territorial pressure,
- intimidation and retaliation behavior.

Required behavior:
- runs simple income operations,
- contests one or two districts,
- reacts to player expansion,
- can threaten, retaliate, negotiate a temporary truce, or weaken under pressure.

### 3. Established local organization

Role:
- stronger background power,
- later-session threat,
- source of diplomacy, protection, or indirect pressure.

Required behavior:
- controls one valuable asset or route,
- has better resources than the player,
- does not immediately seek total war,
- evaluates the player based on growth, reputation, and interference.

The MVP does not require cartels, international syndicates, or multiple organization archetype families.

## Persistent NPC content

The MVP should contain 10–15 named, persistent NPCs.

E5-05 implementation status: four concrete persistent recruitable candidate seeds and matching opportunity definitions now exist in `packages/content`. They are provisional MVP hypotheses for opportunity generation only:

- Vera Kade: experienced but unreliable; `streetwise` + `force`; competence `75`, loyalty `35`, exposure `30`; recruitment cost `60`, minimum trust `35`, maintenance preview `5`, opportunity duration `432` ticks; located at `location:bar_district`.
- Eli Navarro: loyal but inexperienced; `social`; competence `35`, loyalty `80`, exposure `10`; recruitment cost `25`, minimum trust `15`, maintenance preview `5`, opportunity duration `576` ticks; located at `location:community_center`.
- Nika Ross: cheap but exposed; `stealth` + `streetwise`; competence `50`, loyalty `50`, exposure `65`; recruitment cost `10`, minimum trust `10`, maintenance preview `5`, opportunity duration `288` ticks; located at `location:corner_store`.
- Tomas Vek: expensive logistics specialist; `logistics` + `social`; competence `70`, loyalty `60`, exposure `15`; recruitment cost `90`, minimum trust `45`, maintenance preview `5`, opportunity duration `720` ticks; located at `location:freight_terminal`.

Recruitment opportunities can now be generated and expired deterministically for concrete candidates. E5-06 adds one deterministic recruitment action that uses these existing authored cost/trust values: a valid active opportunity can pay the recruitment cost through the ledger, append the candidate to the target organization, and mark the opportunity consumed. Upkeep generation, role assignment, operational-capacity growth, UI, global tick integration, save/load, and campaign integration remain unimplemented.

### Required roles

- player boss,
- 3–5 recruitable operators,
- one possible lieutenant,
- one street-gang leader,
- one established-organization leader,
- one business owner,
- one police contact or corruptible officer,
- one informant or information broker,
- one legal, medical, or logistical specialist,
- and one optional wildcard character with conflicting loyalties.

### Minimal NPC properties

Each persistent NPC needs:
- identity and role,
- competence,
- loyalty,
- personal relationship to the player,
- risk or vulnerability,
- current employment or allegiance,
- availability,
- and a small number of relevant traits.

NPCs do not need deep family trees, full daily schedules, extensive inventories, or complex psychological simulations in the MVP.

## Operation templates

The MVP contains ten core operation templates.

Every operation must use the shared operation flow:

1. identify an opportunity or target,
2. inspect known information,
3. assign people and resources,
4. estimate reward and risk,
5. commit or cancel,
6. resolve over time,
7. apply consequences,
8. trigger world reactions.

### Income operations

#### 1. Small theft

Purpose:
- immediate but unstable income.

Tests:
- basic crew assignment,
- target choice,
- low-level exposure.

#### 2. Protection demand

Purpose:
- recurring income from a business.

Tests:
- intimidation,
- relationship consequences,
- rival and civilian reaction.

#### 3. Contraband delivery

Purpose:
- move goods through one or more districts.

Tests:
- route selection,
- logistics,
- district risk.

### Recruitment and intelligence operations

#### 4. Recruit operator

Purpose:
- expand the organization.

Tests:
- candidate quality,
- trust requirements,
- recurring personnel cost.

#### 5. Scout target

Purpose:
- improve information about a business, location, or rival asset.

Tests:
- information quality,
- preparation value,
- hidden risks.

#### 6. Cultivate informant

Purpose:
- create a recurring information source.

Tests:
- relationships,
- maintenance cost,
- betrayal and exposure risk.

### Expansion and control operations

#### 7. Acquire or pressure business

Purpose:
- gain a legal front, income source, or strategic asset.

Tests:
- alternative acquisition methods,
- resource commitment,
- ownership consequences.

#### 8. Establish local presence

Purpose:
- create influence in a district through a hideout, safe location, or recurring activity.

Tests:
- spatial expansion,
- district resistance,
- operational reach.

### Pressure and rivalry operations

#### 9. Reduce exposure

Possible approaches:
- lay low,
- relocate resources,
- destroy limited evidence,
- or use a corrupt contact.

Tests:
- pressure management,
- opportunity cost,
- difference between exposure and active investigation.

#### 10. Disrupt rival

Possible approaches:
- sabotage an operation,
- interfere with a business,
- intimidate a member,
- or leak selected information.

Tests:
- rival reaction,
- escalation,
- indirect strategic action.

### Deferred operation types

The MVP does not require:
- assassinations,
- kidnapping,
- large armed raids,
- international smuggling,
- complex financial crime,
- political campaigns,
- prison operations,
- or multi-stage heists.

## Opportunities and events

The MVP requires 12–18 reusable opportunity and reaction events.

Events should emerge from simulation state where possible rather than functioning as isolated quests.

### Required opportunity categories

- vulnerable local business,
- available recruit,
- unguarded shipment,
- dissatisfied rival member,
- temporary police distraction,
- valuable storage site,
- business owner seeking protection,
- and exposed rival route.

### Required reaction categories

- increased patrol activity,
- rival warning,
- rival retaliation attempt,
- business refusal or closure,
- crew injury or temporary unavailability,
- informant warning,
- active investigation opening,
- and another organization exploiting local instability.

### Required crisis categories

- hideout exposed,
- key member arrested or threatened,
- income source disrupted,
- and pressure reaching a critical local threshold.

Events should create decisions, not only display narrative text.

## Economy content

The MVP uses a small and readable economy.

### Resource types

Required:
- cash,
- recurring income,
- recurring operating cost,
- generic contraband or illegal goods,
- and limited operational capacity represented through people and assets.

The MVP should not introduce many separate commodities.
One generic contraband category is enough to validate supply and delivery gameplay.

### Cost categories

- wages or member upkeep,
- business upkeep,
- operation cost,
- bribes and favors,
- recovery or medical cost,
- and asset acquisition.

## District state content

Each district needs the following readable state:

- wealth,
- police presence,
- tension,
- criminal influence by organization,
- business opportunity,
- civilian cooperation or resistance,
- and local exposure related to recent operations.

The player does not need exact access to every internal value.
The UI can communicate approximate states such as low, moderate, high, and critical.

## Pressure content

The MVP must support:

- local operational exposure,
- organization-level attention,
- one active investigation at a time,
- district tension,
- police patrol escalation,
- limited arrests,
- one raid or asset-seizure reaction,
- and pressure decay when activity becomes less visible.

The MVP does not need courts, detailed prosecution, long prison gameplay, national agencies, or political reform systems.

## Diplomacy content

The MVP includes a narrow diplomacy slice.

Required relationship dimensions:
- trust,
- fear,
- dependency,
- and hostility.

Required diplomatic actions:
- warn,
- threaten,
- offer or demand a temporary truce,
- trade a favor,
- request information,
- and offer limited cooperation against a shared problem.

Required relationship states:
- neutral,
- wary,
- temporary truce,
- covert cooperation,
- and active conflict.

Formal alliances, subordination networks, institutional protection systems, and complex treaty structures are postponed.

## Progression content

The MVP validates progression from:

- unknown individual,
- to small crew,
- to early local organization.

The MVP must demonstrate that growth provides:
- more parallel operation capacity,
- access to better targets,
- a simple hierarchy,
- more stable income,
- and stronger recovery options.

The MVP does not need regional tiers, multi-city progression, dynasty progression, or advanced organizational doctrines.

## Failure and recovery content

Required setbacks:
- operation failure,
- loss of money or goods,
- member injury,
- temporary arrest of a crew member,
- loss of a business or hideout,
- severe pressure,
- and temporary retreat from a district.

Required recovery options:
- low-risk operations,
- laying low,
- recruiting replacements,
- relocating activity,
- accepting an unfavorable truce,
- and rebuilding recurring income.

The player should be able to recover from major early setbacks.
Boss death may end the MVP run because full succession is outside the MVP scope.

## UI content

The MVP requires the following core surfaces.

### City map

Must show:
- districts,
- relevant locations,
- player and rival influence,
- selected pressure information,
- available opportunities,
- and active operations.

### District overview

Must show:
- economic character,
- major opportunities,
- known organizations,
- pressure and tension,
- and player assets.

### Organization panel

Must show:
- members and roles,
- loyalty and availability,
- assets,
- income and costs,
- and current organizational capacity.

### Operation planning panel

Must show:
- target,
- known information,
- assigned crew,
- required assets,
- estimated reward,
- estimated risk,
- expected duration,
- and possible consequences.

### Character panel

Must show:
- competence,
- loyalty,
- condition,
- relationship to the player,
- and assignment status.

### Business and asset panel

Must show:
- ownership or influence,
- income,
- operating cost,
- cover value,
- strategic function,
- and current risk.

### Pressure and investigation panel

Must show:
- current exposure,
- district tension,
- known investigation state,
- recent causes,
- and available responses.

### Event and history feed

Must show:
- operation outcomes,
- rival reactions,
- police reactions,
- important NPC changes,
- and major shifts in district state.

### System UI

Required:
- pause,
- multiple time speeds,
- notifications,
- tooltips,
- save,
- load,
- and basic settings.

## Audio and visual content

The MVP does not require final art production.

Required presentation content:
- readable placeholder city map,
- clear district differentiation,
- reusable location icons,
- reusable character portraits or silhouettes,
- basic operation and pressure icons,
- simple feedback for success, failure, escalation, and opportunity,
- and minimal ambient audio if available.

The priority is clarity and usability, not final visual quality.

## Save and simulation content

The MVP save must preserve:
- city and district states,
- organizations,
- persistent NPCs,
- relationships,
- businesses and assets,
- active operations,
- pressure and investigations,
- opportunities and unresolved events,
- money and goods,
- and current simulation time.

## Explicit exclusions

The MVP excludes:
- full OpenStreetMap import,
- multiple cities,
- regional and international expansion,
- detailed succession,
- family and dynasty simulation,
- full organization history and legacy,
- complex politics and media,
- advanced financial systems,
- multiple illegal commodity chains,
- courts and prison simulation,
- advanced undercover systems,
- procedural organization cultures,
- and large content libraries.

## Content acceptance checklist

The content set is sufficient when a player can:

- understand four strategically different districts,
- identify several competing opportunities,
- recruit and assign a small crew,
- run operations with meaningful preparation choices,
- establish at least one recurring income source,
- gain and lose local influence,
- trigger recognizable rival and police reactions,
- manage pressure through more than one method,
- suffer a serious setback and recover,
- and reach a stable early local organization state.

## Content rule

Every MVP content item must serve at least one of these purposes:

- create a strategic choice,
- reveal a consequence,
- support recovery,
- or make the simulation easier to understand.

If an item serves none of them, it should be removed from the MVP.

## Open Questions

- Should the four MVP districts use a fictional city or a simplified version of a real city?
- Which ten operation templates should be available immediately and which should be unlocked during the first session?
- Should the established organization be interactable from the beginning or revealed after the player expands?
- How many failed operations can the early economy tolerate before recovery becomes frustrating?
- Which content items require authored event text and which can use systemic summaries?

## Future Extensions

- Additional district archetypes.
- More organization types and internal cultures.
- Specialized illegal supply chains.
- Advanced diplomacy and subordinate organizations.
- Detailed succession and organization history.
- Full real-city generation through OpenStreetMap.
