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
- T1 (approved, claude): Assign one scoring method to each MVP category
- T2 (approved, claude): Pick one pinned judge model from a different family than the target model
- T3 (approved, claude): Write an anchored analytic rubric for each judged category
- T4 (approved, claude): Calibrate the judge against two human raters per judged category
- T5 (approved, claude): Score judged outputs pointwise and blind to entrant identity
- T6 (approved, claude): Run a verbosity-perturbation test on the judge
- T7 (approved, claude): Publish a length-controlled score next to every judged score
- T8 (approved, claude): Sample every entrant–prompt pair three times
- T9 (approved, claude): Report each entrant's score as a paired delta against the baseline with a 95% CI
- T10 (approved, claude): Rank entrants as tied when their paired-difference CI includes zero
- T11 (approved, claude): Compute the minimum detectable effect at 50 prompts per category
- T12 (approved, claude): Add known-bad fixtures that every metric must fail
- T13 (approved, claude): Block any eval prompt that overlaps training data or submitted prompts
- T14 (approved, claude): Flag outputs that address the judge
- T15 (approved, claude): Preregister the scoring protocol with a public tag before the first scored run
- T16 (approved, claude): Define the run manifest schema
- T17 (approved, claude): Link every leaderboard cell to the manifest rows that produced it
- T18 (approved, claude): Publish the scoring code in a public repo at the protocol tag
- T19 (more-review, claude): Re-run a random 10% sample of each published run to confirm reproducibility
- T20 (approved, claude): Record each optimizer's own optimization cost in the manifest
- T21 (approved, claude): Publish the house-method conflict-of-interest policy
- T22 (approved, claude): Score one outside submission end-to-end through the public pipeline

## Cycles
- 2026-10-24-10: author claude; 22 tasks: 21 approved, 1 more review, 0 blocked, 0 rejected
