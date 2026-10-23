// Blind ballot construction (AGENTS.md 7.4).
import { hmacPermutation, renderInlineList } from './util.js';
import { publicFields, ITEM_TYPES } from './formats.js';

export const LETTERS = ['X', 'Y', 'Z'];

/**
 * @param node      parsed node.md ({fm, items})
 * @param versions  { bot: parsedVersion } — only versions that parsed (counted)
 * @param positions { bot: 'A'|'B'|'C' }
 * @param secret    ORCH_SECRET
 * @param label     "<topic>/<node>/<round>"
 */
export function buildBallot({ node, versions, positions, secret, label }) {
  const counted = Object.keys(versions).sort();
  const perm = hmacPermutation(secret, label, counted);
  const letterOf = {};
  const botOf = {};
  perm.forEach((bot, i) => {
    letterOf[bot] = LETTERS[i];
    botOf[LETTERS[i]] = bot;
  });

  // Neutral ids for new items: origin key "<position>.NEW<k>".
  const origins = new Map(); // origin -> { position, k }
  const originOf = (bot, itemId) => {
    if (/^NEW\d+$/.test(itemId)) return `${positions[bot]}.${itemId}`;
    if (/^[ABC]\.NEW\d+$/.test(itemId)) return itemId;
    return null;
  };
  for (const bot of counted) {
    for (const it of versions[bot].items) {
      const o = originOf(bot, it.id);
      if (o && !origins.has(o)) origins.set(o, { position: o[0], k: Number(o.split('NEW')[1]) });
    }
  }
  const sortedOrigins = [...origins.entries()]
    .sort((a, b) => a[1].position.localeCompare(b[1].position) || a[1].k - b[1].k)
    .map(([o]) => o);
  const neutralOf = {};
  const originOfNeutral = {};
  sortedOrigins.forEach((o, i) => {
    neutralOf[o] = `N${i + 1}`;
    originOfNeutral[`N${i + 1}`] = o;
  });

  const existing = node.items.map((i) => i.id);
  const itemIds = [...existing, ...sortedOrigins.map((o) => neutralOf[o])];
  const treatments = {};
  const warnings = [];
  for (const id of itemIds) treatments[id] = {};
  for (const bot of counted) {
    const L = letterOf[bot];
    for (const id of itemIds) treatments[id][L] = { status: 'missing' };
    for (const it of versions[bot].items) {
      let id = it.id;
      const o = originOf(bot, it.id);
      if (o) id = neutralOf[o];
      if (!treatments[id]) {
        warnings.push(`${bot}: item ${it.id} is not an existing item; ignored`);
        continue;
      }
      treatments[id][L] =
        it.action === 'drop'
          ? { status: 'drop', reason: it.fields.reason ?? '' }
          : { status: 'keep', fields: publicFields(it.fields) };
    }
  }
  const atomic = {};
  const summaries = {};
  for (const bot of counted) {
    atomic[letterOf[bot]] = versions[bot].atomic;
    summaries[letterOf[bot]] = versions[bot].summary;
  }
  const letters = counted.map((b) => letterOf[b]).sort();
  return { letters, letterOf, botOf, neutralOf, originOfNeutral, itemIds, treatments, atomic, summaries, warnings, current: node.items };
}

function renderTreatment(t) {
  if (!t || t.status === 'missing') return '(not addressed)\n';
  if (t.status === 'drop') return `dropped: ${t.reason}\n`;
  const f = t.fields;
  const lines = [];
  for (const k of ['type', 'statement', 'options', 'recommendation', 'reason', 'acceptance', 'split_into']) {
    if (f[k] === undefined || f[k] === '' || (Array.isArray(f[k]) && !f[k].length)) continue;
    lines.push(`${k}: ${Array.isArray(f[k]) ? renderInlineList(f[k]) : f[k]}`);
  }
  return lines.join('\n') + '\n';
}

export function renderBallotMd(b, { node, round }) {
  let s = `---\nnode: "${node}"\nround: ${round}\nletters: [${b.letters.join(', ')}]\n---\n`;
  s += `# Ballot — ${node} r${String(round).padStart(2, '0')}\n\n`;
  s += `Vote in \`vote-<you>.md\`: one line per item, \`<id>: ${b.letters.join('|')}|drop|none — <reason from this ballot>\`, then \`atomic: leaf|split|revise — <reason>\`. See AGENTS.md 7.5.\n`;
  const currentById = Object.fromEntries(b.current.map((i) => [i.id, i]));
  for (const id of b.itemIds) {
    s += `\n## ${id}\n`;
    if (currentById[id]) s += `\ncurrent: ${currentById[id].fields.statement ?? ''}\n`;
    else s += `\ncurrent: (new item)\n`;
    for (const L of b.letters) s += `\n### ${L}\n${renderTreatment(b.treatments[id][L])}`;
  }
  s += `\n## Atomic\n`;
  for (const L of b.letters) {
    const a = b.atomic[L];
    s += `\n### ${L}\nverdict: ${a.verdict}${a.failed_tests?.length ? `\nfailed_tests: [${a.failed_tests.join(', ')}]` : ''}\n`;
  }
  return s;
}

export function renderLetterMd(b, L, { node, round }) {
  let s = `---\nnode: "${node}"\nround: ${round}\nletter: ${L}\n---\n# Version ${L}\n\n## Summary\n${b.summaries[L] ?? ''}\n`;
  for (const id of b.itemIds) s += `\n## ${id}\n${renderTreatment(b.treatments[id][L])}`;
  const a = b.atomic[L];
  s += `\n## Atomic\nverdict: ${a.verdict}${a.failed_tests?.length ? `\nfailed_tests: [${a.failed_tests.join(', ')}]` : ''}\n`;
  return s;
}

export function renderKeyMd(b, { node, round }) {
  let s = `---\nnode: "${node}"\nround: ${round}\n---\n# Ballot key — ${node} r${String(round).padStart(2, '0')}\n\nWritten after voting closed.\n\n`;
  for (const L of b.letters) s += `${L}: ${b.botOf[L]}\n`;
  const ns = Object.keys(b.originOfNeutral);
  if (ns.length) {
    s += `\n`;
    for (const n of ns) s += `${n}: ${b.originOfNeutral[n]}\n`;
  }
  return s;
}

export { ITEM_TYPES };
