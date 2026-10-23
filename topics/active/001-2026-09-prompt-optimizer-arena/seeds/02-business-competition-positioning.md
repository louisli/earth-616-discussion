---
topic: "001"
title: Business model, competition and positioning
status: seed
priority: 7
depends_on: ["01"]
updated: 2026-10-22
---

# Business model, competition and positioning

**Goal:** Confirm where the product fits in the market and how it makes money over time.

## Discussion points

- [ ] Hybrid path: what triggers the move from self-hosted licensing (per seat or deployment, plus a recurring definitions fee) to usage-based tiers (per prompt, token or run)
- [ ] Competitor deep dive, prompt management and observability: Langfuse, LangSmith, PromptLayer, Maxim AI, Braintrust, Agenta, Arize Phoenix, Humanloop, TrueFoundry, Vellum
- [ ] Closest philosophically: Promptfoo (local, open-source CLI, but a developer testing tool, not a managed definitions service)
- [ ] Benchmark competitors: BenchLM (one-off, 12 synthetic cases) and Comet Opik (its own algorithms only). Does anyone run an ongoing public cross-vendor optimizer leaderboard?
- [ ] Gap: nobody offers a continuously updated definitions database that pushes optimizations, combined with leakage detection
- [ ] Moat: quality and update cadence of the definitions database
- [ ] Threat: incumbents with distribution bolting on an optimization feature
- [ ] How much optimization AI vendors already do at the API level vs. the chat-app level (the API does little, which is the opening; verify)
- [ ] Positioning: not "just another prompt manager," and credible rather than self-promotional
