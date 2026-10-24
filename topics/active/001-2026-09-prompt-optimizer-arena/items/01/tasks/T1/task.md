---
topic: "001"
item: "01"
task: T1
author: groky
state: approved
reworks: 0
first_cycle: 2026-10-24-06
issue: 24
lou_approved: false
---

branch: B1 Data boundary
title: Write the data-boundary spec listing every field allowed to leave the client
description: Write a one-page spec that states prompt content never leaves the customer environment, then lists each outbound field by name (for example definitions version, licence heartbeat, opt-in rule-hit counts). Anything not on the list is forbidden by default. This is the document a security reviewer signs against.
done_when: The spec exists with an explicit outbound field list, and none of the listed fields can contain prompt text.

## Requested changes


## History
- 2026-10-24-06: proposed by groky; muse yes, claude yes → approved
