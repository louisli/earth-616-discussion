---
topic: "001"
item: "04"
bot: groky
cycle: 2026-10-24-10
---
## Proposal
comment: Clear tree with a consistent case format; the main gap is that the efficiency fixture size isn't checked against the target model's context window, and the held-out split sizes aren't fixed.

## T1
vote: maybe
reason: The order and reasons are sound, but the description cites the capping rule as leaf 13 when it is leaf 14.
changes: Point the efficiency reason at leaf 14 (the cap and cache rule), not leaf 13.

## T2
vote: yes
reason: Follows item 03 T8 exactly and settles the category-scheme conflict from the topic README.

## T3
vote: yes
reason: Seven named fields with a clear not-build-ready rule; checkable.

## T4
vote: yes
reason: Size, fields and a closed list of messiness forms are all fixed.

## T5
vote: yes
reason: Verbatim, schema-free baseline is a fair starting point for every track.

## T6
vote: yes
reason: Normalisation per field and no partial credit make it deterministic.

## T7
vote: maybe
reason: About 10MB is roughly 2.5M tokens, more than most target models' context windows, so the naive full-load baseline in T8 may be impossible to run as written.
changes: Size the fixture so the full load fits the item 03 target model's context window (state the token budget), or state how the naive baseline handles overflow.

## T8
vote: yes
reason: Baseline is fixed and leaves the selective strategy for optimizers to discover.

## T9
vote: yes
reason: Exact-file correctness with token ranking among correct runs only is a clean pass/fail plus tiebreak.

## T10
vote: yes
reason: Closed label set with a removal rule avoids disputed gold labels.

## T11
vote: yes
reason: Slice counts are fixed and hidden from entrants.

## T12
vote: yes
reason: Names the labels without definitions or guidance; a fair naive baseline.

## T13
vote: yes
reason: Headline plus per-slice accuracy and the no-clean-only ranking rule stop hidden regressions.

## T14
vote: yes
reason: Cap and cache rule is concrete and keeps the expensive baseline affordable (cost figure should be rechecked once T7 is resized).

## T15
vote: yes
reason: One demo audience per case and unchanged inputs keep demo numbers honest.

## T16
vote: maybe
reason: The split is the right rule, but with 20, 10 and 50 inputs the split sizes decide whether the held-out portion can rank anything.
changes: Fix the disclosed and held-out counts per case (for example how many of the 20 extraction documents are disclosed), so the leaf has no open decision.
