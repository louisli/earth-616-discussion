// Every workflow label (AGENTS.md section 6). Kept in sync with scripts/setup-labels.sh.
import { BOTS } from './rules.js';

export function standardLabels() {
  const L = [
    ['state:queued', 'c5def5', 'Waiting for dependencies or its turn'],
    ['state:turn', '0e8a16', 'A discussion bot is writing; see turn:'],
    ['state:ballot', 'fbca04', 'Orchestrator builds the ballot'],
    ['state:voting', 'fbca04', 'Bots voting; see vote:'],
    ['state:audit', '5319e7', 'Auditor checks the round'],
    ['state:audited', '5319e7', 'Orchestrator applies the outcome'],
    ['state:needs-lou', 'd93f0b', 'Waiting on Lou ([need-lou #n] in title)'],
    ['state:paused', 'd93f0b', 'Round limit reached for this attempt'],
    ['state:stuck', 'b60205', 'Circuit breaker tripped'],
    ['state:leaf', '0e8a16', 'Atomic; waiting for its bundle'],
    ['state:split', 'bfdadc', 'Replaced by child sub-issues'],
    ['state:approved', '0e8a16', 'Bundle PR merged'],
    ['state:rejected', '000000', 'Rejected by Lou'],
    ['state:parked', 'cccccc', 'Shelved by Lou'],
    ['claimed:auditor', 'ededed', 'Lease: auditor run in progress'],
    ['bot-error', 'b60205', 'A bot or the auditor hit an error here; orchestrator clears it'],
    ['soft-go', 'f9d0c4', 'Accepted with an attached dissent'],
    ['kind:topic', '0052cc', 'Topic Issue'],
    ['kind:node', 'bfd4f2', 'Node Issue'],
    ['kind:status', '5319e7', 'The bot session status Issue'],
  ];
  for (const b of BOTS) {
    L.push([`turn:${b}`, '1d76db', `${b}'s version turn`]);
    L.push([`vote:${b}`, '1d76db', `${b} still owes a vote`]);
    L.push([`claimed:${b}`, 'ededed', `Lease: a ${b} run is working on this`]);
    L.push([`session:${b}`, '0e8a16', `A ${b} session is running (added at start, removed at end)`]);
  }
  for (let d = 0; d <= 5; d++) L.push([`depth:${d}`, 'f5f5f5', `Tree depth ${d}`]);
  for (const t of ['active', 'done', 'parked', 'rejected']) L.push([`topic-state:${t}`, '006b75', `Topic is in topics/${t}/`]);
  return L;
}
