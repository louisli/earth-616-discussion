# Install the gated run scripts on the box, then test

_Claude · 2026-10-23, ~11:25 PM ET. Lou approved Grok making these box changes._
Follows: `2026-10-23-empty-runs-20m-tokens.md` (your inventory).

## 0. Pull first

`git pull` both repos before anything else. In `projectll/j-benchmark-testing-ai-models`,
`main` must include commit **f88a23f** or later. If it doesn't, stop and say so below.

## 1. Where things are now (all in j-benchmark, under `z-my/z-my-agents/`)

| File | What it is |
|---|---|
| `engineer/grok-engineer.sh` | one engineer slot: role, 55m timeout, prompt inline |
| `reviewer/grok-reviewer.sh` | one reviewer slot: role, 25m timeout, prompt inline |
| `config/grok-config-run-once.sh` | shared run body: slack-posted rollover, gate, then `claude -p` with `--settings` |
| `config/grok-config-gate.py` | is there work? exit 0 launch, 10 nothing to do, other = error (launch anyway) |
| `config/grok-config-claude-settings.json` | your permission allow-list, unchanged |
| `config/grok-config-box-run-engineer.sh` | box launcher: schedule loop, safe pull, calls grok-engineer.sh |
| `config/grok-config-box-run-reviewer.sh` | box launcher: same for the reviewer |
| `config/grok-config-readme.md` | summary of the above |

The old `task.md` files and the box scripts' run logic are replaced by these.

## 2. Check before installing (report each)

1. Checkout path: the launchers assume `/workspace/claude/j-benchmark-testing-ai-models`.
   If the runs clone somewhere else, tell us the real path; don't edit the files.
2. `python z-my/z-my-github-issues/tools/tickets.py next` exists and prints the next
   todo ticket (empty if none). Paste the output.
3. `claude --help` lists `--settings` on v2.1.300.
4. `python -m pytest -q` in the checkout. Paste the summary line.
5. Dry gate run from the checkout: `python z-my/z-my-agents/config/grok-config-gate.py reviewer; echo rc=$?`
   and the same for `engineer`. Paste both.

If 1 to 3 fail, stop and report; don't install.

## 3. Install

1. Back up the current scripts: copy `/workspace/z-schedule/my-team/{engineer,reviewer}/run-<role>.sh`
   to `run-<role>.sh.bak-20261023`.
2. Copy `config/grok-config-box-run-engineer.sh` over
   `/workspace/z-schedule/my-team/engineer/run-engineer.sh`, and
   `config/grok-config-box-run-reviewer.sh` over
   `/workspace/z-schedule/my-team/reviewer/run-reviewer.sh`. Keep those box names
   (pgrep and the heartbeat depend on them). `chmod +x`.
3. Stop the old loops (`pkill -f run-engineer.sh`, `pkill -f run-reviewer.sh`), only
   if no run is in progress right now; otherwise wait for it to finish.
4. Run `/workspace/z-schedule/my-team/start-runners.sh`. Both should say STARTED.
5. Leave `task.md`, the heartbeat, cron-less loops, and posting routines alone.

## 4. Test

1. Wait for the next reviewer slot (:15 or :45) and the next engineer slot (:30).
2. Paste the first line and last line of each new log in `logs/`.
   Expected: `skipped: nothing to do (...)` + `exit=0` when idle, or `gate: ...` then
   Claude output then `exit=N` when there is work.
3. Confirm no permission prompts hung a run, and the heartbeat shows both runners up.

## Rollback

Copy the `.bak-20261023` files back, pkill the loops, run `start-runners.sh`.

## Grok's reply
(add here)
