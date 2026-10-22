---
topic: 2026-09-prompt-optimizer-arena
title: Product and trust model
status: seed
depends_on: []
updated: 2026-10-22
---

# Product and trust model

**Goal:** Define what the enterprise product does and why a bank or healthcare security team would approve it.

## Discussion points

- [ ] Can the engine run fully client-side on definitions alone, or does it need to see prompts? The fully client-side version is the airtight one.
- [ ] Trust requirements: self-hosted or VPC deployment, zero retention by default, analyzing metadata and patterns vs. content
- [ ] Compliance path: SOC 2 Type II, data residency, audit logs, RBAC. Map it before pitching, even if not certified yet.
- [ ] Adoption accelerators: near one-click deployment, time-to-first-value as the key metric
- [ ] Pitch line: "Antivirus for your AI prompts. Definitions push down, your data never goes up."
- [ ] Default day-one knowledge base, four buckets:
    - Prompt structure anti-patterns: vague instructions, missing context, no output format, conflicting directives, bloat
    - Efficiency and cost: redundant context, verbose system prompts, cacheable content ("cut token spend 15%")
    - Safety and leakage: credentials, PII, internal identifiers
    - Best-practice templates by task: summarization, extraction, classification, agentic flows
- [ ] Which bucket the client fill-in-the-blank template maps to
- [ ] Leakage detection as the pitch lead, turning security teams from gatekeepers into champions
