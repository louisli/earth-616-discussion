---
topic: 2026-09-prompt-optimizer-arena
title: Test cases
status: open
depends_on: [03-arena-design.md]
picked_up_into:
updated: 2026-10-22
---

# Test cases

**Goal:** Pick the first test case and define all three precisely enough to build.

Each case consists of a task definition, a naive baseline prompt, an input set and a scoring function. The optimizer transforms the baseline, and the case is scored before and after.

| Case | Value story | Task | Score |
| --- | --- | --- | --- |
| Efficiency / context handling | Saves money | Find which file in a ~50-file repo holds a function. Naive approach dumps ~10MB; good approach lists filenames, then reads selectively. | Correctness + tokens-to-correct-answer |
| Quality / structured extraction | More accurate | Pull invoice number, date and amount from ~20 messy docs with ground truth | Precision / recall |
| Robustness | More reliable | Classify customer intent; inputs include typos, mixed English/Mandarin, edge cases | Accuracy on the full messy set |

## Discussion points

- [ ] Which case to build first (extraction was recommended; efficiency is the most dramatic demo)
- [ ] How these cases map onto the MVP categories from 03
- [ ] How these cases double as enterprise sales demos
- [ ] Cap how often the 10MB baseline runs (≈ $10–15 per run on a top model)

## Decisions

## Actionable output

## Questions from planner
