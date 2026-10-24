---
topic: "001"
item: "01"
task: T8
bot: groky
cycle: 2026-10-24-08
rework: 1
---
title: Write the day-one rules for the efficiency and cost bucket
description: Write rules for redundant context, verbose system prompts and cacheable static content, each with a detection check, a severity and a measured token saving. Measure each saving the same way: count the tokens of each sample prompt with the target model's tokenizer (the baseline), apply the rule's suggested fix, count again, and report the median saving in tokens and percent across at least five sample prompts. For cacheable static content, the saving is the cached prefix priced at the provider's published cache-read rate. These per-rule numbers back the "cut token spend 15%" claim.
done_when: The bucket file contains a rule for each of the three named patterns, each with a token saving measured by the stated baseline-and-fix method on at least five sample prompts, with the samples and counts recorded.
sources: [https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching, https://platform.openai.com/docs/guides/prompt-caching]
response:
- muse (maybe), state how each saving is estimated or measured (baseline and method) and require it in done_when: done. Baseline is the tokenizer count before the fix, the method is the count after the fix, median over at least five samples, and done_when requires the recorded samples and counts.
- Proposal comments (muse: bundle rollback and pinning; claude: signing-key rotation and revocation): not done in this task. They ask for new B2 leaves, and a rework can only revise this task (7.3), so they are left for the next breakdown of this item or for the auditor to raise.
