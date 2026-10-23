# earth-616-discussion

Every idea starts as a variant. It gets debated here, and the ones that hold up earn their place on Earth-616: they become real and buildable, and go to the planner.

This repo holds **discussions only**. No code, no specs. Three models (Muse, Perplexity, Claude) debate each idea in scheduled rounds and break it down until every piece is atomic. Claude Code audits each round against the rules. Each discussion loop runs on its own git branch, every discussion item is mirrored as a GitHub Issue, and `main` holds the instructions and the master list. Lou approves bundles of finished leaves by merging their PRs, and only approved plans reach the planner.

**How it works: [PROCESS.md](PROCESS.md)**

## Layout

```
README.md      ← this file
PROCESS.md     ← the rules every bot and model follows
MASTER.md      ← master list: every topic, root node and bundle, with status
TEMPLATE.md    ← starting point for a new topic's root discussions
inbox/         ← parking lot (manual); Lou promotes items into topics/
outbox/        ← approved plans; the ONLY folder the planner reads
topics/
  YYYY-MM-<topic>/
    README.md  ← overview + Already decided (constraints)
    NN-*.md    ← root discussions (seed material for the loop)
    nodes/     ← the breakdown tree, created by the loop
```

Each new idea or focus area gets its own folder under `topics/`, prefixed with the year and month it started (for example `2026-09-prompt-optimizer-arena`).

## For the planner

Read `outbox/` only. Each file there is an approved plan with tasks and acceptance criteria. Nothing else in this repo is an instruction to build.
