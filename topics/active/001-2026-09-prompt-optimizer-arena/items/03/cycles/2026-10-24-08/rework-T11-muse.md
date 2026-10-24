---
topic: "001"
item: "03"
task: T11
bot: muse
cycle: 2026-10-24-08
rework: 1
---
title: Show model-dependent results without hiding harm
description: As a requirement the T10 static leaderboard specification must satisfy (T10 is the spec; T11 states requirements on it): require every published score to carry its target model name beside it, and require a per-category breakdown wherever an entrant helps one category but hurts another, on every results view. Include a standing note, with no citation or attribution, that scores are for the named target model only and do not transfer to other models.
done_when: The T10 leaderboard specification requires model labelling and per-category breakdowns on every results view and carries the no-transfer standing note with no unverified citation.
response:
- groky proposal comment (T3, T10 and T11 all write rules into the same leaderboard specification, so the planner should treat T10 as the spec and T11 as requirements it must satisfy; scoring and judging stay with item 05): done — the description now frames T11 explicitly as a requirement on the T10 spec, and scoring/judging are left to item 05.
- claude proposal comment (house placeholder rule and per-track eligibility gaps in T5): not done for T11 — that gap belongs to T5 and is fixed in rework-T5-muse.md this cycle; it does not affect model-dependent reporting.
- claude (maybe): replace the "Metaculus-style finding" citation with a real source in sources, or drop the citation and keep the standing note: done — the citation and attribution are dropped entirely; the standing note is kept unattributed, so no unverified source is claimed and no sources field is added.
