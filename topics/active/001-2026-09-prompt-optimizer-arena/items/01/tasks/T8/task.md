---
topic: "001"
item: "01"
task: T8
author: groky
state: more-review
reworks: 1
first_cycle: 2026-10-24-06
issue: 31
lou_approved: false
---

branch: B3 Day-one knowledge base
title: Write the day-one rules for the efficiency and cost bucket
description: Write rules for redundant context, verbose system prompts and cacheable static content, each with a detection check, a severity and a measured token saving. Measure each saving the same way: count the tokens of each sample prompt with the target model's tokenizer (the baseline), apply the rule's suggested fix, count again, and report the median saving in tokens and percent across at least five sample prompts. For cacheable static content, the saving is the cached prefix priced at the provider's published cache-read rate. These per-rule numbers back the "cut token spend 15%" claim.
done_when: The bucket file contains a rule for each of the three named patterns, each with a token saving measured by the stated baseline-and-fix method on at least five sample prompts, with the samples and counts recorded.
sources: [https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching, https://platform.openai.com/docs/guides/prompt-caching]

## Requested changes
- 2026-10-24-06 proposal — muse: The tree covers the trust story well, but B2 has no leaf for rolling back or pinning a bad definitions bundle — antivirus-style updates need a staged rollout and rollback path, or a faulty bundle breaks every client at once.
- 2026-10-24-06 proposal — claude: A strong, coherent trust story that answers the starting question cleanly. One missing part: B2 has bundle signing but no leaf for signing-key management (key rotation, revocation, and how a client learns a key was revoked, including air-gapped sites). Security reviewers at banks will ask for it, and without it T5 and T6 can't be fully planned.
- 2026-10-24-06 muse (maybe): State how each rule's token saving is estimated or measured (baseline and method) and require that method in done_when.
- 2026-10-24-08 proposal — muse: The four reworks address their requested changes. The B2 gaps raised last cycle — definitions bundle rollback/pinning and signing-key rotation/revocation — are correctly not done in these reworks, since a rework can only revise its own task; they still need new leaves in a future breakdown of this item.
- 2026-10-24-08 proposal — claude: The reworks are good. The B2 gaps raised last cycle (bundle rollback and pinning; signing-key rotation and revocation, including air-gapped sites) are still open, and only a new breakdown or the auditor can add them, so the auditor should check for them before exporting B2.
- 2026-10-24-08 claude (maybe): Name the tokenizer(s) and provider price sheet(s) the savings are measured with (for example, report per provider for the Anthropic and OpenAI tokenizers and their published cache-read rates), and require those names in done_when.

## History
- 2026-10-24-06: proposed by groky; muse maybe, claude yes → more-review
- 2026-10-24-08: rework 1 assigned to groky
- 2026-10-24-08: reworked by groky — - muse (maybe), state how each saving is estimated or measured (baseline and method) and require it in done_when: done. Baseline is the tokenizer count before the fix, the method is the count after the fix, median over at least five samples, and done_when requires the recorded samples and counts. -
- 2026-10-24-08: rework 1 reviewed; muse yes, claude maybe → more-review
