---
topic: "001"
item: "03"
bot: claude
cycle: 2026-10-24-06
---
## Proposal
comment: Solid tree that settles the 03 side of the category conflict. Two gaps: the house method entrant (T5) depends on item 06, which comes after 05, so the roster needs a stated placeholder rule; and nothing says which entrant types are eligible for which track (open-source optimizers like MIPROv2/GEPA/OPRO/APE are Offline-shaped, commercial improve-my-prompt tools are Runtime-shaped).

## T1
vote: yes
reason: Clear, single contract with the one-rewrite and no-key rules fixed; the token budget is the contract's own deliverable.

## T2
vote: yes
reason: Clear Offline contract with a train-only input, frozen output and a call-count budget.

## T3
vote: yes
reason: Atomic, checkable rule that prevents a misleading head-on ranking.

## T4
vote: yes
reason: Concrete per-tool verdict table, with the terms clause as evidence.

## T5
vote: maybe
reason: The cap is good, but the roster mixes track-specific entrants and depends on an unbuilt house method.
changes: State per track which fixed slots apply (no-optimization baseline in both; metaprompt baseline in Runtime only; house method in both, as a "house v0 = item 06 output, else slot left out" rule), and that open-source optimizers from T6 go to Offline and commercial tools from T4 to Runtime.

## T6
vote: yes
reason: Named shortlist, fixed fields per recipe, and a clear drop rule tied to the T2 budget.

## T7
vote: maybe
reason: A "pick" task with no selection criteria leaves the choice open (atomic test 4).
changes: Add the criteria the pick must meet, e.g. a pinned, dated snapshot ID available via raw API for at least the MVP run period, and a per-call price that keeps the T9 run estimate inside item 07's budget.

## T8
vote: maybe
reason: Item 04's case types (efficiency, quality, robustness) are cross-cutting properties, not task domains, so forcing each into exactly one category may be a category error.
changes: Allow the outcome "item 04 case types are an orthogonal axis applied within each of the three categories" as a valid result, and make done_when "three categories chosen, plus a stated rule for how each 04 case type relates to them."

## T9
vote: yes
reason: Gives item 07 one input figure; done_when forces single numbers despite the "about".

## T10
vote: yes
reason: Concrete column list including cost per correct answer and version stamps.

## T11
vote: maybe
reason: The rule is right, but the "Metaculus-style finding" has no source and the attribution looks wrong.
changes: Replace the citation with a real source (a paper or benchmark showing optimizer gains don't transfer across models) in `sources`, or drop the citation and keep the standing note.

## T12
vote: yes
reason: Clear second-phase spec with an explicit launch gate on T10.

## T13
vote: yes
reason: Correctly raised as a Question for Lou; it trades credibility against entrant access.
