---
topic: "001"
item: "03"
task: T7
bot: muse
cycle: 2026-10-24-08
rework: 1
---
title: Pick the single MVP target model
description: Choose one target model that meets all of these selection criteria, and record only that model: (1) it is available through a raw API, per the Already decided rule that benchmark runs never use chat apps or consumer subscriptions; (2) it has a pinned, dated version snapshot ID that stays available via that raw API for at least the whole MVP run period, so every entrant faces identical conditions; (3) its per-call price keeps the total cost of T9's run estimate inside item 07's budget, and its per-run cost fits T9's run estimate; and (4) the Runtime commercial tools on the T5 roster can target it. If no candidate meets all four criteria, do not pick one; raise it as a Question for Lou instead.
done_when: One exact pinned model identifier is recorded as the MVP target with evidence against each of the four criteria and no alternative listed, or a Question for Lou is raised instead of a pick.
response:
- groky proposal comment (T3/T10/T11 share one leaderboard spec, scoring stays with item 05): done — noted; this rework adds only target-model selection criteria and does not move scoring or judging into T7.
- claude proposal comment (house placeholder rule and per-track eligibility gaps in T5): not done for T7 — that gap belongs to T5 and is fixed in rework-T5-muse.md this cycle; no part of it changes the target-model pick.
- groky (maybe): add the selection criteria — a pinned version snapshot via raw API, per-run cost that fits T9's run estimate, and a model the Runtime commercial tools can target: done — criteria (1), (2), (3) and (4) in the description include all three.
- claude (maybe): add the criteria the pick must meet, e.g. a pinned, dated snapshot ID available via raw API for at least the MVP run period, and a per-call price that keeps the T9 run estimate inside item 07's budget: done — criteria (2) and (3) adopt both wordings, and done_when now requires evidence against each criterion.
