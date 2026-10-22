# PROCESS — how a topic becomes a plan

This repo is the shared state. Bots run on a schedule, call the models, and commit every output here. Nothing lives only in a chat. If it isn't committed, it didn't happen.

```
inbox/ ─▶ topic ─▶ ┌─ ROUND (per node) ──────────────────────────────┐ ─▶ branch brief ─▶ Lou ─▶ outbox/ ─▶ planner
                   │ 1 research + version (model A)                    │
                   │ 2 research + version (model B, reads A)           │
                   │ 3 research + version (model C, reads A + B)       │
                   │ 4 blind vote (all 3) ─▶ tally                     │
                   │ 5 audit (Claude Code)                             │
                   │ 6 atomic test ─▶ leaf | split into children | stuck │
                   └──────────────── children re-enter the loop ───────┘
```

## 1. Roles

| Role | Who | Does | Never does |
| --- | --- | --- | --- |
| Discussers | Muse, Perplexity, Claude | Research, write versions, vote | Approve leaves; resolve escalations; edit another model's files |
| Orchestrator | Bot side (scheduler) | Runs rounds, rotates order, builds blind ballots, tallies votes, applies circuit breakers, commits | Form opinions on content |
| Auditor | Claude Code | Checks each round against this file; can void a round | Judge whether an idea is good |
| Owner | Lou | Reviews branch briefs, resolves escalations, final approval | Review every leaf |

The planner reads **only** `outbox/`.

## 2. Schedule

- **One round per node per cycle.** A cycle is **20 minutes**:

| Minute | Step |
| --- | --- |
| 0–5 | Model A: research + version |
| 5–10 | Model B: research + version |
| 10–15 | Model C: research + version |
| 15–20 | Blind vote (all three in parallel), tally, audit, atomic test |

- **Slots are "up to 5 minutes."** A model that times out forfeits its version for that round, and the round continues with two.
- **Rotation.** The order rotates every round: Muse → Perplexity → Claude, then Perplexity → Claude → Muse, then Claude → Muse → Perplexity. The order is recorded in `order.md`.

## 3. Repo layout

```
inbox/                                  raw material, dropped in as-is
outbox/                                 approved plans for the planner
topics/YYYY-MM-<topic>/
  README.md                             overview + Already decided (constraints)
  tree.md                               generated: whole tree, status per node
  escalations.md                        open items waiting on Lou
  overrides.md                          Lou's redirect reasons (fed to every model)
  audit-log.md                          one line per audit result
  briefs/<branch-id>.md                 branch briefs for Lou
  nodes/<id>/
    node.md                             current accepted version + frontmatter
    rounds/rNN/
      order.md                          rotation for this round
      research-<model>.md               sources + findings
      version-<model>.md                that model's version of the node
      ballot/A.md B.md C.md             anonymized, shuffled copies (orchestrator)
      vote-<model>.md                   votes per item
      ballot/key.md                     label → model; committed only AFTER all votes are in
      result.md                         tally + outcome (orchestrator)
      audit.md                          pass/void + reasons (auditor)
    <child-id>/...                      children nest under their parent
```

**Write rules (to avoid conflicts):**
- Each model writes only files with its own name.
- The orchestrator writes `order.md`, `ballot/`, `result.md`, `node.md`, `tree.md` and `escalations.md`.
- The auditor writes `audit.md` and `audit-log.md`.
- **Node ids** follow the tree: `03`, `03.2`, `03.2.1`.

### `node.md` frontmatter

```yaml
id: 03.2
parent: "03"
depth: 2
title: Choose entrants
status: in-loop        # in-loop | leaf | split | stuck | escalated | approved
round: 2
version_hashes: []     # hash of each accepted version, for ping-pong detection
tokens_used: 0
```

## 4. A round, step by step

