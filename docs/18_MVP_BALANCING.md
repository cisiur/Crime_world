# MVP Balancing

## Purpose

This document defines how the CrimeWorld MVP should be tuned during prototyping and playtesting.

It does not prescribe final production values.
It defines target relationships, pacing windows, acceptable failure rates, and the evidence required before changing balance.

## MVP balance question

The MVP must answer:

> Can the player repeatedly make tense, understandable decisions between profit, growth, exposure, and survival without the game becoming either trivial or punishing?

Balance is successful when the player:
- understands why an outcome happened,
- can compare safer and more ambitious options,
- feels meaningful progress within the first session,
- experiences pressure before becoming dominant,
- and can recover from early mistakes through deliberate choices.

## Core balance principles

### Tension with recoverability

The player should frequently feel that something important is at risk.
Most individual failures should damage the player's position without immediately ending the run.

### Decisions before numbers

Balance should create different viable choices, not one mathematically correct action.

A weaker operation can remain useful because it is:
- quieter,
- faster,
- cheaper,
- easier to repeat,
- or strategically useful for information and access.

### Consequences must be legible

Before commitment, the player should understand:
- expected reward,
- known costs,
- estimated risk,
- likely exposure,
- and major prerequisites.

The player does not need exact hidden probabilities, but they must be able to make an informed decision.

### Growth changes the problem

Progression should not simply reduce all difficulty.

As the organization grows:
- income becomes more stable,
- operations become more capable,
- but visibility, coordination cost, rivalry, and pressure increase.

### Avoid precision before playtests

Early values are hypotheses.
Use broad bands and ratios first, then refine them using telemetry and observed player behavior.

## Starting state targets

The player begins with:
- one playable boss,
- one basic hideout,
- enough money for one meaningful operation and limited recovery,
- no controlled district,
- no reliable recurring income,
- one weak contact or recruit opportunity,
- low organization exposure,
- and incomplete information about the city.

The starting position must be weak but actionable.
The player should never begin in a state where waiting is the only sensible decision.

## First-session pacing targets

These are playtest targets rather than strict timers.

### First 5 minutes

The player should:
- identify at least two possible opportunities,
- understand the basic difference between reward and exposure,
- and be able to commit to a first action.

### First 15 minutes

The player should normally:
- complete one operation,
- experience a visible result,
- gain or lose a meaningful resource,
- and see the first world reaction.

### First 30 minutes

The player should normally be able to:
- recruit or secure one useful contact,
- attempt multiple operation types,
- observe pressure rising or decaying,
- and make one decision that sacrifices immediate profit for safety or future position.

### First-session stabilization

A successful first session should allow the player to reach a fragile foothold through some combination of:
- a small crew,
- recurring income,
- a safer operational base,
- useful intelligence,
- or limited district influence.

Stabilization should feel earned.
It should not require perfect play.

## Economy targets

### Starting reserve

The starting reserve should support:
- one standard early operation,
- plus one limited fallback option after a failure.

A single ordinary failure should not automatically make the run nonfunctional.

### Early operation rewards

A successful low-tier operation should usually provide enough value to fund one of the following:
- another similar operation,
- a recruit or specialist cost,
- a basic hideout or business improvement,
- or a partial reserve for recovery.

It should not normally fund all of them at once.

### Recurring income

Recurring income should:
- reduce dependence on constant risky operations,
- have maintenance or vulnerability,
- and become meaningful only after the player has invested resources or influence.

A basic recurring income source should cover part of routine costs, not eliminate economic pressure.

E5-04 provisional authored business income values are initial implementation hypotheses only:
- Small Shop or Service: `20` money every `144` simulation ticks.
- Restaurant or Nightlife Venue: `60` money every `144` simulation ticks.
- Workshop or Transport Business: `40` money every `144` simulation ticks.

These values prove one bounded business-income flow through the recurring economy and ledger. They are not final balance and do not imply that business upkeep, hideout upkeep, pressure effects, rival disruption, production, inventory, UI, global tick integration, campaign integration, or save/load are implemented.

### Money sinks

The MVP should use a small set of understandable money sinks:
- operation preparation,
- wages or loyalty maintenance,
- business and hideout upkeep,
- bribery or pressure management,
- recovery after losses,
- and selective improvements.

Avoid adding cosmetic or low-impact sinks before the core economy works.

### Economic failure

Running out of money is a severe setback, not an automatic game over.
The player should retain at least one low-cost path to recovery unless the boss dies.

## Operation balance framework

Every operation should be evaluated across five dimensions:

| Dimension | Question |
|---|---|
| Reward | What immediate or strategic value can be gained? |
| Cost | What must be committed before execution? |
| Risk | What is the chance and severity of failure? |
| Exposure | How much attention can the operation generate? |
| Duration | How long are people and assets unavailable? |

No operation should dominate all five dimensions.

## Suggested operation risk bands

Exact probabilities may remain hidden from the player.
The design may use internal bands such as:

