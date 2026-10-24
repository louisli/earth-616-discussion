---
topic: "001"
item: "01"
cycle: 2026-10-24-06
reviewer: muse
---

# Review sheet: muse

Vote on every leaf (T<n>) below in `review-muse.md` (AGENTS.md 7.4): yes, no, or maybe with the changes you want. Comment on the tree as a whole in an optional `## Proposal` section.

# Proposal by groky

# Concept
> The enterprise product is a prompt scanner that runs entirely inside the customer's environment, like antivirus: a signed definitions bundle, built centrally from open and public sources, is pulled down to the client, and the engine checks prompts against it locally, so prompt content never leaves the customer. The answer to the starting question is yes, the engine runs fully client-side on definitions alone; the vendor never sees prompts. The branches fit together as the trust story a bank or healthcare security team would sign off on: a hard data boundary (B1), a definitions pipeline that only flows down (B2), a day-one knowledge base in four buckets (B3), deployment that gets to a first finding fast (B4), a compliance map they can check (B5), and a pitch that leads with leakage detection (B6).

# Branch B1 Data boundary
> What may and may not cross from the customer to the vendor, and how the engine works without seeing anything centrally.

## T1
branch: B1 Data boundary
title: Write the data-boundary spec listing every field allowed to leave the client
description: Write a one-page spec that states prompt content never leaves the customer environment, then lists each outbound field by name (for example definitions version, licence heartbeat, opt-in rule-hit counts). Anything not on the list is forbidden by default. This is the document a security reviewer signs against.
done_when: The spec exists with an explicit outbound field list, and none of the listed fields can contain prompt text.

## T2
branch: B1 Data boundary
title: Specify the scan engine as fully client-side with no network call at scan time
description: Document the engine's inputs as the local prompt plus the local definitions bundle only, with the scan path making zero network calls. This settles the starting question in favour of the airtight client-side version, which the Already decided antivirus model already implies.
done_when: The design doc shows a scan data-flow diagram whose only inputs are the local prompt and the local bundle, with no outbound arrow.

## T3
branch: B1 Data boundary
title: Define zero retention as the engine default
description: Specify that scanned prompts are held in memory only for the duration of a scan, with no content written to disk or logs unless the customer explicitly turns on a local retention setting. Findings store rule ids, severities and timestamps, never the matched text.
done_when: The spec states the default retention of prompt content as zero, and the findings record schema contains no prompt-text field.

## T4
branch: B1 Data boundary
title: Define opt-in telemetry as per-rule hit counts only
description: Specify the only telemetry the vendor may receive: aggregated counts per rule id per day, off by default, sent only after an admin opts in. These counts feed definition quality without revealing content.
done_when: The telemetry schema contains only rule id, date and count fields, and the default setting is documented as off.

# Branch B2 Definitions pipeline
> The format and delivery of the central definitions that are pushed down to clients, including air-gapped sites.

## T5
branch: B2 Definitions pipeline
title: Specify the signed definitions bundle format
description: Define the bundle as a versioned file of rules, each with id, bucket, detection pattern or check, severity and suggested fix, signed by the vendor key. The client refuses any bundle whose signature fails.
done_when: A schema for the bundle exists with every rule field named, and the spec states that the client rejects bundles with an invalid signature.

## T6
branch: B2 Definitions pipeline
title: Specify offline import of definitions bundles for air-gapped sites
description: Define how a customer with no outbound internet downloads a bundle on another machine and imports it as a file, with the same signature check as the online pull. Banks and hospitals often run isolated networks, so this path must exist from day one.
done_when: The spec describes a file-import path that applies the same signature verification as the online update channel.

# Branch B3 Day-one knowledge base
> The rules shipped on day one, in the four agreed buckets, plus where the client's own fill-in-the-blank template fits.

## T7
branch: B3 Day-one knowledge base
title: Write the day-one rules for the prompt-structure anti-patterns bucket
description: Write one rule each for vague instructions, missing context, no output format, conflicting directives and bloat, with a detection check, a severity and a suggested fix for each. These are the rules most users hit first.
done_when: The bucket file contains five rules, one per named anti-pattern, each with a detection check, severity and fix.

