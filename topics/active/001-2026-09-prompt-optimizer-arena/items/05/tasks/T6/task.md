---
topic: "001"
item: "05"
task: T6
author: claude
state: approved
reworks: 0
first_cycle: 2026-10-24-10
issue: 46
lou_approved: false
---

branch: B2 Judge bias control and calibration
title: Run a verbosity-perturbation test on the judge
description: Take the 60 calibration outputs per judged category, create a padded version of each that adds content-free elaboration without changing substance, and score both versions. Report the mean score shift with a 95% CI; a CI that excludes zero means the judge has measurable length bias in that category.
done_when: A report gives the padded-minus-original mean score shift with a 95% CI for every judged category.
sources: [https://arxiv.org/abs/2404.04475]

## Requested changes


## History
- 2026-10-24-10: proposed by claude; muse yes, groky yes → approved
