---
bot_errors: {}
dead_locks: {}
next_task: 1
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

## Tasks
<!-- Every task of this item and its state. Don't propose duplicates of approved or exported ones. -->


## Cycles

