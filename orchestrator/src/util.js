// Shared helpers: frontmatter, Issue state header, title prefixes, ids, hashing.
import crypto from 'node:crypto';
import YAML from 'yaml';

// ---------- frontmatter ----------

export function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text ?? '');
  if (!m) return { data: {}, body: text ?? '', ok: false };
  let data;
  try {
    data = YAML.parse(m[1]) ?? {};
  } catch (e) {
    return { data: {}, body: text.slice(m[0].length), ok: false, error: e.message };
  }
  return { data, body: text.slice(m[0].length), ok: true };
}

export function stringifyFrontmatter(data, body) {
  const y = YAML.stringify(data, { lineWidth: 0, flowCollectionPadding: false }).trimEnd();
  return `---\n${y}\n---\n${body.startsWith('\n') ? body : '\n' + body}`;
}

// ---------- Issue state header (AGENTS.md 3.4) ----------

const HEADER_RE = /<!-- state\r?\n([\s\S]*?)-->/;

export function parseHeader(body) {
  const m = HEADER_RE.exec(body ?? '');
  if (!m) return null;
  try {
    return YAML.parse(m[1]) ?? {};
  } catch {
    return null;
  }
}

const HEADER_KEYS = ['topic', 'node', 'branch', 'path', 'round', 'attempt', 'round_limit', 'order',
  'lou_cycles', 'priority', 'depends_on', 'tally_sha', 'escalation'];

export function renderHeader(h) {
  const lines = [];
  const keys = [...HEADER_KEYS, ...Object.keys(h).filter((k) => !HEADER_KEYS.includes(k))];
  for (const k of keys) {
    if (!(k in h) || h[k] === undefined) continue;
    lines.push(`${k}: ${YAML.stringify(h[k], { lineWidth: 0, collectionStyle: 'flow' }).trim()}`);
  }
  return `<!-- state\n${lines.join('\n')}\n-->`;
}

export function withHeader(body, header) {
  const rendered = renderHeader(header);
  if (HEADER_RE.test(body ?? '')) return body.replace(HEADER_RE, rendered);
  return `${rendered}\n\n${body ?? ''}`;
}

/** Replace the human-readable part of an Issue body (everything after the header). */
export function withHumanPart(body, human) {
  const m = HEADER_RE.exec(body ?? '');
  const head = m ? m[0] : '';
  return `${head}\n\n${human.trim()}\n`;
}

// ---------- title prefixes (AGENTS.md 9.1) ----------

const PREFIX_RE = /^\s*\[(need-lou|updated-lou)(?:\s*#(\d+))?\]\s*/i;

export function titlePrefix(title) {
  const m = PREFIX_RE.exec(title ?? '');
  if (!m) return null;
  return { kind: m[1].toLowerCase(), n: m[2] ? Number(m[2]) : null };
}

export function stripPrefix(title) {
  let t = title ?? '';
  while (PREFIX_RE.test(t)) t = t.replace(PREFIX_RE, '');
  return t;
}

export function withNeedLou(title, n) {
  return `[need-lou #${n}] ${stripPrefix(title)}`;
}

// ---------- ids ----------

export const NODE_ID_RE = /^\d{2}(\.\d+)*$/;

export function nodeSegments(id) {
  return String(id).split('.');
}

export function parentId(id) {
  const s = nodeSegments(id);
  return s.length > 1 ? s.slice(0, -1).join('.') : null;
}

export function rootId(id) {
  return nodeSegments(id)[0];
}

export function depthOf(id) {
  return nodeSegments(id).length - 1;
}

/** Folder of a node relative to the topic folder: nodes/03/03.2/03.2.1 */
export function nodeRelDir(id) {
  const segs = nodeSegments(id);
  const parts = [];
  for (let i = 1; i <= segs.length; i++) parts.push(segs.slice(0, i).join('.'));
  return ['nodes', ...parts].join('/');
}

/** Compare node ids numerically by segment: 03 < 03.1 < 03.2 < 03.10 < 04 */
export function compareNodeIds(a, b) {
  const as = nodeSegments(a).map(Number);
  const bs = nodeSegments(b).map(Number);
  for (let i = 0; i < Math.max(as.length, bs.length); i++) {
    if (as[i] === undefined) return -1;
    if (bs[i] === undefined) return 1;
    if (as[i] !== bs[i]) return as[i] - bs[i];
  }
  return 0;
}

export function roundDir(r) {
  return `r${String(r).padStart(2, '0')}`;
}

// ---------- inline lists:  [a, "b, c", d] ----------

export function parseInlineList(v) {
  if (Array.isArray(v)) return v.map(String);
  const s = String(v ?? '').trim();
  if (!s || s === '[]') return [];
  const inner = s.startsWith('[') && s.endsWith(']') ? s.slice(1, -1) : s;
  const out = [];
  let cur = '';
  let q = null;
  for (const ch of inner) {
    if (q) {
      if (ch === q) q = null;
      else cur += ch;
    } else if (ch === '"' || ch === "'") q = ch;
    else if (ch === ',') {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter((x) => x.length);
}

export function renderInlineList(arr) {
  return `[${(arr ?? []).map((x) => (/[,"\[\]]/.test(x) ? `"${String(x).replace(/"/g, "'")}"` : x)).join(', ')}]`;
}

// ---------- hashing ----------

export function sha256(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

/** Deterministic permutation of `items` from HMAC(secret, label). */
export function hmacPermutation(secret, label, items) {
  if (!secret) throw new Error('ORCH_SECRET is not set');
  const digest = crypto.createHmac('sha256', secret).update(label).digest();
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = digest[(arr.length - 1 - i) % digest.length] % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function normalizeText(s) {
  return String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function mdEscapeCell(s) {
  return String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

export function isoDate(d) {
  return new Date(d).toISOString().slice(0, 10);
}
