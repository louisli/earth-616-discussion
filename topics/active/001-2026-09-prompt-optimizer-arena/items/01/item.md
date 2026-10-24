---
bot_errors: {}
dead_locks: {}
next_task: 18
topic: "001"
item: "01"
title: Product and trust model
priority: 6
depends_on: []
---

# 01 Product and trust model

**Goal:** Define what the enterprise product does and why a bank or healthcare security team would approve it.

## Starting points
- Can the engine run fully client-side on definitions alone, or does it need to see prompts? The fully client-side version is the airtight one.
- Trust requirements: self-hosted or VPC deployment, zero retention by default, analyzing metadata and patterns vs. content
- Compliance path: SOC 2 Type II, data residency, audit logs, RBAC. Map it before pitching, even if not certified yet.
- Adoption accelerators: near one-click deployment, time-to-first-value as the key metric
- Pitch line: "Antivirus for your AI prompts. Definitions push down, your data never goes up."
- Default day-one knowledge base, four buckets: Prompt structure anti-patterns: vague instructions, missing context, no output format, conflicting directives, bloat; Efficiency and cost: redundant context, verbose system prompts, cacheable content ("cut token spend 15%"); Safety and leakage: credentials, PII, internal identifiers; Best-practice templates by task: summarization, extraction, classification, agentic flows
- Which bucket the client fill-in-the-blank template maps to
- Leakage detection as the pitch lead, turning security teams from gatekeepers into champions

## Concept
The enterprise product is a prompt scanner that runs entirely inside the customer's environment, like antivirus: a signed definitions bundle, built centrally from open and public sources, is pulled down to the client, and the engine checks prompts against it locally, so prompt content never leaves the customer. The answer to the starting question is yes, the engine runs fully client-side on definitions alone; the vendor never sees prompts. The branches fit together as the trust story a bank or healthcare security team would sign off on: a hard data boundary (B1), a definitions pipeline that only flows down (B2), a day-one knowledge base in four buckets (B3), deployment that gets to a first finding fast (B4), a compliance map they can check (B5), and a pitch that leads with leakage detection (B6).

- **B1 Data boundary:** What may and may not cross from the customer to the vendor, and how the engine works without seeing anything centrally.
- **B2 Definitions pipeline:** The format and delivery of the central definitions that are pushed down to clients, including air-gapped sites.
- **B3 Day-one knowledge base:** The rules shipped on day one, in the four agreed buckets, plus where the client's own fill-in-the-blank template fits.
- **B4 Deployment and adoption:** How a security team installs the product in its own environment and how fast it shows value.
- **B5 Compliance map:** The controls an approving security team checks (SOC 2 Type II, data residency, audit logs, RBAC), mapped to product features before any certification.
- **B6 Security-team pitch:** The message that turns the security team from gatekeeper into champion, led by leakage detection.

_From groky's proposal, cycle 2026-10-24-06._

## Tasks
<!-- Every task of this item and its state. Don't propose duplicates of approved or exported ones. -->


## Cycles

