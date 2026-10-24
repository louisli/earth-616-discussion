#!/usr/bin/env bash
# Creates (or updates) every label in AGENTS.md section 6, and deletes labels from the old round design.
# Safe to re-run. Usage: scripts/setup-labels.sh [owner/repo]
set -euo pipefail
REPO="${1:-louisli/earth-616-discussion}"

label() { gh label create "$1" -R "$REPO" --color "$2" --description "$3" --force >/dev/null && echo "ok  $1"; }

# item states
label "state:todo"        "c5def5" "Item waiting to be broken down"
label "state:working"     "0e8a16" "Item in the current cycle (see phase in the header)"
label "state:waiting"     "fbca04" "Item broken down; some tasks still in rework"
label "state:done"        "0e8a16" "Item has no task left in review or rework"
# task states
label "state:approved"    "0e8a16" "Task: both reviewers voted yes; auditor next"
label "state:more-review" "fbca04" "Task: mixed votes; author reworks next cycle"
label "state:rework"      "1d76db" "Task: being reworked this cycle"
label "state:blocked"     "b60205" "Task: still more-review after 2 reworks; auditor next"
label "state:exported"    "5319e7" "Task: exported to the target repo"
# shared
label "state:rejected"    "000000" "Rejected"
label "state:needs-lou"   "d93f0b" "Waiting on Lou ([need-lou #n] in title)"
label "state:parked"      "cccccc" "Shelved by Lou"

for b in muse groky claude; do
  label "todo:$b"    "1d76db" "$b has work on this item in the current window"
  label "claimed:$b" "ededed" "Lock: a $b run is working here"
done
label "claimed:auditor" "ededed" "Lock: an auditor run is working here"
label "bot-error"    "b60205" "A bot or the auditor hit an error here; orchestrator clears it"
label "lou-approved" "0e8a16" "Lou approved or reworded this task himself"
label "kind:topic"   "0052cc" "Topic Issue"
label "kind:item"    "bfd4f2" "Item Issue"
label "kind:task"    "d4c5f9" "Task Issue"
label "kind:status"  "5319e7" "The bot status Issue"
for t in active done parked rejected; do label "topic-state:$t" "006b75" "Topic is in topics/$t/"; done
label "topic:001" "006b75" "Topic 001 — prompt optimizer arena"

# old round design
for l in state:queued state:turn state:ballot state:voting state:audit state:audited state:paused state:stuck \
         state:leaf state:split soft-go kind:node claimed:perplexity \
         depth:0 depth:1 depth:2 depth:3 depth:4 depth:5; do
  gh label delete "$l" -R "$REPO" --yes >/dev/null 2>&1 && echo "del $l" || true
done
for b in muse groky claude perplexity; do
  for p in turn vote session; do gh label delete "$p:$b" -R "$REPO" --yes >/dev/null 2>&1 && echo "del $p:$b" || true; done
done
