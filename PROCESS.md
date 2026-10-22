# PROCESS — how a topic becomes a plan

This repo is the shared state. Bots run on a schedule, call the models, and commit every output here. Nothing lives only in a chat. If it isn't committed, it didn't happen.

```
inbox/ ─▶ topic ─▶ ┌─ ROUND (per node) ──────────────────────────────┐ ─▶ bundle brief ─▶ Lou ─▶ outbox/ ─▶ planner
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
| Owner | Lou | Reviews bundle briefs, resolves escalations, final approval | Review every leaf |

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
- **Up to 6 rounds per attempt** (max ~2 hours of wall-clock time). A node exits early as soon as one of these happens:
    - **Converged:** every item went 3/3, and the atomic test returned leaf or split.
    - **No change:** the accepted version is unchanged from the previous round.
    - **Escalated:** everything still open is waiting on Lou, so another round can't settle it.

  Round 6 ending without an exit **pauses** the node (`status: paused`). It is not a failure. The node waits for one of Lou's decisions (section 8b); `/rerun` starts a new attempt and round numbers continue (`r07`, `r08`, ...).

  Each attempt is logged in `node.md`, so it's visible how many rounds a node needed in total.
- **Sequential for now.** One root discussion loops at a time, in the order its `depends_on` allows (topic README gives the suggested order). Parallel loops may be enabled later, but only for roots with no dependency on each other.
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
  briefs/<bundle-id>.md                 bundle briefs for Lou
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
status: in-loop        # in-loop | leaf | split | paused | stuck | escalated | approved | rejected | parked
attempt: 1             # incremented by each /rerun
round: 2               # keeps counting across attempts
round_limit: 6         # last round allowed in this attempt
version_hashes: []     # hash of each accepted version, for ping-pong detection
tokens_used: 0
issue: 42              # GitHub Issue number mirroring this node
```

### Where things live: `main`, loop branches, Issues

| Place | Holds | Written by |
| --- | --- | --- |
| **`main`** | Instructions and the master list: `PROCESS.md`, `TEMPLATE.md`, `MASTER.md`, each topic's `README.md` (Already decided), `overrides.md`, `escalations.md`, `tree.md`, and `outbox/` | Orchestrator (master list and outbox), Lou (instructions) |
| **Loop branch** `loop/<topic>/<root-id>` | Everything a discussion loop produces: `nodes/<id>/` with all rounds, research, versions, ballots, votes and audits. One branch per root discussion; its child nodes stay on the same branch. | Models, orchestrator, auditor |
| **Issues** | One issue per node, so the discussion is visible without reading files | Orchestrator |

**Rules:**
- **Loops read instructions from `main`.** At the start of every round, the orchestrator merges the latest `main` into the loop branch. A change to `PROCESS.md`, Already decided or `overrides.md` takes effect from the next round.
- **Master list (`MASTER.md` on `main`).** Every topic, root node and bundle, with status, current round, open escalations and a link to its branch and Issue. The orchestrator updates it after every round. It's the only file a loop updates on `main` mid-loop.
- **Bundles go to `main` through a PR.** When a bundle's leaves are done, the orchestrator opens a PR from the loop branch. The PR description is the bundle brief. **Lou merging the PR is the approval.** After the merge, the orchestrator compiles the plan into `outbox/` on `main`.
- **Anything other than a merge.** Lou uses a decision command (section 8b) as a PR comment. The PR stays open until the bundle comes back.

**Issues mirror every node:**
- **Title:** `[<topic>] <node-id> <node title>`
- **Body:** the node's current accepted version, plus links to the branch and `node.md`
- **Sub-issues:** a node's children are its sub-issues, so the tree is browsable in GitHub.
- **Labels:** `topic:<topic>`, `depth:<n>`, `status:<in-loop|leaf|split|paused|stuck|escalated|approved|rejected|parked>`, `soft-go` while a dissent is attached, `needs-lou` for escalations
- **Comments:** one per round: the order, the vote tally per item, the outcome and the audit result.
- **Escalations:** labeled `needs-lou`. Lou answers with a decision command (section 8b) in an issue comment.
- **Closing:** an issue closes when its node is approved (PR merged), or when it splits and all its children are closed.
- **Source of truth:** Issues are a view. If an issue and the repo disagree, the files win, and the orchestrator re-syncs the issue.

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
| Ping-pong | New accepted version matches an earlier `version_hashes` entry |
| Child = parent | Child ≥ ~90% similar to its parent |
| Node budget | Token cap per node (set per topic) |
| Tree size | > 50 nodes per topic |

