// Parsers and renderers for the file formats in AGENTS.md sections 4 and 7.
import YAML from 'yaml';
import { parseInlineList, renderInlineList, parseFrontmatter, stringifyFrontmatter } from './util.js';

export const MAX_TASKS = 10;
const LIST_KEYS = new Set(['sources']);
const TASK_FIELDS = ['title', 'description', 'done_when', 'sources'];

/** Frontmatter written by bots: every scalar parsed as a string, so "03" survives. */
export function parseLooseFrontmatter(text) {
  const m = /^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text ?? '');
  if (!m) return { data: null, body: text ?? '' };
  try {
    return { data: YAML.parse(m[1], { schema: 'failsafe' }) ?? {}, body: text.slice(m[0].length) };
  } catch {
    return { data: null, body: text.slice(m[0].length) };
  }
}

/** Split a markdown body into `## heading` sections; `preamble` holds the lines before the first one. */
export function sections(body) {
  const out = [];
  const preamble = [];
  let cur = null;
  let inFence = false;
  for (const line of (body ?? '').split(/\r?\n/)) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    const h = !inFence && /^##\s+(.+?)\s*$/.exec(line);
    if (h) {
      cur = { heading: h[1].replace(/\s+#.*$/, '').trim(), lines: [] };
      out.push(cur);
    } else (cur ? cur.lines : preamble).push(line);
  }
  out.preamble = preamble;
  return out;
}

/** `key: value` lines; other lines continue the previous value. `#` headings and comments are skipped. */
export function parseKV(lines) {
  const kv = {};
  let last = null;
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim() || /^#/.test(line) || /^<!--/.test(line.trim())) continue;
    const m = /^([a-z_]+)\s*:\s?(.*)$/.exec(line);
    if (m) {
      last = m[1];
      kv[last] = m[2].replace(/\s+#\s.*$/, '').trim();
    } else if (last) {
      kv[last] = `${kv[last]}${kv[last] ? '\n' : ''}${line.trim()}`;
    }
  }
  for (const k of Object.keys(kv)) if (LIST_KEYS.has(k)) kv[k] = parseInlineList(kv[k]);
  return kv;
}

const one = (s) => String(s ?? '').replace(/\s*\r?\n\s*/g, ' ').trim();

function taskFieldsMd(t) {
  const lines = [`title: ${one(t.title)}`, `description: ${one(t.description)}`];
  if (t.done_when) lines.push(`done_when: ${one(t.done_when)}`);
  if (t.sources?.length) lines.push(`sources: ${renderInlineList(t.sources)}`);
  return lines.join('\n');
}

function pickTask(kv) {
  const t = {};
  for (const k of TASK_FIELDS) if (kv[k] !== undefined && kv[k] !== '') t[k] = k === 'sources' ? kv[k] : one(kv[k]);
  return t;
}

function expectMatches(data, expect) {
  for (const [k, v] of Object.entries(expect)) {
    if (v === undefined) continue;
    if (String(data?.[k] ?? '').trim() !== String(v)) return `${k} is ${JSON.stringify(data?.[k])}, expected ${v}`;
  }
  return null;
}

// ---------- topic README and seeds (AGENTS.md 4.2) ----------

export function parseTopicReadme(text) {
  const title = (/^#\s+(.+)$/m.exec(text ?? '')?.[1] ?? '').replace(/^\[\d{3}\]\s*/, '').trim();
  const goal = (/^\*\*Goal:\*\*\s*(.+)$/m.exec(text ?? '')?.[1] ?? '').trim();
  const target = (/^\*\*Target:\*\*\s*(.+)$/m.exec(text ?? '')?.[1] ?? '').trim();
  return { title, goal, target };
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
  return { id, title, goal, points, priority: Number(fm.priority ?? 99), depends_on: deps };
}

// ---------- item.md (orchestrator) ----------

export function newItem({ topic, seed }) {
  return {
    fm: { topic, item: seed.id, title: seed.title, priority: seed.priority, depends_on: seed.depends_on, next_task: 1, bot_errors: {}, dead_locks: {} },
    goal: seed.goal,
    points: seed.points,
    tasks: [],
    cycles: [],
  };
}

export function parseItem(text) {
  const { data, body } = parseFrontmatter(text ?? '');
  const secs = sections(body);
  const list = (h) => (secs.find((s) => s.heading.toLowerCase() === h)?.lines ?? []).filter((l) => /^- /.test(l)).map((l) => l.slice(2).trim());
  return {
    fm: { bot_errors: {}, dead_locks: {}, next_task: 1, ...data },
    goal: (/^\*\*Goal:\*\*\s*(.+)$/m.exec(body)?.[1] ?? '').trim(),
    points: list('starting points'),
    tasks: list('tasks'),
    cycles: list('cycles'),
  };
}

export function renderItem(it) {
  const body = `# ${it.fm.item} ${it.fm.title}

**Goal:** ${it.goal}

## Starting points
${it.points.map((p) => `- ${p}`).join('\n') || '- (none)'}

## Tasks
<!-- Every task of this item and its state. Don't propose duplicates of approved or exported ones. -->
${it.tasks.map((t) => `- ${t}`).join('\n')}

## Cycles
${it.cycles.map((c) => `- ${c}`).join('\n')}
`;
  return stringifyFrontmatter(it.fm, body);
}

// ---------- assignments.md (AGENTS.md 7.1) ----------
// Machine data lives in the frontmatter (`work`, `review`); the body is the human version bots read.

export function renderAssignments(a) {
  const fm = { topic: a.topic, item: a.item, cycle: a.cycle, author: a.author ?? null, work: a.work };
  if (a.review) fm.review = a.review;
  const work = a.work.map((w) => `- ${w.bot}: ${w.what === 'breakdown' ? 'breakdown' : `rework ${w.task}`}`).join('\n');
  let body = `## work (commit by :25)\n${work || '- (nothing)'}\n`;
  if (a.review) {
    body += `\n## review (commit by :45)\n${a.review.sheets.map((b) => `- ${b}: review, sheet review-sheet-${b}.md`).join('\n') || '- (nothing)'}\n`;
  }
  return stringifyFrontmatter(fm, body);
}

export function parseAssignments(text) {
  const { data, ok } = parseFrontmatter(text ?? '');
  if (!ok || !data) return null;
  return { topic: String(data.topic), item: String(data.item), cycle: String(data.cycle), author: data.author ?? null, work: data.work ?? [], review: data.review ?? null };
}

// ---------- breakdown, rework, review (bots) ----------

export function parseBreakdown(text, expect = {}) {
  const { data, body } = parseLooseFrontmatter(text);
  if (!data) return { ok: false, error: 'no frontmatter' };
  const mismatch = expectMatches(data, expect);
  if (mismatch) return { ok: false, error: mismatch };
  const secs = sections(body);
  const summary = one((secs.find((s) => /^summary$/i.test(s.heading))?.lines ?? []).join(' '));
  const tasks = [];
  for (const s of secs.filter((x) => /^\d+$/.test(x.heading)).sort((a, b) => Number(a.heading) - Number(b.heading))) {
    const t = pickTask(parseKV(s.lines));
    if (t.title && t.description) tasks.push(t);
  }
  if (!tasks.length) return { ok: false, error: 'no tasks with title and description' };
  return { ok: true, summary, tasks: tasks.slice(0, MAX_TASKS), truncated: tasks.length > MAX_TASKS };
}

export function parseRework(text, expect = {}) {
  const { data, body } = parseLooseFrontmatter(text);
  if (!data) return { ok: false, error: 'no frontmatter' };
  const mismatch = expectMatches(data, expect);
  if (mismatch) return { ok: false, error: mismatch };
  const kv = parseKV(body.split(/\r?\n/));
  const t = pickTask(kv);
  if (!t.title || !t.description) return { ok: false, error: 'title and description are required' };
  return { ok: true, task: t, response: (kv.response ?? '').trim() };
}

export const VOTES = ['yes', 'no', 'maybe'];

export function parseReview(text, expect = {}) {
  const { data, body } = parseLooseFrontmatter(text);
  if (!data) return { ok: false, error: 'no frontmatter' };
  const mismatch = expectMatches(data, expect);
  if (mismatch) return { ok: false, error: mismatch };
  const votes = {};
  for (const s of sections(body)) {
    const m = /^T(\d+)$/i.exec(s.heading);
    if (!m) continue;
    const kv = parseKV(s.lines);
    const vote = String(kv.vote ?? '').toLowerCase().replace(/[^a-z]/g, '');
    if (!VOTES.includes(vote)) continue;
    votes[`T${Number(m[1])}`] = { vote, reason: one(kv.reason), changes: one(kv.changes) };
  }
  return { ok: true, votes };
}

// ---------- review sheet (orchestrator) ----------

export function renderSheet({ topic, item, cycle, reviewer, fresh, reworks }) {
  const fm = { topic, item, cycle, reviewer };
  let body = `# Review sheet: ${reviewer}\n\nVote on every task below in \`review-${reviewer}.md\` (AGENTS.md 7.4): yes, no, or maybe with the changes you want.\n`;
  if (fresh.length) {
    body += `\n# New tasks (by ${fresh[0].author})\n`;
    for (const t of fresh) body += `\n## ${t.id}\n${taskFieldsMd(t)}\n`;
  }
  if (reworks.length) {
    body += `\n# Reworked tasks\n`;
    for (const t of reworks) {
      body += `\n## ${t.id}\n${taskFieldsMd(t)}\nrequested: ${t.changes.map(one).join(' | ') || '(none)'}\nresponse: ${one(t.response) || '(none)'}\n`;
    }
  }
  return stringifyFrontmatter(fm, body);
}

export function parseSheet(text) {
  const { body } = parseFrontmatter(text ?? '');
  const out = {};
  for (const s of sections(body)) {
    if (!/^T\d+$/.test(s.heading)) continue;
    out[s.heading] = pickTask(parseKV(s.lines));
  }
  return out;
}

// ---------- task.md (AGENTS.md 7.6) ----------

export function renderTask(t) {
  const fm = { topic: t.topic, item: t.item, task: t.task, author: t.author, state: t.state, reworks: t.reworks, first_cycle: t.first_cycle, issue: t.issue ?? null, lou_approved: Boolean(t.lou_approved) };
  const body = `${taskFieldsMd(t)}

## Requested changes
${t.changes.map((c) => `- ${one(c)}`).join('\n')}

## History
${t.history.map((h) => `- ${one(h)}`).join('\n')}
`;
  return stringifyFrontmatter(fm, body);
}

export function parseTask(text) {
  const { data, body } = parseFrontmatter(text ?? '');
  if (!data) return null;
  const secs = sections(body);
  const list = (h) => (secs.find((s) => s.heading.toLowerCase() === h)?.lines ?? []).filter((l) => /^- /.test(l)).map((l) => l.slice(2).trim());
  return {
    topic: String(data.topic), item: String(data.item), task: String(data.task), author: data.author, state: data.state,
    reworks: Number(data.reworks ?? 0), first_cycle: data.first_cycle, issue: data.issue ?? null, lou_approved: Boolean(data.lou_approved),
    ...pickTask(parseKV(secs.preamble)),
    changes: list('requested changes'),
    history: list('history'),
  };
}

export function taskBodyMd(t) {
  return `**${t.task}: ${one(t.title)}**\n\n${one(t.description)}\n\n${t.done_when ? `**Done when:** ${one(t.done_when)}\n\n` : ''}${t.sources?.length ? `**Sources:** ${t.sources.join(', ')}\n\n` : ''}**Author:** ${t.author} · **Reworks:** ${t.reworks}\n\n**Requested changes**\n\n${t.changes.map((c) => `- ${c}`).join('\n') || '- (none)'}\n\n**History**\n\n${t.history.map((h) => `- ${h}`).join('\n')}`;
}
