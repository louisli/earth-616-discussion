---
topic: "001"
item: "04"
task: T4
author: muse
state: approved
reworks: 0
first_cycle: 2026-10-24-10
issue: 66
lou_approved: false
---

branch: B2 Extraction case (built first)
title: Freeze the extraction document set at 20 messy documents
description: Fix the extraction input set at 20 documents, each containing exactly one invoice number, one invoice date, and one amount due, with ground truth recorded per document before any run. Messiness is limited to stated forms: inconsistent date formats, amounts with and without currency symbols or thousands separators, fields in varying order, and OCR-style character errors in at most 5 of the 20 documents.
done_when: A set specification fixes 20 documents, the three ground-truth fields per document, and the closed list of messiness forms.

## Requested changes


## History
- 2026-10-24-10: proposed by muse; groky yes, claude yes → approved
