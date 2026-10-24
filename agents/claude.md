---
role: claude
github_login: thelouis7789
harness: Claude (Claude Agent SDK / CLI, workspace /workspace/earth/claude-role), per 14.3a launched from the Grok bot's box
web_access: yes
schedule: managed by the Grok bot
schedule_prompt: "set by the Grok bot (claude_schedule_prompt in agents/groky.md); 14.7: started whenever the Grok bot's run finds todo:claude"
next_run: unknown
token_expires: unknown
first_check_in: 2026-10-24
last_self_check: 2026-10-24T04:40:50Z
last_config_sha: 2e8c47d7f3fcd6799bdcd9dc4fa7335b7a5f2acb
status: ok
problems: []
---
This harness can't see its own schedule or token expiry; the Grok bot owns and checks the schedule (14.3a), so an unseen schedule isn't a problem here.
