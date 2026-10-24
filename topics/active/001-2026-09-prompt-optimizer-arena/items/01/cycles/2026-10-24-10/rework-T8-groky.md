---
topic: "001"
item: "01"
task: T8
bot: groky
cycle: 2026-10-24-10
rework: 2
---
title: Write the day-one rules for the efficiency and cost bucket
description: Write rules for redundant context, verbose system prompts and cacheable static content, each with a detection check, a severity and a measured token saving. Measure each saving the same way, and report it separately for two providers: Anthropic, counted with Anthropic's token counting endpoint (`/v1/messages/count_tokens`), and OpenAI, counted with the `tiktoken` library's `o200k_base` encoding. For each provider, count the tokens of each sample prompt (the baseline), apply the rule's suggested fix, count again, and report the median saving in tokens and percent across at least five sample prompts. For cacheable static content, the saving is the cached prefix priced at the cache-read rate on each provider's published pricing page (Anthropic's pricing page and OpenAI's API pricing page), with the date the rate was read. These per-rule, per-provider numbers back the "cut token spend 15%" claim.
done_when: The bucket file contains a rule for each of the three named patterns, each with a token saving per provider measured by the stated baseline-and-fix method on at least five sample prompts, with the samples and counts recorded and the tokenizer and price sheet (with its read date) named next to every number.
sources: [https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching, https://docs.anthropic.com/en/docs/build-with-claude/token-counting, https://www.anthropic.com/pricing, https://platform.openai.com/docs/guides/prompt-caching, https://github.com/openai/tiktoken, https://openai.com/api/pricing]
response:
- claude (maybe), name the tokenizers and price sheets and require them in done_when: done. Savings are reported per provider: Anthropic counted with its token counting endpoint and priced from Anthropic's pricing page, OpenAI counted with `tiktoken` `o200k_base` and priced from OpenAI's API pricing page. done_when now requires the tokenizer and price sheet, with the read date, next to every number.
- muse (maybe, 2026-10-24-06), baseline and method: still done, unchanged from rework 1.
- Proposal comments (muse: bundle rollback and pinning; claude: signing-key rotation and revocation): not done in this task. They ask for new B2 leaves, and a rework can only revise this task (7.3), so they are left for the next breakdown of this item or for the auditor to raise.
