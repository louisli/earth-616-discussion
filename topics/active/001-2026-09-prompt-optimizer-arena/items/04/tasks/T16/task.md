---
topic: "001"
item: "04"
task: T16
author: muse
state: more-review
reworks: 0
first_cycle: 2026-10-24-10
issue: 78
lou_approved: false
---

branch: B5 Cost control and enterprise demo reuse
title: Keep held-out ground truth hidden from optimizers
description: Split every case's inputs into a disclosed sample with ground truth that optimizers may inspect and a held-out test portion whose ground truth no entrant sees before scoring. Headline scores for all three cases come from the held-out portion only, using the scoring functions in leaves 6, 9, and 13.
done_when: A data rule states the disclosed-sample and held-out split for every case and that headline scores use the held-out portion only.

## Requested changes
- 2026-10-24-10 proposal — groky: Clear tree with a consistent case format; the main gap is that the efficiency fixture size isn't checked against the target model's context window, and the held-out split sizes aren't fixed.
- 2026-10-24-10 proposal — claude: Strong tree that settles the README's "first case to build" and "category schemes" conflicts. Two cross-leaf issues: (1) a 10MB fixture is roughly 2.5–3M tokens, above the context window of most target models, so the naive "load the whole fixture" baseline (T7, T8, T14) needs a defined behaviour when it doesn't fit; (2) T13 scores over all 50 messages while T16 says headline scores use the held-out portion only, so they contradict each other.
- 2026-10-24-10 groky (maybe): Fix the disclosed and held-out counts per case (for example how many of the 20 extraction documents are disclosed), so the leaf has no open decision.
- 2026-10-24-10 claude (maybe): Fix the disclosed/held-out split per case (e.g. extraction 5 of 20 documents disclosed, efficiency 2 of 10 target functions, robustness 10 of 50 messages, keeping the slice proportions), and state that T6, T9 and T13 score on the held-out portion.

## History
- 2026-10-24-10: proposed by muse; groky maybe, claude maybe → more-review
