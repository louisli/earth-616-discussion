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
| Discussers | Muse bot, Perplexity bot, Claude bot (each in its own harness, using `gh`) | Research, write versions, vote | Approve leaves; resolve escalations; edit another model's files |
| Orchestrator | Bot side (scheduler) | Runs rounds, rotates order, builds blind ballots, tallies votes, applies circuit breakers, commits | Form opinions on content |
| Auditor | Claude Code | Checks each round against this file; can void a round | Judge whether an idea is good |
| Owner | Lou | Reviews bundle briefs, resolves escalations, final approval | Review every leaf |

The planner reads **only** `outbox/`.

## 1a. Bot contract

Each bot runs its own model in its own harness and works with this repo only through `git` and `gh`. The process doesn't care how a bot calls its model, which model version it uses, or how it searches. It only defines what a bot reads and writes.

**Each run, a bot follows its runbook** (`runbooks/discussion-bot.md`). In short:

1. **Find work.** List Issues labeled `vote:<me>` or `turn:<me>` (`STATE.md`). These labels are the only way a bot knows it has work.
2. **Claim and read.** Claim one Issue, then read only the inputs its position allows.
3. **Write.** Write only its own files, in the section 4a formats.
4. **Commit and push** under its own git identity. If the push is rejected, it pulls with rebase and pushes again.
5. **Hand off.** Swap labels to hand off to the next bot, then exit.

**Research.** Bots research with whatever their harness offers. A bot with no live web access says so in `research-<model>.md`, and cites only research ids from other bots' files (for example `A.R2`).

**Voting is blind by instruction.** A bot votes from `ballot/` only, and doesn't open `version-*` files or the git history for that round until its vote is pushed. The repo is shared, so this can't be enforced technically. Shuffled A/B/C labels still remove order bias, and the auditor flags any vote whose reasons quote a version file instead of the ballot.

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
inbox/                                  parking lot: raw material, NOT automated (see 3a)
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
lou_cycles: 0          # times this node went [need-lou] → [updated-lou]
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
- **Labels:** one `state:` label (the workflow state), plus `turn:` / `vote:` / `claimed:` while bots work, `topic:<topic>`, `depth:<n>` and `soft-go`. The full list is in `STATE.md`.
- **Comments:** one per round: the order, the vote tally per item, the outcome and the audit result.
- **Escalations.** The bot uses a title prefix as the handshake with Lou:
    1. **Escalate.** The bot adds the `state:needs-lou` label and puts `[need-lou]` at the start of the Issue title.
    2. **Reply.** Lou comments with a decision command (section 8b), then changes the prefix to `[updated-lou]`. That prefix is the signal to act.
    3. **Act.** The bot runs the command, removes the prefix, sets the new `state:` label, and comments what it did.
    - **No valid command.** If the bot finds `[updated-lou]` without a valid command, it reverts the prefix to `[need-lou]` and asks Lou to restate.
    - **Prefix removed without a command.** If Lou removes the prefix without leaving a command, the bot puts it back.
    - **Repeat cycles are normal.** A node can go `[need-lou]` → `[updated-lou]` → back into rounds → `[need-lou]` again, any number of times.
        - **Counter.** The prefix carries a counter: `[need-lou #2]`, then `[updated-lou #2]`. The count is stored in `node.md` as `lou_cycles`.
        - **Latest command wins.** On each `[updated-lou]`, the bot acts only on the **latest** command posted after the most recent `[need-lou]`. Earlier commands in the thread are history, not instructions.
        - **Cycle comment.** Each cycle gets one bot comment: what was escalated, what Lou decided, and what happened next. Reading the comments top-down tells the full story.
        - **Flag at 3+.** From the third cycle, the escalation comment adds a line noting that this node keeps coming back to Lou, and suggests `/reword`, `/pick` or `/park`. Nothing is forced; it's a prompt to try a different move instead of `/rerun` again.
- **Closing:** an issue closes when its node is approved (PR merged), or when it splits and all its children are closed.
- **Source of truth:** workflow state lives in Issue labels; content lives in files. See `STATE.md` for the labels, and `runbooks/` for what each role does in each state.

## 3a. Inbox: parking only

