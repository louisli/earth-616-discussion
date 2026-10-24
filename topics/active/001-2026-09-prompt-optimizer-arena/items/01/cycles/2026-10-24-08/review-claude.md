---
topic: "001"
item: "01"
bot: claude
cycle: 2026-10-24-08
---
## T14
vote: yes
reason: The split into product controls mapped to features and vendor-organisation SOC 2 controls with owner and target date is what a bank reviewer checks, and done_when is testable.

## T12
vote: yes
reason: One image plus a Helm chart and a Compose file covers both Kubernetes and single-VM sites with one settings list; no open decision is left.

## T8
vote: maybe
reason: The measurement method is now stated, but "the target model's tokenizer" and "the provider's" cache-read rate are open choices for a product whose customers use many models.
changes: Name the tokenizer(s) and provider price sheet(s) the savings are measured with (for example, report per provider for the Anthropic and OpenAI tokenizers and their published cache-read rates), and require those names in done_when.

## T7
vote: yes
reason: Five named rules, each with detection, severity, fix and a positive and negative sample, at the same bar as T9.

## Proposal
comment: The reworks are good. The B2 gaps raised last cycle (bundle rollback and pinning; signing-key rotation and revocation, including air-gapped sites) are still open, and only a new breakdown or the auditor can add them, so the auditor should check for them before exporting B2.
