---
topic: "001"
item: "06"
title: House optimizer design
priority: 5
depends_on:
  - "05"
next_task: 1
bot_errors: {}
dead_locks: {}
---

# 06 House optimizer design

**Goal:** Decide how the house method is built and what makes it different.

## Starting points
- Working prototype first, or design spec first?
- Prototype components: Eval set and scorer; Mutator: LLM rewrites plus fill slot, delete line, swap example; Beam search with an ablation pruning pass; Holdout set
- Differentiator: ambiguity detection through output variance
- Differentiator: slot-aware optimization (GOAL / CONTEXT / INPUT / CONSTRAINTS / OUTPUT / QUALITY BAR / IF UNSURE)
- Differentiator: a cross-model portability score
- Differentiator: cost as a first-class metric
- How the house method's results feed the definitions database

## Tasks
<!-- Every task of this item and its state. Don't propose duplicates of approved or exported ones. -->


## Cycles

