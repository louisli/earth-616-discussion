---
bot_errors: {}
dead_locks: {}
next_task: 14
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

## Concept
The arena becomes two separate leaderboards that are never merged: a Runtime track where each entrant rewrites one prompt once before it is sent, and an Offline track where each entrant tunes a system prompt against a disclosed training split. Both tracks run the same MVP — one fixed target model, three categories reconciled with item 04, about 50 prompts per category — with entrants admitted only after a terms check, scored identically within a track, and published first as a static leaderboard before any interactive try-it page.

- **B1 Tracks and comparison rules:** Defines the two tracks, what counts as one entry in each, and the rule that results are only ranked inside a track.
- **B2 Entrants and eligibility:** Covers the entrant roster for the MVP, vendor-terms clearance for commercial tools, and reproducible run recipes for open-source optimizers.
- **B3 MVP scope: model, categories, size:** Locks the single target model, the three MVP categories reconciled with item 04's case types, and the prompt count that keeps the MVP publishable.
- **B4 Publication and rollout:** Covers the static leaderboard format, how model-dependent results are shown honestly, and the later try-it page with blind voting.

_From muse's proposal, cycle 2026-10-24-06._

## Tasks
<!-- Every task of this item and its state. Don't propose duplicates of approved or exported ones. -->


## Cycles

