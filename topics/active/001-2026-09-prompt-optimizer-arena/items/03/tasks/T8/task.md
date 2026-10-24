---
topic: "001"
item: "03"
task: T8
author: muse
state: approved
reworks: 1
first_cycle: 2026-10-24-06
issue: 18
lou_approved: false
---

branch: B3 MVP scope: model, categories, size
title: Reconcile the three MVP categories with item 04 case types
description: Pick exactly three MVP categories from coding, extraction, summarization and reasoning, and state how each item 04 case type (efficiency, quality extraction, robustness) relates to them. A case type is either assigned to exactly one MVP category, or — where it is a cross-cutting property rather than a task domain — marked as an orthogonal dimension measured across all three categories, applied within each category; forcing a cross-cutting case type into a single category is not required. Extraction appears exactly once, under one shared name, in both item 03 and item 04, so item 04 builds its cases against the same scheme.
done_when: Exactly three categories are chosen, and a mapping table states for each item 04 case type either its single assigned category or that it is a dimension measured across all three categories, with extraction appearing once under one shared name in both items.

## Requested changes
- 2026-10-24-06 proposal — groky: The tree covers the item's starting points well. T3, T10 and T11 all write rules into the same leaderboard specification, so the planner should treat T10 as the spec and T3 and T11 as requirements it must satisfy; scoring and judging stay with item 05.
- 2026-10-24-06 proposal — claude: Solid tree that settles the 03 side of the category conflict. Two gaps: the house method entrant (T5) depends on item 06, which comes after 05, so the roster needs a stated placeholder rule; and nothing says which entrant types are eligible for which track (open-source optimizers like MIPROv2/GEPA/OPRO/APE are Offline-shaped, commercial improve-my-prompt tools are Runtime-shaped).
- 2026-10-24-06 groky (maybe): Let the mapping mark a case as a dimension measured across all three categories when it isn't a category itself, and keep the rule that extraction has one shared name in 03 and 04.
- 2026-10-24-06 claude (maybe): Allow the outcome "item 04 case types are an orthogonal axis applied within each of the three categories" as a valid result, and make done_when "three categories chosen, plus a stated rule for how each 04 case type relates to them."

## History
- 2026-10-24-06: proposed by muse; groky maybe, claude maybe → more-review
- 2026-10-24-08: rework 1 assigned to muse
- 2026-10-24-08: reworked by muse — - groky proposal comment (T3/T10/T11 share one leaderboard spec, scoring stays with item 05): done — noted; this rework changes only the category reconciliation rule. - claude proposal comment (house placeholder rule and per-track eligibility gaps in T5): not done for T8 — that gap belongs to T5 and
- 2026-10-24-08: rework 1 reviewed; groky yes, claude yes → approved
