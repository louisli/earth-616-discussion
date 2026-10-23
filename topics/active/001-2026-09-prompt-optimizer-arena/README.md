# [001] Prompt Optimizer Arena + "antivirus for AI prompts"

**Goal:** decide what to build for a public prompt-optimizer benchmark and the enterprise "antivirus for AI prompts" product it feeds, down to buildable tasks.

Two linked ideas:

1. **Prompt Optimizer Arena.** A public, open benchmark that runs the same raw prompts through different optimizers: a house method, commercial "improve my prompt" tools, and open-source optimizers. All are scored on one fixed target model, eval set and judge. It includes a public leaderboard and blind human voting.
2. **Enterprise product.** An "antivirus for AI prompts" for security-conscious organizations. Central definitions push down to clients; client data never goes up.

The arena builds credibility and community and feeds R&D into the product.

## Already decided

These are constraints, so don't reopen them.

- **Antivirus model:** a central definitions database built from open and public sources is pushed down to clients. Each client's private knowledge base stays with that client.
- **Pricing path:** self-hosted licensing first; usage-based pricing later, leading to a hybrid.
- **Benchmark role:** the open benchmark doubles as R&D for the paid product.
- **Measurement:** all benchmark runs go through raw model APIs, never chat apps or consumer subscriptions.

## Out of scope

- Building anything. This topic produces agreed plans only; the planner turns them into work.
- Personal or employer-related considerations of the topic owner.

## Seeds

| # | Seed | Depends on |
| --- | --- | --- |
| 1 | [Product and trust model](seeds/01-product-trust-model.md) | — |
| 2 | [Business model, competition and positioning](seeds/02-business-competition-positioning.md) | 01 |
| 3 | [Arena design: tracks, entrants, MVP scope](seeds/03-arena-design.md) | — |
| 4 | [Test cases](seeds/04-test-cases.md) | 03 |
| 5 | [Scoring trust and eval methodology](seeds/05-scoring-trust-eval.md) | 03 |
| 6 | [House optimizer design](seeds/06-house-optimizer.md) | 05 |
| 7 | [Architecture, build plan and costs](seeds/07-architecture-build-costs.md) | 04, 05 |
| 8 | [Community and open-source strategy](seeds/08-community-open-source.md) | 02 |

**Priority** (set in each seed, 1 = first): 03 → 05 → 04 → 07 → 06 → 01 → 02 → 08. Benchmark credibility comes first, because the product builds on it.

## Conflicts to settle

| Conflict | Where it differs | Settle in |
| --- | --- | --- |
| Run count | One note sizes ~1,800 runs; another estimates ~600 | 07 |
| Category schemes | MVP categories (coding, extraction, summarization, reasoning) vs. starter cases (efficiency, quality, robustness) | 03 + 04 |
| First case to build | Extraction was recommended; efficiency was flagged as the most dramatic demo | 04 |
