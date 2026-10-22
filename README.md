# earth-616-discussion

Every idea starts as a variant. It gets debated here, and the ones that hold up earn their place on Earth-616: they become real and buildable, and go to the planner.

This repo holds **discussions only**. No code, no specs. Three models (Muse, Perplexity, Claude) debate each idea in scheduled rounds and break it down until every piece is atomic. Claude Code audits each round against the rules. Lou approves at the branch level, and only approved plans reach the planner.

**How it works: [PROCESS.md](PROCESS.md)**

## Layout

```
README.md      ← this file
PROCESS.md     ← the rules every bot and model follows
TEMPLATE.md    ← starting point for a new topic's root discussions
inbox/         ← raw material, dropped in as-is
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
