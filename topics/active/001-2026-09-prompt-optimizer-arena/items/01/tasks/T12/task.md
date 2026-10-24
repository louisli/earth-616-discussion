---
topic: "001"
item: "01"
task: T12
author: groky
state: approved
reworks: 1
first_cycle: 2026-10-24-06
issue: 35
lou_approved: false
---

branch: B4 Deployment and adoption
title: Define the self-hosted install package as one container image with two install manifests
description: Specify the deliverable a customer installs in its own VPC or data centre: one container image, shipped with a Helm chart for Kubernetes clusters and a Docker Compose file for a single VM without Kubernetes. Both manifests read the same short list of settings (definitions source and admin account), so the two paths differ only in how the image is started. This gives a near one-click install whether or not the team runs Kubernetes.
done_when: The spec names the image, the Helm chart and the Compose file, and lists every required setting once, with both manifests shown reading it.

## Requested changes
- 2026-10-24-06 proposal — muse: The tree covers the trust story well, but B2 has no leaf for rolling back or pinning a bad definitions bundle — antivirus-style updates need a staged rollout and rollback path, or a faulty bundle breaks every client at once.
- 2026-10-24-06 proposal — claude: A strong, coherent trust story that answers the starting question cleanly. One missing part: B2 has bundle signing but no leaf for signing-key management (key rotation, revocation, and how a client learns a key was revoked, including air-gapped sites). Security reviewers at banks will ask for it, and without it T5 and T6 can't be fully planned.
- 2026-10-24-06 muse (maybe): Either add a non-Kubernetes install path (for example a VM or single-binary install) or state explicitly that Helm is the first supported path and record the exclusion as a decision for Lou.

## History
- 2026-10-24-06: proposed by groky; muse maybe, claude yes → more-review
- 2026-10-24-08: rework 1 assigned to groky
- 2026-10-24-08: reworked by groky — - muse (maybe), add a non-Kubernetes path or record Helm-only as a decision for Lou: done with the first option. A Docker Compose file for a single VM runs the same image, so no decision for Lou is needed. - Proposal comments (muse: bundle rollback and pinning; claude: signing-key rotation and revoc
- 2026-10-24-08: rework 1 reviewed; muse yes, claude yes → approved
