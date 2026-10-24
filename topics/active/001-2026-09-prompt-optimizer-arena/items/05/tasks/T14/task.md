---
topic: "001"
item: "05"
task: T14
author: claude
state: approved
reworks: 0
first_cycle: 2026-10-24-10
issue: 54
lou_approved: false
---

branch: B4 Integrity checks against silent failure
title: Flag outputs that address the judge
description: Scan every judged output for text aimed at the evaluator (for example score requests, "as the grader" phrasing, or rubric text copied in) with a fixed pattern list, and route flagged outputs to a human check before publication. A confirmed judge-targeted output scores as a failure.
done_when: Every judged run has a flag report, and each flagged output has a recorded human verdict before publication.

## Requested changes


## History
- 2026-10-24-10: proposed by claude; muse yes, groky yes → approved
