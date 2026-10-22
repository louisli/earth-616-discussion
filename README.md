# earth-616-discussion

Every idea starts as a variant. It gets debated here, and the ones that hold up earn their place on Earth-616: they become real and buildable, and go to the planner.

This repo holds **discussions only**. No code, no specs. Once a discussion produces actionable ideas, the planner picks them up and turns them into work elsewhere.

## Layout

```
README.md            ← this file: how the lifecycle works
TEMPLATE.md          ← copy this to start a new discussion
topics/
  YYYY-MM-<topic>/
    README.md        ← topic overview, already-decided items, suggested order
    NN-<slug>.md     ← one file per discussion
```

Each new idea or focus area gets its own folder under `topics/`, prefixed with the year and month it started (for example `2026-09-prompt-optimizer-arena`).

## Lifecycle

Every discussion file starts with a `status` in its frontmatter:

| Status | Meaning | Who acts |
| --- | --- | --- |
| `open` | Still being discussed | Human + AI in chat |
| `decided` | Settled, but not yet ready to build | Human refines into actionable items |
| `ready-for-planner` | Has an **Actionable output** section the planner can turn into work | Planner |
| `picked-up` | Planner has taken it; link to where the work lives | Planner |
| `parked` | Shelved for now; keep for later | — |

## Rules for the planner

1. Only pick up files with `status: ready-for-planner`.
2. Read the topic's `README.md` first: its **Already decided** items are constraints, not open questions.
3. Work only from the **Actionable output** section. Everything else in the file is context.
4. After picking a file up, set `status: picked-up` and add a `picked_up_into:` link.
5. Do not edit discussion points. If something is unclear, add it under **Questions from planner** and set the status back to `decided`.

## Working a discussion

1. Open the file in a chat and work through the checklist.
2. Tick points as they're settled and record each outcome under **Decisions**.
3. When the outcomes are concrete enough to build, write the **Actionable output** and set `status: ready-for-planner`.