| Risk band | Intended feeling | Initial tuning range |
|---|---|---|
| Low | Reliable but limited | 80–95% acceptable outcome |
| Moderate | Meaningful uncertainty | 60–80% acceptable outcome |
| High | Ambitious and dangerous | 35–60% acceptable outcome |
| Extreme | Desperate or transformative | below 35% acceptable outcome |

An acceptable outcome includes full or partial success where appropriate.
These ranges are starting hypotheses and must be validated through playtests.

## Outcome distribution

Operations should support:
- critical success,
- full success,
- partial success,
- failure,
- and critical failure.

Partial outcomes are especially important for MVP balance.
They prevent the system from feeling like repeated coin flips and create follow-up decisions.

Examples:
- profit gained but exposure increased,
- target weakened but not controlled,
- recruit acquired with a loyalty problem,
- goods moved but one route compromised.

## Information and uncertainty

The player should receive:
- an estimated risk band,
- important known modifiers,
- likely reward range,
- and major possible consequences.

Uncertainty should come from incomplete intelligence, not hidden arbitrary punishment.

Better information can:
- narrow reward estimates,
- reveal countermeasures,
- expose rival presence,
- or identify a safer preparation option.

Information should improve decisions rather than simply add a flat success bonus.

## Preparation balance

Preparation should create diminishing returns.

The first useful preparation should matter significantly.
Further preparation should improve confidence or reduce specific risks, but never make every operation perfectly safe.

Preparation may trade:
- money for lower operational risk,
- time for better intelligence,
- additional personnel for speed,
- or favors for reduced exposure.

## Crew and capacity balance

Each assigned character should create an opportunity cost.

The player should not be able to assign the same best crew to every simultaneous activity.

Early MVP targets:
- the player starts with capacity for one meaningful operation at a time,
- early growth allows two parallel commitments,
- and additional capacity requires trusted people rather than only money.

Injuries, arrests, stress, and betrayal risk should temporarily reduce effective capacity.

## Pressure balance framework

Pressure should be generated by behavior, not by the simple passage of time.

Major inputs include:
- operation visibility,
- violence,
- repeated activity in one district,
- critical failure,
- evidence,
- witnesses,
- and rival or informant actions.

## Pressure pacing targets

The player should usually encounter:
- the first visible warning within the first few operations,
- a meaningful operational restriction before uncontested expansion becomes possible,
- and a serious reaction only after repeated aggression, major failure, or ignored warnings.

The first operation should not normally trigger a crackdown unless the player deliberately chooses an extreme action.

## Pressure states

For MVP testing, pressure should use a small number of readable states:

| State | Intended effect |
|---|---|
| Quiet | Normal conditions; low attention |
| Watched | Warnings, patrol changes, increased uncertainty |
| Targeted | Higher exposure risk, investigations, restricted options |
| Crackdown | Raids, arrests, seizures, and major disruption |

Transitions must be explainable through recent events.

## Pressure decay

Going quiet should reduce short-term exposure and district attention.
It should not automatically erase:
- active investigations,
- collected evidence,
- known associates,
- rival hostility,
- or public memory.

The player should be able to choose between:
- waiting,
- relocating,
- bribery,
- evidence management,
- misdirection,
- or accepting temporary operational limits.

## Rival balance

Rivals should behave as active competitors, not level-scaled punishment.

### Early rival behavior

Early rivals should:
- contest selected opportunities,
- retaliate after clear interference,
- exploit exposed weakness,
- and occasionally create threats the player can avoid.

They should not immediately use their strongest possible action against a new player without a world-state reason.

### Rival asymmetry

The two MVP rival organizations should have different strengths and vulnerabilities.

For example:
- one rival may be aggressive, visible, and territorially strong,
- another may be quieter, economically stable, and better connected.

The player should adapt strategy rather than merely compare power scores.

### Anti-dogpile rule

Multiple rivals should not constantly coordinate against a weak player without diplomatic, territorial, or pressure-based justification.

Coalitions belong to later escalation or clear player dominance.

## Recruitment balance

Recruitment should involve tradeoffs between:
- competence,
- loyalty,
- cost,
- exposure,
- and personal relationships.

Early recruits should be useful but imperfect.
A single high-quality recruit may significantly expand capability, but losing that person should also matter.

Avoid generating obviously useless candidates whose only function is to waste the player's time.

## Business and location balance

Businesses and locations should provide combinations of:
- income,
- cover,
- storage,
- access,
- recruitment,
- logistics,
- or district influence.

No single business archetype should be the best source of income, cover, and operational utility simultaneously.

Taking control of a location should also create:
- upkeep,
- visibility,
- dependency,
- or a defense obligation.

## District balance

The four MVP districts should support different strategies.

Each district should differ through a combination of:
- opportunity value,
- police attention,
- rival presence,
- business density,
- transport value,
- and civilian response.

No district should be objectively best in every category.

The player should have a reason to operate outside the safest or richest district.

## Recovery balance

