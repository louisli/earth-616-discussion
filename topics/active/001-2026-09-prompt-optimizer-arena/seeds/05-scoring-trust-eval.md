---
topic: "001"
title: Scoring trust and eval methodology
status: seed
depends_on: ["03"]
updated: 2026-10-22
---

# Scoring trust and eval methodology

**Goal:** Make every score defensible, because this is what makes or breaks the arena. The previous discussion stopped at model-as-judge.

## Discussion points

- [ ] Model-as-judge for open-ended outputs: judge model choice, rubrics, calibration against human ratings, disclosure of which method scored what
- [ ] Judge biases: rewarding longer answers, favoring its own model family; mitigations
- [ ] Statistics: variance and confidence intervals instead of single scores; how many prompts per category
- [ ] Silent failures: metric functions that always pass, train/test leakage, judge prompts that reward length
- [ ] Preregistered, blinded rubric (the gap BenchLM itself named)
- [ ] Transparency: every score explainable (inputs, raw outputs, tokens, computation); open-source the scoring code
- [ ] Reproducibility: pinned model versions, fixed inputs and seeds, versioned prompts, datasets and judge configs, published run manifests
- [ ] Fairness rules: same target model, held-out eval set and judge for all; always a no-optimization baseline; report quality, input/output tokens, latency and each optimizer's own optimization cost
- [ ] Conflict of interest: the house method is one named entrant, not the headline; it must be able to visibly lose; accept outside submissions
