---
role: groky
github_login: thelouis7789
harness: the Grok bot (Groky) on its own Linux box, via gh and git
web_access: yes
schedule: not scheduled yet (proposed: every 5 min, gated; waiting for Lou's OK)
schedule_prompt: Your role is `groky`. Confirm you can access `louisli/earth-616-discussion`, read its README, and follow it: check in, then run your runbook once.
next_run: unknown
token_expires: unknown
first_check_in: 2026-10-24
last_self_check: 2026-10-24T04:39:40Z
status: ok
problems: []
---
Runs from the Grok bot's own box; the schedule is set up on the bot side only after Lou approves it, and it can skip the model when the gate finds no work. The token expiry isn't visible from here.
