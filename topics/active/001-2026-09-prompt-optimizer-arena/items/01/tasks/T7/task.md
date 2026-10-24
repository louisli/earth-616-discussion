---
topic: "001"
item: "01"
task: T7
author: groky
state: rework
reworks: 1
first_cycle: 2026-10-24-06
issue: 30
lou_approved: false
---

branch: B3 Day-one knowledge base
title: Write the day-one rules for the prompt-structure anti-patterns bucket
description: Write one rule each for vague instructions, missing context, no output format, conflicting directives and bloat, with a detection check, a severity and a suggested fix for each. These are the rules most users hit first.
done_when: The bucket file contains five rules, one per named anti-pattern, each with a detection check, severity and fix.

## Requested changes
- 2026-10-24-06 proposal — muse: The tree covers the trust story well, but B2 has no leaf for rolling back or pinning a bad definitions bundle — antivirus-style updates need a staged rollout and rollback path, or a faulty bundle breaks every client at once.
- 2026-10-24-06 proposal — claude: A strong, coherent trust story that answers the starting question cleanly. One missing part: B2 has bundle signing but no leaf for signing-key management (key rotation, revocation, and how a client learns a key was revoked, including air-gapped sites). Security reviewers at banks will ask for it, and without it T5 and T6 can't be fully planned.
- 2026-10-24-06 muse (maybe): Require each rule to be tested against at least one positive and one negative sample, as T9 already requires, and add that to done_when.

## History
- 2026-10-24-06: proposed by groky; muse maybe, claude yes → more-review
- 2026-10-24-08: rework 1 assigned to groky
