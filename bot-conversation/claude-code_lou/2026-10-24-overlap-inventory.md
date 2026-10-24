# Claude Code → Lou: bot material in j-benchmark that overlaps earth-616

2026-10-24 · Repos: projectll/j-benchmark-testing-ai-models (j-benchmark) and louisli/earth-616-discussion (earth-616) · Status: open

Lou approved this inventory in a Claude Code chat. It follows the j-benchmark
idea note
`z-my/z-my-github-issues/v-ideas/needs-info/cv-2026-10-24-cross-repo-overlap-analysis.md`.
**Nothing has moved.** Lou picks the order; each move then becomes its own
j-benchmark ticket.

Read against j-benchmark `main` at `b136cda` and earth-616 `main` at `d434c05`.

## Direction

earth-616 is the home for bot coordination (Groky, Muse, Claude). Bot
material that overlaps moves here from j-benchmark one piece at a time, and
each move leaves a pointer behind. Moved material lands in **`AGENTS.md`**,
as new sections with a line in its 16.1 change log, because `AGENTS.md` is
the one rulebook here.

## What earth-616 already has

- `AGENTS.md` section 0: ground rules, no secrets, the account table, times in ET.
- Section 14: check-in, including 14.3a on running Claude from the Grok bot's box.
- Section 15: bot conversations. Section 16: changing the rules, with a change log.
- Section 17: the standard `CLAUDE.md` router shape (added today).
- `agents/*.md`: check-in files.

**Gaps:** Discord and Slack, reporting, survival docs, Lou's phrases, and the
GitHub-fallback steps.

## Inventory

All j-benchmark paths are under `z-my/z-my-agents/` unless shown in full.

| # | j-benchmark item | Move, stay or split | Pointer left behind |
| --- | --- | --- | --- |
| 1 | `standard/BOT_CONVENTIONS.md` §7 Discord and Slack. It grew to about 80 lines today with Muse's reporting spec (046a, PR #141) | **Move.** Pure bot operations. The "don't post skipped runs" line refers to the gate's logs, so it stays next to `config/grok-config-readme.md` | "Channels, posting and report formats: earth-616 `AGENTS.md` section N" |
| 2 | Same file, §10 Survival docs | **Split.** The pattern moves. The weekly `[Grok]`/`[Muse] … survival doc` issues stay in j-benchmark's Issues tab, because Issues here belong to the orchestrator (3.3, 15.4). Moving them would need a rule change first | Pattern pointer. The planner's skip rule in `planner/hourly-claude-planner.md` stays, with its link updated |
| 3 | Same file, §2 Phrases | **Split.** "spec it out", "proposed", "snapshot" and "stop" move. "open a ticket", "GitHub issue", "write it as an idea" and "push to main" stay, since they describe j-benchmark's ticket workflow | One line above the table |
| 4 | Same file, §6 Updates and reporting | **Move.** Nothing in it is specific to j-benchmark | One line |
| 5 | Same file, §8 Safety and the box | **Split.** No secrets, back up first and install nothing move (partly already in section 0 here). Runner slot timing stays with the runners | Pointer |
| 6 | Same file, §1, §3, §4, §5 and §9 | **Stay.** They describe `tickets.py`, ideas, PRs and merge rules | Header line: "Shared bot rules live in earth-616 `AGENTS.md`" |
| 7 | `standard/GITHUB_ACCESS_FALLBACK.md` | **Split, low priority.** The workarounds that apply to any repo (§1–2) move. §3–4 and the worked example (tickets, `[skip ci]`) stay | Pointer at the top |
| 8 | Runbooks (`engineer/`, `reviewer/`, `planner/`), `config/grok-config-*`, `z-my/z-my-github-issues/tools/`, `.github/workflows/`, `standard/ISSUE_STANDARD.md` | **Stay.** They run against j-benchmark's code | Not applicable |
| 9 | `engineer/engineer.md`, `reviewer/reviewer.md`, `z-my-readme.md`, `docs/architecture.md`, `docs/ticket-flow.md` | **Stay.** They mention Groky, Slack and Discord in passing | Update links as items 1–5 move |
| 10 | `z-my/z-my-github-issues/v-ideas/archive/*` (Groky's 2026-10-17 setup snapshot, the 10-23 gate notes, Muse's notes) | **Stay.** History | Not applicable |
| 11 | `CLAUDE.md`, `CLAUDE_j-benchmark.md`, `config/grok-config-box-claude.md` | **Stay.** Already brought to the standard shape by j-benchmark PR #143 (047a, waiting for Lou to merge) | Not applicable |

## Suggested order

1. **Item 1 (Discord and Slack).** The largest and fastest-growing bot-only section.
2. **Item 2 (survival-doc pattern).** Text only; the issues stay where they are.
3. **Items 3–5 (phrases, reporting, generic safety).** These can go together in one move.
4. **Item 7 (GitHub fallback).** Lowest value.
5. **Then shrink `BOT_CONVENTIONS.md`** to what's specific to j-benchmark, with the header pointer from item 6.

**Each move is two changes:**
- a j-benchmark ticket and PR that Lou merges, since `standard/` is under `z-my/z-my-agents/`;
- an `AGENTS.md` change here, logged in 16.1.

## Open for Lou

- The order above, or a different one.
- Whether survival-doc issues should ever move here. That needs an `AGENTS.md` rule change, since the orchestrator owns Issues here.
