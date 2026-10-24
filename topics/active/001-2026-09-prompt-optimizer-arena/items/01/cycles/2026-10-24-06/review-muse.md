---
topic: "001"
item: "01"
bot: muse
cycle: 2026-10-24-06
---
## Proposal
comment: The tree covers the trust story well, but B2 has no leaf for rolling back or pinning a bad definitions bundle — antivirus-style updates need a staged rollout and rollback path, or a faulty bundle breaks every client at once.

## T1
vote: yes
reason: One spec, one checkable field list, and default-forbidden is the right boundary a security reviewer can sign against.

## T2
vote: yes
reason: Settles the starting question for the airtight client-side version, consistent with the Already decided antivirus model; no network at scan time is testable from the data-flow diagram.

## T3
vote: yes
reason: Zero retention as the default with a findings schema holding no prompt text is atomic and pass/fail checkable.

## T4
vote: yes
reason: Per-rule hit counts only, off by default and opt-in, feeds definition quality without revealing content.

## T5
vote: yes
reason: Signed, versioned bundle with named rule fields and rejection on a bad signature is a single buildable spec.

## T6
vote: yes
reason: Air-gapped import with the same signature check is essential for banks and hospitals and is one clear deliverable.

## T7
vote: maybe
reason: The five anti-pattern rules belong together as one bucket file, but existence alone does not show a rule works.
changes: Require each rule to be tested against at least one positive and one negative sample, as T9 already requires, and add that to done_when.

## T8
vote: maybe
reason: The three efficiency patterns are one bucket, but the token-saving estimates have no stated basis, so the "cut token spend 15%" claim stays unverifiable.
changes: State how each rule's token saving is estimated or measured (baseline and method) and require that method in done_when.

## T9
vote: yes
reason: Covers credentials, PII and internal identifiers with a positive and a negative sample per rule, so the done_when is a real test.

## T10
vote: yes
reason: Four templates, one per named task type, each listing its required fields — a single knowledge-base deliverable other buckets can point to.

## T11
vote: yes
reason: Correctly maps the client fill-in-the-blank template to the best-practice templates bucket and keeps it in the client's private knowledge base, per Already decided.

## T12
vote: maybe
reason: A container plus Helm chart suits Kubernetes teams, but no decision in the topic README limits self-hosting to Kubernetes, and many bank and hospital estates are not K8s-only.
changes: Either add a non-Kubernetes install path (for example a VM or single-binary install) or state explicitly that Helm is the first supported path and record the exclusion as a decision for Lou.

## T13
vote: yes
reason: One adoption metric with a 30-minute target and a planted-secret sample set that guarantees a first finding is clear and checkable.

## T14
vote: yes
reason: One map table covering SOC 2, data residency, audit logs and RBAC with an honest built/planned/not-covered status, mapped before pitching as the starting points require.

## T15
vote: yes
reason: Local audit log with named fields and no prompt content is atomic and satisfies the compliance ask without breaking the data boundary.

## T16
vote: yes
reason: Three named roles with a permission matrix over every console action is a single, testable RBAC spec.

## T17
vote: yes
reason: One-pager leads with leakage detection, uses the agreed pitch line, and points to the data-boundary spec and compliance map as proof; pricing correctly stays with item 02.
