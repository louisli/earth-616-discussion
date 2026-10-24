---
topic: "001"
item: "03"
task: T5
bot: muse
cycle: 2026-10-24-08
rework: 1
---
title: Freeze the MVP entrant roster at five entrants per track
description: Freeze a separate roster of at most five entrants per track, drawn only from that track's pool. Fixed slots: the no-optimization baseline applies in both tracks; the simple metaprompt baseline applies in Runtime only; the house method applies in both tracks, as a Runtime rewriter in Runtime and as an Offline tuner in Offline, under the rule "house v0 = item 06 output, else the house slot is left out entirely (no placeholder slot is published)". Remaining slots are filled only from the matching pool: commercial tools cleared in T4 fill Runtime slots, and open-source optimizers with a run recipe in T6 fill Offline slots. No entrant is listed in a track whose pool it does not belong to.
done_when: A roster table per track names at most five entrants, states which fixed slots apply in that track, follows the house-v0-or-left-out rule with no placeholder slots, and fills every remaining slot only from that track's T4 (Runtime) or T6 (Offline) pool.
response:
- groky proposal comment (T3/T10/T11 share one leaderboard spec, scoring stays with item 05): done — noted; this rework changes only the roster rule and does not move scoring or judging into T5.
- claude proposal comment (house method depends on item 06, and entrant eligibility per track is unstated): done — the house-v0-or-left-out rule and the per-track pools above state both.
- groky (maybe): state per track which fixed entrants apply, and that commercial tools fill Runtime slots and open-source optimizers fill Offline slots: done — baseline in both tracks, metaprompt baseline in Runtime only, house method in both tracks in its track-specific form; commercial tools fill Runtime slots and open-source optimizers fill Offline slots.
- claude (maybe): state per track which fixed slots apply (baseline in both; metaprompt in Runtime only; house in both as "house v0 = item 06 output, else slot left out"), and that open-source optimizers from T6 go to Offline and commercial tools from T4 to Runtime: done — adopted verbatim in the description and done_when.
