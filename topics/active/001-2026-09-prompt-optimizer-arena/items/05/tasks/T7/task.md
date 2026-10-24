---
topic: "001"
item: "05"
task: T7
author: claude
state: approved
reworks: 0
first_cycle: 2026-10-24-10
issue: 47
lou_approved: false
---

branch: B2 Judge bias control and calibration
title: Publish a length-controlled score next to every judged score
description: Fit a regression of judge score on output-token count (relative to the baseline's output length on the same prompt), in the style of length-controlled AlpacaEval, and publish the length-controlled score beside the raw judged score. Ranking uses the length-controlled score whenever the verbosity test (6) shows bias for that category.
done_when: Scoring code outputs a raw and a length-controlled score per entrant per judged category, and the ranking rule picks between them from the leaf-6 result.
sources: [https://arxiv.org/abs/2404.04475]

## Requested changes


## History
- 2026-10-24-10: proposed by claude; muse yes, groky yes → approved
