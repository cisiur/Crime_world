# Diplomacy Model

## Purpose

This document defines how organizations, institutions, and the player interact through negotiation, cooperation, leverage, and betrayal.

Diplomacy is not just flavor text.
It is a parallel system to war and expansion.

Through diplomacy, the player can:
- stabilize a contested district without fighting,
- use rivals as proxies,
- turn institutions into tools,
- avoid costly wars by paying tribute or accepting conditions,
- enable covert operations via secret cooperation.

## Core idea

Diplomacy is the layer that turns neutral or hostile actors into usable forces.

In CrimeWorld, organizations are not just enemies and allies.
They are strategic entities with:
- interests,
- fears,
- dependencies,
- leverage over each other,
- tolerance for risk and exposure.

A diplomacy system should reflect this complexity.

## Actors in diplomacy

Diplomacy in CrimeWorld involves:

### Player and organization
- The player leads an organization.
- The player also has personal traits, contacts, and reputation.
- The organization has assets, territory, income, and rivalries.
- Both affect diplomacy: the player through personal influence, the organization through power and position.

### Rival organizations
- Street gangs, mafia families, cartels, hybrid syndicates.
- Each has its own interests, strengths, weaknesses, and strategic focus.
- They can form alliances, truces, or subordination deals.
- They can also engage in covert cooperation or betrayal.

### Police and law enforcement
Traktowane asymetrycznie:
- Nie mają dyplomacji w sensie pełnych sojuszy.
- Ich relacje są ukierunkowane na:
  - korupcję,
  - nacisk,
  - ochronę,
  - przeciek,
  - polityczny crackdown.
- Policja i śledczy mogą:
  - przyjąć propozycję spokoju pod warunkiem konkretnych działań,
  - być wpływowi przez budżet i polityczny nacisk,
  - współpracować z konkurencjami,
  - być wykorzystywani w układach.

### Political actors
Traktowane asymetrycznie:
- Politycy, urzędnicy, komisarze, lokalne władze.
- Ich relacje to:
  - korupcja,
  - nacisk polityczny,
  - obietnica ochrony,
  - wspólne cele policyjne,
  - przecieki informacyjne.
- Nie tworzą sojuszy, ale mogą być narzędziem w układach.

## Relation dimensions

Each active relationship has a set of numeric or bounded values.

These are the hidden dimensions:

### Trust
- How much the actor believes the other will act in good faith.
- Increases after successful cooperation and fulfilled deals.
- Decreases after betrayal, leaks, or broken promises.
- High trust enables complex deals and long-term cooperation.

### Fear
- How much the other actor can threaten this actor's survival or interests.
- Based on demonstrated violence, pressure, and strategic leverage.
- High fear can lead to submission, tribute, or defensive alliances.
- Low fear encourages aggression and testing of boundaries.

### Leverage
- How much power one actor has over another through control of:
  - territory,
  - resources,
  - corruption nodes,
  - criminal supply,
  - political access.
- Leverage is asymmetric.
- High leverage allows coercive diplomacy.

### Dependency
- How much this actor relies on the other for:
  - income,
  - logistics,
  - protection,
  - political cover.
- High dependency increases risk if the relationship breaks.
- Low dependency allows more freedom of action.

### Respect
- How much the actor views the other as a credible, consistent, powerful force.
- Grows with consistent behavior, strength, and reliability.
- High respect makes negotiation more effective.
- Low respect encourages testing and undermining.

### Hostility
- Measured desire to harm, weaken, or destroy the other.
- Based on past conflicts, territorial disputes, ideological clashes.
- High hostility makes peace unstable and deals harder.
- Negative hostility can lead to cooperative interests.

### Legitimacy cover
- How much relationship can be presented as legitimate or indirect.
- Crucial for deals with institutions and political actors.
- Higher legitimacy cover reduces risk of exposure and crackdown.

Visible relationship states are derived from these dimensions.

## Formal relationship states

These are the concrete states that can be represented in UI and logic.

### Neutral
- No formal agreement.
- Interactions possible but not protected.
- Default state between unknown organizations.

### Wary
- Mutual suspicion.
- Cooperation possible but with high risk of betrayal.
- Small conflicts easy to escalate.

### Cold peace
- Formal non-aggression, but no cooperation.
- Based on exhaustion or temporary balance.
- Easily broken if advantage appears.

### Pact (non-aggression)
- Both sides agree not to fight for a defined period.
- May include conditions (e.g., no expansion into certain districts).
- Breach of pact increases hostility and fear.

### Truce
- End of active conflict.
- Often temporary or conditional.
- May require tribute or concessions.

### Alliance
- Both sides agree to cooperate against third parties.
- May include joint operations, resource sharing, or mutual defense.
- High trust and respect required.
- Can be fragile if interests diverge.

#### Alliance types
- Defensive alliance — mutual defense against aggression.
- Offensive alliance — joint expansion or targeting of a rival.
- Situational alliance — cooperation limited to specific goals or districts.