The round limit is not a breaker: hitting it pauses the node (section 2). Breakers are kept across attempts; `/rerun` never resets `version_hashes`, so a node that keeps circling is still caught.

A stuck node goes to `escalations.md` with its last 2–3 versions, the breaker that tripped, and the last objection. Lou responds with a decision command (section 8b).

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

## 8. Lou's review: bundle level, by exception

- **Bundle:** the lowest node whose subtree holds about **3–10 leaves**. When all its leaves are done, the orchestrator writes `briefs/<bundle-id>.md`:
    - What the bundle delivers (2–3 sentences)
    - Decisions made, each with vote result (3/3 or 2/3) and one-line reason
    - Assumptions
    - Flags (below)
    - Leaf count, depth, tokens used
    - 1 random leaf shown in full (spot check)
- **Lou's options** (the brief is the PR description): merge the PR to accept everything, use any decision command in section 8b as a PR comment, or drill in by opening the leaves' Issues or files.
- **Flags.** These always reach Lou, even under an approved bundle:
    - Contradicts Already decided
    - Soft go whose dissent persisted
    - Hard to undo, costs money, or public-facing
    - Stuck
- **Calibration.** The first bundle is reviewed at both brief and leaf level. As Lou's non-accept commands (rerun, reject, pick, reword) become rarer, spot checks go down and bundle size goes up. If they rise, tighten again.

## 8b. Lou's decision commands

Whenever something reaches Lou (an escalation, a paused or stuck node, or a bundle PR), he replies with one command as a comment on the Issue or PR. Versions are shown as A/B/C. The model names are revealed in `ballot/key.md` after voting, so Lou can look, but the commands use letters.

| # | Command | What happens |
| --- | --- | --- |
| 1 | `/rerun [n]` | Send it back into rounds unchanged, for *n* more rounds (default 3). Starts a new attempt. |
| 2 | `/accept all` | Accept all versions together. If any of them contradict each other, the orchestrator lists the conflicts and asks again instead of guessing. |
| 3 | `/reject [reason]` | Reject it. The node is marked `rejected`, its Issue is closed as not planned, and the reason goes to `overrides.md` so the idea doesn't come back in another branch. |
| 4 | `/pick A` or `/pick A C` | Keep only the chosen version(s). With one pick, it is accepted as-is. With two picks, one **merge round** runs: the models combine only those two versions and may add nothing new. |
| 5 | `/reword <text>` | Lou's text becomes the node's new version and goes back into rounds. It is logged in `overrides.md` as Lou-authored: models may sharpen or split it, but may not contradict it. |
| — | `/park` | Shelve it for later, untouched. |

**Rules:**
- **The orchestrator executes; it doesn't interpret.** A command that doesn't parse gets a reply on the Issue asking Lou to restate it, and nothing changes.
- **Every command is logged in `overrides.md` on `main`,** with the node id, the command and its date. It becomes context for every model in later rounds. This is also the record of how often Lou had to step in.
- **Scope on a bundle PR:**
    - `/accept all` is the same as merging.
    - `/pick` takes leaf ids instead of letters, and keeps only those leaves.
    - `/reject` and `/reword` apply to the whole bundle unless leaf ids are given (for example, `/reject 03.2.1 out of scope`).

## 9. Output to the planner

When Lou approves a bundle, the orchestrator compiles `outbox/YYYY-MM-DD-<topic>-<bundle>.md`:

```
Goal · Decisions (with reasons) · Scope / Out of scope · Tasks (one per leaf, with acceptance criteria) · Dependencies · Open risks · Source: link to bundle brief
```
