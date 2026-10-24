---
topic: "001"
item: "04"
task: T11
author: muse
state: approved
reworks: 0
first_cycle: 2026-10-24-10
issue: 73
lou_approved: false
---

branch: B4 Robustness case (built third)
title: Freeze the robustness input set at 50 messages with fixed messiness slices
description: Fix the robustness input set at 50 customer messages with stated slice proportions: 20 clean, 10 containing typos, 10 mixing English and Mandarin, and 10 edge cases such as very short or multi-question messages that still have one gold label under leaf 10. The slice of each message is recorded in the set metadata and is not shown to entrants.
done_when: A set specification fixes 50 messages with slice counts of 20 clean, 10 typo, 10 mixed-language, and 10 edge, plus hidden slice metadata.

## Requested changes


## History
- 2026-10-24-10: proposed by muse; groky yes, claude yes → approved
