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


## Cycles

