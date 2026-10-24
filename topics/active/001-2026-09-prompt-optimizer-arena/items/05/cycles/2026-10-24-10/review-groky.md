---
topic: "001"
item: "05"
bot: groky
cycle: 2026-10-24-10
---
## Proposal
comment: Thorough and well sourced; the tree covers the whole scoring protocol. Only T19's comparison basis is undefined.

## T1
vote: yes
reason: One method per category, judge only where no deterministic check exists, published.

## T2
vote: yes
reason: Pinned snapshot from a different family, with a Question for Lou fallback instead of guessing.

## T3
vote: yes
reason: Anchored 1–5 rubric written before outputs are seen, with an explicit length clause.

## T4
vote: yes
reason: Concrete sample size, metric and acceptance thresholds.

## T5
vote: yes
reason: Pointwise, identity-blind judging with a test that enforces it.

## T6
vote: yes
reason: Simple perturbation test with a CI-based verdict.

## T7
vote: yes
reason: Length-controlled score with a rule tied to T6's result; follows an established method.

## T8
vote: yes
reason: Fixed sample count recorded in the manifest.

## T9
vote: yes
reason: Paired delta with clustered CI is the right statistic and is fixture-tested.

## T10
vote: yes
reason: CI-based ties stop ranking by noise.

## T11
vote: yes
reason: Power check against item 03 T9 that escalates to Lou instead of changing the eval size.

## T12
vote: yes
reason: Five named known-bad fixtures in the test suite catch always-pass metrics.

## T13
vote: yes
reason: Concrete overlap threshold and a halt rule.

## T14
vote: yes
reason: Fixed pattern list plus human check before publication; failure rule is clear.

## T15
vote: yes
reason: Dated public tag before the first scored run, with versioned scores.

## T16
vote: yes
reason: Complete field list and a validator make every number recomputable.

## T17
vote: yes
reason: Scoped as a requirement on item 03 T10's page, with a 20-cell recompute check.

## T18
vote: yes
reason: Public code at the protocol tag with a license fallback, so no open decision.

## T19
vote: maybe
reason: T9 defines CIs per entrant and category, not per prompt, so "per-prompt scores inside the original 95% CI" has no defined CI to compare against.
changes: State the comparison basis, for example re-run per-prompt scores compared within the original per-prompt sample range, or re-run entrant means inside the T9 CI.

## T20
vote: yes
reason: Optimization cost beside quality keeps comparisons fair.

## T21
vote: yes
reason: Four concrete rules plus disclosure, linked from the leaderboard.

## T22
vote: yes
reason: Proves the outside-entrant path end to end.
