# World Dependency Graph

## Purpose

This document describes the core dependency graph of CrimeWorld.

The goal is not to list features.
The goal is to define how systems influence one another so that future mechanics can be added without breaking the structure of the game.

## Reading rule

A dependency graph is more useful than isolated system descriptions.
A system should usually have both incoming and outgoing influences.

If a system has no meaningful dependencies, it is probably too weak or unnecessary.

## Core graph philosophy

CrimeWorld should be built as a living web of causes and consequences.

The player does not only interact with content.
The player alters the state of the world, and the world responds through connected systems.

---

# 1. Top-level world loops

## Loop A: economy loop

Population needs
-> consumer demand
-> business activity
-> money flow
-> logistics demand
-> employment
-> poverty / wealth shifts
-> crime pressure
-> police pressure
-> more economic change

## Loop B: crime loop

Opportunity
-> criminal action
-> reward
-> attention
-> pressure
-> retaliation
-> adaptation
-> new opportunity

## Loop C: control loop

Influence
-> business control
-> territorial control
-> logistics control
-> political leverage
-> lower resistance in some areas
-> stronger expansion
-> higher visibility
-> stronger opposition

## Loop D: organization loop

Leadership
-> trust / fear / loyalty
-> operational effectiveness
-> profits
-> internal stability
-> succession risk
-> leadership change
-> new organization behavior

---

# 2. Core economic dependencies

## Population -> demand

A city needs consumers, workers, and neighborhoods.
Population drives demand for goods, services, housing, transport, entertainment, and illegal goods.

## Demand -> businesses

Demand creates businesses and business growth.

## Businesses -> jobs

Businesses create jobs and income.

## Jobs -> wealth distribution

Jobs affect local wealth, consumption, and stability.

## Wealth distribution -> crime pressure

Poorer areas may produce more street crime, desperation, recruitment potential, and black-market demand.
Richer areas may produce better targets, more surveillance, and stronger legal resistance.

## Businesses -> logistics demand

More business activity means more transport, storage, supply chains, and movement of goods.

## Logistics -> prices

Transport quality and route efficiency affect prices and margins.

## Prices -> player opportunity

High prices, broken supply chains, scarcity, or low security create openings for the player.

---

# 3. Criminal economy dependencies

## Scarcity -> criminal opportunity

When legal systems fail to satisfy demand, illegal systems grow.

## Criminal opportunity -> criminal organizations

Profitable crime attracts gangs, mafias, cartels, and opportunists.

## Criminal organizations -> competition

When one group grows, rivals react.

## Competition -> violence / corruption / diplomacy

Rivals may fight, bribe, infiltrate, negotiate, or absorb one another.

## Criminal organizations -> illegal supply chains

Organizations need access to goods, transport, safe storage, trusted people, and laundering.

## Illegal supply chains -> profit

The more secure and efficient the chain, the more profit and influence it generates.

## Profit -> expansion

Profit allows recruitment, business purchases, corruption, expansion, and stabilization.

## Expansion -> attention

Expansion increases visibility and pressure.

---

# 4. Police and pressure dependencies

## Crime visibility -> police pressure

The more visible or disruptive the player's actions are, the more attention they create.

## Police pressure -> investigations

Investigations increase the chance of raids, arrests, surveillance, and asset loss.

## Corruption -> reduced enforcement effectiveness

Corruption can weaken response, but should not remove risk entirely.

## Media / public fear -> political support for police

Public panic can increase police budgets and political pressure.

## Higher police budgets -> more capability

More capability means better investigations, more raids, and better intelligence.

## Strong police -> tougher criminal operations

Strong police make violence, open expansion, and repeated exposure more costly.

## Internal police weakness -> player opportunity

Corruption, incompetence, overload, and rivalry inside police structures create openings for the player.

---

# 5. Organization dependencies

## Leadership -> trust

Leadership quality affects loyalty, execution quality, and internal stability.

## Trust -> operation success

Trusted crews are less likely to betray, fail, or panic.

## Greed / fear / ambition -> betrayal risk

These traits affect whether NPCs stay loyal, seize power, or defect.

## Size -> complexity

As an organization grows, coordination becomes harder.

## Size -> visibility

A bigger organization attracts more attention.

## Size -> reach

A bigger organization can move into more cities, sectors, and networks.

## Reach -> coordination cost

Larger empires need more trusted managers, logistics, and communication.

## Succession risk -> internal conflict

If leadership changes, the organization may split, revolt, or collapse.

---

# 6. District dependencies

## Infrastructure -> district value

Roads, hubs, ports, and land use affect district usefulness.

## District value -> business density

Good districts attract more businesses and more valuable targets.

## Business density -> police presence

Important economic districts tend to draw more security and state attention.

## Business density -> criminal opportunity

More business means more laundering, extortion, theft, sabotage, and infiltration opportunities.

## Poverty -> recruitment potential

Poorer districts can produce easier recruitment for criminal organizations.

## Affluence -> valuable targets

Wealthy districts create better high-value criminal opportunities.

---

# 7. Character dependencies

## Family / relationships -> loyalty

Important NPCs are influenced by family, friends, debts, grudges, and personal ambition.

## Health / stress -> performance

Burned-out or injured characters perform worse.

## Reputation -> access

Reputation affects trust, recruitment, diplomacy, and intimidation.

## Fear / respect -> compliance

Characters may obey because they trust the boss, respect them, or fear them.

## Secrets -> leverage

Secrets create blackmail opportunities and political power.

---

# 8. Expansion dependencies

## Local control -> regional influence

Controlling districts and businesses in one place can build regional power.

## Regional influence -> stronger logistics

Regional power improves movement, supply chains, and access to resources.

## Regional influence -> political leverage

More regional strength can affect officials, police, and local institutions.

## Regional influence -> cross-city expansion

A stronger network makes it easier to enter other cities.

## Global reputation -> easier entry

A feared or respected organization may enter new markets more easily.

## Global visibility -> stronger opposition

The more famous the organization becomes, the more opponents react.

---

# 9. Story emergence dependencies

## Conflict -> memory

Major events should leave behind state that matters later.

## Betrayal -> revenge

A betrayal should create future consequences, not just immediate loss.

## Arrest -> succession pressure

A leader being removed should trigger internal instability.

## Victory -> new weakness

Winning should often create a new vulnerability.

## Loss -> new opportunity

A failed rival or weakened district should open future plays.

This is how the game generates stories instead of isolated outcomes.

---

# 10. Important design constants

## Constant 1: control increases risk

The more control the player gains, the more visible and vulnerable the organization becomes.

## Constant 2: every asset should connect to another system

A business should not exist only as a money generator.
It should connect to logistics, cover, recruitment, laundering, influence, or risk.

## Constant 3: no system should be isolated

If a feature does not influence other features, it should be reconsidered.

## Constant 4: abstraction is allowed when it preserves the dependency

We do not need exact realism everywhere.
We need believable cause and effect.

## Constant 5: the graph is more important than the list

The order of systems matters less than how they influence one another.

---

# 11. Suggested core dependency backbone

A simplified version of the whole game can be read as:

Population
-> demand
-> business activity
-> logistics
-> wealth distribution
-> crime opportunity
-> organizations
-> operations
-> pressure
-> adaptation
-> expansion
-> more population impact

That loop should remain visible in every future system.

## Final principle

If a future mechanic does not fit into this graph, it should not be added yet.
If it fits the graph and creates a new decision, it is likely worth keeping.
