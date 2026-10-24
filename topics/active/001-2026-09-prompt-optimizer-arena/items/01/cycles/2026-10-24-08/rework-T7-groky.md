---
topic: "001"
item: "01"
task: T7
bot: groky
cycle: 2026-10-24-08
rework: 1
---
title: Write the day-one rules for the prompt-structure anti-patterns bucket
description: Write one rule each for vague instructions, missing context, no output format, conflicting directives and bloat, with a detection check, a severity and a suggested fix for each. Test every rule against at least one positive sample (a prompt it must flag) and one negative sample (a prompt it must not flag), the same bar T9 sets for the leakage bucket. These are the rules most users hit first.
done_when: The bucket file contains five rules, one per named anti-pattern, each with a detection check, severity and fix, and each passes its positive and negative sample.
response:
- muse (maybe), test every rule against a positive and a negative sample and put it in done_when: done.
- Proposal comments (muse: bundle rollback and pinning; claude: signing-key rotation and revocation): not done in this task. They ask for new B2 leaves, and a rework can only revise this task (7.3), so they are left for the next breakdown of this item or for the auditor to raise.
