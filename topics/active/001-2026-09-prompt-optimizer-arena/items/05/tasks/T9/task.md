---
topic: "001"
item: "05"
task: T9
author: claude
state: approved
reworks: 0
first_cycle: 2026-10-24-10
issue: 49
lou_approved: false
---

branch: B3 Statistics and uncertainty
title: Report each entrant's score as a paired delta against the baseline with a 95% CI
description: For each entrant and category, compute the per-prompt difference from the no-optimization baseline on the same prompt, and report its mean with a 95% CI using standard errors clustered by prompt (by source passage where prompts share one). The leaderboard shows the absolute score and this delta with its CI, never a bare point score.
done_when: Scoring code outputs, for every entrant and category, the absolute score with CI and the paired delta vs baseline with a clustered 95% CI, checked against a hand-computed fixture.
sources: [https://arxiv.org/abs/2411.00640]

## Requested changes


## History
- 2026-10-24-10: proposed by claude; muse yes, groky yes → approved
