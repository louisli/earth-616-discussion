---
topic: "001"
item: "05"
task: T12
author: claude
state: approved
reworks: 0
first_cycle: 2026-10-24-10
issue: 52
lou_approved: false
---

branch: B4 Integrity checks against silent failure
title: Add known-bad fixtures that every metric must fail
description: For each deterministic metric and the judge, build fixtures that must score as failures: an empty output, a refusal, the input copied back, a schema-valid but wrong answer, and an over-long padded wrong answer. These run in the scoring code's test suite on every change, catching metrics that always pass.
done_when: The test suite contains all 5 fixture types for every metric and fails if any fixture scores above the failure threshold.

## Requested changes


## History
- 2026-10-24-10: proposed by claude; muse yes, groky yes → approved
