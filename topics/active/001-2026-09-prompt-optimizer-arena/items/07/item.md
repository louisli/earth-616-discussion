---
topic: "001"
item: "07"
title: Architecture, build plan and costs
priority: 4
depends_on:
  - "04"
  - "05"
next_task: 1
bot_errors: {}
dead_locks: {}
---

# 07 Architecture, build plan and costs

**Goal:** Agree on the system shape, the build order and a realistic run budget. This is a web app only, with no mobile client.

## Starting points
- Frontend: landing and explainer, public leaderboard by category, submission interface
- Backend API: submissions, run queue, user accounts, leaderboard data
- Benchmark runner: an isolated service with separate API keys that captures outputs and token counts, keeping a hard line between the AI that builds the app and the models being measured
- Scoring engine: ground truth (quality), token counting (efficiency), accuracy on messy inputs (robustness)
- Database: test cases and ground truth, submissions, raw run results, leaderboard
- Harness output: versioned, exportable results
- Build order: DB schema → runner and scoring for one case end to end → backend → frontend last
- Set up direct API accounts and billing for benchmark runs (Anthropic, OpenAI, others)
- Verify current API pricing before budgeting; use cache reads and Batch API to cut cost
- Run count: ~1,800 vs. ~600 runs. Settle which sizing is right.
- Budget: ~$20–50 per full pass across 3 models, a few hundred dollars during development (to recheck)
- Live-run cost controls: cached results or bring-your-own-key
- Privacy notice: tell users plainly what happens to submitted prompts

## Tasks
<!-- Every task of this item and its state. Don't propose duplicates of approved or exported ones. -->


## Cycles