1. **Model A** reads `README.md` (topic constraints), `overrides.md` and `node.md`. It writes `research-A` (every factual claim cited) and `version-A`.
2. **Model B** reads the same inputs plus A's research. It writes its own research and version. **It must state where it agrees and disagrees with A, and why.**
3. **Model C** reads the same inputs plus A's and B's research. It writes its research and version, stating its agreements and disagreements with both.
4. **Blind vote.**
    - The orchestrator splits each version into **items** (each proposed sub-idea, decision or claim), anonymizes the versions as A/B/C and shuffles them.
    - Each model votes **per item**: which version's treatment it prefers, or "none," with one line of reason.
    - Models vote without seeing each other's votes.
5. **Tally per item:**

| Votes | Outcome |
| --- | --- |
| 3/3 same | **Go**: accepted into `node.md` |
| 2/3 same | **Soft go**: accepted, dissent attached; same dissent next round → escalate |
| 3-way split | **Need help**: added to `escalations.md` with all three side by side |
| No support | **Rework**: back into next round (counts toward breakers) |

6. **Audit** (section 7). A voided round is discarded for the affected node.
7. **Atomic test** (section 5) on the updated node. The outcome is **leaf**, **split** into children (each starting at round 1), or **revise** (another round).

## 5. Atomic test: a node is a leaf only if all 5 pass

1. **One sentence.** It can be stated in one sentence with no "and."
2. **One owner, one outcome.** One agent or person can finish it, with one checkable result.
3. **Testable done.** The acceptance criteria can be written as pass/fail.
4. **No open decisions.** Every choice inside it is made, or escalated.
5. **Stable.** Another breakdown pass returns the same node or nothing new.

All three models must vote "atomic" (3/3). A 2/3 vote means one more round.

## 6. Circuit breakers: any one marks the node `stuck`

| Breaker | Limit |
| --- | --- |
| Depth | > 4 levels |
| Rounds on one node | > 3 |
| Ping-pong | New accepted version matches an earlier `version_hashes` entry |
| Child = parent | Child ≥ ~90% similar to its parent |
| Node budget | Token cap per node (set per topic) |
| Tree size | > 50 nodes per topic |

A stuck node goes to `escalations.md` with its last 2–3 versions, the breaker that tripped, and the last objection. Once Lou decides, the node re-enters with counters reset.

## 7. Audit checklist (Claude Code, after every round)

- [ ] Every factual claim in `research-*` has a source.
- [ ] B referenced A's research; C referenced both; each stated its agreements and disagreements.
- [ ] Ballots were anonymized, and `key.md` was committed after all votes.
- [ ] Every vote has a reason.
- [ ] The tally matches the votes.
- [ ] Nothing contradicts the topic's **Already decided** without being escalated.
- [ ] The atomic test was applied to any node marked `leaf`.
- [ ] Breaker counters were updated and limits respected.
- [ ] No model wrote outside its own files.
- [ ] Nothing was marked `approved` except by Lou.

**Result:** `pass`, or `void` with the failed items. Repeated violations by the same model are flagged in `audit-log.md`.

## 8. Lou's review: branch level, by exception

- **Branch:** the lowest node whose subtree holds about **3–10 leaves**. When all its leaves are done, the orchestrator writes `briefs/<branch-id>.md`:
    - What the branch delivers (2–3 sentences)
    - Decisions made, each with vote result (3/3 or 2/3) and one-line reason
    - Assumptions
    - Flags (below)
    - Leaf count, depth, tokens used
    - 1 random leaf shown in full (spot check)
- **Lou's options:** **approve** (all leaves under the branch), **redirect** (one line of feedback goes to `overrides.md`, and the branch re-enters the loop) or **drill in**.
- **Flags.** These always reach Lou, even under an approved branch:
    - Contradicts Already decided
    - Soft go whose dissent persisted
    - Hard to undo, costs money, or public-facing
    - Stuck
- **Calibration.** The first branch is reviewed at both brief and leaf level. As redirects drop, spot checks go down and branch size goes up. If redirects rise, tighten again.

## 9. Output to the planner

When Lou approves a branch, the orchestrator compiles `outbox/YYYY-MM-DD-<topic>-<branch>.md`:

```
Goal · Decisions (with reasons) · Scope / Out of scope · Tasks (one per leaf, with acceptance criteria) · Dependencies · Open risks · Source: link to branch brief
```
