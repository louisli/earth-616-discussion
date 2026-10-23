// Pure decision rules: next node, writing order, round outcome (pass 6), bundles (10.1), Lou's commands (9.2).
import { compareNodeIds, normalizeText, parentId, NODE_ID_RE } from './util.js';

export const BOTS = ['muse', 'perplexity', 'claude'];
export const ACTIVE_STATES = ['turn', 'ballot', 'voting', 'audit', 'audited'];

// ---------- scheduling (AGENTS.md 5.1) ----------

/** A node is done when leaf, approved, rejected or parked, or split with every child done. */
export function makeDone(nodesById) {
  const memo = new Map();
  const done = (id) => {
    if (memo.has(id)) return memo.get(id);
    const n = nodesById.get(id);
    let d = false;
    if (n) {
      if (['leaf', 'approved', 'rejected', 'parked'].includes(n.state)) d = true;
      else if (n.state === 'split') {
        const kids = [...nodesById.values()].filter((k) => parentId(k.id) === id && k.topic === n.topic);
        d = kids.length > 0 && kids.every((k) => done(k.id));
      }
    }
    memo.set(id, d);
    return d;
  };
  return done;
}

/**
 * Pick queued nodes to start. nodes: [{topic, id, state, priority, depends_on, topicActive}]
 */
export function pickNextNodes(nodes, maxActive) {
  const active = nodes.filter((n) => ACTIVE_STATES.includes(n.state)).length;
  const slots = Math.max(0, maxActive - active);
  if (!slots) return [];
  const byTopic = new Map();
  for (const n of nodes) {
    if (!byTopic.has(n.topic)) byTopic.set(n.topic, new Map());
    byTopic.get(n.topic).set(n.id, n);
  }
  const doneFns = new Map([...byTopic].map(([t, m]) => [t, makeDone(m)]));
  const ready = nodes
    .filter((n) => n.state === 'queued' && n.topicActive)
    .filter((n) => (n.depends_on ?? []).every((d) => doneFns.get(n.topic)(String(d))))
    .sort((a, b) => a.topic.localeCompare(b.topic) || a.priority - b.priority || compareNodeIds(a.id, b.id));
  return ready.slice(0, slots);
}

/**
 * Writing order (AGENTS.md 5.1): A is a bot that isn't A on another active node;
 * ties go to the bot after the previous round's A in the cycle muse → perplexity → claude.
 */
export function chooseOrder({ prevA, busyA }) {
  const start = prevA ? (BOTS.indexOf(prevA) + 1) % BOTS.length : 0;
  const cycle = [...BOTS.slice(start), ...BOTS.slice(0, start)];
  const A = cycle.find((b) => !busyA.includes(b)) ?? cycle[0];
  const i = BOTS.indexOf(A);
  return [A, BOTS[(i + 1) % 3], BOTS[(i + 2) % 3]];
}

// ---------- outcome (AGENTS.md 12, pass 6) ----------

/**
 * @param result   parsed result.md frontmatter
 * @param audit    parsed audit.md
 * @param node     node AFTER tally ({fm, items})
 * @param topicNodeCount  number of node Issues in the topic
 * @param skipEscalation  true after Lou resolved the open items (/pick, /accept all)
 */
export function decideOutcome({ result, audit, node, topicNodeCount, skipEscalation = false, limits = {} }) {
  const maxDepth = limits.maxDepth ?? 4;
  const maxNodes = limits.maxNodes ?? 50;
  const fm = node.fm;
  const round = fm.round;

  if (!skipEscalation) {
    const open = new Set();
    const reasons = [];
    for (const r of result.items ?? []) {
      if (r.outcome === 'escalate') {
        open.add(r.id);
        reasons.push(`${r.id}: votes split`);
      }
    }
    const fromThisRound = `r${String(round).padStart(2, '0')}`;
    for (const it of node.items) {
      if (it.fields.type === 'question' && it.fields.from === fromThisRound) {
        open.add(it.id);
        reasons.push(`${it.id}: accepted as a question for Lou`);
      }
    }
    for (const id of audit?.escalate ?? []) {
      open.add(id);
      reasons.push(`${id}: auditor flagged a conflict with Already decided or overrides`);
    }
    for (const [id, ds] of Object.entries(fm.soft_go_dissents ?? {})) {
      const now = ds.filter((d) => d.round === round);
      const prev = ds.filter((d) => d.round === round - 1);
      if (now.some((d) => prev.some((p) => p.bot === d.bot))) {
        open.add(id);
        reasons.push(`${id}: the same dissent two rounds in a row`);
      }
    }
    if (open.size) return { action: 'escalate', state: 'needs-lou', items: [...open], reason: reasons.join('; ') };
  }

  // Breakers (8.3)
  const hashes = fm.version_hashes ?? [];
  const cur = hashes[hashes.length - 1];
  if (cur && hashes.slice(0, -2).includes(cur)) return { action: 'escalate', state: 'stuck', reason: 'ping-pong: the accepted version returned to one from two or more rounds back' };
  for (const [role, n] of Object.entries(fm.dead_locks ?? {})) if (n >= 3) return { action: 'escalate', state: 'stuck', reason: `${role} lost its lock 3 times on this node` };
  for (const [role, n] of Object.entries(fm.bot_errors ?? {})) if (n >= 3) return { action: 'escalate', state: 'stuck', reason: `${role} hit 3 errors on this node` };
  if (topicNodeCount > maxNodes) return { action: 'escalate', state: 'stuck', reason: `topic has more than ${maxNodes} nodes` };

  if (result.atomic === 'leaf') return { action: 'leaf' };

  const allAccepted = (result.items ?? []).every((r) => r.outcome === 'go' || r.outcome === 'soft');
  const titles = result.split_titles ?? [];
  if (result.atomic === 'split' && allAccepted && titles.length) {
    if (fm.depth + 1 > maxDepth) return { action: 'escalate', state: 'stuck', reason: `splitting would go deeper than ${maxDepth} levels` };
    if (topicNodeCount + titles.length > maxNodes) return { action: 'escalate', state: 'stuck', reason: `splitting would take the topic past ${maxNodes} nodes` };
    const parentText = normalizeText(fm.title);
    const same = titles.find((t) => normalizeText(t) === parentText);
    if (same) return { action: 'escalate', state: 'stuck', reason: `child "${same}" is the same as its parent` };
    return { action: 'split', children: titles };
  }

  if (hashes.length >= 2 && hashes[hashes.length - 1] === hashes[hashes.length - 2]) {
    return { action: 'escalate', state: 'needs-lou', reason: 'converged without leaf or split: the accepted version did not change this round' };
  }
  if (round >= fm.round_limit) return { action: 'escalate', state: 'paused', reason: `round limit ${fm.round_limit} reached for this attempt` };
  return { action: 'queued' };
}

