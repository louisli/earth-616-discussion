---
topic: "001"
item: "05"
task: T10
author: claude
state: approved
reworks: 0
first_cycle: 2026-10-24-10
issue: 50
lou_approved: false
---

branch: B3 Statistics and uncertainty
title: Rank entrants as tied when their paired-difference CI includes zero
description: Within a track and category, two entrants get the same rank unless the 95% CI of their paired per-prompt difference excludes zero. This stops the leaderboard from ordering entrants by noise.
done_when: The ranking function assigns equal ranks to every entrant pair whose paired-difference CI includes zero, verified on a fixture with a known tie.

## Requested changes


## History
- 2026-10-24-10: proposed by claude; muse yes, groky yes → approved
