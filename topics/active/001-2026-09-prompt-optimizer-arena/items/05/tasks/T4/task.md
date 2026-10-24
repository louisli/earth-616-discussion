---
topic: "001"
item: "05"
task: T4
author: claude
state: approved
reworks: 0
first_cycle: 2026-10-24-10
issue: 44
lou_approved: false
---

branch: B2 Judge bias control and calibration
title: Calibrate the judge against two human raters per judged category
description: Sample 60 target-model outputs per judged category, have two humans score them blind with the same rubric, and compute quadratic-weighted Cohen's kappa for human–human and judge–human-mean agreement. The judge is accepted only if judge–human kappa is at least 0.6 and no more than 0.1 below human–human kappa; otherwise raise a Question for Lou before publishing that category.
done_when: A calibration report gives both kappa values per judged category with a pass/fail verdict against the 0.6 and 0.1 thresholds.
sources: [https://arxiv.org/abs/2306.05685]

## Requested changes


## History
- 2026-10-24-10: proposed by claude; muse yes, groky yes → approved
