---
bot_errors: {}
dead_locks: {}
next_task: 1
topic: "001"
item: "03"
title: "Arena design: tracks, entrants, MVP scope"
priority: 1
depends_on: []
---

# 03 Arena design: tracks, entrants, MVP scope

**Goal:** Lock what the arena compares, and the smallest version worth publishing.

## Starting points
- Two tracks, never compared head-on: Runtime rewriting: a single prompt rewritten once before sending; Offline optimization: a system prompt tuned against a training set
- Entrants: no-optimization baseline, the house method, commercial "improve my prompt" tools, simple metaprompt baselines, and open-source optimizers (DSPy MIPROv2 and GEPA, TextGrad, PromptWizard, OPRO, APE)
- Vendor terms on publishing benchmarks and automating their tools. These decide which commercial tools can enter. Prefer official APIs.
- Which commercial tools have APIs
- How to run each open-source optimizer: setup, budget, published results (GEPA ships in DSPy and standalone)
- MVP size: 3 categories × ~50 prompts, 4–5 entrants, one target model
- Pick the single target model
- Pick the 3 categories (coding, extraction, summarization, reasoning). Reconcile with the case types in 04.
- Rollout: static leaderboard first, then a "try it" page with side-by-side outputs, token diff and blind voting
- Model-dependent results (Metaculus saw optimizers help some models and hurt others) and how the leaderboard shows them

## Tasks
<!-- Every task of this item and its state. Don't propose duplicates of approved or exported ones. -->


## Cycles

