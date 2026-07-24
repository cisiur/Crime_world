# MVP Game Loop

## Purpose

This document defines the first playable loop of CrimeWorld.

The MVP must prove that planning operations, building a small organization, managing district opportunity, and responding to pressure are engaging before the project expands into full city generation, succession, multi-city play, or long-term legacy systems.

## Validation question

The MVP should answer one question:

> Does the player want to plan one more operation because the next opportunity, risk, and consequence feel meaningfully different from the previous one?

The first playable version succeeds when the player understands why an operation worked or failed, sees the city react, and starts forming their own strategy.

## Starting scenario

The player begins as an unknown individual in one controlled city map containing 3–5 districts.

At campaign start, the player has:
- one low-quality hideout,
- a small amount of personal money,
- one trusted contact,
- no formal organization,
- no controlled district,
- no recurring criminal income,
- low personal exposure,
- and limited knowledge of the city.

The world already contains:
- 2–3 rival criminal organizations,
- several neutral businesses and strategic locations,
- basic police presence,
- district-level economic differences,
- a small pool of recruitable NPCs,
- and visible low-level opportunities.

The player should begin weak, but not directionless.

## First playable objective

The first objective is not a scripted mission.
It is a short sandbox goal:

> Create a stable small crew with one recurring income source while avoiding a pressure crisis.

This objective teaches the full MVP loop without forcing a specific strategy.

The player may achieve it through different combinations of recruitment, operations, business influence, and district selection.

## Core loop

The MVP loop is:

1. Observe the city.
2. Identify an opportunity or threat.
3. Gather available information.
4. Select an operation.
5. Assign people and resources.
6. Review expected reward, duration, and risk.
7. Commit or cancel.
8. Advance time while the operation executes.
9. Resolve the outcome.
10. Apply consequences to people, money, districts, rivals, and pressure.
11. Decide whether to expand, recover, relocate, or stay quiet.
12. Repeat with a changed world state.

Every completed operation must alter at least one future decision.

## First five minutes

The player should:
- create or select a basic character identity,
- receive a short explanation of their starting situation,
- inspect the city and its districts,
- see differences in opportunity, wealth, police presence, and rival influence,
- inspect the trusted starting contact,
- and choose between at least two initial opportunities.

The opening should avoid a long tutorial sequence.
The player should make a meaningful decision quickly.

## Initial opportunities

The MVP should generate or present a small set of low-level opportunities such as:
- a simple theft or collection job,
- a low-volume delivery or smuggling run,
- temporary work for an existing criminal contact,
- recruitment of a risky but useful helper,
- surveillance of a business or rival asset,
- or a small investment in a legal or semi-legal income source.

Initial opportunities should differ in:
- immediate reward,
- exposure,
- required people,
- duration,
- district conditions,
- and possible follow-up opportunities.

There should not be one obviously correct opening choice.

## First operation

The first operation should teach the operation model in a simplified form.

The player should choose:
- the target,
- the assigned character or characters,
- a basic approach where applicable,
- and the amount of money or equipment committed.

Before confirmation, the UI should show:
- expected reward range,
- estimated risk category,
- operation duration,
- important known modifiers,
- and possible visible consequences.

Exact hidden probabilities do not need to be shown.
The player should understand the reason for the estimate.

## First outcome

The first operation may result in:
- full success,
- partial success,
- failure,
- or critical failure.

The game should avoid forcing the first operation to succeed.
However, an early failure should create a recovery decision rather than immediately destroy the campaign.

The result should clearly explain:
- what happened,
- which modifiers mattered,
- what was gained or lost,
- how exposure changed,
- and which new opportunities or threats appeared.

## First world reaction

The city should react within the first 15–20 minutes.

The first reaction may include:
- increased police attention in one district,
- a rival noticing the player's activity,
- a business becoming more cautious,
- a new recruit becoming interested,
- a contact offering a follow-up job,
- or an opportunity disappearing because the world changed.

The reaction does not need to be severe.
Its purpose is to prove that the world remembers and responds.

## First recruitment decision

The player should encounter at least two recruitable characters with different tradeoffs.

Examples:
- competent but unreliable,
- loyal but inexperienced,
- cheap but highly visible,
- expensive but well connected.

Implementation status after E5-06: four concrete persistent candidates now have authored opportunity definitions with visible costs, trust requirements, maintenance previews, locations, and expiration durations; the domain can generate/expire those opportunities deterministically; and one active opportunity can be executed by paying the recruitment cost through the ledger, appending the candidate to membership, and consuming the opportunity. Upkeep generation, role assignment, operational-capacity growth, UI, tick-loop, campaign, save/load, pressure, and rival behavior are still future tasks.

Recruitment should involve more than paying a fixed cost.
The player should consider:
- trust,
- role usefulness,
- personal risk,
- existing relationships,
- and maintenance cost.

The first recruit expands capability but also creates responsibility.

## First recurring income source

During the first session, the player should be able to establish one recurring income source.

Possible sources include:
- a small protection arrangement,
- a low-scale distribution route,
- a legal front activity,
- control of a profitable local service,
- or a repeatable contract through a criminal contact.

Recurring income should not be passive and permanently safe.
It should have at least one dependency, such as:
- a specific district,
- a business relationship,
- a crew member,
- a supply source,
- or an acceptable pressure level.

This gives rivals and pressure something meaningful to threaten.

## First expansion choice

