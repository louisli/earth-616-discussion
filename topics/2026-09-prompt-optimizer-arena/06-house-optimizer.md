---
topic: 2026-09-prompt-optimizer-arena
title: House optimizer design
status: open
depends_on: [05-scoring-trust-eval.md]
picked_up_into:
updated: 2026-10-22
---

# House optimizer design

**Goal:** Decide how the house method is built and what makes it different.

## Discussion points

- [ ] Working prototype first, or design spec first?
- [ ] Prototype components:
    - Eval set and scorer
    - Mutator: LLM rewrites plus fill slot, delete line, swap example
    - Beam search with an ablation pruning pass
    - Holdout set
- [ ] Differentiator: ambiguity detection through output variance
- [ ] Differentiator: slot-aware optimization (GOAL / CONTEXT / INPUT / CONSTRAINTS / OUTPUT / QUALITY BAR / IF UNSURE)
- [ ] Differentiator: a cross-model portability score
- [ ] Differentiator: cost as a first-class metric
- [ ] How the house method's results feed the definitions database

## Decisions

## Actionable output

## Questions from planner
