# Result — 001/04 cycle 2026-10-24-10

16 tasks: 11 approved, 5 more review, 0 blocked, 0 rejected.

| Task | Author | Rework | Votes | Outcome | Title |
| --- | --- | --- | --- | --- | --- |
| T1 | muse | — | groky maybe, claude maybe | **more-review** | Build extraction first, then efficiency, then robustness |
| T2 | muse | — | groky yes, claude yes | **approved** | Map the three cases onto the item 03 category scheme |
| T3 | muse | — | groky yes, claude yes | **approved** | Define the common case specification format |
| T4 | muse | — | groky yes, claude yes | **approved** | Freeze the extraction document set at 20 messy documents |
| T5 | muse | — | groky yes, claude yes | **approved** | Write the extraction naive baseline prompt verbatim |
| T6 | muse | — | groky yes, claude yes | **approved** | Define extraction scoring as per-field precision and recall |
| T7 | muse | — | groky maybe, claude maybe | **more-review** | Freeze the efficiency repo fixture at about 50 files and about 10MB |
| T8 | muse | — | groky yes, claude maybe | **more-review** | Write the efficiency naive baseline prompt verbatim |
| T9 | muse | — | groky yes, claude yes | **approved** | Define efficiency scoring as correctness gated on tokens to correct answer |
| T10 | muse | — | groky yes, claude yes | **approved** | Freeze the robustness label set at six customer intents |
| T11 | muse | — | groky yes, claude yes | **approved** | Freeze the robustness input set at 50 messages with fixed messiness slices |
| T12 | muse | — | groky yes, claude yes | **approved** | Write the robustness naive baseline prompt verbatim |
| T13 | muse | — | groky yes, claude maybe | **more-review** | Define robustness scoring as accuracy on the full messy set |
| T14 | muse | — | groky yes, claude yes | **approved** | Cap and cache the 10MB efficiency baseline runs |
| T15 | muse | — | groky yes, claude yes | **approved** | Give each case one enterprise demo form |
| T16 | muse | — | groky maybe, claude maybe | **more-review** | Keep held-out ground truth hidden from optimizers |

## Comments on the proposal

- groky: Clear tree with a consistent case format; the main gap is that the efficiency fixture size isn't checked against the target model's context window, and the held-out split sizes aren't fixed.
- claude: Strong tree that settles the README's "first case to build" and "category schemes" conflicts. Two cross-leaf issues: (1) a 10MB fixture is roughly 2.5–3M tokens, above the context window of most target models, so the naive "load the whole fixture" baseline (T7, T8, T14) needs a defined behaviour when it doesn't fit; (2) T13 scores over all 50 messages while T16 says headline scores use the held-out portion only, so they contradict each other.
