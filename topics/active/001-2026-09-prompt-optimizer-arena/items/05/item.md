---
bot_errors: {}
dead_locks: {}
next_task: 23
topic: "001"
item: "05"
title: Scoring trust and eval methodology
priority: 2
depends_on:
  - "03"
---

# 05 Scoring trust and eval methodology

**Goal:** Make every score defensible, because this is what makes or breaks the arena. The previous discussion stopped at model-as-judge.

## Starting points
- Model-as-judge for open-ended outputs: judge model choice, rubrics, calibration against human ratings, disclosure of which method scored what
- Judge biases: rewarding longer answers, favoring its own model family; mitigations
- Statistics: variance and confidence intervals instead of single scores; how many prompts per category
- Silent failures: metric functions that always pass, train/test leakage, judge prompts that reward length
- Preregistered, blinded rubric (the gap BenchLM itself named)
- Transparency: every score explainable (inputs, raw outputs, tokens, computation); open-source the scoring code
- Reproducibility: pinned model versions, fixed inputs and seeds, versioned prompts, datasets and judge configs, published run manifests
- Fairness rules: same target model, held-out eval set and judge for all; always a no-optimization baseline; report quality, input/output tokens, latency and each optimizer's own optimization cost
- Conflict of interest: the house method is one named entrant, not the headline; it must be able to visibly lose; accept outside submissions

## Concept
Scoring becomes a frozen, public protocol that every entrant passes through identically: deterministic checks wherever a category allows them, and a pinned, calibrated, blinded model judge only where it doesn't (B1). The judge's known biases are measured and controlled rather than assumed away (B2). Every number ships with an uncertainty estimate, and ranks follow the statistics rather than point scores (B3). Integrity checks catch metrics that silently pass, leaked eval data and outputs that try to game the judge before anything is published (B4). The whole protocol is preregistered before the first scored run, and every score traces back to raw artifacts in a published manifest (B5). Fairness and conflict-of-interest rules keep the house method an ordinary entrant that can visibly lose (B6). Item 03 owns what is compared and how the leaderboard looks; this item owns how each number on it is produced and defended.

- **B1 Scoring methods and the judge:** Decides how each MVP category is scored, which judge model scores open-ended outputs, and the rubric it scores against.
- **B2 Judge bias control and calibration:** Shows the judge agrees with humans, and measures and controls length, position, identity and self-preference effects.
- **B3 Statistics and uncertainty:** Sampling, confidence intervals, paired comparisons against the baseline, tie rules and whether ~50 prompts per category can resolve real differences.
- **B4 Integrity checks against silent failure:** Automated guards that catch always-pass metrics, train/test leakage and judge-targeted outputs before scores are published.
- **B5 Preregistration, transparency and reproducibility:** Freezes the protocol before runs, records every run in a manifest, makes every score explainable, and proves the published numbers reproduce.
- **B6 Fairness and conflict of interest:** Cost reporting for every optimizer, the house method's conflict-of-interest rules, and the path for outside submissions.

_From claude's proposal, cycle 2026-10-24-10._

## Tasks
<!-- Every task of this item and its state. Don't propose duplicates of approved or exported ones. -->


## Cycles

