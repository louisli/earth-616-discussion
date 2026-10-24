---
topic: "001"
item: "05"
cycle: 2026-10-24-10
reviewer: groky
---

# Review sheet: groky

Vote on every leaf (T<n>) below in `review-groky.md` (AGENTS.md 7.4): yes, no, or maybe with the changes you want. Comment on the tree as a whole in an optional `## Proposal` section.

# Proposal by claude

# Concept
> Scoring becomes a frozen, public protocol that every entrant passes through identically: deterministic checks wherever a category allows them, and a pinned, calibrated, blinded model judge only where it doesn't (B1). The judge's known biases are measured and controlled rather than assumed away (B2). Every number ships with an uncertainty estimate, and ranks follow the statistics rather than point scores (B3). Integrity checks catch metrics that silently pass, leaked eval data and outputs that try to game the judge before anything is published (B4). The whole protocol is preregistered before the first scored run, and every score traces back to raw artifacts in a published manifest (B5). Fairness and conflict-of-interest rules keep the house method an ordinary entrant that can visibly lose (B6). Item 03 owns what is compared and how the leaderboard looks; this item owns how each number on it is produced and defended.

# Branch B1 Scoring methods and the judge
> Decides how each MVP category is scored, which judge model scores open-ended outputs, and the rubric it scores against.

## T1
branch: B1 Scoring methods and the judge
title: Assign one scoring method to each MVP category
description: For each of the three MVP categories fixed by item 03 T8, record whether it is scored by a deterministic check (for example schema/field match for extraction, hidden unit tests for coding) or by the model judge. Use the judge only for a category with no deterministic check, and state why for each judged category. The resulting table is published on the leaderboard so readers see which method scored what.
done_when: A published table maps each of the 3 MVP categories to exactly one scoring method, with a one-line justification for every judged category.

