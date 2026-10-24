// Pure decision rules (AGENTS.md 5.2, 7.5, 9.2).

export const BOTS = ['muse', 'groky', 'claude'];
export const ROLES = [...BOTS, 'auditor'];
export const MAX_REWORKS = 2;

/** Tally one task from its two reviewers' votes (null = missing). AGENTS.md 7.5 */
export function tallyOutcome(votes, reworks) {
  const v = votes.map((x) => x?.vote ?? null);
  let out;
  if (v.length === 2 && v[0] === 'yes' && v[1] === 'yes') out = 'approved';
  else if (v.length === 2 && v[0] === 'no' && v[1] === 'no') out = 'rejected';
  else out = 'more-review';
  if (out === 'more-review' && reworks >= MAX_REWORKS) out = 'blocked';
  return out;
}

/**
 * Ready items in pick order: state todo, active topic, every depends_on item done.
 * items: [{ topic, id, state, priority, depends_on, topicActive }]
 */
export function readyItems(items) {
  const doneSet = new Set(items.filter((i) => i.state === 'done').map((i) => `${i.topic}/${i.id}`));
  return items
    .filter((i) => i.state === 'todo' && i.topicActive)
    .filter((i) => (i.depends_on ?? []).every((d) => doneSet.has(`${i.topic}/${d}`)))
    .sort((a, b) => a.priority - b.priority || a.topic.localeCompare(b.topic) || a.id.localeCompare(b.id));
}

/** Bots in the order they get new items this cycle: rotates by one every cycle. */
export function botOrder(ordinal) {
  const k = ((ordinal % BOTS.length) + BOTS.length) % BOTS.length;
  return [...BOTS.slice(k), ...BOTS.slice(0, k)];
}

/** Lou's commands (AGENTS.md 9.2). */
export function parseCommand(text) {
  const body = String(text ?? '').trim();
  const m = /^\/([a-z]+)\b\s*([\s\S]*)$/i.exec(body);
  if (!m) return null;
  const name = m[1].toLowerCase();
  const rest = m[2].trim();
  switch (name) {
    case 'approve':
    case 'rerun':
    case 'park':
    case 'resume':
      return { name };
    case 'reject':
      return { name, reason: rest.split(/\r?\n/)[0] };
    case 'reword':
    case 'rework':
      if (!rest) return { error: `/${name} needs text` };
      return { name, text: rest };
    default:
      return { error: `unknown command /${name}` };
  }
}

export const COMMANDS_FOR = {
  task: ['approve', 'reword', 'rework', 'reject', 'park', 'resume'],
  item: ['rerun', 'reject', 'park', 'resume'],
  topic: ['reject', 'park', 'resume'],
};
