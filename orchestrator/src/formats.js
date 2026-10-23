// Parsers and renderers for every file format in AGENTS.md sections 4, 7, 8 and 13.
import YAML from 'yaml';
import { parseInlineList, renderInlineList, stringifyFrontmatter, sha256 } from './util.js';

export const ITEM_TYPES = ['decision', 'research', 'build', 'question', 'claim', 'open'];
const LIST_KEYS = new Set(['options', 'evidence', 'agrees_with', 'disagrees_with', 'split_into', 'failed_tests']);
const ENUM_KEYS = new Set(['action', 'type', 'verdict', 'web_access']);
const ITEM_FIELD_ORDER = ['type', 'statement', 'options', 'recommendation', 'reason', 'acceptance', 'split_into', 'author', 'from'];

/** Frontmatter written by bots: parse every scalar as a string so "03" and "03.10" survive. */
export function parseLooseFrontmatter(text) {
  const m = /^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text ?? '');
  if (!m) return { data: null, body: text ?? '' };
  try {
    return { data: YAML.parse(m[1], { schema: 'failsafe' }) ?? {}, body: text.slice(m[0].length) };
  } catch {
    return { data: null, body: text.slice(m[0].length) };
  }
}

function parseStrictFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text ?? '');
  if (!m) return { data: null, body: text ?? '' };
  return { data: YAML.parse(m[1]) ?? {}, body: text.slice(m[0].length) };
}

/** Split a markdown body into `## heading` sections. */
export function sections(body) {
  const out = [];
  let cur = null;
  let inFence = false;
  for (const line of (body ?? '').split(/\r?\n/)) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    const h = !inFence && /^##\s+(.+?)\s*$/.exec(line);
    if (h && !/^###/.test(line)) {
      cur = { heading: h[1].replace(/\s+#.*$/, '').trim(), lines: [] };
      out.push(cur);
    } else if (cur) cur.lines.push(line);
  }
  return out;
}

/** key: value lines; lines that aren't key: value continue the previous value. */
export function parseKV(lines) {
  const kv = {};
  let last = null;
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) continue;
    const m = /^\s*([a-z_]+)\s*:\s?(.*)$/.exec(line);
    if (m) {
      last = m[1];
      let v = m[2];
      if (LIST_KEYS.has(last) || ENUM_KEYS.has(last)) v = v.replace(/\s+#\s.*$/, '').trim();
      kv[last] = v.trim();
    } else if (last) {
      kv[last] = `${kv[last]} ${line.trim()}`.trim();
    }
  }
  for (const k of Object.keys(kv)) if (LIST_KEYS.has(k)) kv[k] = parseInlineList(kv[k]);
  return kv;
}

function renderItemFields(fields) {
  const lines = [];
  const keys = [...ITEM_FIELD_ORDER, ...Object.keys(fields).filter((k) => !ITEM_FIELD_ORDER.includes(k))];
  for (const k of keys) {
    const v = fields[k];
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) continue;
    lines.push(`${k}: ${Array.isArray(v) ? renderInlineList(v) : String(v).replace(/\r?\n/g, ' ')}`);
  }
  return lines.join('\n');
}

/** The fields of a treatment that are carried into node.md and the ballot (no position-revealing fields). */
export function publicFields(f) {
  const out = {};
  for (const k of ['type', 'statement', 'options', 'recommendation', 'reason', 'acceptance', 'split_into']) {
    if (f[k] !== undefined) out[k] = f[k];
  }
  return out;
}

// ---------- topic README and seeds (AGENTS.md 4.2) ----------

