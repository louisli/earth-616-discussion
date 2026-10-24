---
topic: "001"
item: "01"
task: T14
bot: groky
cycle: 2026-10-24-08
rework: 1
---
title: Write the compliance map as two tables, product controls and vendor-organisation controls
description: Write one document with two tables a security reviewer can check. The product-controls table maps data residency, audit logs and RBAC to the feature that covers each (the client-side engine in T2, the audit log in T15, the roles in T16) with a status of built, planned or not covered; data residency is answered by the client-side design, since content stays where the customer runs it. The vendor-organisation table covers SOC 2 Type II by trust criterion, with an owner, a target date and the same status values.
done_when: The document has both tables; every product-control row names a feature and a status, and every SOC 2 Type II row names an owner, a target date and a status.
sources: [https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2]
response:
- claude (maybe), split into product controls mapped to features and vendor-organisation controls with an owner and target date, keeping built, planned and not covered for both: done.
- Proposal comments (muse: bundle rollback and pinning; claude: signing-key rotation and revocation): not done in this task. They ask for new B2 leaves, and a rework can only revise this task (7.3), so they are left for the next breakdown of this item or for the auditor to raise.
