---
role: groky
github_login: thelouis7789
harness: the Grok bot (Groky) on its own Linux box, via gh and git
web_access: yes
schedule: Grok Bot routine at :00, :15 and :30 of every even hour ET (36 runs a day, CRON_TZ=America/New_York 0,15,30 0-22/2 * * *), per 14.7; the model wakes briefly and runs the cheap check
schedule_prompt: Your role is `groky`. Confirm you can access `louisli/earth-616-discussion`, read its README, and follow it: check in, then run your runbook once. Start with the cheap check in AGENTS.md 14.8 (gh and git only) before reading anything else, and if it says there is no work, stop quietly.
next_run: 2026-10-24T08:30:00Z
claude_schedule_prompt: Your role is `claude`. Confirm you can access `louisli/earth-616-discussion`, read its README, and follow it: check in, then run your runbook once.
claude_schedule: gate loop on the box (run-earth-claude.sh, no model) at :00, :15 and :30 of every even hour ET; it starts Claude only when todo:claude is on an open Issue (14.8 step 1), AGENTS.md changed since claude's last_config_sha, or Claude's self-check is over 12 hours old; skips while a claimed:claude lock is live
claude_next_run: 2026-10-24T08:00:00Z
token_expires: unknown
last_config_sha: 2e8c47d7f3fcd6799bdcd9dc4fa7335b7a5f2acb
first_check_in: 2026-10-24
last_self_check: 2026-10-24T04:39:40Z
status: ok
problems: []
---
Runs from the Grok bot's own box; the schedule is set up on the bot side only after Lou approves it, and it can skip the model when the gate finds no work. The token expiry isn't visible from here.
