#!/usr/bin/env bash
# Creates (or updates) every label in AGENTS.md section 6. Safe to re-run.
# Usage: scripts/setup-labels.sh [owner/repo]
set -euo pipefail
REPO="${1:-louisli/earth-616-discussion}"

label() { gh label create "$1" -R "$REPO" --color "$2" --description "$3" --force >/dev/null && echo "ok  $1"; }

# state: (exactly one per node Issue)
label "state:queued"      "c5def5" "Waiting for dependencies or its turn"
label "state:turn"        "0e8a16" "A discussion bot is writing; see turn:"
label "state:ballot"      "fbca04" "Orchestrator builds the ballot"
label "state:voting"      "fbca04" "Bots voting; see vote:"
label "state:audit"       "5319e7" "Auditor checks the round"
label "state:audited"     "5319e7" "Orchestrator applies the outcome"
label "state:needs-lou"   "d93f0b" "Waiting on Lou ([need-lou #n] in title)"
label "state:paused"      "d93f0b" "Round limit reached for this attempt"
label "state:stuck"       "b60205" "Circuit breaker tripped"
label "state:leaf"        "0e8a16" "Atomic; waiting for its bundle"
label "state:split"       "bfdadc" "Replaced by child sub-issues"
label "state:approved"    "0e8a16" "Bundle PR merged"
label "state:rejected"    "000000" "Rejected by Lou"
label "state:parked"      "cccccc" "Shelved by Lou"

# turn: / vote: / claimed:
for b in muse groky claude; do
  label "turn:$b"    "1d76db" "$b's version turn"
  label "vote:$b"    "1d76db" "$b still owes a vote"
  label "claimed:$b" "ededed" "Lease: a $b run is working on this"
done
label "claimed:auditor"      "ededed" "Lease: auditor run in progress"

# qualifiers
label "bot-error" "b60205" "A bot or the auditor hit an error here; orchestrator clears it"
label "soft-go" "f9d0c4" "Accepted with an attached dissent"
for d in 0 1 2 3 4 5; do label "depth:$d" "f5f5f5" "Tree depth $d"; done
label "kind:topic" "0052cc" "Topic Issue"
label "kind:node"  "bfd4f2" "Node Issue"
label "kind:status" "5319e7" "The bot session status Issue"
for b in muse groky claude; do label "session:$b" "0e8a16" "A $b session is running (added at start, removed at end)"; done
for t in active done parked rejected; do label "topic-state:$t" "006b75" "Topic is in topics/$t/"; done
label "topic:001" "006b75" "Topic 001 — prompt optimizer arena"