export function parseTopicReadme(text) {
  const title = (/^#\s+(.+)$/m.exec(text ?? '')?.[1] ?? '').replace(/^\[\d{3}\]\s*/, '').trim();
  const goal = (/^\*\*Goal:\*\*\s*(.+)$/m.exec(text ?? '')?.[1] ?? '').trim();
  const out = sections(text).find((s) => /^out of scope/i.test(s.heading));
  const outOfScope = out ? out.lines.filter((l) => /^\s*-\s+/.test(l)).map((l) => l.replace(/^\s*-\s+/, '').trim()) : [];
  return { title, goal, outOfScope };
}

export function parseSeed(text, fileName) {
  const { data, body } = parseLooseFrontmatter(text);
  const id = /^(\d{2})-/.exec(fileName)?.[1];
  const fm = data ?? {};
  const title = String(fm.title ?? /^#\s+(.+)$/m.exec(body)?.[1] ?? fileName).trim();
  const goal = (/^\*\*Goal:\*\*\s*(.+)$/m.exec(body)?.[1] ?? '').trim();
  const points = [];
  const sec = sections(body).find((s) => /^discussion points/i.test(s.heading));
  for (const line of sec?.lines ?? []) {
    const top = /^- \[[ xX]\]\s+(.+)$/.exec(line) ?? /^- (?!\[)(.+)$/.exec(line);
    const sub = /^\s{2,}[-*]\s+(.+)$/.exec(line);
    if (top) points.push(top[1].trim());
    else if (sub && points.length) {
      const prev = points[points.length - 1];
      points[points.length - 1] = `${prev}${prev.endsWith(':') ? ' ' : '; '}${sub[1].trim()}`;
    }
  }
  const deps = parseInlineList(fm.depends_on ?? []).map((d) => String(d).replace(/\.md$/, '').slice(0, 2));
  return {
    id,
    title,
    goal,
    points,
    priority: Number(fm.priority ?? 99),
    depends_on: deps,
  };
}

// ---------- node.md (AGENTS.md 8.4) ----------

export function emptyCounters() {
  return { muse: 0, perplexity: 0, claude: 0, auditor: 0 };
}

export function newNodeFm({ id, parent = null, depth, title, priority, depends_on = [], issue, round_limit = 6 }) {
  return {
    id,
    parent,
    depth,
    title,
    priority,
    depends_on,
    attempt: 1,
    round: 0,
    round_limit,
    lou_cycles: 0,
    next_item: 1,
    version_hashes: [],
    soft_go_dissents: {},
    dead_locks: emptyCounters(),
    bot_errors: emptyCounters(),
    merge_of: null,
    ever_stuck: false,
    issue,
  };
}

export function parseNode(text) {
  const { data, body } = parseStrictFrontmatter(text);
  if (!data) throw new Error('node.md has no frontmatter');
  data.id = String(data.id);
  if (data.parent !== null && data.parent !== undefined) data.parent = String(data.parent);
  data.depends_on = (data.depends_on ?? []).map(String);
  data.version_hashes ??= [];
  data.soft_go_dissents ??= {};
  data.dead_locks = { ...emptyCounters(), ...(data.dead_locks ?? {}) };
  data.bot_errors = { ...emptyCounters(), ...(data.bot_errors ?? {}) };
  const secs = sections(body);
  const items = secs
    .filter((s) => /^I\d+$/.test(s.heading))
    .map((s) => ({ id: s.heading, fields: parseKV(s.lines) }));
  const context = secs.find((s) => s.heading === 'Context')?.lines.join('\n').trim() ?? '';
  const next = Math.max(data.next_item ?? 1, ...items.map((i) => Number(i.id.slice(1)) + 1));
  data.next_item = next;
  return { fm: data, items, context };
}

export function renderNode(node) {
  const { fm, items, context } = node;
  let body = `# ${fm.id} ${fm.title}\n`;
  if (context) body += `\n## Context\n\n${context.trim()}\n`;
  for (const it of items) body += `\n## ${it.id}\n${renderItemFields(it.fields)}\n`;
  return stringifyFrontmatter(fm, body);
}

/** Hash of the accepted items, for "no change" and ping-pong detection. */
export function itemsHash(items) {
  const canon = [...items]
    .sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)))
    .map((i) => `${i.id}\n${renderItemFields(publicFields(i.fields))}`)
    .join('\n\n');
  return sha256(canon);
}

// ---------- order.md ----------

