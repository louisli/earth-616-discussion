---
topic: "001"
item: "01"
task: T12
author: groky
state: more-review
reworks: 0
first_cycle: 2026-10-24-06
issue: 35
lou_approved: false
---

branch: B4 Deployment and adoption
title: Define the self-hosted install package as a container image with a Helm chart
description: Specify the deliverable a customer installs in its own VPC or data centre: one container image plus a Helm chart, with a single values file for the definitions source and admin account. This is the near one-click path for teams already on Kubernetes.
done_when: The spec names the image, the chart and every required value in the values file.

## Requested changes
- 2026-10-24-06 proposal — muse: The tree covers the trust story well, but B2 has no leaf for rolling back or pinning a bad definitions bundle — antivirus-style updates need a staged rollout and rollback path, or a faulty bundle breaks every client at once.
- 2026-10-24-06 proposal — claude: A strong, coherent trust story that answers the starting question cleanly. One missing part: B2 has bundle signing but no leaf for signing-key management (key rotation, revocation, and how a client learns a key was revoked, including air-gapped sites). Security reviewers at banks will ask for it, and without it T5 and T6 can't be fully planned.
- 2026-10-24-06 muse (maybe): Either add a non-Kubernetes install path (for example a VM or single-binary install) or state explicitly that Helm is the first supported path and record the exclusion as a decision for Lou.

## History
- 2026-10-24-06: proposed by groky; muse maybe, claude yes → more-review
