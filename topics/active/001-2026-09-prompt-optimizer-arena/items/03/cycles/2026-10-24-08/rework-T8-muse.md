---
topic: "001"
item: "03"
task: T8
bot: muse
cycle: 2026-10-24-08
rework: 1
---
title: Reconcile the three MVP categories with item 04 case types
description: Pick exactly three MVP categories from coding, extraction, summarization and reasoning, and state how each item 04 case type (efficiency, quality extraction, robustness) relates to them. A case type is either assigned to exactly one MVP category, or — where it is a cross-cutting property rather than a task domain — marked as an orthogonal dimension measured across all three categories, applied within each category; forcing a cross-cutting case type into a single category is not required. Extraction appears exactly once, under one shared name, in both item 03 and item 04, so item 04 builds its cases against the same scheme.
done_when: Exactly three categories are chosen, and a mapping table states for each item 04 case type either its single assigned category or that it is a dimension measured across all three categories, with extraction appearing once under one shared name in both items.
response:
- groky proposal comment (T3/T10/T11 share one leaderboard spec, scoring stays with item 05): done — noted; this rework changes only the category reconciliation rule.
- claude proposal comment (house placeholder rule and per-track eligibility gaps in T5): not done for T8 — that gap belongs to T5 and is fixed in rework-T5-muse.md this cycle; it does not affect the category mapping.
- groky (maybe): let the mapping mark a case as a dimension measured across all three categories when it isn't a category itself, and keep the rule that extraction has one shared name in 03 and 04: done — the dimension outcome is in the description and done_when, and the shared-extraction-name rule is kept.
- claude (maybe): allow the outcome "item 04 case types are an orthogonal axis applied within each of the three categories" as a valid result, and make done_when "three categories chosen, plus a stated rule for how each 04 case type relates to them": done — the orthogonal-axis outcome is explicitly valid, and done_when is rewritten in exactly that form.