Recovery is successful when a setback changes the player's strategy without making continued play obviously pointless.

After a serious early failure, the player should usually retain at least one path based on:
- a low-cost operation,
- a personal contact,
- selling or abandoning an asset,
- accepting a bad deal,
- temporary subordination,
- or going quiet.

Recovery should consume time, reputation, opportunity, or relationships.
It should not be free.

## Loss severity guidelines

### Minor setback

Examples:
- reduced reward,
- short injury,
- small exposure increase,
- temporary loss of access.

The player should adapt but not abandon the current plan entirely.

### Major setback

Examples:
- arrest of a crew member,
- business loss,
- investigation opened,
- major debt,
- rival takeover of a strategic location.

The player should need a recovery plan.

### Run-threatening crisis

Examples:
- boss directly exposed,
- organization nearly bankrupt with no safe income,
- hideout compromised during a crackdown,
- simultaneous loss of key personnel and legal cover.

The crisis must result from accumulated state or an informed high-risk choice, not an unexplained random roll.

## Boss death in MVP

Full succession is outside MVP scope.
The boss's death ends the MVP run.

Because this is the only hard game-over state:
- lethal risk must be clearly communicated,
- ordinary low-risk operations should not randomly kill the boss,
- and the player should usually be able to avoid direct personal exposure through delegation.

## Difficulty settings

The first MVP build does not need multiple formal difficulty modes.

Balance should first target one intended experience.
Developer tuning controls may expose:
- starting money,
- pressure generation,
- rival aggressiveness,
- operation outcome modifiers,
- and recovery assistance.

Formal difficulty modes should be designed only after the base loop is validated.

## Anti-frustration rules

- The first meaningful choice should appear immediately.
- The first few operations should teach different dimensions of the loop.
- One ordinary failure should not erase the run.
- Major danger should be foreshadowed.
- The UI should explain the main reason for each outcome.
- The player should not be forced into long periods of waiting with no decisions.
- Recovery should be possible but costly.
- Randomness should modify plans, not replace planning.

## Anti-snowball rules

Positive momentum should create new obligations.

As the player gains power:
- maintenance rises,
- more people require management,
- rivals react,
- exposure grows,
- and valuable assets create dependencies.

Negative momentum should not automatically compound forever.

After major losses:
- pressure may fall as the organization becomes less active,
- rivals may shift attention elsewhere,
- low-profile opportunities may appear,
- and smaller-scale operations should become viable again.

## Metrics for playtesting

Collect or observe:
- time to first committed operation,
- time to first visible world reaction,
- number of meaningful choices per 10 minutes,
- operation types selected,
- success, partial success, and failure distribution,
- causes of pressure escalation,
- time spent with no viable action,
- frequency of bankruptcy or unrecoverable states,
- frequency and cause of boss death,
- time to first recurring income,
- time to first recruit,
- and whether players voluntarily begin another run.

## Warning signs

Balance needs revision if:
- players repeat one operation because alternatives are clearly inferior,
- safest play is always optimal,
- aggressive play has no meaningful consequence,
- pressure feels unrelated to player behavior,
- players cannot explain why they failed,
- one early failure commonly creates an unrecoverable run,
- players spend long periods waiting for money or pressure decay,
- or stable players have no reason to take further risks.

## Initial validation targets

The first external playtests should aim for:
- first operation commitment within 5 minutes,
- first visible reaction within 15 minutes,
- a fragile foothold within one normal session for most engaged players,
- at least two viable strategic approaches,
- recoverable ordinary failures,
- and clear player desire to attempt another operation or another run.

These are hypotheses, not promises.
They should be revised when playtest evidence contradicts them.

## Tuning workflow

1. Identify the player behavior that is failing.
2. Find the responsible system or dependency.
3. Change one major variable group at a time.
4. Repeat the same playtest scenario.
5. Compare player decisions, not only final outcomes.
6. Record why the value changed.

Avoid changing economy, pressure, operation success, and rival aggression simultaneously unless performing a deliberate reset.

## MVP acceptance criteria

The balancing model is ready for implementation when:
- every MVP operation has a distinct risk-reward role,
- starting resources support action and limited recovery,
- pressure escalation has readable states,
- rivals have asymmetric behavior targets,
- district tradeoffs are defined,
- recovery paths exist for major non-lethal setbacks,
- and telemetry can measure the core validation questions.

## Open Questions

- How long should a normal first MVP session be for the primary playtest format?
- Should wages be paid continuously, per tick cycle, or after completed operations?
- Which operation should be the safest baseline used to compare all others?
- How visible should internal success estimates be in the first UI?
- Should pressure decay be continuous or evaluated in discrete periods?
- How often should rivals initiate actions without direct player provocation?

## Future Extensions

- Formal difficulty modes.
- Adaptive scenario generation for testing balance extremes.
- Long-campaign economic inflation and institutional escalation.
- Succession-specific balance after MVP.
- Multi-city logistics and regional pressure tuning.
- Automated simulation runs for economy and AI stress testing.
