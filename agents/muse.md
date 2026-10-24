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
last_config_sha: 7d4f627830e290ab1c119f4b5c5d0f6384ff04a8
last_self_check: 2026-10-24T04:49:51Z
status: ok
problems: []
---
Harness limit: Muse's cron wakes the model on every run — there is no shell pre-gate, so the 14.4 gate would run as the first step inside each run and exit at once when it prints nothing. Muse cron job `earth-616-muse-runbook` fires every 15 min; an in-run time gate limits action to :00, :15 and :30 of even hours ET (the harness cannot gate before waking, as 14.7 notes).
