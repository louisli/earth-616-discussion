---
topic: "001"
item: "05"
bot: muse
cycle: 2026-10-24-10
---
## Proposal
comment: The tree covers every starting point with no missing branch I can see. One minor cross-reference slip: T3 says the rubric is written before any entrant output is seen "(see 14)", but preregistration is T15, not T14 — worth fixing in the protocol document, not a reason to hold the rubric task.

## T1
vote: yes
reason: One published table mapping each of the 3 MVP categories to exactly one method, with justification for judged categories, is atomic and pass/fail checkable.

## T2
vote: yes
reason: One pinned judge ID from a different family than the target, with settings and availability evidence, and a Question for Lou fallback if no candidate qualifies.

## T3
vote: yes
reason: Anchors and an example for all 5 points of every criterion plus the "length is not a criterion" clause make the rubric concrete and testable.

## T4
vote: yes
reason: Fixed sample size, two blind human raters, and explicit kappa pass/fail thresholds (0.6 and within 0.1) with a Question for Lou on failure.

## T5
vote: yes
reason: Pointwise, identity-blind judging with a prompt template test that fails if an entrant name or optimized prompt leaks in is a checkable control for position and identity bias.

## T6
vote: yes
reason: The padded-vs-original comparison reports a mean shift with a 95% CI per judged category, so length bias is measured rather than assumed.

## T7
vote: yes
reason: Raw and length-controlled scores are both output, and the ranking rule for choosing between them is tied to the T6 result.

## T8
vote: yes
reason: Exactly 3 scored samples per entrant–prompt pair in the manifest, with the per-prompt score defined as their mean, is verifiable.

## T9
vote: yes
reason: Paired per-prompt deltas against the baseline with prompt-clustered 95% CIs, checked against a hand-computed fixture, meet the no-bare-point-scores requirement.

## T10
vote: yes
reason: Equal ranks whenever the paired-difference CI includes zero is a clear, fixture-verifiable tie rule that stops ordering by noise.

## T11
vote: yes
reason: The minimum detectable effect is computed at stated power and alpha, and the size question is correctly escalated to Lou instead of silently changing the locked ~50 prompts.

## T12
vote: yes
reason: All 5 known-bad fixture types for every metric, with the suite failing if any scores above the failure threshold, directly catches always-pass metrics.

## T13
vote: yes
reason: A pre-scoring 13-gram overlap check against both the training split and submitted prompts, halting the run on any hit, is a concrete leakage gate.

## T14
vote: yes
reason: Fixed-pattern flagging plus a recorded human verdict before publication, with confirmed judge-targeted outputs scored as failures, is testable and proportionate.

## T15
vote: yes
reason: A public protocol tag timestamped before the earliest scored run, covering methods through integrity checks, with version-labeled scores, satisfies preregistration.

## T16
vote: yes
reason: The manifest schema lists every field needed to recompute a score and a validator rejects any manifest missing one.

## T17
vote: yes
reason: Linking each leaderboard cell to its manifest rows, verified by exact recomputation on 20 random cells, makes every score explainable without building a second leaderboard.

## T18
vote: yes
reason: Scoring code published at the protocol tag with a license fallback, reproducing the leaderboard from the published manifest, delivers the open-source transparency requirement.

## T19
vote: yes
reason: Re-running a random 10% sample and reporting the in-CI share against a 90% flag threshold is a defined, pass/fail reproducibility check.

## T20
vote: yes
reason: Optimization tokens, dollars and wall-clock time per entrant in the manifest, shown beside quality, tokens and latency, covers the fairness cost-reporting rule.

## T21
vote: yes
reason: The published policy contains all four house-method rules plus the authorship disclosure, linked from the leaderboard.

## T22
vote: yes
reason: A published submission guide plus one outside submission scored in the manifest under the current protocol version proves outside entrants go through the identical pipeline.
