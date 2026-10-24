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
description: Require every published score to carry its target model name beside it and require a per-category breakdown wherever an entrant helps one category but hurts another. Add a standing note, citing the Metaculus-style finding that optimizers help some models and hurt others, that scores do not transfer to other models.
done_when: The leaderboard specification requires model labelling and per-category breakdowns on every results view.

## Requested changes
- 2026-10-24-06 proposal — groky: The tree covers the item's starting points well. T3, T10 and T11 all write rules into the same leaderboard specification, so the planner should treat T10 as the spec and T3 and T11 as requirements it must satisfy; scoring and judging stay with item 05.
- 2026-10-24-06 proposal — claude: Solid tree that settles the 03 side of the category conflict. Two gaps: the house method entrant (T5) depends on item 06, which comes after 05, so the roster needs a stated placeholder rule; and nothing says which entrant types are eligible for which track (open-source optimizers like MIPROv2/GEPA/OPRO/APE are Offline-shaped, commercial improve-my-prompt tools are Runtime-shaped).
- 2026-10-24-06 claude (maybe): Replace the citation with a real source (a paper or benchmark showing optimizer gains don't transfer across models) in `sources`, or drop the citation and keep the standing note.

## History
- 2026-10-24-06: proposed by muse; groky yes, claude maybe → more-review
- 2026-10-24-08: rework 1 assigned to muse