- **No automation.** `inbox/` is where anything gets parked: notes, chat dumps, links, half-ideas. No bot reads it, and no loop starts from it.
- **Promotion is manual.** Lou decides what is ready, then creates the topic folder (`topics/YYYY-MM-<topic>/`) with its `README.md` (Already decided) and seed discussions. This can be done alone or in a chat with Claude.
- **Promoted items leave the inbox.** They are moved, not copied, so the inbox only holds what hasn't been decided yet.
- **Planned change.** If promotion is ever automated, a separate intake process goes *before* the inbox. The inbox itself stays manual.

## 4. A round, step by step

1. **Model A** reads `README.md` (topic constraints), `overrides.md` and `node.md`. It writes `research-A` (every factual claim cited) and `version-A`.
2. **Model B** reads the same inputs plus A's research. It writes its own research and version. **It must state where it agrees and disagrees with A, and why.**
3. **Model C** reads the same inputs plus A's and B's research. It writes its research and version, stating its agreements and disagreements with both.
4. **Blind vote.**
    - The orchestrator lines the versions up **by item id** (section 4a). This is mechanical, because every version uses the required format. It then anonymizes the versions as A/B/C and shuffles them.
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

## 4a. Required formats

Models must write in these formats, so the orchestrator can line items up and tally votes **without judging content**. A file that doesn't parse forfeits that model's turn for the round, and the auditor logs it.

**Item ids are stable.**
- Accepted items in `node.md` have ids `I1, I2, …`. An id never changes or gets reused for something else.
- In a round, a model must address **every existing id**: keep and treat it, or drop it with a reason.
- A model adds new items as `NEW1, NEW2, …`. The orchestrator assigns the next free `I` id after the round.
- Model B and model C must also address the `NEW` items from earlier models in the same round, using `A.NEW1` style references.

### `research-<model>.md`

```markdown
---
node: 03.2
model: perplexity
round: 2
---
## R1
claim: <one factual claim>
source: <url>
accessed: 2026-10-22
## R2
...
```

### `version-<model>.md`

```markdown
---
node: 03.2
model: muse
round: 2
---
## Summary
<one sentence: what this node is>

## I1                                  # existing id, or NEW1 / A.NEW1 for new items
action: keep | drop                   # drop needs a reason
type: decision | research | build | question | claim
statement: <one sentence>
options: [<opt 1>, <opt 2>]           # decision only
recommendation: <opt>                 # decision only
reason: <one line>
evidence: [R1, R3]                    # ids from research files; any model's, e.g. A.R2
agrees_with: [A, B]                   # B and C only: which earlier versions this matches
disagrees_with: [A]                   # B and C only, each with a reason below
disagreement_reason: <one line>
split_into: [<child title>, ...]      # optional: proposes this item becomes child nodes

## Atomic
verdict: leaf | split | revise
failed_tests: [1, 4]                  # numbers from section 5, if not leaf
```

### Ballot (orchestrator builds it)

There is one block per item id. Each block shows up to three treatments labeled A/B/C in shuffled order. A version that dropped the item appears as `dropped: <reason>`.

### `vote-<model>.md`

```markdown
---
node: 03.2
model: claude
round: 2
---
I1: B — <one-line reason>
I2: none — <reason>                   # none = no treatment is acceptable
I3: drop — <reason>                   # vote to remove the item
NEW1: A — <reason>
atomic: leaf | split | revise — <reason>
```

**Tally rules.** These are applied per item, and the section 4 table applies.
- **Same letter, or both `drop`:** counts as agreement.
- **`none`:** counts as support for no version.
- **3-way split:** escalates.

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
| Node budget | Token cap per node, only if the bot's harness reports usage (optional) |
| Tree size | > 50 nodes per topic |

The round limit is not a breaker: hitting it pauses the node (section 2). Breakers are kept across attempts; `/rerun` never resets `version_hashes`, so a node that keeps circling is still caught.

A stuck node goes to `escalations.md` with its last 2–3 versions, the breaker that tripped, and the last objection. Lou responds with a decision command (section 8b).

## 7. Audit checklist (Claude Code, after every round)

- [ ] Every factual claim in `research-*` has a source.
- [ ] B referenced A's research; C referenced both; each stated its agreements and disagreements.
- [ ] Ballots were anonymized, and `key.md` was committed after all votes.
- [ ] Every vote has a reason, and every file matches the formats in section 4a.
- [ ] Every existing item id was addressed (kept or dropped with a reason) by every version.
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
