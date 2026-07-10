# Diplomacy Model

## Purpose

This document defines how criminal organizations and important actors interact through negotiation, leverage, dependency, cooperation, coercion, and betrayal.

Diplomacy is a strategic alternative to open conflict.
It should change what the player can safely do, where they can operate, and which risks they can transfer to other actors.

## Core idea

Diplomacy is not a universal menu shared by every faction.

CrimeWorld distinguishes between:
- diplomacy between criminal organizations,
- personal relationships between important NPCs,
- institutional influence over police, politics, and administration.

These systems can interact, but they should not be treated as identical.

## Diplomatic actors

### Criminal organizations

Criminal organizations can:
- negotiate truces,
- form pacts,
- create alliances,
- exchange access or resources,
- accept subordination,
- threaten one another,
- betray agreements,
- cooperate covertly.

### Important characters

Bosses, lieutenants, fixers, officials, and other key NPCs can maintain personal relationships that differ from formal organizational relations.

A personal relationship can:
- preserve communication during conflict,
- create secret deals,
- weaken formal agreements,
- survive leadership changes,
- become leverage during succession.

### Institutions

Police, prosecutors, city administration, and political bodies do not participate in diplomacy like criminal organizations.

The player influences institutions through specific people, offices, budgets, procedures, corruption nodes, political pressure, and legal cover.

Institutional interaction includes:
- bribery,
- corruption,
- political sponsorship,
- information leaks,
- protection from specific actions,
- delayed investigations,
- procedural obstruction,
- selective enforcement.

An institution as a whole should not sign an alliance or non-aggression pact with the player.

## Core relationship dimensions

Each active relationship uses four primary dimensions.

### Trust

How strongly an actor expects the other side to honor commitments.

Trust increases through:
- fulfilled deals,
- reliable support,
- shared risk,
- consistent behavior.

Trust decreases through:
- broken agreements,
- leaks,
- deception,
- abandonment during crisis.

### Fear

How strongly an actor believes the other side can harm its interests or survival.

Fear can produce:
- submission,
- tribute,
- caution,
- defensive coalitions,
- preemptive betrayal.

### Dependency

How much an actor relies on the other side for:
- income,
- logistics,
- territory access,
- protection,
- information,
- political or legal cover.

Dependency can stabilize a relationship while also creating resentment.

### Hostility

How strongly an actor wants to weaken, punish, or destroy the other side.

Hostility grows through:
- territorial conflict,
- betrayal,
- humiliation,
- repeated disruption,
- incompatible long-term interests.

## Derived factors

### Leverage

Leverage is not a permanent relationship stat.
It is calculated from the current situation.

Sources of leverage include:
- control of territory,
- control of supply routes,
- blackmail material,
- economic dependency,
- military advantage,
- political access,
- knowledge of secrets.

### Respect

Respect is a modifier derived from reputation, consistency, competence, and demonstrated strength.
It affects negotiation credibility but does not replace trust or fear.

### Legitimacy cover

Legitimacy cover belongs to a specific deal, asset, or channel rather than to the whole relationship.
It determines how safely an arrangement can be hidden behind legal activity.

## Formal relationship states

### Neutral

No formal agreement exists.

### Wary

Both sides expect possible conflict or betrayal.

### Cold peace

Open conflict is avoided, but cooperation remains limited.

### Non-aggression pact

Both sides accept defined restrictions for a limited period.

Possible terms:
- no attacks,
- no expansion into named districts,
- no interference with named businesses,
- no recruitment from the other side.

### Truce

An active conflict is suspended.
A truce may include tribute, concessions, withdrawal, or temporary boundaries.

### Alliance

Organizations cooperate toward shared strategic goals.

Alliance types:
- defensive,
- offensive,
- situational,
- district-specific,
- operation-specific.

### Subordination

One organization accepts a lower position.

Possible terms:
- tribute,
- territorial restrictions,
- operational support,
- resource access,
- protection,
- succession approval.

### Covert cooperation

Secret collaboration without a public formal relationship.

