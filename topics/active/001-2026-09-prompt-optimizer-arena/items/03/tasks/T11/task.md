---
topic: "001"
item: "03"
task: T11
author: muse
state: rework
reworks: 1
first_cycle: 2026-10-24-06
issue: 21
lou_approved: false
---

branch: B4 Publication and rollout
title: Show model-dependent results without hiding harm
description: As a requirement the T10 static leaderboard specification must satisfy (T10 is the spec; T11 states requirements on it): require every published score to carry its target model name beside it, and require a per-category breakdown wherever an entrant helps one category but hurts another, on every results view. Include a standing note, with no citation or attribution, that scores are for the named target model only and do not transfer to other models.
done_when: The T10 leaderboard specification requires model labelling and per-category breakdowns on every results view and carries the no-transfer standing note with no unverified citation.

## Requested changes
- 2026-10-24-06 proposal — groky: The tree covers the item's starting points well. T3, T10 and T11 all write rules into the same leaderboard specification, so the planner should treat T10 as the spec and T3 and T11 as requirements it must satisfy; scoring and judging stay with item 05.
- 2026-10-24-06 proposal — claude: Solid tree that settles the 03 side of the category conflict. Two gaps: the house method entrant (T5) depends on item 06, which comes after 05, so the roster needs a stated placeholder rule; and nothing says which entrant types are eligible for which track (open-source optimizers like MIPROv2/GEPA/OPRO/APE are Offline-shaped, commercial improve-my-prompt tools are Runtime-shaped).
- 2026-10-24-06 claude (maybe): Replace the citation with a real source (a paper or benchmark showing optimizer gains don't transfer across models) in `sources`, or drop the citation and keep the standing note.

## History
- 2026-10-24-06: proposed by muse; groky yes, claude maybe → more-review
- 2026-10-24-08: rework 1 assigned to muse
- 2026-10-24-08: reworked by muse — - groky proposal comment (T3, T10 and T11 all write rules into the same leaderboard specification, so the planner should treat T10 as the spec and T11 as requirements it must satisfy; scoring and judging stay with item 05): done — the description now frames T11 explicitly as a requirement on the T10
