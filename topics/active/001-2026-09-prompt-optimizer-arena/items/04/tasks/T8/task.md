---
topic: "001"
item: "04"
task: T8
author: muse
state: more-review
reworks: 0
first_cycle: 2026-10-24-10
issue: 70
lou_approved: false
---

branch: B3 Efficiency case (built second)
title: Write the efficiency naive baseline prompt verbatim
description: Record the exact baseline prompt an unoptimized entrant receives: it asks which file defines a named function and is run in the naive form that loads the whole fixture into context. The selective strategy of listing filenames first and reading only candidate files is the behaviour optimization is expected to discover, and it is not hinted at in the baseline prompt.
done_when: One verbatim baseline prompt is recorded that asks for the file defining a named function and contains no selective-reading hint.

## Requested changes
- 2026-10-24-10 proposal — groky: Clear tree with a consistent case format; the main gap is that the efficiency fixture size isn't checked against the target model's context window, and the held-out split sizes aren't fixed.
- 2026-10-24-10 proposal — claude: Strong tree that settles the README's "first case to build" and "category schemes" conflicts. Two cross-leaf issues: (1) a 10MB fixture is roughly 2.5–3M tokens, above the context window of most target models, so the naive "load the whole fixture" baseline (T7, T8, T14) needs a defined behaviour when it doesn't fit; (2) T13 scores over all 50 messages while T16 says headline scores use the held-out portion only, so they contradict each other.
- 2026-10-24-10 claude (maybe): State what the naive baseline does when the fixture exceeds the context window (e.g. feed files in fixed alphabetical order in context-sized chunks until it answers, counting all tokens), and keep the no-selective-reading-hint rule.

## History
- 2026-10-24-10: proposed by muse; groky yes, claude maybe → more-review
