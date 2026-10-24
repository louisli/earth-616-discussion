---
topic: "001"
item: "03"
task: T5
author: muse
state: approved
reworks: 1
first_cycle: 2026-10-24-06
issue: 15
lou_approved: false
---

branch: B2 Entrants and eligibility
title: Freeze the MVP entrant roster at five entrants per track
description: Freeze a separate roster of at most five entrants per track, drawn only from that track's pool. Fixed slots: the no-optimization baseline applies in both tracks; the simple metaprompt baseline applies in Runtime only; the house method applies in both tracks, as a Runtime rewriter in Runtime and as an Offline tuner in Offline, under the rule "house v0 = item 06 output, else the house slot is left out entirely (no placeholder slot is published)". Remaining slots are filled only from the matching pool: commercial tools cleared in T4 fill Runtime slots, and open-source optimizers with a run recipe in T6 fill Offline slots. No entrant is listed in a track whose pool it does not belong to.
done_when: A roster table per track names at most five entrants, states which fixed slots apply in that track, follows the house-v0-or-left-out rule with no placeholder slots, and fills every remaining slot only from that track's T4 (Runtime) or T6 (Offline) pool.

## Requested changes
- 2026-10-24-06 proposal — groky: The tree covers the item's starting points well. T3, T10 and T11 all write rules into the same leaderboard specification, so the planner should treat T10 as the spec and T3 and T11 as requirements it must satisfy; scoring and judging stay with item 05.
- 2026-10-24-06 proposal — claude: Solid tree that settles the 03 side of the category conflict. Two gaps: the house method entrant (T5) depends on item 06, which comes after 05, so the roster needs a stated placeholder rule; and nothing says which entrant types are eligible for which track (open-source optimizers like MIPROv2/GEPA/OPRO/APE are Offline-shaped, commercial improve-my-prompt tools are Runtime-shaped).
- 2026-10-24-06 groky (maybe): State per track which of the three fixed entrants apply (for example, the house method as a Runtime rewriter and as an Offline tuner, or only one), and that commercial tools fill Runtime slots and open-source optimizers fill Offline slots.
- 2026-10-24-06 claude (maybe): State per track which fixed slots apply (no-optimization baseline in both; metaprompt baseline in Runtime only; house method in both, as a "house v0 = item 06 output, else slot left out" rule), and that open-source optimizers from T6 go to Offline and commercial tools from T4 to Runtime.

## History
- 2026-10-24-06: proposed by muse; groky maybe, claude maybe → more-review
- 2026-10-24-08: rework 1 assigned to muse
- 2026-10-24-08: reworked by muse — - groky proposal comment (T3/T10/T11 share one leaderboard spec, scoring stays with item 05): done — noted; this rework changes only the roster rule and does not move scoring or judging into T5. - claude proposal comment (house method depends on item 06, and entrant eligibility per track is unstated
- 2026-10-24-08: rework 1 reviewed; groky yes, claude yes → approved
