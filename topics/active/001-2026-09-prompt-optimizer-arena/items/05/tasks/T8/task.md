---
topic: "001"
item: "05"
task: T8
author: claude
state: approved
reworks: 0
first_cycle: 2026-10-24-10
issue: 48
lou_approved: false
---

branch: B3 Statistics and uncertainty
title: Sample every entrant–prompt pair three times
description: Run each (entrant, prompt) pair 3 times against the target model with the sampling settings fixed in the manifest, and score each sample. The prompt's score is the mean of its 3 samples, which reduces within-prompt variance and lets the report show it.
done_when: The run manifest shows exactly 3 scored samples for every entrant–prompt pair, and the per-prompt score equals their mean.
sources: [https://arxiv.org/abs/2411.00640]

## Requested changes


## History
- 2026-10-24-10: proposed by claude; muse yes, groky yes → approved
