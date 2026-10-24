---
topic: "001"
item: "04"
task: T13
author: muse
state: more-review
reworks: 0
first_cycle: 2026-10-24-10
issue: 75
lou_approved: false
---

branch: B4 Robustness case (built third)
title: Define robustness scoring as accuracy on the full messy set
description: Score robustness as exact-label accuracy across all 50 messages in leaf 11, reported as one headline accuracy plus a per-slice accuracy breakdown for the clean, typo, mixed-language, and edge slices. No entrant is ranked on the clean slice alone, so a clean-set gain cannot hide a messy-slice regression.
done_when: A scoring rule states headline accuracy over all 50 messages, the four per-slice breakdowns, and that ranking never uses the clean slice alone.

## Requested changes
- 2026-10-24-10 proposal — groky: Clear tree with a consistent case format; the main gap is that the efficiency fixture size isn't checked against the target model's context window, and the held-out split sizes aren't fixed.
- 2026-10-24-10 proposal — claude: Strong tree that settles the README's "first case to build" and "category schemes" conflicts. Two cross-leaf issues: (1) a 10MB fixture is roughly 2.5–3M tokens, above the context window of most target models, so the naive "load the whole fixture" baseline (T7, T8, T14) needs a defined behaviour when it doesn't fit; (2) T13 scores over all 50 messages while T16 says headline scores use the held-out portion only, so they contradict each other.
- 2026-10-24-10 claude (maybe): Score headline and per-slice accuracy on the held-out portion of the 50 messages (per T16), and keep the rule that ranking never uses the clean slice alone.

## History
- 2026-10-24-10: proposed by muse; groky yes, claude maybe → more-review