// ---------- bundles (AGENTS.md 10.1) ----------

/** nodes: [{id, state}] for ONE topic. Returns [{id, leaves:[ids]}]. */
export function findBundles(nodes, maxLeaves = 10) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const done = makeDone(byId);
  const kids = (id) => nodes.filter((n) => parentId(n.id) === id);
  const leavesUnder = (id) => {
    const out = [];
    const walk = (x) => {
      const n = byId.get(x);
      if (!n) return;
      if (n.state === 'leaf') out.push(x);
      for (const k of kids(x)) walk(k.id);
    };
    walk(id);
    return out.sort(compareNodeIds);
  };
  const isBundle = (id) => {
    if (!done(id)) return false;
    const leaves = leavesUnder(id);
    if (leaves.length < 1 || leaves.length > maxLeaves) return false;
    // Wait for the parent: a subtree is only bundled once everything above it is done too,
    // unless the parent is too big to be one bundle.
    const p = parentId(id);
    if (!p || !byId.has(p)) return true;
    return done(p) && leavesUnder(p).length > maxLeaves;
  };
  return nodes
    .map((n) => n.id)
    .filter(isBundle)
    .sort(compareNodeIds)
    .map((id) => ({ id, leaves: leavesUnder(id) }));
}

// ---------- Lou's commands (AGENTS.md 9.2) ----------

export function parseCommand(text) {
  const body = String(text ?? '').trim();
  const first = body.split(/\r?\n/)[0].trim();
  const m = /^\/([a-z]+)\b\s*(.*)$/i.exec(first);
  if (!m) return null;
  const name = m[1].toLowerCase();
  const rest = m[2].trim();
  const words = rest ? rest.split(/\s+/) : [];
  const leadingIds = [];
  for (const w of words) {
    if (NODE_ID_RE.test(w)) leadingIds.push(w);
    else break;
  }
  const afterIds = words.slice(leadingIds.length).join(' ');
  switch (name) {
    case 'rerun': {
      if (rest && !/^\d+$/.test(rest)) return { error: '/rerun takes an optional number of rounds' };
      return { name, n: rest ? Number(rest) : 3 };
    }
    case 'accept':
      return /^all$/i.test(rest) ? { name: 'accept-all' } : { error: 'did you mean /accept all?' };
    case 'reject':
      return { name, ids: leadingIds, reason: afterIds };
    case 'pick': {
      const letters = words.filter((w) => /^[XYZ]$/i.test(w)).map((w) => w.toUpperCase());
      if (letters.length && letters.length === words.length && letters.length <= 2) return { name, letters: [...new Set(letters)] };
      if (leadingIds.length && leadingIds.length === words.length) return { name, ids: leadingIds };
      return { error: '/pick takes one or two ballot letters (X, Y, Z), or leaf ids on a bundle PR' };
    }
    case 'reword': {
      const full = body.replace(/^\/reword\b\s*/i, '');
      const idm = /^(\d{2}(?:\.\d+)*)\s+([\s\S]+)$/.exec(full);
      if (idm) return { name, ids: [idm[1]], text: idm[2].trim() };
      if (!full.trim()) return { error: '/reword needs the new text' };
      return { name, ids: [], text: full.trim() };
    }
    case 'park':
    case 'resume':
      return { name };
    default:
      return { error: `unknown command /${name}` };
  }
}
