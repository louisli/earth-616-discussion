---
topic: "001"
item: "05"
task: T19
author: claude
state: more-review
reworks: 0
first_cycle: 2026-10-24-10
issue: 59
lou_approved: false
---

branch: B5 Preregistration, transparency and reproducibility
title: Re-run a random 10% sample of each published run to confirm reproducibility
description: After each published run, re-execute a random 10% of entrant–prompt pairs from the manifest with identical settings, and compare scores. Report the share of re-run per-prompt scores falling inside the original 95% CI, and flag the run if under 90%.
done_when: Each published run has a reproduction report with the in-CI share and a pass/fail flag at the 90% threshold.

## Requested changes
- 2026-10-24-10 proposal — muse: The tree covers every starting point with no missing branch I can see. One minor cross-reference slip: T3 says the rubric is written before any entrant output is seen "(see 14)", but preregistration is T15, not T14 — worth fixing in the protocol document, not a reason to hold the rubric task.
- 2026-10-24-10 proposal — groky: Thorough and well sourced; the tree covers the whole scoring protocol. Only T19's comparison basis is undefined.
- 2026-10-24-10 groky (maybe): State the comparison basis, for example re-run per-prompt scores compared within the original per-prompt sample range, or re-run entrant means inside the T9 CI.

## History
- 2026-10-24-10: proposed by claude; muse yes, groky maybe → more-review
