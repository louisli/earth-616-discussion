---
topic: "001"
item: "04"
cycle: 2026-10-24-10
reviewer: groky
---

# Review sheet: groky

Vote on every leaf (T<n>) below in `review-groky.md` (AGENTS.md 7.4): yes, no, or maybe with the changes you want. Comment on the tree as a whole in an optional `## Proposal` section.

# Proposal by muse

# Concept
> The three starter cases become one buildable case pack built in a fixed order — structured extraction first, efficiency second, robustness third — where every case is specified in the same format (task definition, verbatim naive baseline prompt, frozen input set with ground truth, and a deterministic scoring function), extraction anchors the shared extraction category from item 03, efficiency anchors coding-style search, robustness is treated as a cross-cutting dimension measured on messy inputs, and every case doubles as an enterprise demo with its expensive runs capped and cached.

# Branch B1 Order, mapping, and the common case format
> Decides which case is built first, how the three cases relate to the MVP categories from item 03, and the one specification format every case must use.

## T1
branch: B1 Order, mapping, and the common case format
title: Build extraction first, then efficiency, then robustness
description: Fix the build order as extraction, efficiency, robustness, with no alternative order. Extraction goes first because its ground truth is deterministic, its scoring harness is reusable by the other two cases, and its runs are cheap; efficiency goes second because it is the most dramatic demo but depends on the capping rule in leaf 13; robustness goes third because its gold labels need the adjudication rule in leaf 10.
done_when: The build order is recorded as extraction first, efficiency second, robustness third, with one stated reason per position and no alternative order listed.

## T2
branch: B1 Order, mapping, and the common case format
title: Map the three cases onto the item 03 category scheme
description: Apply the item 03 T8 rule exactly: extraction is a category and appears once, under the single shared name extraction, in both items; the efficiency case is assigned to the coding category, because its task is searching a code repo; robustness is not forced into one category and is instead marked as an orthogonal dimension measured across categories, realised in this item as its own messy-input case in branch B4.
done_when: A mapping states extraction as the shared extraction category, efficiency assigned to coding, and robustness as a dimension measured across categories, with extraction named once under one name.

## T3
branch: B1 Order, mapping, and the common case format
title: Define the common case specification format
description: Require every case specification to contain exactly these fields: task definition in one paragraph, the verbatim naive baseline prompt, a frozen input set with a version identifier, ground truth for every input, one deterministic scoring function, a per-case run cap, and the enterprise demo form from leaf 15. A case missing any field is not ready to build.
done_when: A template lists all seven required fields and states that a case missing any field is not build-ready.

# Branch B2 Extraction case (built first)
> Defines the quality case: pulling invoice number, date, and amount from messy documents against known ground truth, scored by precision and recall.

## T4
branch: B2 Extraction case (built first)
title: Freeze the extraction document set at 20 messy documents
description: Fix the extraction input set at 20 documents, each containing exactly one invoice number, one invoice date, and one amount due, with ground truth recorded per document before any run. Messiness is limited to stated forms: inconsistent date formats, amounts with and without currency symbols or thousands separators, fields in varying order, and OCR-style character errors in at most 5 of the 20 documents.
done_when: A set specification fixes 20 documents, the three ground-truth fields per document, and the closed list of messiness forms.

## T5
branch: B2 Extraction case (built first)
title: Write the extraction naive baseline prompt verbatim
description: Record the exact baseline prompt an unoptimized entrant receives: a generic request to extract the invoice number, date, and amount from a document, with no output schema, no field definitions, and no examples. The optimized prompt is whatever an entrant produces from this baseline under the arena tracks from item 03.
done_when: One verbatim baseline prompt is recorded with no schema, no field definitions, and no examples in it.

## T6
branch: B2 Extraction case (built first)
title: Define extraction scoring as per-field precision and recall
description: Score extraction per field against ground truth after stated normalisation only: dates converted to ISO format, amounts reduced to a numeric value, and invoice numbers compared as exact strings. Report precision, recall, and F1 for each of the three fields plus one overall F1 averaged across fields, with no partial credit for a near-miss value.
done_when: A scoring rule states the normalisation per field, the per-field and overall F1 calculation, and that near misses score zero.

# Branch B3 Efficiency case (built second)
> Defines the context-handling case: finding which file in a large repo holds a function, scored by correctness gated on token cost.

## T7
branch: B3 Efficiency case (built second)
title: Freeze the efficiency repo fixture at about 50 files and about 10MB
description: Fix the efficiency input as one synthetic repo fixture of 50 files totalling about 10MB, containing 10 named target functions each present in exactly one file, with the correct file recorded per function before any run. No file in the fixture names its target function in its filename, so filename search alone cannot solve the case.
done_when: A fixture specification fixes 50 files, about 10MB total, 10 target functions each in exactly one recorded file, and the no-target-name-in-filename rule.

