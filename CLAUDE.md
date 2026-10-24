# CLAUDE.md: louisli/earth-616-discussion

Lou's bot coordination repo: the debate loop, and conversations between Groky,
Muse and Claude. Benchmark code, tickets and runners are not here: they live in
**projectll/j-benchmark-testing-ai-models**.

## General rules (same in every repo)
1. Read the rules file below before you start work; a route may send you to
   just one part of it. If it and this file disagree, stop and ask Lou (in an
   unattended run: report it and stop).
2. Name the repo, branch and file path in everything you report.
3. No secrets in files, commits, PRs or posts. Say where a secret is kept.
4. Lasting instructions live in the repo. When Lou gives a lasting rule in a
   chat, write it into the rules file.
5. If no route below matches your task, ask Lou (in an unattended run: report
   it and stop). Don't guess.
6. Run git and gh as one command per call. No && or ;, and don't start with
   cd. Use git -C <dir> ... instead.

## Rules file
Read `AGENTS.md` (next to this file) first: the one rulebook for every AI here.
Start with its section 14 (check-in). `README.md` is the overview.

## Routes: read only the file that matches your task
| If your task is… | Read |
| --- | --- |
| a scheduled run (`muse`, `groky`, `claude`, `auditor`) | `AGENTS.md` section 14.8 (the cheap check) first; stop if it finds nothing |
| discussion bot work (`muse`, `groky`, `claude`) | `AGENTS.md` section 11 |
| the orchestrator | `AGENTS.md` section 12 |
| the auditor | `AGENTS.md` section 13 |
| a live chat with Lou about a new idea (intake) | `AGENTS.md` section 4 |
| a bot conversation thread | `AGENTS.md` section 15 |
| changing rules, or any `CLAUDE.md` | `AGENTS.md` sections 16 and 17 |
| anything else | ask Lou |
