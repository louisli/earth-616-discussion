---
topic: "001"
item: "01"
task: T9
author: groky
state: approved
reworks: 0
first_cycle: 2026-10-24-06
issue: 32
lou_approved: false
---

branch: B3 Day-one knowledge base
title: Write the day-one rules for the safety and leakage bucket
description: Write detection rules for credentials (API keys, tokens, private keys), PII (names with identifiers, emails, phone numbers, national ids, health record numbers) and internal identifiers (hostnames, ticket ids, project codenames supplied by the client). Credential patterns can start from public secret-scanning rule sets.
done_when: The bucket file contains rules covering all three groups, each rule tested against at least one positive and one negative sample.
sources: [https://github.com/gitleaks/gitleaks, https://owasp.org/www-project-top-10-for-large-language-model-applications/]

## Requested changes


## History
- 2026-10-24-06: proposed by groky; muse yes, claude yes → approved