### Subordination
- One organization accepts a subordinate role to another.
- Subordinate pays tribute, accepts restrictions, follows orders in defined areas.
- Superior organization gains income, influence, and control.
- Breach can lead to rebellion or external intervention.

### Corrupt protection (with institutions)
- Organization pays for protection from police or political action.
- Institution reduces pressure, delays investigations, or provides warnings.
- Legitimacy cover is important.
- Exposure risk high if discovered.

### Covert cooperation
- Secret cooperation between rivals or with institutions.
- Not publicized.
- May include:
  - swapping intelligence,
  - coordinated timing,
  - silent support in operations.
- Can be a stepping stone for formal alliances or betrayal.

### Active conflict
- Open hostility and fighting.
- No diplomatic cover.
- All diplomatic actions disabled until ceasefire or truce.

Each state has constraints on:
- allowed operations,
- mobility,
- resource flows,
- political cover.

## Hidden relationship layer

Not all agreements are visible.

Hidden layer includes:
- secret deals,
- informal protection,
- double agents,
- covert intelligence sharing,
- informal tribute,
- unofficial ceasefire zones.

Hidden agreements:
- are risky but flexible,
- can be discovered by rivals or institutions,
- can be used as leverage for blackmail or betrayal,
- can lead to sudden public shifts if exposed.

Hidden layer interacts with:
- political pressure,
- police investigations,
- rival intelligence operations.

## Diplomatic actions

Organizations and institutions can perform diplomatic actions.

### Negotiate
- Propose a formal or informal deal.
- Requires some level of trust, respect, or leverage.
- Can propose:
  - truce,
  - pact,
  - alliance,
  - subordination,
  - covert cooperation.

### Demand
- Force terms on the other actor.
- Requires high leverage or fear.
- Can demand:
  - tribute,
  - territory,
  - restrictions on operations,
  - access to resources.

### Threaten
- Escalate pressure without immediate violence.
- Can lead to negotiation or breakdown.

### Bribe
- Monetary or resource-based leverage.
- Mainly used with institutions and political actors.
- Can buy:
  - protection,
  - delay investigations,
  - warnings,
  - leaks.

### Trade favors
- Exchange of resources, services, or access.
- Can be used to build trust and dependency.

### Propose ceasefire
- Offer to end active conflict.
- May require concessions or tribute.
- If accepted, may lead to pact or truce.

### Request alliance
- Propose formal cooperation against third parties.
- Requires mutual strategic interest.

### Offer protection
- Offer shield against police or political action.
- Mainly with institutions or political actors.

### Betray
- Secretly break an agreement.
- Can involve:
  - informing to police,
  - leaking deals,
  - coordinating attacks with rivals.
- High risk, high reward.
- Large drop in trust and respect.

### Warn
- Informal signal that a relationship is at risk.
- Can be used to prevent escalation or betrayal.

Each action has:
- cost (money, resources, exposure),
- prerequisites (trust, leverage, fear levels),
- risk of failure or backlash.

## AI evaluation logic

Non-player actors evaluate diplomatic offers using a model.

### Decision factors
- current relation dimensions (trust, fear, leverage, etc.)
- strategic situation:
  - pressure level,
  - district competition,
  - resource needs,
  - organizational stability
- player reputation:
  - known for keeping deals,
  - known for violence,
  - known for betrayal
- risk exposure:
  - police pressure,
  - political scrutiny,
  - rival interest

### Acceptance criteria
- Offers are accepted if:
  - benefits outweigh risks,
  - the actor feels they can enforce the deal,
  - there is enough trust or fear to prevent betrayal.
- Offers are rejected if:
  - risks are too high,
  - the actor is already committed to another deal,
  - trust or fear is too low.

### Risk assessment
- AI considers:
  - probability of betrayal,
  - probability of exposure,
  - cost of failure,
  - impact on long-term stability.

## Breakdown and betrayal

Relacje są dynamiczne.

### Natural breakdown
- If trust decays, agreements become unstable.
- If dependency drops, actor may become more independent.
- If fear decreases, actor may test boundaries.

### Forced breakdown
- External pressure (police crackdown, political action) can force actor to abandon deals.
- Competing alliances can cause conflict.

### Betrayal
- Can be planned or opportunistic.
- High risk, high reward.
- AI may prepare betrayal if:
  - player's power threatens their position,
  - they have better offers from rivals,
  - they have high leverage and low fear.

## Player perspective

The player sees:
- formal relationship states,
- visible diplomatic options,
- some indicators of trust, fear, and leverage,
- risk of arrangement breaking.

The player does not see:
- exact numeric values,
- hidden deals,
- internal calculations of AI.

To uncover hidden information, player must:
- use intelligence operations,
- cultivate informants,
- blackmail or threaten key actors.

## Design principle

A diplomacy system is well designed if it changes strategic choices.

Diplomacy should not be:
- just a menu of static options,
- a way to avoid conflict without risk,
- invisible background logic.

Diplomacy should be:
- a tool for managing risk,
- a way to create long-term advantages,
- a source of emergent stories through betrayal, alliance, and pressure.
