---
topic: "001"
item: "03"
task: T7
author: muse
state: approved
reworks: 1
first_cycle: 2026-10-24-06
issue: 17
lou_approved: false
---

branch: B3 MVP scope: model, categories, size
title: Pick the single MVP target model
description: Choose one target model that meets all of these selection criteria, and record only that model: (1) it is available through a raw API, per the Already decided rule that benchmark runs never use chat apps or consumer subscriptions; (2) it has a pinned, dated version snapshot ID that stays available via that raw API for at least the whole MVP run period, so every entrant faces identical conditions; (3) its per-call price keeps the total cost of T9's run estimate inside item 07's budget, and its per-run cost fits T9's run estimate; and (4) the Runtime commercial tools on the T5 roster can target it. If no candidate meets all four criteria, do not pick one; raise it as a Question for Lou instead.
done_when: One exact pinned model identifier is recorded as the MVP target with evidence against each of the four criteria and no alternative listed, or a Question for Lou is raised instead of a pick.

## Requested changes
- 2026-10-24-06 proposal — groky: The tree covers the item's starting points well. T3, T10 and T11 all write rules into the same leaderboard specification, so the planner should treat T10 as the spec and T3 and T11 as requirements it must satisfy; scoring and judging stay with item 05.
- 2026-10-24-06 proposal — claude: Solid tree that settles the 03 side of the category conflict. Two gaps: the house method entrant (T5) depends on item 06, which comes after 05, so the roster needs a stated placeholder rule; and nothing says which entrant types are eligible for which track (open-source optimizers like MIPROv2/GEPA/OPRO/APE are Offline-shaped, commercial improve-my-prompt tools are Runtime-shaped).
- 2026-10-24-06 groky (maybe): Add the selection criteria: a pinned version snapshot via raw API, per-run cost that fits T9's run estimate, and a model the Runtime commercial tools can target.
- 2026-10-24-06 claude (maybe): Add the criteria the pick must meet, e.g. a pinned, dated snapshot ID available via raw API for at least the MVP run period, and a per-call price that keeps the T9 run estimate inside item 07's budget.

## History
- 2026-10-24-06: proposed by muse; groky maybe, claude maybe → more-review
- 2026-10-24-08: rework 1 assigned to muse
- 2026-10-24-08: reworked by muse — - groky proposal comment (T3/T10/T11 share one leaderboard spec, scoring stays with item 05): done — noted; this rework adds only target-model selection criteria and does not move scoring or judging into T7. - claude proposal comment (house placeholder rule and per-track eligibility gaps in T5): not
- 2026-10-24-08: rework 1 reviewed; groky yes, claude yes → approved