After establishing basic income, the player should face a genuine strategic choice:
- deepen activity in the current district,
- enter a more profitable but dangerous district,
- invest in a business,
- recruit another specialist,
- attack or undermine a rival opportunity,
- or stay quiet and reduce exposure.

This is the first moment when the player should feel that they are building an organization rather than completing isolated missions.

## Pressure rhythm

Pressure should create rhythm, not a punishment timer.

The basic MVP cycle is:

> operate → gain value → create exposure → observe reaction → manage pressure → operate again

The player should have several responses to rising pressure:
- pause visible operations,
- move activity to another district,
- spend money on basic protection or misdirection,
- abandon a compromised opportunity,
- or accept lower income temporarily.

Staying quiet may reduce short-term exposure, but it should not erase evidence, active investigations, damaged relationships, or rival hostility.

## Rival interaction

At least one rival organization should become relevant during the first session.

The rival may:
- compete for the same opportunity,
- control a useful location,
- react to player expansion,
- pressure a shared contact,
- exploit a failed player operation,
- or offer a temporary arrangement.

The rival does not need the full diplomacy model in MVP.
A limited set of reactions is enough:
- ignore,
- warn,
- obstruct,
- retaliate,
- negotiate a temporary boundary,
- or exploit weakness.

## Session phases

### Phase 1: Orientation

The player learns:
- who they are,
- where they are,
- which districts differ,
- and which first opportunities exist.

Target pacing: first 5 minutes.

### Phase 2: First risk

The player recruits or uses a contact and commits to the first operation.

Target pacing: first 10–15 minutes.

### Phase 3: First consequence

The operation resolves and the city reacts.
The player learns that reward, exposure, and relationships are connected.

Target pacing: first 15–20 minutes.

### Phase 4: First structure

The player builds a small crew and establishes a recurring income source.

Target pacing: first 30–45 minutes.

### Phase 5: First strategic identity

The player chooses whether to become aggressive, cautious, economic, opportunistic, or relationship-driven.

Target pacing: within the first 45–60 minutes.

## First-session stabilization state

A first session may be considered stabilized when the player has:
- a living player character,
- one hideout,
- at least one recruited member or reliable external operator,
- one recurring income source,
- enough money to fund another operation,
- manageable pressure,
- and at least two plausible next strategic choices.

This is not victory.
It is the point where the sandbox can continue without tutorial scaffolding.

## Failure and recovery in the first session

The first session should allow setbacks such as:
- losing money,
- an injured or arrested helper,
- a failed recruitment attempt,
- temporary loss of an opportunity,
- increased district exposure,
- or rival interference.

A setback should create a recovery route through:
- a smaller operation,
- help from the starting contact,
- selling or abandoning an asset,
- changing districts,
- or waiting for short-term exposure to fall.

The player should understand that failure changes the plan rather than simply demanding a reload.

## Information available to the player

The MVP should show enough information to support decisions without exposing every hidden number.

The player should see:
- district condition summaries,
- known rival presence,
- operation requirements,
- estimated risk and reward,
- current money and recurring income,
- crew availability,
- visible exposure or pressure state,
- and recent world reactions.

The player should not automatically know:
- exact success probabilities,
- hidden loyalty values,
- all rival plans,
- or complete police investigation state.

Better information should come from contacts and intelligence actions.

## Emotional arc

The intended first-session emotions are:
- vulnerability at the beginning,
- agency after choosing the first plan,
- tension while time advances,
- satisfaction or adaptation after the outcome,
- concern when the world reacts,
- ownership when the first crew and income structure form,
- and ambition when multiple paths open.

## Anti-patterns

The MVP loop should avoid:
- a scripted sequence with only one valid opening,
- repeated operations that differ only by reward value,
- pressure that rises automatically without an understandable cause,
- passive businesses that cannot be threatened,
- rivals that exist only as static map markers,
- mandatory early combat,
- long periods of waiting with no decision,
- and early failure states that encourage immediate reloads.

## MVP playtest success criteria

The loop is validated when playtests show that:
- players understand the basic opportunity → operation → consequence cycle,
- players can explain why they chose one operation over another,
- players notice that districts and assigned people affect outcomes,
- players respond to pressure instead of ignoring it,
- players form different strategies from the same starting state,
- setbacks produce adaptation rather than automatic reloads,
- and players want to continue after reaching the first stabilization state.

A successful session does not require the player to dominate the city.
It requires the player to care about the next decision.

## Relationship to the full game

The MVP loop is the smallest complete expression of the full CrimeWorld fantasy.

Later versions may add:
- deeper diplomacy,
- imprisonment,
- succession,
- organization history,
- multiple cities,
- full OpenStreetMap generation,
- advanced politics,
- and long-term dynasty play.

These systems should extend the validated loop rather than replace it.

## Design principle

The MVP game loop is well designed when every operation creates a new decision and every consequence changes what the player wants to do next.

## Open Questions

- Should the first starting contact always be reliable, or can campaigns begin with an uncertain relationship?
- How many starting opportunities are needed to produce meaningful variation without overwhelming the player?
- Should the first recurring income source be fully sandbox-generated or partially curated for onboarding?
- What is the ideal real-time length of the first stabilization arc?
- Which rival reaction best demonstrates the living-world promise without creating excessive early difficulty?

## Future Extensions

- Multiple starting backgrounds and contact networks.
- Different city-specific opening pressures.
- Scenario starts with existing debts, enemies, or family obligations.
- Dynamic tutorials that react to the player's chosen strategy.
- Cooperative or competitive multiplayer opening loops if multiplayer is ever explored.
