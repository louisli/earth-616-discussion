---
topic: "001"
item: "01"
task: T14
author: groky
state: more-review
reworks: 0
first_cycle: 2026-10-24-06
issue: 37
lou_approved: false
---

branch: B5 Compliance map
title: Write the compliance map table from control to feature and status
description: Write a table mapping each control a security reviewer asks about (SOC 2 Type II trust criteria, data residency, audit logs, RBAC) to the product feature that covers it and its status (built, planned, not covered). Data residency is answered by the client-side design, since content stays where the customer runs it.
done_when: The table covers all four control areas, and every row names a feature and a status.
sources: [https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2]

## Requested changes
- 2026-10-24-06 proposal — muse: The tree covers the trust story well, but B2 has no leaf for rolling back or pinning a bad definitions bundle — antivirus-style updates need a staged rollout and rollback path, or a faulty bundle breaks every client at once.
- 2026-10-24-06 proposal — claude: A strong, coherent trust story that answers the starting question cleanly. One missing part: B2 has bundle signing but no leaf for signing-key management (key rotation, revocation, and how a client learns a key was revoked, including air-gapped sites). Security reviewers at banks will ask for it, and without it T5 and T6 can't be fully planned.
- 2026-10-24-06 claude (maybe): Split the table into product controls (data residency, audit logs, RBAC, mapped to features) and vendor-organisation controls (SOC 2 Type II, with an owner and target date), and keep "built / planned / not covered" for both.

## History
- 2026-10-24-06: proposed by groky; muse yes, claude maybe → more-review
