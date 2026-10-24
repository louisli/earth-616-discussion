import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cycleAt, nextCycleId, cycleOrdinal } from '../src/clock.js';
import { tallyOutcome, readyItems, botOrder, parseCommand } from '../src/rules.js';
import * as F from '../src/formats.js';
import { parseHeader, withHeader } from '../src/util.js';

test('clock: cycles start at even hours ET', () => {
  // 2026-10-24 06:10 UTC = 02:10 EDT
  assert.deepEqual(cycleAt(new Date('2026-10-24T06:10:00Z')).id, '2026-10-24-02');
  assert.equal(cycleAt(new Date('2026-10-24T06:10:00Z')).minute, 10);
  assert.equal(cycleAt(new Date('2026-10-24T07:50:00Z')).minute, 110); // 03:50 EDT
  assert.equal(nextCycleId(new Date('2026-10-24T07:50:00Z')), '2026-10-24-04');
  assert.equal(nextCycleId(new Date('2026-10-25T03:50:00Z')), '2026-10-25-00'); // 23:50 → midnight
  assert.equal(cycleOrdinal('2026-10-24-04') - cycleOrdinal('2026-10-24-02'), 1);
  assert.equal(cycleOrdinal('2026-10-25-00') - cycleOrdinal('2026-10-24-22'), 1);
});

test('tally rules (AGENTS.md 7.5)', () => {
  const v = (x) => (x ? { vote: x } : null);
  assert.equal(tallyOutcome([v('yes'), v('yes')], 0), 'approved');
  assert.equal(tallyOutcome([v('no'), v('no')], 0), 'rejected');
  assert.equal(tallyOutcome([v('maybe'), v('maybe')], 0), 'more-review');
  assert.equal(tallyOutcome([v('yes'), v('no')], 0), 'more-review');
  assert.equal(tallyOutcome([v('yes'), null], 0), 'more-review');
  assert.equal(tallyOutcome([v('yes'), v('maybe')], 2), 'blocked');
  assert.equal(tallyOutcome([v('yes'), v('yes')], 2), 'approved');
  assert.equal(tallyOutcome([v('no'), v('no')], 2), 'rejected');
});

test('ready items honor priority and dependencies', () => {
  const it = (id, state, priority, deps = []) => ({ topic: '001', id, state, priority, depends_on: deps, topicActive: true });
  const r = readyItems([it('01', 'todo', 6), it('03', 'done', 1), it('04', 'todo', 3, ['03']), it('05', 'todo', 2, ['03']), it('07', 'todo', 4, ['04', '05'])]);
  assert.deepEqual(r.map((x) => x.id), ['05', '04', '01']);
  assert.deepEqual(readyItems([{ ...it('01', 'todo', 1), topicActive: false }]), []);
});

test('bot order rotates every cycle', () => {
  assert.deepEqual(botOrder(0), ['muse', 'groky', 'claude']);
  assert.deepEqual(botOrder(1), ['groky', 'claude', 'muse']);
  assert.deepEqual(botOrder(5), ['claude', 'muse', 'groky']);
});

test('Lou commands', () => {
  assert.deepEqual(parseCommand('/approve'), { name: 'approve' });
  assert.deepEqual(parseCommand('/reword Use one judge model.\nMore text'), { name: 'reword', text: 'Use one judge model.\nMore text' });
  assert.equal(parseCommand('/rework').error, '/rework needs text');
  assert.deepEqual(parseCommand('/reject dup'), { name: 'reject', reason: 'dup' });
  assert.equal(parseCommand('[muse] /approve'), null);
  assert.ok(parseCommand('/pick X').error);
});

test('breakdown parsing', () => {
  const text = `---\ntopic: "001"\nitem: "03"\nbot: muse\ncycle: 2026-10-24-02\n---\n## Summary\nSplit by track.\n\n## 1\ntitle: Pick the target model\ndescription: Choose one target model\n  for every run.\ndone_when: model named in README\nsources: [https://a.example, https://b.example]\n\n## 2\ntitle: no description\n`;
  const b = F.parseBreakdown(text, { item: '03', bot: 'muse', cycle: '2026-10-24-02' });
  assert.ok(b.ok);
  assert.equal(b.tasks.length, 1);
  assert.equal(b.tasks[0].description, 'Choose one target model for every run.');
  assert.deepEqual(b.tasks[0].sources, ['https://a.example', 'https://b.example']);
  assert.equal(F.parseBreakdown(text, { bot: 'groky' }).ok, false);
  assert.equal(F.parseBreakdown('no frontmatter').ok, false);
});

test('review parsing', () => {
  const r = F.parseReview(`---\nitem: "03"\nbot: claude\ncycle: c\n---\n## T3\nvote: Yes\nreason: fine\n\n## t5\nvote: maybe\nreason: vague\nchanges: name the model\n\n## T6\nvote: perhaps\n`, { bot: 'claude' });
  assert.deepEqual(Object.keys(r.votes), ['T3', 'T5']);
  assert.equal(r.votes.T3.vote, 'yes');
  assert.equal(r.votes.T5.changes, 'name the model');
});

test('task.md and sheet round trip', () => {
  const t = { topic: '001', item: '03', task: 'T4', author: 'muse', state: 'more-review', reworks: 1, first_cycle: 'c', issue: 9, lou_approved: false, title: 'A', description: 'B c', done_when: 'D', sources: ['u'], changes: ['x'], history: ['h'] };
  const back = F.parseTask(F.renderTask(t));
  assert.deepEqual(back, t);
  const sheet = F.renderSheet({ topic: '001', item: '03', cycle: 'c', reviewer: 'groky', fresh: [{ id: 'T1', author: 'muse', title: 'One', description: 'Two' }], reworks: [{ id: 'T4', author: 'muse', title: 'A', description: 'B', changes: ['x'], response: 'done' }] });
  const parsed = F.parseSheet(sheet);
  assert.deepEqual(Object.keys(parsed), ['T1', 'T4']);
  assert.equal(parsed.T1.description, 'Two');
  assert.equal(parsed.T4.title, 'A');
});

test('assignments round trip', () => {
  const a = { topic: '001', item: '03', cycle: '2026-10-24-02', author: 'groky', work: [{ bot: 'groky', what: 'breakdown' }], review: { sheets: ['muse', 'claude'], fresh: { T1: 'groky' }, reworks: [] } };
  const text = F.renderAssignments(a);
  assert.match(text, /- groky: breakdown/);
  assert.match(text, /- claude: review, sheet review-sheet-claude.md/);
  assert.deepEqual(F.parseAssignments(text), a);
});

test('state header keeps new keys', () => {
  const b = withHeader('hello', { topic: '001', item: '03', cycle: '2026-10-24-02', phase: 'work', author: 'muse', new_in: '2026-10-24-02' });
  assert.equal(parseHeader(b).new_in, '2026-10-24-02');
  assert.equal(parseHeader(b).item, '03');
});
