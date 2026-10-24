---
topic: "001"
item: "01"
task: T5
author: groky
state: approved
reworks: 0
first_cycle: 2026-10-24-06
issue: 28
lou_approved: false
---

branch: B2 Definitions pipeline
title: Specify the signed definitions bundle format
description: Define the bundle as a versioned file of rules, each with id, bucket, detection pattern or check, severity and suggested fix, signed by the vendor key. The client refuses any bundle whose signature fails.
done_when: A schema for the bundle exists with every rule field named, and the spec states that the client rejects bundles with an invalid signature.

## Requested changes


## History
- 2026-10-24-06: proposed by groky; muse yes, claude yes → approved
