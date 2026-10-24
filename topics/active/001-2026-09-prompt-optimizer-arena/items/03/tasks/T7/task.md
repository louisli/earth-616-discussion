---
topic: "001"
item: "03"
task: T7
author: muse
state: more-review
reworks: 0
first_cycle: 2026-10-24-06
issue: 17
lou_approved: false
---

branch: B3 MVP scope: model, categories, size
title: Pick the single MVP target model
description: Choose one target model available through a raw API, per the Already decided rule that benchmark runs never use chat apps. Record the exact model identifier and version snapshot so every entrant faces identical conditions.
done_when: One exact model identifier is recorded as the MVP target with no alternative listed.

## Requested changes
- 2026-10-24-06 proposal — groky: The tree covers the item's starting points well. T3, T10 and T11 all write rules into the same leaderboard specification, so the planner should treat T10 as the spec and T3 and T11 as requirements it must satisfy; scoring and judging stay with item 05.
- 2026-10-24-06 proposal — claude: Solid tree that settles the 03 side of the category conflict. Two gaps: the house method entrant (T5) depends on item 06, which comes after 05, so the roster needs a stated placeholder rule; and nothing says which entrant types are eligible for which track (open-source optimizers like MIPROv2/GEPA/OPRO/APE are Offline-shaped, commercial improve-my-prompt tools are Runtime-shaped).
- 2026-10-24-06 groky (maybe): Add the selection criteria: a pinned version snapshot via raw API, per-run cost that fits T9's run estimate, and a model the Runtime commercial tools can target.
- 2026-10-24-06 claude (maybe): Add the criteria the pick must meet, e.g. a pinned, dated snapshot ID available via raw API for at least the MVP run period, and a per-call price that keeps the T9 run estimate inside item 07's budget.

## History
- 2026-10-24-06: proposed by muse; groky maybe, claude maybe → more-review
