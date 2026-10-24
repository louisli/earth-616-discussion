---
topic: "001"
item: "01"
task: T8
author: groky
state: rework
reworks: 1
first_cycle: 2026-10-24-06
issue: 31
lou_approved: false
---

branch: B3 Day-one knowledge base
title: Write the day-one rules for the efficiency and cost bucket
description: Write rules for redundant context, verbose system prompts and cacheable static content, each with a detection check, a severity and an estimated token saving. The token-saving estimate backs the "cut token spend 15%" claim with a per-rule number.
done_when: The bucket file contains a rule for each of the three named patterns, each with a token-saving estimate.
sources: [https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching]

## Requested changes
- 2026-10-24-06 proposal — muse: The tree covers the trust story well, but B2 has no leaf for rolling back or pinning a bad definitions bundle — antivirus-style updates need a staged rollout and rollback path, or a faulty bundle breaks every client at once.
- 2026-10-24-06 proposal — claude: A strong, coherent trust story that answers the starting question cleanly. One missing part: B2 has bundle signing but no leaf for signing-key management (key rotation, revocation, and how a client learns a key was revoked, including air-gapped sites). Security reviewers at banks will ask for it, and without it T5 and T6 can't be fully planned.
- 2026-10-24-06 muse (maybe): State how each rule's token saving is estimated or measured (baseline and method) and require that method in done_when.

## History
- 2026-10-24-06: proposed by groky; muse maybe, claude yes → more-review
- 2026-10-24-08: rework 1 assigned to groky
