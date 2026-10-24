---
topic: "001"
item: "04"
bot: claude
cycle: 2026-10-24-10
---
## Proposal
comment: Strong tree that settles the README's "first case to build" and "category schemes" conflicts. Two cross-leaf issues: (1) a 10MB fixture is roughly 2.5–3M tokens, above the context window of most target models, so the naive "load the whole fixture" baseline (T7, T8, T14) needs a defined behaviour when it doesn't fit; (2) T13 scores over all 50 messages while T16 says headline scores use the held-out portion only, so they contradict each other.

## T1
vote: maybe
reason: Right order with sound reasons, but the cross-reference is wrong: the capping rule is T14, not "leaf 13" (T13 is robustness scoring).
changes: Change "the capping rule in leaf 13" to "the capping rule in T14".

## T2
vote: yes
reason: Applies the item 03 rule cleanly and settles the category-scheme conflict without forcing robustness into one category.

## T3
vote: yes
reason: A closed seven-field template with a clear not-build-ready rule.

## T4
vote: yes
reason: Fixed size, fixed fields and a closed list of messiness forms; testable.

## T5
vote: yes
reason: Verbatim, deliberately naive baseline with a pass/fail check.

## T6
vote: yes
reason: Normalisation, per-field and overall F1, and zero credit for near misses are all fixed.

## T7
vote: maybe
reason: "About 10MB" isn't a pass/fail size, and 10MB (~2.5–3M tokens) exceeds most target models' context windows, so the fixture's fit has to be decided here.
changes: Fix the size as a stated range (e.g. 9.5–10.5MB), and record the fixture's token count under the arena's fixed target model tokenizer next to that model's context window.

## T8
vote: maybe
reason: A "whole fixture in context" baseline can't run if the fixture is bigger than the target model's context window, so the baseline is undefined as written.
changes: State what the naive baseline does when the fixture exceeds the context window (e.g. feed files in fixed alphabetical order in context-sized chunks until it answers, counting all tokens), and keep the no-selective-reading-hint rule.

## T9
vote: yes
reason: Exact-file correctness gate, then token ranking among correct runs only; unambiguous.

## T10
vote: yes
reason: Closed label set, one gold label, and a clear removal rule for disputed inputs.

## T11
vote: yes
reason: Fixed counts per slice, with slice metadata hidden from entrants.

## T12
vote: yes
reason: Verbatim naive baseline naming the labels with nothing else; testable.

## T13
vote: maybe
reason: Scoring "across all 50 messages" contradicts T16, where headline scores come from the held-out portion only.
changes: Score headline and per-slice accuracy on the held-out portion of the 50 messages (per T16), and keep the rule that ranking never uses the clean slice alone.

## T14
vote: yes
reason: Clear cap, cache and exemption rule that addresses the seed's cost point (it inherits whatever T8 decides about oversize fixtures).

## T15
vote: yes
reason: One named enterprise audience per case, with demo numbers tied to benchmark numbers.

## T16
vote: maybe
reason: The split proportions are left open, which fails atomic test 4 (no open decisions), and the small sets make the split matter.
changes: Fix the disclosed/held-out split per case (e.g. extraction 5 of 20 documents disclosed, efficiency 2 of 10 target functions, robustness 10 of 50 messages, keeping the slice proportions), and state that T6, T9 and T13 score on the held-out portion.
