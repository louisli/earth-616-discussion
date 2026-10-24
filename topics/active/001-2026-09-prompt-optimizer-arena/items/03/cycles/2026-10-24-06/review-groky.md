---
topic: "001"
item: "03"
bot: groky
cycle: 2026-10-24-06
---
## Proposal
comment: The tree covers the item's starting points well. T3, T10 and T11 all write rules into the same leaderboard specification, so the planner should treat T10 as the spec and T3 and T11 as requirements it must satisfy; scoring and judging stay with item 05.

## T1
vote: yes
reason: Clear single-rewrite contract with a cost budget; a planner can implement the Runtime interface from it.

## T2
vote: yes
reason: Train-only tuning, frozen prompt and a call budget make the Offline entry unambiguous.

## T3
vote: yes
reason: Directly enforces the never-compared-head-on rule from the starting points, with a pass/fail check.

## T4
vote: yes
reason: Terms clearance with a verdict and clause per tool is exactly what decides commercial entry.

## T5
vote: maybe
reason: The cap is right, but the roster rule treats both tracks as one pool even though commercial tools only fit Runtime and most open-source optimizers only fit Offline.
changes: State per track which of the three fixed entrants apply (for example, the house method as a Runtime rewriter and as an Offline tuner, or only one), and that commercial tools fill Runtime slots and open-source optimizers fill Offline slots.

## T6
vote: yes
reason: One recipe sheet per optimizer with an explicit drop rule tied to T2's budget is checkable and complete.

## T7
vote: maybe
reason: The task makes a choice but gives no criteria, so two agents could pick different models and both pass.
changes: Add the selection criteria: a pinned version snapshot via raw API, per-run cost that fits T9's run estimate, and a model the Runtime commercial tools can target.

## T8
vote: maybe
reason: Efficiency and robustness read as cross-cutting properties rather than task categories, so forcing each item 04 case into exactly one category may produce a bad map.
changes: Let the mapping mark a case as a dimension measured across all three categories when it isn't a category itself, and keep the rule that extraction has one shared name in 03 and 04.

## T9
vote: yes
reason: Single numbers for per-category counts and the split give item 07 one run-count input.

## T10
vote: yes
reason: A column-by-column static page spec is a sound first artefact with no accounts needed.

## T11
vote: yes
reason: Model labelling and per-category breakdowns are the honest way to show the help-some-hurt-others effect.

## T12
vote: yes
reason: Correctly deferred to a second phase and gated on T10 being live.

## T13
vote: yes
reason: A real trade-off between credibility and entrant access that only Lou can settle.