export function renderOrder({ node, round, order, merge_of }) {
  const fm = { node, round, A: order[0], B: order[1], C: order[2] };
  if (merge_of) fm.merge_of = merge_of;
  let body = `# ${node} ${round}\n\nA: ${order[0]}\nB: ${order[1]}\nC: ${order[2]}\n`;
  if (merge_of) {
    body += `\n**Merge round.** Every position also reads round ${merge_of.round}'s ballot files ${merge_of.letters
      .map((l) => `\`${l}.md\``)
      .join(' and ')} and may only combine those treatments (AGENTS.md 5.2).\n`;
  }
  return stringifyFrontmatter(fm, body);
}

export function parseOrder(text) {
  const { data } = parseLooseFrontmatter(text);
  if (!data) return null;
  return { node: data.node, round: Number(data.round), order: [data.A, data.B, data.C], merge_of: data.merge_of ?? null };
}

// ---------- version-<bot>.md (AGENTS.md 7.3) ----------

const ITEM_HEADING_RE = /^(I\d+|NEW\d+|[ABC]\.NEW\d+)$/;

export function parseVersion(text, expect = {}) {
  const errors = [];
  const { data, body } = parseLooseFrontmatter(text);
  if (!data) return { ok: false, errors: ['missing or invalid frontmatter'] };
  for (const k of ['node', 'bot', 'round', 'position']) {
    if (expect[k] !== undefined && String(data[k] ?? '').trim() !== String(expect[k])) {
      errors.push(`frontmatter ${k} is "${data[k] ?? ''}", expected "${expect[k]}"`);
    }
  }
  const secs = sections(body);
  const summary = secs.find((s) => s.heading === 'Summary')?.lines.join(' ').trim() ?? '';
  const items = [];
  const seen = new Set();
  let atomic = null;
  for (const s of secs) {
    if (s.heading === 'Summary') continue;
    if (s.heading === 'Atomic') {
      const kv = parseKV(s.lines);
      atomic = { verdict: (kv.verdict ?? '').toLowerCase(), failed_tests: kv.failed_tests ?? [] };
      continue;
    }
    if (!ITEM_HEADING_RE.test(s.heading)) continue;
    if (seen.has(s.heading)) {
      errors.push(`item ${s.heading} appears twice`);
      continue;
    }
    seen.add(s.heading);
    const f = parseKV(s.lines);
    const action = (f.action ?? '').toLowerCase();
    if (!['keep', 'drop'].includes(action)) errors.push(`item ${s.heading}: action must be keep or drop`);
    if (action === 'keep') {
      if (!ITEM_TYPES.includes((f.type ?? '').toLowerCase())) errors.push(`item ${s.heading}: invalid type "${f.type ?? ''}"`);
      if (!f.statement) errors.push(`item ${s.heading}: missing statement`);
    }
    if (action === 'drop' && !f.reason) errors.push(`item ${s.heading}: drop needs a reason`);
    if (f.type) f.type = f.type.toLowerCase();
    items.push({ id: s.heading, action, fields: f });
  }
  if (!atomic || !['leaf', 'split', 'revise'].includes(atomic.verdict)) errors.push('## Atomic verdict must be leaf, split or revise');
  return { ok: errors.length === 0, errors, fm: data, summary, items, atomic };
}

// ---------- vote-<bot>.md (AGENTS.md 7.5) ----------

export function parseVote(text, expect = {}) {
  const errors = [];
  const { data, body } = parseLooseFrontmatter(text);
  if (!data) return { ok: false, errors: ['missing or invalid frontmatter'] };
  for (const k of ['node', 'bot', 'round']) {
    if (expect[k] !== undefined && String(data[k] ?? '').trim() !== String(expect[k])) {
      errors.push(`frontmatter ${k} is "${data[k] ?? ''}", expected "${expect[k]}"`);
    }
  }
  const choices = {};
  const reasons = {};
  let atomic = null;
  for (const line of body.split(/\r?\n/)) {
    const m = /^\s*([A-Za-z]+\d*|atomic)\s*:\s*([A-Za-z]+)\s*(?:[—–-]+\s*(.*))?$/.exec(line);
    if (!m) continue;
    const id = m[1];
    const raw = m[2];
    if (id.toLowerCase() === 'atomic') {
      atomic = raw.toLowerCase();
      reasons.atomic = (m[3] ?? '').trim();
      continue;
    }
    if (!/^(I|N)\d+$/.test(id)) continue;
    const choice = /^[XYZ]$/i.test(raw) ? raw.toUpperCase() : raw.toLowerCase();
    if (!['X', 'Y', 'Z', 'drop', 'none'].includes(choice)) {
      errors.push(`${id}: invalid choice "${raw}"`);
      continue;
    }
    choices[id] = choice;
    reasons[id] = (m[3] ?? '').trim();
  }
  if (!['leaf', 'split', 'revise'].includes(atomic)) errors.push('missing atomic: leaf | split | revise');
  return { ok: errors.length === 0, errors, fm: data, choices, reasons, atomic };
}

// ---------- audit.md (AGENTS.md 13.4) ----------

export function parseAudit(text) {
  const clean = (text ?? '').replace(/```[a-z]*\n?/g, '');
  const kv = parseKV(clean.split(/\r?\n/));
  const result = (kv.result ?? '').split(/\s|\|/)[0].toLowerCase();
  return {
    ok: ['pass', 'void'].includes(result),
    result,
    failed: parseInlineList(kv.failed ?? []),
    escalate: parseInlineList(kv.escalate ?? []),
  };
}
