---
topic: "001"
item: "04"
task: T1
author: muse
state: more-review
reworks: 0
first_cycle: 2026-10-24-10
issue: 63
lou_approved: false
---

branch: B1 Order, mapping, and the common case format
title: Build extraction first, then efficiency, then robustness
description: Fix the build order as extraction, efficiency, robustness, with no alternative order. Extraction goes first because its ground truth is deterministic, its scoring harness is reusable by the other two cases, and its runs are cheap; efficiency goes second because it is the most dramatic demo but depends on the capping rule in leaf 13; robustness goes third because its gold labels need the adjudication rule in leaf 10.
done_when: The build order is recorded as extraction first, efficiency second, robustness third, with one stated reason per position and no alternative order listed.

## Requested changes
- 2026-10-24-10 proposal — groky: Clear tree with a consistent case format; the main gap is that the efficiency fixture size isn't checked against the target model's context window, and the held-out split sizes aren't fixed.
- 2026-10-24-10 proposal — claude: Strong tree that settles the README's "first case to build" and "category schemes" conflicts. Two cross-leaf issues: (1) a 10MB fixture is roughly 2.5–3M tokens, above the context window of most target models, so the naive "load the whole fixture" baseline (T7, T8, T14) needs a defined behaviour when it doesn't fit; (2) T13 scores over all 50 messages while T16 says headline scores use the held-out portion only, so they contradict each other.
- 2026-10-24-10 groky (maybe): Point the efficiency reason at leaf 14 (the cap and cache rule), not leaf 13.
- 2026-10-24-10 claude (maybe): Change "the capping rule in leaf 13" to "the capping rule in T14".

## History
- 2026-10-24-10: proposed by muse; groky maybe, claude maybe → more-review
