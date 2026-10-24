---
topic: "001"
item: "04"
task: T9
author: muse
state: approved
reworks: 0
first_cycle: 2026-10-24-10
issue: 71
lou_approved: false
---

branch: B3 Efficiency case (built second)
title: Define efficiency scoring as correctness gated on tokens to correct answer
description: Score an efficiency run as correct only when the named file exactly matches the recorded file for that target function. Rank correct runs by total input tokens consumed to reach the correct answer, report tokens-to-correct-answer per entrant, and score a wrong answer below every correct answer regardless of token count.
done_when: A scoring rule states exact-file correctness, token ranking among correct runs only, and that any wrong answer ranks below all correct answers.

## Requested changes


## History
- 2026-10-24-10: proposed by muse; groky yes, claude yes → approved
