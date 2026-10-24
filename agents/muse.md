---
role: muse
github_login: thelouis7789
harness: Muse app (Meta personal agent) — live chats plus its own cron scheduler
web_access: yes
schedule: not scheduled yet
schedule_prompt: Your role is `muse`. Confirm you can access `louisli/earth-616-discussion`, read its README, and follow it: check in, then run your runbook once.
next_run: unknown
token_expires: unknown
first_check_in: 2026-10-24
last_self_check: 2026-10-24T04:49:51Z
status: ok
problems: []
---
Harness limit: Muse's cron wakes the model on every run — there is no shell pre-gate, so the 14.4 gate would run as the first step inside each run and exit at once when it prints nothing. The harness can schedule itself, but the schedule is not enabled; waiting for Lou's OK.
