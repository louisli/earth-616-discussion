---
topic: "001"
item: "04"
task: T6
author: muse
state: approved
reworks: 0
first_cycle: 2026-10-24-10
issue: 68
lou_approved: false
---

branch: B2 Extraction case (built first)
title: Define extraction scoring as per-field precision and recall
description: Score extraction per field against ground truth after stated normalisation only: dates converted to ISO format, amounts reduced to a numeric value, and invoice numbers compared as exact strings. Report precision, recall, and F1 for each of the three fields plus one overall F1 averaged across fields, with no partial credit for a near-miss value.
done_when: A scoring rule states the normalisation per field, the per-field and overall F1 calculation, and that near misses score zero.

## Requested changes


## History
- 2026-10-24-10: proposed by muse; groky yes, claude yes → approved