## T2
branch: B1 Scoring methods and the judge
title: Pick one pinned judge model from a different family than the target model
description: Choose a single judge with a dated snapshot ID available via raw API for the whole MVP run period, from a different model family than the target model picked in item 03 T7, to limit self-preference bias. Record the exact ID, temperature 0 and max output tokens. If no candidate meets these conditions, raise a Question for Lou instead of picking.
done_when: One exact pinned judge ID is recorded with its family, settings and evidence of snapshot availability, or a Question for Lou is raised instead.
sources: [https://arxiv.org/abs/2404.13076, https://arxiv.org/abs/2306.05685]

## T3
branch: B1 Scoring methods and the judge
title: Write an anchored analytic rubric for each judged category
description: For each judged category, write criteria scored 1–5, with a written anchor and one example output for every score point, and an explicit rule that length and formatting are not criteria. The rubric is written before any entrant output is seen (see 14), and the judge prompt embeds it verbatim.
done_when: Each judged category has a versioned rubric file with anchors and an example for all 5 points of every criterion, and a "length is not a criterion" clause.

# Branch B2 Judge bias control and calibration
> Shows the judge agrees with humans, and measures and controls length, position, identity and self-preference effects.

## T4
branch: B2 Judge bias control and calibration
title: Calibrate the judge against two human raters per judged category
description: Sample 60 target-model outputs per judged category, have two humans score them blind with the same rubric, and compute quadratic-weighted Cohen's kappa for human–human and judge–human-mean agreement. The judge is accepted only if judge–human kappa is at least 0.6 and no more than 0.1 below human–human kappa; otherwise raise a Question for Lou before publishing that category.
done_when: A calibration report gives both kappa values per judged category with a pass/fail verdict against the 0.6 and 0.1 thresholds.
sources: [https://arxiv.org/abs/2306.05685]

## T5
branch: B2 Judge bias control and calibration
title: Score judged outputs pointwise and blind to entrant identity
description: The judge scores each output alone against the rubric, never in a pairwise comparison, so position bias does not arise in MVP scoring. Its prompt contains only the original raw task and the output: no entrant name, no rewritten or optimized prompt, and output order shuffled per batch. Pairwise human blind voting (item 03 T12) is outside this leaf.
done_when: The judge prompt template contains only the raw task, rubric and output fields, verified by a test that fails if an entrant name or optimized prompt appears in any rendered judge prompt.

## T6
branch: B2 Judge bias control and calibration
title: Run a verbosity-perturbation test on the judge
description: Take the 60 calibration outputs per judged category, create a padded version of each that adds content-free elaboration without changing substance, and score both versions. Report the mean score shift with a 95% CI; a CI that excludes zero means the judge has measurable length bias in that category.
done_when: A report gives the padded-minus-original mean score shift with a 95% CI for every judged category.
sources: [https://arxiv.org/abs/2404.04475]

## T7
branch: B2 Judge bias control and calibration
title: Publish a length-controlled score next to every judged score
description: Fit a regression of judge score on output-token count (relative to the baseline's output length on the same prompt), in the style of length-controlled AlpacaEval, and publish the length-controlled score beside the raw judged score. Ranking uses the length-controlled score whenever the verbosity test (6) shows bias for that category.
done_when: Scoring code outputs a raw and a length-controlled score per entrant per judged category, and the ranking rule picks between them from the leaf-6 result.
sources: [https://arxiv.org/abs/2404.04475]

# Branch B3 Statistics and uncertainty
> Sampling, confidence intervals, paired comparisons against the baseline, tie rules and whether ~50 prompts per category can resolve real differences.

## T8
branch: B3 Statistics and uncertainty
title: Sample every entrant–prompt pair three times
description: Run each (entrant, prompt) pair 3 times against the target model with the sampling settings fixed in the manifest, and score each sample. The prompt's score is the mean of its 3 samples, which reduces within-prompt variance and lets the report show it.
done_when: The run manifest shows exactly 3 scored samples for every entrant–prompt pair, and the per-prompt score equals their mean.
sources: [https://arxiv.org/abs/2411.00640]

## T9
branch: B3 Statistics and uncertainty
title: Report each entrant's score as a paired delta against the baseline with a 95% CI
description: For each entrant and category, compute the per-prompt difference from the no-optimization baseline on the same prompt, and report its mean with a 95% CI using standard errors clustered by prompt (by source passage where prompts share one). The leaderboard shows the absolute score and this delta with its CI, never a bare point score.
done_when: Scoring code outputs, for every entrant and category, the absolute score with CI and the paired delta vs baseline with a clustered 95% CI, checked against a hand-computed fixture.
sources: [https://arxiv.org/abs/2411.00640]

## T10
branch: B3 Statistics and uncertainty
title: Rank entrants as tied when their paired-difference CI includes zero
description: Within a track and category, two entrants get the same rank unless the 95% CI of their paired per-prompt difference excludes zero. This stops the leaderboard from ordering entrants by noise.
done_when: The ranking function assigns equal ranks to every entrant pair whose paired-difference CI includes zero, verified on a fixture with a known tie.

## T11
branch: B3 Statistics and uncertainty
title: Compute the minimum detectable effect at 50 prompts per category
description: Using pilot variance from the baseline and one other entrant, compute the smallest paired score difference detectable at 80% power and alpha 0.05 with 50 prompts and 3 samples each, per category. Item 03 T9 locked ~50 prompts per category; if the minimum detectable effect exceeds 5 points on a 100-point scale, raise a Question for Lou on eval size instead of changing it.
done_when: A report states the minimum detectable effect per category, and a Question for Lou exists for every category above 5 points.
sources: [https://arxiv.org/abs/2411.00640]

# Branch B4 Integrity checks against silent failure
> Automated guards that catch always-pass metrics, train/test leakage and judge-targeted outputs before scores are published.

## T12
branch: B4 Integrity checks against silent failure
title: Add known-bad fixtures that every metric must fail
description: For each deterministic metric and the judge, build fixtures that must score as failures: an empty output, a refusal, the input copied back, a schema-valid but wrong answer, and an over-long padded wrong answer. These run in the scoring code's test suite on every change, catching metrics that always pass.
done_when: The test suite contains all 5 fixture types for every metric and fails if any fixture scores above the failure threshold.

## T13
branch: B4 Integrity checks against silent failure
title: Block any eval prompt that overlaps training data or submitted prompts
description: Before scoring, check every eval prompt for 13-gram overlap against the Offline training split and against every entrant's submitted or optimized prompt. Any overlap stops the run for that entrant until the eval prompt is replaced or the entrant is disqualified, and the result is logged.
done_when: A pre-scoring check reports zero 13-gram overlaps for every entrant, or the run is halted with the overlapping prompts listed.

## T14
branch: B4 Integrity checks against silent failure
title: Flag outputs that address the judge
description: Scan every judged output for text aimed at the evaluator (for example score requests, "as the grader" phrasing, or rubric text copied in) with a fixed pattern list, and route flagged outputs to a human check before publication. A confirmed judge-targeted output scores as a failure.
done_when: Every judged run has a flag report, and each flagged output has a recorded human verdict before publication.

# Branch B5 Preregistration, transparency and reproducibility
> Freezes the protocol before runs, records every run in a manifest, makes every score explainable, and proves the published numbers reproduce.

## T15
branch: B5 Preregistration, transparency and reproducibility
title: Preregister the scoring protocol with a public tag before the first scored run
description: Freeze the scoring methods (1), judge ID (2), rubrics (3), calibration thresholds (4), statistics plan (8–11) and integrity checks (12–14) in one protocol document, and publish it under a dated git tag before any entrant output is scored. Any later change needs a new protocol version, and scores are always labeled with the version they used.
done_when: A public protocol tag exists whose timestamp precedes the earliest scored run in the manifest, and every published score names its protocol version.

## T16
branch: B5 Preregistration, transparency and reproducibility
title: Define the run manifest schema
description: Specify one JSON schema recording, per scored sample: target and judge model IDs, protocol version, dataset version hash, rubric version, raw task, entrant prompt, sampling settings and seed, raw output, judge prompt and response, input/output tokens, latency and timestamp. Every leaderboard number must be recomputable from manifest rows alone.
done_when: A versioned JSON schema exists with all listed fields, and a validator rejects a manifest missing any of them.

## T17
branch: B5 Preregistration, transparency and reproducibility
title: Link every leaderboard cell to the manifest rows that produced it
description: Each score on the leaderboard (item 03 T10) links to its manifest rows and the computation that aggregated them, so any reader can see inputs, raw outputs, tokens and judge reasoning behind a number. This is a requirement on T10's page spec, not a second leaderboard.
done_when: For 20 randomly chosen leaderboard cells, the linked manifest rows recompute the displayed value exactly.

## T18
branch: B5 Preregistration, transparency and reproducibility
title: Publish the scoring code in a public repo at the protocol tag
description: Release the full scoring code (metrics, judge prompts, statistics, integrity checks) publicly at the same tag as the preregistered protocol, under the license item 08 chooses, or Apache-2.0 if item 08 has not decided by release. Anyone can then rerun scoring on the published manifest.
done_when: A public repo contains the scoring code at the protocol tag, and running it on the published manifest reproduces the leaderboard numbers.

## T19
branch: B5 Preregistration, transparency and reproducibility
title: Re-run a random 10% sample of each published run to confirm reproducibility
description: After each published run, re-execute a random 10% of entrant–prompt pairs from the manifest with identical settings, and compare scores. Report the share of re-run per-prompt scores falling inside the original 95% CI, and flag the run if under 90%.
done_when: Each published run has a reproduction report with the in-CI share and a pass/fail flag at the 90% threshold.

# Branch B6 Fairness and conflict of interest
> Cost reporting for every optimizer, the house method's conflict-of-interest rules, and the path for outside submissions.

## T20
branch: B6 Fairness and conflict of interest
title: Record each optimizer's own optimization cost in the manifest
description: For every entrant, log the tokens, dollars and wall-clock time it spent producing its prompt: total optimization spend for Offline entrants, per-rewrite spend for Runtime entrants. These sit beside quality, target input/output tokens and latency in the published results, so a cheap optimizer is not hidden behind an expensive one.
done_when: The manifest holds optimization tokens, dollars and wall-clock time for every entrant, and the results table shows them next to quality, tokens and latency.

## T21
branch: B6 Fairness and conflict of interest
title: Publish the house-method conflict-of-interest policy
description: State publicly that the house method is one named, labeled entrant, runs through the identical pipeline and protocol version, is never the page headline or default sort, and its results are published even when it loses. The policy also discloses that the arena operator built the house method.
done_when: A published policy page contains all four rules and the authorship disclosure, linked from the leaderboard.

## T22
branch: B6 Fairness and conflict of interest
title: Score one outside submission end-to-end through the public pipeline
description: Using the entry contracts from item 03 T1 and T2, document how a third party submits an optimizer, then run one real or test outside submission through the same protocol and publish its result like any other entrant. This proves outside entrants are scored identically.
done_when: A submission guide is published, and one outside submission appears in the manifest scored under the current protocol version.