Examples:
- intelligence exchange,
- coordinated timing,
- proxy attacks,
- hidden route sharing,
- unofficial ceasefire zones.

### Active conflict

Open hostility removes most normal diplomatic options until communication or a ceasefire is restored.

## Deal model

A diplomatic agreement should be represented as a concrete deal with:
- participants,
- terms,
- duration,
- obligations,
- concessions,
- enforcement mechanisms,
- secrecy level,
- exposure risk,
- breach consequences.

This is more useful than changing only a generic relation state.

## Diplomatic actions

### Negotiate

Propose a new deal or modify an existing one.

### Demand

Use leverage or fear to force concessions.

Possible demands:
- tribute,
- territory,
- route access,
- withdrawal,
- resource delivery,
- surrender of an associate.

### Threaten

Increase pressure without immediately starting open conflict.

### Exchange favors

Trade resources, access, information, or services.

### Offer criminal protection

Offer protection from:
- rival organizations,
- street violence,
- supply disruption,
- territorial aggression.

This action applies to organizations, businesses, or individuals, not to an institution as a whole.

### Request mediation

Ask a respected third party to reduce hostility or create a truce.

### Propose ceasefire

Attempt to pause active conflict under defined terms.

### Betray

Secretly violate an agreement for strategic gain.

Betrayal may include:
- leaking information,
- coordinating with a rival,
- breaking territorial terms,
- withholding promised support,
- using an agreement as preparation for attack.

## Institutional influence

Institutional influence is handled through targeted relationships and operations rather than formal diplomacy.

Possible targets:
- police officer,
- unit commander,
- prosecutor,
- judge,
- inspector,
- politician,
- administrator,
- union leader,
- regulator.

Possible effects:
- warning about a raid,
- slowed investigation,
- redirected enforcement,
- ignored violations,
- protected permit or contract,
- political pressure on a rival,
- temporary procedural delay.

Institutional influence should be fragile, personal, and exposed to leadership changes, investigations, and political pressure.

## AI evaluation

AI actors evaluate a proposal using:
- expected benefit,
- expected risk,
- trust,
- fear,
- dependency,
- hostility,
- current leverage,
- organization stability,
- pressure level,
- rival threats,
- likelihood of enforcement,
- likelihood of exposure.

AI should accept deals when they improve its strategic position, not because the player reached an arbitrary relation threshold.

## Breakdown and betrayal

Relationships change when conditions change.

A deal becomes unstable when:
- trust declines,
- dependency disappears,
- hostility rises,
- leverage shifts,
- terms are no longer beneficial,
- external pressure makes the deal dangerous,
- leadership changes.

Betrayal should be more likely when:
- the betrayer has an alternative partner,
- the victim is weakened,
- enforcement is weak,
- secrecy creates opportunity,
- ambition outweighs fear.

## Player information

The player should see:
- formal relationship state,
- known deal terms,
- broad indicators of trust, fear, dependency, and hostility,
- warnings about instability,
- visible leverage sources.

The player should not automatically see:
- exact hidden values,
- secret deals,
- internal AI calculations,
- concealed personal relationships.

Hidden information is uncovered through:
- intelligence operations,
- informants,
- surveillance,
- blackmail,
- personal contacts.

## Relationship to other systems

Diplomacy connects to:
- operations,
- organization AI,
- district control,
- supply chains,
- pressure,
- succession,
- personal reputation,
- emergent stories.

A deal should change what actors can do, not merely display a new label.

## Design principle

Diplomacy is well designed when it creates enforceable commitments, strategic dependencies, credible betrayal risks, and alternatives to direct conflict.

It should not become a static menu, a universal solution, or a way to neutralize risk permanently.

## Open Questions

- Which deal terms must be supported in the first full version?
- How are deal violations detected?
- Can organizations guarantee deals with hostages, collateral, or shared assets?
- How much of a relationship survives leadership succession?

## Future Extensions

- mediation networks,
- formal criminal councils,
- hostage and collateral agreements,
- cross-city treaties,
- political patronage blocs,
- succession recognition deals,
- more complex proxy conflicts.
