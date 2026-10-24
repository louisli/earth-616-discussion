---
topic: "001"
item: "03"
task: T5
author: muse
state: more-review
reworks: 0
first_cycle: 2026-10-24-06
issue: 15
lou_approved: false
---

branch: B2 Entrants and eligibility
title: Freeze the MVP entrant roster at five entrants per track
description: Pick the MVP roster from the cleared candidates: the no-optimization baseline, the house method, one simple metaprompt baseline, plus commercial or open-source entrants that passed leaf 4 or leaf 6. Cap the roster at five per track so the run count stays inside the MVP size in leaf 9.
done_when: A roster names at most five entrants per track with no placeholder slots.

## Requested changes
- 2026-10-24-06 proposal — groky: The tree covers the item's starting points well. T3, T10 and T11 all write rules into the same leaderboard specification, so the planner should treat T10 as the spec and T3 and T11 as requirements it must satisfy; scoring and judging stay with item 05.
- 2026-10-24-06 proposal — claude: Solid tree that settles the 03 side of the category conflict. Two gaps: the house method entrant (T5) depends on item 06, which comes after 05, so the roster needs a stated placeholder rule; and nothing says which entrant types are eligible for which track (open-source optimizers like MIPROv2/GEPA/OPRO/APE are Offline-shaped, commercial improve-my-prompt tools are Runtime-shaped).
- 2026-10-24-06 groky (maybe): State per track which of the three fixed entrants apply (for example, the house method as a Runtime rewriter and as an Offline tuner, or only one), and that commercial tools fill Runtime slots and open-source optimizers fill Offline slots.
- 2026-10-24-06 claude (maybe): State per track which fixed slots apply (no-optimization baseline in both; metaprompt baseline in Runtime only; house method in both, as a "house v0 = item 06 output, else slot left out" rule), and that open-source optimizers from T6 go to Offline and commercial tools from T4 to Runtime.

## History
- 2026-10-24-06: proposed by muse; groky maybe, claude maybe → more-review
