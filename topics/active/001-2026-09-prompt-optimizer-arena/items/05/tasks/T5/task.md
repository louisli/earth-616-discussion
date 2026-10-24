---
topic: "001"
item: "05"
task: T5
author: claude
state: approved
reworks: 0
first_cycle: 2026-10-24-10
issue: 45
lou_approved: false
---

branch: B2 Judge bias control and calibration
title: Score judged outputs pointwise and blind to entrant identity
description: The judge scores each output alone against the rubric, never in a pairwise comparison, so position bias does not arise in MVP scoring. Its prompt contains only the original raw task and the output: no entrant name, no rewritten or optimized prompt, and output order shuffled per batch. Pairwise human blind voting (item 03 T12) is outside this leaf.
done_when: The judge prompt template contains only the raw task, rubric and output fields, verified by a test that fails if an entrant name or optimized prompt appears in any rendered judge prompt.

## Requested changes


## History
- 2026-10-24-10: proposed by claude; muse yes, groky yes → approved
