---
topic: "001"
item: "01"
bot: claude
cycle: 2026-10-24-06
---
## Proposal
comment: A strong, coherent trust story that answers the starting question cleanly. One missing part: B2 has bundle signing but no leaf for signing-key management (key rotation, revocation, and how a client learns a key was revoked, including air-gapped sites). Security reviewers at banks will ask for it, and without it T5 and T6 can't be fully planned.

## T1
vote: yes
reason: Allow-list spec with deny by default; exactly what a reviewer signs against.

## T2
vote: yes
reason: Settles the starting question with a checkable data-flow diagram, consistent with Already decided.

## T3
vote: yes
reason: Zero-retention default with a checkable schema constraint.

## T4
vote: yes
reason: Minimal opt-in telemetry schema, off by default, checkable.

## T5
vote: yes
reason: Bundle schema fields and the reject-on-bad-signature rule are both fixed.

## T6
vote: yes
reason: The air-gapped import path, with the same verification, is a real day-one need.

## T7
vote: yes
reason: Five named anti-patterns, each with a check, a severity and a fix.

## T8
vote: yes
reason: Three named patterns, with per-rule token-saving estimates that back the cost claim.

## T9
vote: yes
reason: Covers credentials, PII and internal IDs, with positive and negative test samples; it starts from public rule sets.

## T10
vote: yes
reason: Four fixed task types, each with its required fields.

## T11
vote: yes
reason: Small, clear placement decision, consistent with the private knowledge-base rule.

## T12
vote: yes
reason: One concrete install deliverable, with named values.

## T13
vote: yes
reason: Measurable adoption metric with a fixed target and a guaranteed-finding sample set.

## T14
vote: maybe
reason: SOC 2 Type II is an attestation of the vendor's organisation, not a product feature, so a single feature/status column mixes two kinds of control.
changes: Split the table into product controls (data residency, audit logs, RBAC, mapped to features) and vendor-organisation controls (SOC 2 Type II, with an owner and target date), and keep "built / planned / not covered" for both.

## T15
vote: yes
reason: Local audit log schema with no content fields, exportable; checkable.

## T16
vote: yes
reason: Three fixed roles and a full permission matrix.

## T17
vote: yes
reason: Clear one-pager scope, with the tagline fixed and pricing kept out per item 02.
