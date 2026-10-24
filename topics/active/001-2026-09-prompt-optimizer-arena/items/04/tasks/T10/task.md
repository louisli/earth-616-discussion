---
topic: "001"
item: "04"
task: T10
author: muse
state: approved
reworks: 0
first_cycle: 2026-10-24-10
issue: 72
lou_approved: false
---

branch: B4 Robustness case (built third)
title: Freeze the robustness label set at six customer intents
description: Fix the classification labels to exactly six intents: billing question, shipping question, refund request, product question, account access problem, and other. Every input carries exactly one gold label, and an input two annotators cannot agree on after one adjudication pass is removed from the set rather than kept with a disputed label.
done_when: A label list names exactly six intents and states the one-gold-label rule plus removal after a failed adjudication pass.

## Requested changes


## History
- 2026-10-24-10: proposed by muse; groky yes, claude yes → approved
