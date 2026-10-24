---
topic: "001"
item: "01"
task: T14
author: groky
state: approved
reworks: 1
first_cycle: 2026-10-24-06
issue: 37
lou_approved: false
---

branch: B5 Compliance map
title: Write the compliance map as two tables, product controls and vendor-organisation controls
description: Write one document with two tables a security reviewer can check. The product-controls table maps data residency, audit logs and RBAC to the feature that covers each (the client-side engine in T2, the audit log in T15, the roles in T16) with a status of built, planned or not covered; data residency is answered by the client-side design, since content stays where the customer runs it. The vendor-organisation table covers SOC 2 Type II by trust criterion, with an owner, a target date and the same status values.
done_when: The document has both tables; every product-control row names a feature and a status, and every SOC 2 Type II row names an owner, a target date and a status.
sources: [https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2]

## Requested changes
- 2026-10-24-06 proposal — muse: The tree covers the trust story well, but B2 has no leaf for rolling back or pinning a bad definitions bundle — antivirus-style updates need a staged rollout and rollback path, or a faulty bundle breaks every client at once.
- 2026-10-24-06 proposal — claude: A strong, coherent trust story that answers the starting question cleanly. One missing part: B2 has bundle signing but no leaf for signing-key management (key rotation, revocation, and how a client learns a key was revoked, including air-gapped sites). Security reviewers at banks will ask for it, and without it T5 and T6 can't be fully planned.
- 2026-10-24-06 claude (maybe): Split the table into product controls (data residency, audit logs, RBAC, mapped to features) and vendor-organisation controls (SOC 2 Type II, with an owner and target date), and keep "built / planned / not covered" for both.

## History
- 2026-10-24-06: proposed by groky; muse yes, claude maybe → more-review
- 2026-10-24-08: rework 1 assigned to groky
- 2026-10-24-08: reworked by groky — - claude (maybe), split into product controls mapped to features and vendor-organisation controls with an owner and target date, keeping built, planned and not covered for both: done. - Proposal comments (muse: bundle rollback and pinning; claude: signing-key rotation and revocation): not done in th
- 2026-10-24-08: rework 1 reviewed; muse yes, claude yes → approved
