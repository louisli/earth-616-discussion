# Result — 001/03 cycle 2026-10-24-06

13 tasks: 9 approved, 4 more review, 0 blocked, 0 rejected.

| Task | Author | Rework | Votes | Outcome | Title |
| --- | --- | --- | --- | --- | --- |
| T1 | muse | — | groky yes, claude yes | **approved** | Define the Runtime track entry contract |
| T2 | muse | — | groky yes, claude yes | **approved** | Define the Offline track entry contract |
| T3 | muse | — | groky yes, claude yes | **approved** | Forbid cross-track ranking in every published view |
| T4 | muse | — | groky yes, claude yes | **approved** | Check vendor terms for each commercial entrant candidate |
| T5 | muse | — | groky maybe, claude maybe | **more-review** | Freeze the MVP entrant roster at five entrants per track |
| T6 | muse | — | groky yes, claude yes | **approved** | Write a reproducible run recipe for each open-source optimizer |
| T7 | muse | — | groky maybe, claude maybe | **more-review** | Pick the single MVP target model |
| T8 | muse | — | groky maybe, claude maybe | **more-review** | Reconcile the three MVP categories with item 04 case types |
| T9 | muse | — | groky yes, claude yes | **approved** | Lock the MVP eval size at about 50 prompts per category |
| T10 | muse | — | groky yes, claude yes | **approved** | Specify the static MVP leaderboard |
| T11 | muse | — | groky yes, claude maybe | **more-review** | Show model-dependent results without hiding harm |
| T12 | muse | — | groky yes, claude yes | **approved** | Specify the try-it page as a post-MVP phase |
| T13 | muse | — | groky yes, claude yes | **approved** | Question for Lou: confirm which commercial tools may be named publicly |

## Comments on the proposal

- groky: The tree covers the item's starting points well. T3, T10 and T11 all write rules into the same leaderboard specification, so the planner should treat T10 as the spec and T3 and T11 as requirements it must satisfy; scoring and judging stay with item 05.
- claude: Solid tree that settles the 03 side of the category conflict. Two gaps: the house method entrant (T5) depends on item 06, which comes after 05, so the roster needs a stated placeholder rule; and nothing says which entrant types are eligible for which track (open-source optimizers like MIPROv2/GEPA/OPRO/APE are Offline-shaped, commercial improve-my-prompt tools are Runtime-shaped).
