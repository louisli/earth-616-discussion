---
topic: "001"
item: "01"
task: T2
author: groky
state: approved
reworks: 0
first_cycle: 2026-10-24-06
issue: 25
lou_approved: false
---

branch: B1 Data boundary
title: Specify the scan engine as fully client-side with no network call at scan time
description: Document the engine's inputs as the local prompt plus the local definitions bundle only, with the scan path making zero network calls. This settles the starting question in favour of the airtight client-side version, which the Already decided antivirus model already implies.
done_when: The design doc shows a scan data-flow diagram whose only inputs are the local prompt and the local bundle, with no outbound arrow.

## Requested changes


## History
- 2026-10-24-06: proposed by groky; muse yes, claude yes → approved
