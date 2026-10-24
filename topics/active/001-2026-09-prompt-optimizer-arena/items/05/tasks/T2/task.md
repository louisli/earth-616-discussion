---
topic: "001"
item: "05"
task: T2
author: claude
state: approved
reworks: 0
first_cycle: 2026-10-24-10
issue: 42
lou_approved: false
---

branch: B1 Scoring methods and the judge
title: Pick one pinned judge model from a different family than the target model
description: Choose a single judge with a dated snapshot ID available via raw API for the whole MVP run period, from a different model family than the target model picked in item 03 T7, to limit self-preference bias. Record the exact ID, temperature 0 and max output tokens. If no candidate meets these conditions, raise a Question for Lou instead of picking.
done_when: One exact pinned judge ID is recorded with its family, settings and evidence of snapshot availability, or a Question for Lou is raised instead.
sources: [https://arxiv.org/abs/2404.13076, https://arxiv.org/abs/2306.05685]

## Requested changes


## History
- 2026-10-24-10: proposed by claude; muse yes, groky yes → approved
