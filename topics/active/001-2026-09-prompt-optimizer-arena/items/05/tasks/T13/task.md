---
topic: "001"
item: "05"
task: T13
author: claude
state: approved
reworks: 0
first_cycle: 2026-10-24-10
issue: 53
lou_approved: false
---

branch: B4 Integrity checks against silent failure
title: Block any eval prompt that overlaps training data or submitted prompts
description: Before scoring, check every eval prompt for 13-gram overlap against the Offline training split and against every entrant's submitted or optimized prompt. Any overlap stops the run for that entrant until the eval prompt is replaced or the entrant is disqualified, and the result is logged.
done_when: A pre-scoring check reports zero 13-gram overlaps for every entrant, or the run is halted with the overlapping prompts listed.

## Requested changes


## History
- 2026-10-24-10: proposed by claude; muse yes, groky yes → approved
