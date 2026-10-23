// Tally per item and atomic verdict (AGENTS.md 7.5), and applying the result to node.md.
import { itemsHash } from './formats.js';
import { roundDir } from './util.js';

/**
 * @param ballot  from buildBallot
 * @param votes   { bot: parsedVote } — only votes that parsed (valid)
 */
export function tally(ballot, votes) {
  const voters = Object.keys(votes).sort();
  const V = voters.length;
  const items = [];
  for (const id of ballot.itemIds) {
    const perVoter = {};
    for (const bot of voters) {
      let c = votes[bot].choices[id] ?? 'none';
      if (['X', 'Y', 'Z'].includes(c)) {
        const t = ballot.treatments[id][c];
        if (!t || t.status === 'missing') c = 'none';
        else if (t.status === 'drop') c = 'drop';
      }
      perVoter[bot] = c;
    }
    const counts = {};
    for (const c of Object.values(perVoter)) if (c !== 'none') counts[c] = (counts[c] ?? 0) + 1;
    const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const [top, support] = ranked[0] ?? [null, 0];
    let outcome;
    if (V === 3 && support === 3) outcome = 'go';
    else if (support >= 2) outcome = 'soft';
    else if (ranked.length >= 2) outcome = 'escalate';
    else outcome = 'rework';
    const dissent =
      outcome === 'soft' ? voters.filter((b) => perVoter[b] !== top).map((b) => ({ bot: b, choice: perVoter[b] })) : [];
    items.push({ id, outcome, choice: ['go', 'soft'].includes(outcome) ? top : null, support, perVoter, dissent });
  }
  const leafVotes = voters.filter((b) => votes[b].atomic === 'leaf').length;
  const splitVotes = voters.filter((b) => votes[b].atomic === 'split').length;
  const atomic = V === 3 && leafVotes === 3 ? 'leaf' : splitVotes >= 2 ? 'split' : 'revise';
  const atomicVotes = Object.fromEntries(voters.map((b) => [b, votes[b].atomic]));
  return { valid: V, voters, items, atomic, atomicVotes, void: V < 2 };
}

/**
 * Apply a tally to node.md. Returns the new node plus what pass 6 needs.
 * Mutates nothing it was given.
 */
export function applyTally(node, ballot, t, round) {
  const fm = structuredClone(node.fm);
  const byId = new Map(node.items.map((i) => [i.id, structuredClone(i)]));
  const finalIdOf = {};
  const splitTitles = [];
  const from = roundDir(round);
  for (const r of t.items) {
    const isNew = r.id.startsWith('N');
    if (r.outcome !== 'go' && r.outcome !== 'soft') {
      finalIdOf[r.id] = isNew ? null : r.id;
      continue;
    }
    if (r.choice === 'drop') {
      if (!isNew) byId.delete(r.id);
      finalIdOf[r.id] = null;
      continue;
    }
    const tr = ballot.treatments[r.id][r.choice];
    const fields = { ...tr.fields, from };
    let fid = r.id;
    if (isNew) {
      fid = `I${fm.next_item}`;
      fm.next_item += 1;
    }
    finalIdOf[r.id] = fid;
    byId.set(fid, { id: fid, fields });
    for (const title of tr.fields.split_into ?? []) {
      const tt = String(title).trim();
      if (tt && !splitTitles.includes(tt)) splitTitles.push(tt);
    }
    if (r.outcome === 'soft' && r.dissent.length) {
      fm.soft_go_dissents[fid] = [...(fm.soft_go_dissents[fid] ?? []), ...r.dissent.map((d) => ({ round, bot: d.bot, choice: d.choice }))];
    }
  }
  const items = [...byId.values()].sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));
  fm.version_hashes = [...fm.version_hashes, itemsHash(items)];
  return { node: { ...node, fm, items }, finalIdOf, splitTitles };
}

export function renderResultMd({ node, round, ballot, t, finalIdOf, splitTitles, forfeits }) {
  const data = {
    node,
    round,
    valid_voters: t.voters,
    forfeits,
    letters: ballot.letterOf,
    atomic: t.atomic,
    atomic_votes: t.atomicVotes,
    split_titles: splitTitles,
    items: t.items.map((r) => ({
      id: r.id,
      final_id: finalIdOf[r.id] ?? null,
      outcome: r.outcome,
      choice: r.choice,
      support: r.support,
      votes: r.perVoter,
      dissent: r.dissent,
    })),
  };
  let human = `# Result — ${node} ${roundDir(round)}\n\nValid votes: ${t.valid} (${t.voters.join(', ')}). Atomic: **${t.atomic}**.\n\n`;
  human += `| Item | ${t.voters.join(' | ')} | Outcome | Accepted as |\n| --- | ${t.voters.map(() => '---').join(' | ')} | --- | --- |\n`;
  for (const r of t.items) {
    human += `| ${r.id} | ${t.voters.map((b) => r.perVoter[b]).join(' | ')} | ${r.outcome}${r.choice ? ` (${r.choice})` : ''} | ${finalIdOf[r.id] ?? '—'} |\n`;
  }
  return { data, human };
}
