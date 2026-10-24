---
topic: "001"
item: "03"
task: T8
author: muse
state: rework
reworks: 1
first_cycle: 2026-10-24-06
issue: 18
lou_approved: false
---

branch: B3 MVP scope: model, categories, size
title: Reconcile the three MVP categories with item 04 case types
description: Map the candidate categories coding, extraction, summarization, and reasoning onto item 04's cases of efficiency, quality extraction, and robustness, and pick exactly three categories for the MVP. Extraction must appear once, under one name, in both items so item 04 can build its cases against the same scheme.
done_when: A mapping table shows each item 04 case assigned to exactly one MVP category and exactly three categories chosen.

## Requested changes
- 2026-10-24-06 proposal — groky: The tree covers the item's starting points well. T3, T10 and T11 all write rules into the same leaderboard specification, so the planner should treat T10 as the spec and T3 and T11 as requirements it must satisfy; scoring and judging stay with item 05.
- 2026-10-24-06 proposal — claude: Solid tree that settles the 03 side of the category conflict. Two gaps: the house method entrant (T5) depends on item 06, which comes after 05, so the roster needs a stated placeholder rule; and nothing says which entrant types are eligible for which track (open-source optimizers like MIPROv2/GEPA/OPRO/APE are Offline-shaped, commercial improve-my-prompt tools are Runtime-shaped).
- 2026-10-24-06 groky (maybe): Let the mapping mark a case as a dimension measured across all three categories when it isn't a category itself, and keep the rule that extraction has one shared name in 03 and 04.
- 2026-10-24-06 claude (maybe): Allow the outcome "item 04 case types are an orthogonal axis applied within each of the three categories" as a valid result, and make done_when "three categories chosen, plus a stated rule for how each 04 case type relates to them."

## History
- 2026-10-24-06: proposed by muse; groky maybe, claude maybe → more-review
- 2026-10-24-08: rework 1 assigned to muse
