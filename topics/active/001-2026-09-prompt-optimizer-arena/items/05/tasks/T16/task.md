---
topic: "001"
item: "05"
task: T16
author: claude
state: approved
reworks: 0
first_cycle: 2026-10-24-10
issue: 56
lou_approved: false
---

branch: B5 Preregistration, transparency and reproducibility
title: Define the run manifest schema
description: Specify one JSON schema recording, per scored sample: target and judge model IDs, protocol version, dataset version hash, rubric version, raw task, entrant prompt, sampling settings and seed, raw output, judge prompt and response, input/output tokens, latency and timestamp. Every leaderboard number must be recomputable from manifest rows alone.
done_when: A versioned JSON schema exists with all listed fields, and a validator rejects a manifest missing any of them.

## Requested changes


## History
- 2026-10-24-10: proposed by claude; muse yes, groky yes → approved
