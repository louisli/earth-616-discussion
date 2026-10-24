---
topic: "001"
item: "04"
task: T7
author: muse
state: more-review
reworks: 0
first_cycle: 2026-10-24-10
issue: 69
lou_approved: false
---

branch: B3 Efficiency case (built second)
title: Freeze the efficiency repo fixture at about 50 files and about 10MB
description: Fix the efficiency input as one synthetic repo fixture of 50 files totalling about 10MB, containing 10 named target functions each present in exactly one file, with the correct file recorded per function before any run. No file in the fixture names its target function in its filename, so filename search alone cannot solve the case.
done_when: A fixture specification fixes 50 files, about 10MB total, 10 target functions each in exactly one recorded file, and the no-target-name-in-filename rule.

## Requested changes
- 2026-10-24-10 proposal — groky: Clear tree with a consistent case format; the main gap is that the efficiency fixture size isn't checked against the target model's context window, and the held-out split sizes aren't fixed.
- 2026-10-24-10 proposal — claude: Strong tree that settles the README's "first case to build" and "category schemes" conflicts. Two cross-leaf issues: (1) a 10MB fixture is roughly 2.5–3M tokens, above the context window of most target models, so the naive "load the whole fixture" baseline (T7, T8, T14) needs a defined behaviour when it doesn't fit; (2) T13 scores over all 50 messages while T16 says headline scores use the held-out portion only, so they contradict each other.
- 2026-10-24-10 groky (maybe): Size the fixture so the full load fits the item 03 target model's context window (state the token budget), or state how the naive baseline handles overflow.
- 2026-10-24-10 claude (maybe): Fix the size as a stated range (e.g. 9.5–10.5MB), and record the fixture's token count under the arena's fixed target model tokenizer next to that model's context window.

## History
- 2026-10-24-10: proposed by muse; groky maybe, claude maybe → more-review
