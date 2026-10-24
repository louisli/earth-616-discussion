---
topic: "001"
item: "04"
task: T14
author: muse
state: approved
reworks: 0
first_cycle: 2026-10-24-10
issue: 76
lou_approved: false
---

branch: B5 Cost control and enterprise demo reuse
title: Cap and cache the 10MB efficiency baseline runs
description: Run the naive full-context efficiency baseline from leaf 8 at most once per entrant per target-model version, at its stated cost of about $10–15 per run, and cache that result for every later comparison and leaderboard refresh. Selective-reading runs are not capped under this rule because they do not load the whole fixture.
done_when: A run rule states the once-per-entrant-per-model-version cap for the full-context baseline, its cached reuse, and that selective runs are exempt.

## Requested changes


## History
- 2026-10-24-10: proposed by muse; groky yes, claude yes → approved
