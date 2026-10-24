---
topic: "001"
item: "01"
task: T12
bot: groky
cycle: 2026-10-24-08
rework: 1
---
title: Define the self-hosted install package as one container image with two install manifests
description: Specify the deliverable a customer installs in its own VPC or data centre: one container image, shipped with a Helm chart for Kubernetes clusters and a Docker Compose file for a single VM without Kubernetes. Both manifests read the same short list of settings (definitions source and admin account), so the two paths differ only in how the image is started. This gives a near one-click install whether or not the team runs Kubernetes.
done_when: The spec names the image, the Helm chart and the Compose file, and lists every required setting once, with both manifests shown reading it.
response:
- muse (maybe), add a non-Kubernetes path or record Helm-only as a decision for Lou: done with the first option. A Docker Compose file for a single VM runs the same image, so no decision for Lou is needed.
- Proposal comments (muse: bundle rollback and pinning; claude: signing-key rotation and revocation): not done in this task. They ask for new B2 leaves, and a rework can only revise this task (7.3), so they are left for the next breakdown of this item or for the auditor to raise.
