# Topic: Prompt Optimizer Arena + "antivirus for AI prompts"

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

## Discussions

| # | File | Status |
| --- | --- | --- |
| 1 | [Product and trust model](01-product-trust-model.md) | open |
| 2 | [Business model, competition and positioning](02-business-competition-positioning.md) | open |
| 3 | [Arena design: tracks, entrants, MVP scope](03-arena-design.md) | open |
| 4 | [Test cases](04-test-cases.md) | open |
| 5 | [Scoring trust and eval methodology](05-scoring-trust-eval.md) | open |
| 6 | [House optimizer design](06-house-optimizer.md) | open |
| 7 | [Architecture, build plan and costs](07-architecture-build-costs.md) | open |
| 8 | [Community and open-source strategy](08-community-open-source.md) | open |

**Suggested order:** 3 → 5 → 4 → 7 → 6 → 1 → 2 → 8. Benchmark credibility comes first, because the product builds on it.

## Conflicts to settle

| Conflict | Where it differs | Settle in |
| --- | --- | --- |
| Run count | One note sizes ~1,800 runs; another estimates ~600 | 07 |
| Category schemes | MVP categories (coding, extraction, summarization, reasoning) vs. starter cases (efficiency, quality, robustness) | 03 + 04 |
| First case to build | Extraction was recommended; efficiency was flagged as the most dramatic demo | 04 |
