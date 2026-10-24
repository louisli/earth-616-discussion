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
_Grok · 2026-10-23, 11:47 PM ET. Louis asked me to do this in chat, and the file says he approved the box changes. Both repos were pulled first: `projectll/j-benchmark-testing-ai-models` `main` includes **f88a23f** (it is the HEAD commit, "[claude]: remove runners/box/run-reviewer.sh (moved to config/) [skip ci]"), and earth was fast-forwarded to pick up this file._

### 2. Checks before installing

1. **Checkout path:** the runs use `/workspace/claude/j-benchmark-testing-ai-models`, the same path the launchers assume. No change needed.
2. **`tickets.py next`:** exists, exit code 0, and printed nothing (no `todo` tickets; all 39 tickets are `complete` (34), `started-incomplete` (2, i.e. 019a and 022a) or `superseded` (2)).
3. **`--settings`:** `claude --version` is 2.1.300 and `claude --help` lists `--settings <file-or-json>`.
4. **`python -m pytest -q`:** `270 passed, 1 skipped in 8.56s`
5. **Dry gate runs from the checkout:**
   - `grok-config-gate.py reviewer` printed `no open PRs`, `rc=10`
   - `grok-config-gate.py engineer` printed `no open PRs and no todo ticket`, `rc=10`

All five passed, so I went ahead. I also read the launchers, `grok-config-run-once.sh`, the two role scripts and the gate before installing. One note: the gate treats "no open PRs and no `todo` ticket" as nothing to do for the engineer, so a ticket in a feedback status with no open PR would not launch a run. I assume that is intended; the runbook handles feedback only through open PRs.

### 3. Install

- No `claude -p` run was in progress (checked just before, at 11:26 PM; the next slot was 11:30).
- Backed up as `run-engineer.sh.bak-20261023` and `run-reviewer.sh.bak-20261023` next to the originals (the earlier `.bak-*` files are untouched).
- Copied `config/grok-config-box-run-engineer.sh` over `/workspace/z-schedule/my-team/engineer/run-engineer.sh` and `config/grok-config-box-run-reviewer.sh` over `/workspace/z-schedule/my-team/reviewer/run-reviewer.sh`, then `chmod +x`.
- Stopped only the old loops by their exact PIDs (16418 and 16422), then ran `start-runners.sh`. It printed `run-engineer.sh: STARTED`, `run-reviewer.sh: STARTED`, and `run-hourly-health-check.sh: running` (11:26 PM). The new loops are PIDs 63842 and 63849, and both are still up.
- Left `task.md`, the heartbeat, the posting routines and the `start-runners.sh` script alone.

### 4. Test

First and last lines of the new logs (the logs are two lines, so first and last together are the whole log):

`engineer/logs/engineer-20261023-2330.log` (the 11:30 PM slot, the first slot after the install):
```
skipped: nothing to do (no open PRs and no todo ticket)
exit=0
```

`reviewer/logs/reviewer-20261023-2345.log` (the 11:45 PM slot):
```
skipped: nothing to do (no open PRs)
exit=0
```

- **Permission prompts:** no run launched Claude, so no prompt could hang. The path where the gate says there is work, with Claude launched using `--settings`, has not been exercised yet; it will only happen when there is an open PR (or, for the engineer, a `todo` ticket). I can watch for that first real run and report if you want.
- **Heartbeat:** the process list shows both runners up under the unchanged names (`run-engineer.sh` and `run-reviewer.sh`), and `start-runners.sh` reports them as running. The 11:00 PM heartbeat log (written before the install) showed both runners up, and the midnight one will be the first after the install; I'll flag it only if it shows DOWN.
- **Posting routines:** the engineer's "skipped" log for 11:30 PM will be posted at the next :25 run like any other log, and the posted lists were not touched.

Rollback has not been needed.

