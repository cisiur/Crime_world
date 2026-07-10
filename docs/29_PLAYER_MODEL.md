# Player Model

## Purpose

This document defines the player character as a concrete entity within the simulation.

The player is not just a cursor that issues commands.
The player is a character with properties, risks, growth, and a specific relationship to their organization.

## Core idea

The player character is the most important NPC in the game.

They have a unique position: they are inside the simulation, exposed to its consequences,
but they are also the only entity the human controls.

The player character should feel personal, vulnerable, and meaningful.
If the player character dies or goes to prison, it should matter.

## Player character properties

The player character should have:
- name
- age
- reputation (street, criminal, political, legal)
- personal heat (separate from organization heat)
- personal wealth
- personal network (contacts, loyalties, debts)
- physical condition (health, injury, stress)
- psychological state (confidence, paranoia, ambition)
- known associates (visible to law enforcement)
- criminal record
- legal cover (businesses, identities, lawyers)

## Player vs organization

The player character and the organization they lead are related but not identical.

| Dimension | Player character | Organization |
|---|---|---|
| Scale | One person | Many people and assets |
| Heat | Personal exposure | Institutional exposure |
| Risk | Arrest, death, injury | Raids, seizures, collapse |
| Reputation | Personal standing | Collective standing |
| Growth | Skills, contacts, influence | Territory, income, capacity |
| Vulnerability | Personal mistakes | Structural weaknesses |

An organization can survive the player's temporary absence (arrest, hospitalization).
A strong enough organization may even survive the player's death — but the game ends there.

## Player growth

The player character should grow through experience, not through abstract skill trees.

Growth dimensions:
- reputation — how the criminal world perceives them
- network — who owes them, who trusts them, who fears them
- knowledge — understanding of districts, organizations, and weaknesses
- legal exposure — how much law enforcement knows about them
- personal wealth — assets held separately from the organization
- influence — the ability to make things happen through personal authority

Growth should happen organically through decisions and outcomes,
not through XP bars or arbitrary stat purchases.

## Player risks

The player character faces personal risks that the organization cannot fully absorb.

### Arrest
- The player can be arrested if personal heat reaches a critical threshold.
- Arrest does not end the game immediately.
- While arrested, the organization continues to run under a trusted lieutenant.
- The player must manage legal exposure, find legal cover, or be released through influence.
- A long arrest weakens organizational loyalty and creates succession pressure.

### Death
- The player can be killed by rival organizations, police, or betrayal.
- Death ends the current campaign.
- The game should make death feel meaningful and avoidable through smart play.
- Death should never feel random — it should be a consequence of identifiable decisions.

### Injury and stress
- Physical injury reduces the player's ability to take direct actions.
- Stress and paranoia affect decision quality (reflected in available choices and probabilities).
- Both recover over time with the right conditions (safe houses, downtime, trusted allies).

### Betrayal
- Key lieutenants may turn against the player if loyalty collapses.
- Betrayal may take the form of a coup, an informant deal with police, or defection to a rival.
- The player can detect betrayal risk through intelligence operations.

## Player visibility

The player character exists on a spectrum from unknown to notorious.

| Visibility level | State | Effect |
|---|---|---|
| Unknown | Ghost | Full freedom of movement, no police interest |
| Suspected | On radar | Occasional surveillance, soft restrictions |
| Known | Named | Monitored contacts, harder legal cover |
| Wanted | Hunted | Active investigation, travel restricted |
| Notorious | Legend | Massive heat, but fear-based influence |

The player should be able to manage their visibility deliberately.
Low profile is a strategic choice, not a default.

## Player as a diplomatic actor

The player character's personal reputation affects diplomatic outcomes.

- a player known for keeping deals has better negotiation outcomes
- a player known for violence gets faster submission but more coalition pressure
- a player with wide personal networks has more options in crisis
- a player who has betrayed allies faces narrower diplomatic options later

## Player and the organization's identity

The organization reflects the player's choices over time.

An aggressive player builds a feared but watched organization.
A subtle player builds a quiet but deeply networked one.
A diplomatic player builds alliances but depends on relationships that can break.

The organization is not a neutral tool.
It is the accumulated consequence of how the player has played.

## What the player can do directly

The player character can take some actions personally, outside the organization.

Direct player actions may include:
- meeting a contact face to face
- negotiating with a rival boss directly
- visiting a front business to manage its cover
- personally extracting a compromised crew member
- going into hiding to let heat decay faster
- making a personal bribe that does not trace back to the organization

Direct actions are higher risk and higher reward than delegated operations.
They also carry personal exposure that affects the player character's heat directly.

## Player character at campaign start

At the beginning of a campaign, the player character should:
- be unknown to law enforcement
- have minimal personal wealth
- have one or two reliable personal contacts
- have no criminal record (or a minor one)
- have no territory or organizational assets
- have ambition and a starting reason to enter the criminal world

The starting state should feel like a real beginning, not a tutorial wrapper.

## Design principle

The player character is well designed if losing them feels like losing something real.
If the player is just a login screen for the organization, the character is too shallow.
The player should be able to care about their character's survival independently of the organization's fate.
