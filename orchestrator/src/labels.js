// Every workflow label (AGENTS.md section 6). Kept in sync with scripts/setup-labels.sh.
import { BOTS } from './rules.js';

export function standardLabels() {
  const L = [
    // item states
    ['state:todo', 'c5def5', 'Item waiting to be broken down'],
    ['state:working', '0e8a16', 'Item in the current cycle (see phase in the header)'],
    ['state:waiting', 'fbca04', 'Item broken down; some tasks still in rework'],
    ['state:done', '0e8a16', 'Item has no task left in review or rework'],
    // task states
    ['state:approved', '0e8a16', 'Task: both reviewers voted yes; auditor next'],
    ['state:more-review', 'fbca04', 'Task: mixed votes; author reworks next cycle'],
    ['state:rework', '1d76db', 'Task: being reworked this cycle'],
    ['state:blocked', 'b60205', 'Task: still more-review after 2 reworks; auditor next'],
    ['state:exported', '5319e7', 'Task: exported to the target repo'],
    // shared
    ['state:rejected', '000000', 'Rejected'],
    ['state:needs-lou', 'd93f0b', 'Waiting on Lou ([need-lou #n] in title)'],
    ['state:parked', 'cccccc', 'Shelved by Lou'],
    ['claimed:auditor', 'ededed', 'Lock: an auditor run is working here'],
    ['bot-error', 'b60205', 'A bot or the auditor hit an error here; orchestrator clears it'],
    ['lou-approved', '0e8a16', 'Lou approved or reworded this task himself'],
    ['kind:topic', '0052cc', 'Topic Issue'],
    ['kind:item', 'bfd4f2', 'Item Issue'],
    ['kind:task', 'd4c5f9', 'Task Issue'],
    ['kind:status', '5319e7', 'The bot status Issue'],
  ];
  for (const b of BOTS) {
    L.push([`todo:${b}`, '1d76db', `${b} has work on this item in the current window`]);
    L.push([`claimed:${b}`, 'ededed', `Lock: a ${b} run is working here`]);
  }
  for (const t of ['active', 'done', 'parked', 'rejected']) L.push([`topic-state:${t}`, '006b75', `Topic is in topics/${t}/`]);
  return L;
}

/** Labels from the old round design, safe to delete. */
export const OBSOLETE_LABELS = [
  'state:queued', 'state:turn', 'state:ballot', 'state:voting', 'state:audit', 'state:audited', 'state:paused', 'state:stuck',
  'state:leaf', 'state:split', 'soft-go', 'kind:node',
  ...['muse', 'groky', 'claude', 'perplexity'].flatMap((b) => [`turn:${b}`, `vote:${b}`, `session:${b}`]),
  'claimed:perplexity',
  ...[0, 1, 2, 3, 4, 5].map((d) => `depth:${d}`),
];