## T8
branch: B3 Efficiency case (built second)
title: Write the efficiency naive baseline prompt verbatim
description: Record the exact baseline prompt an unoptimized entrant receives: it asks which file defines a named function and is run in the naive form that loads the whole fixture into context. The selective strategy of listing filenames first and reading only candidate files is the behaviour optimization is expected to discover, and it is not hinted at in the baseline prompt.
done_when: One verbatim baseline prompt is recorded that asks for the file defining a named function and contains no selective-reading hint.

## T9
branch: B3 Efficiency case (built second)
title: Define efficiency scoring as correctness gated on tokens to correct answer
description: Score an efficiency run as correct only when the named file exactly matches the recorded file for that target function. Rank correct runs by total input tokens consumed to reach the correct answer, report tokens-to-correct-answer per entrant, and score a wrong answer below every correct answer regardless of token count.
done_when: A scoring rule states exact-file correctness, token ranking among correct runs only, and that any wrong answer ranks below all correct answers.

# Branch B4 Robustness case (built third)
> Defines the reliability case: classifying customer intent on inputs with typos, mixed English and Mandarin, and edge cases, scored by accuracy on the full messy set.

## T10
branch: B4 Robustness case (built third)
title: Freeze the robustness label set at six customer intents
description: Fix the classification labels to exactly six intents: billing question, shipping question, refund request, product question, account access problem, and other. Every input carries exactly one gold label, and an input two annotators cannot agree on after one adjudication pass is removed from the set rather than kept with a disputed label.
done_when: A label list names exactly six intents and states the one-gold-label rule plus removal after a failed adjudication pass.

## T11
branch: B4 Robustness case (built third)
title: Freeze the robustness input set at 50 messages with fixed messiness slices
description: Fix the robustness input set at 50 customer messages with stated slice proportions: 20 clean, 10 containing typos, 10 mixing English and Mandarin, and 10 edge cases such as very short or multi-question messages that still have one gold label under leaf 10. The slice of each message is recorded in the set metadata and is not shown to entrants.
done_when: A set specification fixes 50 messages with slice counts of 20 clean, 10 typo, 10 mixed-language, and 10 edge, plus hidden slice metadata.

## T12
branch: B4 Robustness case (built third)
title: Write the robustness naive baseline prompt verbatim
description: Record the exact baseline prompt an unoptimized entrant receives: a generic request to classify a customer message by intent, naming the six labels from leaf 10 but giving no label definitions, no handling guidance for typos or mixed language, and no examples.
done_when: One verbatim baseline prompt is recorded that names the six labels and contains no definitions, no messiness guidance, and no examples.

## T13
branch: B4 Robustness case (built third)
title: Define robustness scoring as accuracy on the full messy set
description: Score robustness as exact-label accuracy across all 50 messages in leaf 11, reported as one headline accuracy plus a per-slice accuracy breakdown for the clean, typo, mixed-language, and edge slices. No entrant is ranked on the clean slice alone, so a clean-set gain cannot hide a messy-slice regression.
done_when: A scoring rule states headline accuracy over all 50 messages, the four per-slice breakdowns, and that ranking never uses the clean slice alone.

# Branch B5 Cost control and enterprise demo reuse
> Caps and caches the expensive baseline runs, keeps held-out ground truth hidden from optimizers, and gives each case a sales-demo form.

## T14
branch: B5 Cost control and enterprise demo reuse
title: Cap and cache the 10MB efficiency baseline runs
description: Run the naive full-context efficiency baseline from leaf 8 at most once per entrant per target-model version, at its stated cost of about $10–15 per run, and cache that result for every later comparison and leaderboard refresh. Selective-reading runs are not capped under this rule because they do not load the whole fixture.
done_when: A run rule states the once-per-entrant-per-model-version cap for the full-context baseline, its cached reuse, and that selective runs are exempt.

## T15
branch: B5 Cost control and enterprise demo reuse
title: Give each case one enterprise demo form
description: Assign each case exactly one demo form aimed at enterprise buyers: extraction demos invoice processing for a finance team, efficiency demos codebase search cost reduction for an engineering team, and robustness demos support triage reliability for a customer-support team. Each demo reuses the case's frozen input set and scoring function unchanged, so demo numbers are the benchmark numbers.
done_when: A demo list assigns one named enterprise audience per case and states that demos reuse the frozen inputs and scoring unchanged.

## T16
branch: B5 Cost control and enterprise demo reuse
title: Keep held-out ground truth hidden from optimizers
description: Split every case's inputs into a disclosed sample with ground truth that optimizers may inspect and a held-out test portion whose ground truth no entrant sees before scoring. Headline scores for all three cases come from the held-out portion only, using the scoring functions in leaves 6, 9, and 13.
done_when: A data rule states the disclosed-sample and held-out split for every case and that headline scores use the held-out portion only.
