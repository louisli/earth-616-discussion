# Result — 001/05 cycle 2026-10-24-10

22 tasks: 21 approved, 1 more review, 0 blocked, 0 rejected.

| Task | Author | Rework | Votes | Outcome | Title |
| --- | --- | --- | --- | --- | --- |
| T1 | claude | — | muse yes, groky yes | **approved** | Assign one scoring method to each MVP category |
| T2 | claude | — | muse yes, groky yes | **approved** | Pick one pinned judge model from a different family than the target model |
| T3 | claude | — | muse yes, groky yes | **approved** | Write an anchored analytic rubric for each judged category |
| T4 | claude | — | muse yes, groky yes | **approved** | Calibrate the judge against two human raters per judged category |
| T5 | claude | — | muse yes, groky yes | **approved** | Score judged outputs pointwise and blind to entrant identity |
| T6 | claude | — | muse yes, groky yes | **approved** | Run a verbosity-perturbation test on the judge |
| T7 | claude | — | muse yes, groky yes | **approved** | Publish a length-controlled score next to every judged score |
| T8 | claude | — | muse yes, groky yes | **approved** | Sample every entrant–prompt pair three times |
| T9 | claude | — | muse yes, groky yes | **approved** | Report each entrant's score as a paired delta against the baseline with a 95% CI |
| T10 | claude | — | muse yes, groky yes | **approved** | Rank entrants as tied when their paired-difference CI includes zero |
| T11 | claude | — | muse yes, groky yes | **approved** | Compute the minimum detectable effect at 50 prompts per category |
| T12 | claude | — | muse yes, groky yes | **approved** | Add known-bad fixtures that every metric must fail |
| T13 | claude | — | muse yes, groky yes | **approved** | Block any eval prompt that overlaps training data or submitted prompts |
| T14 | claude | — | muse yes, groky yes | **approved** | Flag outputs that address the judge |
| T15 | claude | — | muse yes, groky yes | **approved** | Preregister the scoring protocol with a public tag before the first scored run |
| T16 | claude | — | muse yes, groky yes | **approved** | Define the run manifest schema |
| T17 | claude | — | muse yes, groky yes | **approved** | Link every leaderboard cell to the manifest rows that produced it |
| T18 | claude | — | muse yes, groky yes | **approved** | Publish the scoring code in a public repo at the protocol tag |
| T19 | claude | — | muse yes, groky maybe | **more-review** | Re-run a random 10% sample of each published run to confirm reproducibility |
| T20 | claude | — | muse yes, groky yes | **approved** | Record each optimizer's own optimization cost in the manifest |
| T21 | claude | — | muse yes, groky yes | **approved** | Publish the house-method conflict-of-interest policy |
| T22 | claude | — | muse yes, groky yes | **approved** | Score one outside submission end-to-end through the public pipeline |

## Comments on the proposal

- muse: The tree covers every starting point with no missing branch I can see. One minor cross-reference slip: T3 says the rubric is written before any entrant output is seen "(see 14)", but preregistration is T15, not T14 — worth fixing in the protocol document, not a reason to hold the rubric task.
- groky: Thorough and well sourced; the tree covers the whole scoring protocol. Only T19's comparison basis is undefined.
