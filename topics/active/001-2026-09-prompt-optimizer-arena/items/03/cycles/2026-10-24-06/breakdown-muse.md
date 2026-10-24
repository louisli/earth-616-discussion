---
topic: "001"
item: "03"
bot: muse
cycle: 2026-10-24-06
---
## Concept
The arena becomes two separate leaderboards that are never merged: a Runtime track where each entrant rewrites one prompt once before it is sent, and an Offline track where each entrant tunes a system prompt against a disclosed training split. Both tracks run the same MVP — one fixed target model, three categories reconciled with item 04, about 50 prompts per category — with entrants admitted only after a terms check, scored identically within a track, and published first as a static leaderboard before any interactive try-it page.

## B1
title: Tracks and comparison rules
description: Defines the two tracks, what counts as one entry in each, and the rule that results are only ranked inside a track.

## B2
title: Entrants and eligibility
description: Covers the entrant roster for the MVP, vendor-terms clearance for commercial tools, and reproducible run recipes for open-source optimizers.

## B3
title: MVP scope: model, categories, size
description: Locks the single target model, the three MVP categories reconciled with item 04's case types, and the prompt count that keeps the MVP publishable.

## B4
title: Publication and rollout
description: Covers the static leaderboard format, how model-dependent results are shown honestly, and the later try-it page with blind voting.

## 1
branch: B1
title: Define the Runtime track entry contract
description: Specify that a Runtime entry receives one raw prompt plus its input, may rewrite that prompt exactly once, and may not see the scoring key or other test prompts. State the token budget for the rewrite call so entrants are comparable on cost.
done_when: A one-page contract exists that lets a planner implement a Runtime entrant interface with no open choices.

## 2
branch: B1
title: Define the Offline track entry contract
description: Specify that an Offline entry receives the training split only, produces one frozen system prompt, and is then scored unchanged on the held-out test split. State the tuning budget as a maximum number of target-model calls.
done_when: A one-page contract exists that lets a planner implement an Offline entrant interface with no open choices.

## 3
branch: B1
title: Forbid cross-track ranking in every published view
description: Require separate tables, separate winners, and separate URLs for Runtime and Offline results in the leaderboard specification. Add an explanatory note that the tracks solve different problems so a head-on rank would mislead readers.
done_when: The leaderboard specification contains no view that orders entrants from different tracks against each other.

## 4
branch: B2
title: Check vendor terms for each commercial entrant candidate
description: For each commercial improve-my-prompt tool on the candidate list, record whether its terms allow automated use, benchmark publication, and naming the tool in results. Prefer official APIs and mark any tool without API access as manual-only or excluded.
done_when: A table lists every commercial candidate with an allow, exclude, or manual-only verdict plus the terms clause behind it.

## 5
branch: B2
title: Freeze the MVP entrant roster at five entrants per track
description: Pick the MVP roster from the cleared candidates: the no-optimization baseline, the house method, one simple metaprompt baseline, plus commercial or open-source entrants that passed leaf 4 or leaf 6. Cap the roster at five per track so the run count stays inside the MVP size in leaf 9.
done_when: A roster names at most five entrants per track with no placeholder slots.

## 6
branch: B2
title: Write a reproducible run recipe for each open-source optimizer
description: For each shortlisted open-source optimizer — DSPy MIPROv2, GEPA, TextGrad, PromptWizard, OPRO, APE — record install source, required model access, tuning budget, and its published result to expect. Drop any optimizer that cannot run within the Offline budget in leaf 2.
done_when: A recipe sheet covers each shortlisted optimizer with setup, budget, and expected published result, or an explicit drop reason.

## 7
branch: B3
title: Pick the single MVP target model
description: Choose one target model available through a raw API, per the Already decided rule that benchmark runs never use chat apps. Record the exact model identifier and version snapshot so every entrant faces identical conditions.
done_when: One exact model identifier is recorded as the MVP target with no alternative listed.

## 8
branch: B3
title: Reconcile the three MVP categories with item 04 case types
description: Map the candidate categories coding, extraction, summarization, and reasoning onto item 04's cases of efficiency, quality extraction, and robustness, and pick exactly three categories for the MVP. Extraction must appear once, under one name, in both items so item 04 can build its cases against the same scheme.
done_when: A mapping table shows each item 04 case assigned to exactly one MVP category and exactly three categories chosen.

## 9
branch: B3
title: Lock the MVP eval size at about 50 prompts per category
description: Fix the MVP at three categories of about 50 prompts each, split into a disclosed training portion for the Offline track and a held-out test portion for scoring both tracks. Publish the resulting total run estimate per entrant so run-count disputes for item 07 have one input figure from this item.
done_when: Prompt counts per category plus the train/test split are stated as single numbers that sum to one total run estimate per entrant.

## 10
branch: B4
title: Specify the static MVP leaderboard
description: Specify a static page per track showing per-category scores, overall score within the track, token cost per correct answer, and the exact target model plus eval version. This is the first published artefact and needs no user accounts.
done_when: A page specification lists every column and version stamp the static leaderboard must show.

## 11
branch: B4
title: Show model-dependent results without hiding harm
description: Require every published score to carry its target model name beside it and require a per-category breakdown wherever an entrant helps one category but hurts another. Add a standing note, citing the Metaculus-style finding that optimizers help some models and hurt others, that scores do not transfer to other models.
done_when: The leaderboard specification requires model labelling and per-category breakdowns on every results view.

## 12
branch: B4
title: Specify the try-it page as a post-MVP phase
description: Specify a second-phase page where a visitor submits one prompt, sees side-by-side outputs from two anonymised entrants, sees the token difference, and casts a blind vote before names are revealed. Gate this phase on the static leaderboard in leaf 10 already being live.
done_when: A phase specification describes the side-by-side view, token diff, and blind vote flow with its launch gate stated.

## 13
branch: B4
title: Question for Lou: confirm which commercial tools may be named publicly
description: Some vendors allow benchmarking but forbid naming them in a public ranking, which would force anonymised rows and weaken the leaderboard. This choice needs Lou because it trades credibility against entrant access and cannot be settled from terms text alone.
done_when: Lou answers whether anonymised commercial rows are acceptable or named-only entrants should be required.
