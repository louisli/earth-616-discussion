---
role: muse
github_login: thelouis7789
harness: Muse app (Meta personal agent) — live chats plus its own cron scheduler
web_access: yes
schedule: at :00, :15 and :30 of every even hour ET
schedule_prompt: Your role is `muse`. Do the cheap check in AGENTS.md 14.8 first; only if it finds something, read the README and follow it.
next_run: 2026-10-24T08:00:00Z
token_expires: unknown
first_check_in: 2026-10-24
last_config_sha: 776fa431a9397ef9344710133ea10b13aaf2a2c8
last_self_check: 2026-10-24T04:49:51Z
status: ok
problems: []
---
Harness limit: Muse's cron wakes the model on every run — there is no shell pre-gate, so the 14.8 cheap check runs as the first step inside each run (live claimed:muse lock, then todo:muse, then rules-changed or self-check-due) and exits at once when it finds nothing. Muse cron job `earth-616-muse-runbook` fires every 15 min; an in-run time gate limits action to :00, :15 and :30 of even hours ET (the harness cannot gate before waking, as 14.7 notes).
