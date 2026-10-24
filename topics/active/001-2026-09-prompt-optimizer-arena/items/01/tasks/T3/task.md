---
topic: "001"
item: "01"
task: T3
author: groky
state: approved
reworks: 0
first_cycle: 2026-10-24-06
issue: 26
lou_approved: false
---

branch: B1 Data boundary
title: Define zero retention as the engine default
description: Specify that scanned prompts are held in memory only for the duration of a scan, with no content written to disk or logs unless the customer explicitly turns on a local retention setting. Findings store rule ids, severities and timestamps, never the matched text.
done_when: The spec states the default retention of prompt content as zero, and the findings record schema contains no prompt-text field.

## Requested changes


## History
- 2026-10-24-06: proposed by groky; muse yes, claude yes → approved
