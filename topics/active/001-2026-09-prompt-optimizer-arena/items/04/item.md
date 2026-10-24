---
bot_errors: {}
dead_locks: {}
next_task: 17
topic: "001"
item: "04"
title: Test cases
priority: 3
depends_on:
  - "03"
---

# 04 Test cases

**Goal:** Pick the first test case and define all three precisely enough to build.

## Starting points
- Which case to build first (extraction was recommended; efficiency is the most dramatic demo)
- How these cases map onto the MVP categories from 03
- How these cases double as enterprise sales demos
- Cap how often the 10MB baseline runs (≈ $10–15 per run on a top model)

## Concept
The three starter cases become one buildable case pack built in a fixed order — structured extraction first, efficiency second, robustness third — where every case is specified in the same format (task definition, verbatim naive baseline prompt, frozen input set with ground truth, and a deterministic scoring function), extraction anchors the shared extraction category from item 03, efficiency anchors coding-style search, robustness is treated as a cross-cutting dimension measured on messy inputs, and every case doubles as an enterprise demo with its expensive runs capped and cached.

- **B1 Order, mapping, and the common case format:** Decides which case is built first, how the three cases relate to the MVP categories from item 03, and the one specification format every case must use.
- **B2 Extraction case (built first):** Defines the quality case: pulling invoice number, date, and amount from messy documents against known ground truth, scored by precision and recall.
- **B3 Efficiency case (built second):** Defines the context-handling case: finding which file in a large repo holds a function, scored by correctness gated on token cost.
- **B4 Robustness case (built third):** Defines the reliability case: classifying customer intent on inputs with typos, mixed English and Mandarin, and edge cases, scored by accuracy on the full messy set.
- **B5 Cost control and enterprise demo reuse:** Caps and caches the expensive baseline runs, keeps held-out ground truth hidden from optimizers, and gives each case a sales-demo form.

_From muse's proposal, cycle 2026-10-24-10._

## Tasks
<!-- Every task of this item and its state. Don't propose duplicates of approved or exported ones. -->
- T1 (more-review, muse): Build extraction first, then efficiency, then robustness
- T2 (approved, muse): Map the three cases onto the item 03 category scheme
- T3 (approved, muse): Define the common case specification format
- T4 (approved, muse): Freeze the extraction document set at 20 messy documents
- T5 (approved, muse): Write the extraction naive baseline prompt verbatim
- T6 (approved, muse): Define extraction scoring as per-field precision and recall
- T7 (more-review, muse): Freeze the efficiency repo fixture at about 50 files and about 10MB
- T8 (more-review, muse): Write the efficiency naive baseline prompt verbatim
- T9 (approved, muse): Define efficiency scoring as correctness gated on tokens to correct answer
- T10 (approved, muse): Freeze the robustness label set at six customer intents
- T11 (approved, muse): Freeze the robustness input set at 50 messages with fixed messiness slices
- T12 (approved, muse): Write the robustness naive baseline prompt verbatim
- T13 (more-review, muse): Define robustness scoring as accuracy on the full messy set
- T14 (approved, muse): Cap and cache the 10MB efficiency baseline runs
- T15 (approved, muse): Give each case one enterprise demo form
- T16 (more-review, muse): Keep held-out ground truth hidden from optimizers

## Cycles
- 2026-10-24-10: author muse; 16 tasks: 11 approved, 5 more review, 0 blocked, 0 rejected
