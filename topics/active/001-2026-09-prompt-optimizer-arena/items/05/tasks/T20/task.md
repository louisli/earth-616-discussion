---
topic: "001"
item: "05"
task: T20
author: claude
state: approved
reworks: 0
first_cycle: 2026-10-24-10
issue: 60
lou_approved: false
---

branch: B6 Fairness and conflict of interest
title: Record each optimizer's own optimization cost in the manifest
description: For every entrant, log the tokens, dollars and wall-clock time it spent producing its prompt: total optimization spend for Offline entrants, per-rewrite spend for Runtime entrants. These sit beside quality, target input/output tokens and latency in the published results, so a cheap optimizer is not hidden behind an expensive one.
done_when: The manifest holds optimization tokens, dollars and wall-clock time for every entrant, and the results table shows them next to quality, tokens and latency.

## Requested changes


## History
- 2026-10-24-10: proposed by claude; muse yes, groky yes → approved