## T8
branch: B3 Day-one knowledge base
title: Write the day-one rules for the efficiency and cost bucket
description: Write rules for redundant context, verbose system prompts and cacheable static content, each with a detection check, a severity and an estimated token saving. The token-saving estimate backs the "cut token spend 15%" claim with a per-rule number.
done_when: The bucket file contains a rule for each of the three named patterns, each with a token-saving estimate.
sources: [https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching]

## T9
branch: B3 Day-one knowledge base
title: Write the day-one rules for the safety and leakage bucket
description: Write detection rules for credentials (API keys, tokens, private keys), PII (names with identifiers, emails, phone numbers, national ids, health record numbers) and internal identifiers (hostnames, ticket ids, project codenames supplied by the client). Credential patterns can start from public secret-scanning rule sets.
done_when: The bucket file contains rules covering all three groups, each rule tested against at least one positive and one negative sample.
sources: [https://github.com/gitleaks/gitleaks, https://owasp.org/www-project-top-10-for-large-language-model-applications/]

## T10
branch: B3 Day-one knowledge base
title: Write the day-one best-practice templates for four task types
description: Write one reference prompt template each for summarization, extraction, classification and agentic flows, with the fields a good prompt for that task must contain. Rules in other buckets point users to these templates as fixes.
done_when: Four templates exist, one per task type, each listing its required fields.

## T11
branch: B3 Day-one knowledge base
title: Map the client fill-in-the-blank template to the best-practice templates bucket
description: Record that the client's own fill-in-the-blank template is a customer-authored entry in the best-practice templates bucket, stored only in that client's private knowledge base and never sent up. This follows the Already decided rule that each client's private knowledge base stays with that client.
done_when: The knowledge-base spec states that client templates belong to the best-practice templates bucket and live only in the client's private knowledge base.

# Branch B4 Deployment and adoption
> How a security team installs the product in its own environment and how fast it shows value.

## T12
branch: B4 Deployment and adoption
title: Define the self-hosted install package as a container image with a Helm chart
description: Specify the deliverable a customer installs in its own VPC or data centre: one container image plus a Helm chart, with a single values file for the definitions source and admin account. This is the near one-click path for teams already on Kubernetes.
done_when: The spec names the image, the chart and every required value in the values file.

## T13
branch: B4 Deployment and adoption
title: Define time-to-first-value as minutes from install to first leakage finding
description: Define the adoption metric as the minutes from starting the install to the first leakage finding on the bundled sample prompt set, with a target of 30 minutes or less. Shipping a sample set with planted secrets makes the first finding guaranteed.
done_when: The metric definition, its 30-minute target and the sample prompt set with planted findings are documented.

# Branch B5 Compliance map
> The controls an approving security team checks (SOC 2 Type II, data residency, audit logs, RBAC), mapped to product features before any certification.

## T14
branch: B5 Compliance map
title: Write the compliance map table from control to feature and status
description: Write a table mapping each control a security reviewer asks about (SOC 2 Type II trust criteria, data residency, audit logs, RBAC) to the product feature that covers it and its status (built, planned, not covered). Data residency is answered by the client-side design, since content stays where the customer runs it.
done_when: The table covers all four control areas, and every row names a feature and a status.
sources: [https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2]

## T15
branch: B5 Compliance map
title: Specify the local audit log schema without prompt content
description: Define the audit log the engine writes locally: who ran or configured what, when, which bundle version and which rule ids fired, with no prompt text. It stays in the customer environment and can be exported to their own log system.
done_when: The audit log schema exists, and none of its fields holds prompt content.

## T16
branch: B5 Compliance map
title: Specify three RBAC roles for the admin console
description: Define the roles admin (settings, telemetry opt-in, users), rule author (client private rules and templates) and viewer (findings and audit log, read-only), with a permission matrix.
done_when: A permission matrix lists every console action against the three roles.

# Branch B6 Security-team pitch
> The message that turns the security team from gatekeeper into champion, led by leakage detection.

## T17
branch: B6 Security-team pitch
title: Write the security-team one-pager led by leakage detection
description: Write a one-page brief for bank and healthcare security teams that opens with leakage detection, uses the line "Antivirus for your AI prompts. Definitions push down, your data never goes up.", and points to the data-boundary spec and compliance map as proof. Pricing and competition stay out; they belong to item 02.
done_when: The one-pager exists, its first section is leakage detection, and it links the data-boundary spec and compliance map.
