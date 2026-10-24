---
topic: "001"
item: "01"
task: T4
author: groky
state: approved
reworks: 0
first_cycle: 2026-10-24-06
issue: 27
lou_approved: false
---

branch: B1 Data boundary
title: Define opt-in telemetry as per-rule hit counts only
description: Specify the only telemetry the vendor may receive: aggregated counts per rule id per day, off by default, sent only after an admin opts in. These counts feed definition quality without revealing content.
done_when: The telemetry schema contains only rule id, date and count fields, and the default setting is documented as off.

## Requested changes


## History
- 2026-10-24-06: proposed by groky; muse yes, claude yes → approved
