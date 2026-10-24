import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseVersion, parseVote, parseSeed, parseNode, renderNode, newNodeFm, parseAudit, parseOrder, renderOrder } from '../src/formats.js';
import { buildBallot } from '../src/ballot.js';
import { tally, applyTally } from '../src/tally.js';
import { chooseOrder, pickNextNodes, decideOutcome, findBundles, parseCommand } from '../src/rules.js';
import { parseHeader, renderHeader, withHeader, titlePrefix, stripPrefix, withNeedLou, nodeRelDir, compareNodeIds, parseInlineList } from '../src/util.js';

const v = (bot, round, position, items, verdict = 'revise', node = '03') =>
  `---\nnode: ${node}\nbot: ${bot}\nround: ${round}\nposition: ${position}\n---\n## Summary\nThe node.\n\n${items}\n\n## Atomic\nverdict: ${verdict}\nfailed_tests: [4]\n`;

test('ids and folders', () => {
  assert.equal(nodeRelDir('03.2.1'), 'nodes/03/03.2/03.2.1');
  assert.deepEqual(['03.10', '04', '03', '03.2'].sort(compareNodeIds), ['03', '03.2', '03.10', '04']);
  assert.deepEqual(parseInlineList('[Pick the tracks, "Choose entrants, MVP", c]'), ['Pick the tracks', 'Choose entrants, MVP', 'c']);
});

test('header round-trip keeps "03" a string', () => {
  const h = { topic: '001', node: '03.10', round: 2, order: ['muse', 'claude', 'groky'], depends_on: ['03'] };
  const body = withHeader('hello', h);
  const back = parseHeader(body);
  assert.equal(back.node, '03.10');
  assert.equal(back.topic, '001');
  assert.deepEqual(back.order, ['muse', 'claude', 'groky']);
  assert.ok(renderHeader(h).startsWith('<!-- state'));
});

test('title prefixes', () => {
  assert.deepEqual(titlePrefix('[need-lou #2] [001] 03 Arena'), { kind: 'need-lou', n: 2 });
  assert.deepEqual(titlePrefix('[updated-lou] [001] x'), { kind: 'updated-lou', n: null });
  assert.equal(stripPrefix('[updated-lou #3] [need-lou #2] [001] 03 A'), '[001] 03 A');
  assert.equal(withNeedLou('[updated-lou #1] [001] 03 A', 2), '[need-lou #2] [001] 03 A');
});

test('seed parsing', () => {
  const s = parseSeed(`---\ntopic: "001"\ntitle: Test cases\nstatus: seed\npriority: 3\ndepends_on: ["03"]\n---\n# Test cases\n\n**Goal:** Pick a case.\n\n## Discussion points\n\n- [ ] First point\n    - sub a\n- [ ] Second point\n`, '04-test-cases.md');
  assert.equal(s.id, '04');
  assert.equal(s.priority, 3);
  assert.deepEqual(s.depends_on, ['03']);
  assert.deepEqual(s.points, ['First point; sub a', 'Second point']);
});

test('version parsing: valid, and forfeits on bad format', () => {
  const ok = parseVersion(v('muse', 1, 'A', '## I1\naction: keep\ntype: decision    # comment\nstatement: Use two tracks.\noptions: [one, two]\nrecommendation: two\nreason: clearer\n\n## NEW1\naction: keep\ntype: build\nstatement: Build it.\nsplit_into: [Part a, Part b]'), { node: '03', bot: 'muse', round: 1, position: 'A' });
  assert.ok(ok.ok, ok.errors.join('; '));
  assert.equal(ok.items[0].fields.type, 'decision');
  assert.deepEqual(ok.items[1].fields.split_into, ['Part a', 'Part b']);
  const bad = parseVersion(v('muse', 1, 'A', '## I1\naction: maybe'), { node: '03', bot: 'muse', round: 1, position: 'A' });
  assert.equal(bad.ok, false);
  const wrongBot = parseVersion(v('claude', 1, 'A', '## I1\naction: drop\nreason: no'), { bot: 'muse' });
  assert.equal(wrongBot.ok, false);
});

function sampleRound() {
  const node = parseNode(renderNode({ fm: newNodeFm({ id: '03', depth: 0, title: 'Arena design', priority: 1, issue: 5 }), items: [
    { id: 'I1', fields: { type: 'open', statement: 'Two tracks?' } },
    { id: 'I2', fields: { type: 'open', statement: 'Pick a target model' } },
  ], context: '' }));
  node.fm.round = 1;
  const versions = {
    muse: parseVersion(v('muse', 1, 'A', '## I1\naction: keep\ntype: decision\nstatement: Two tracks.\n\n## I2\naction: keep\ntype: decision\nstatement: Model M.\n\n## NEW1\naction: keep\ntype: build\nstatement: Build harness.\nsplit_into: [Harness]', 'split')),
    groky: parseVersion(v('groky', 1, 'B', '## I1\naction: keep\ntype: decision\nstatement: Two tracks, separate boards.\n\n## I2\naction: drop\nreason: premature\n\n## A.NEW1\naction: keep\ntype: build\nstatement: Build harness first.', 'split')),
    claude: parseVersion(v('claude', 1, 'C', '## I1\naction: keep\ntype: decision\nstatement: One track.\n\n## I2\naction: keep\ntype: decision\nstatement: Model N.\n\n## A.NEW1\naction: keep\ntype: build\nstatement: Harness.\n\n## NEW1\naction: keep\ntype: claim\nstatement: Extra.', 'revise')),
  };
  const positions = { muse: 'A', groky: 'B', claude: 'C' };
  const ballot = buildBallot({ node, versions, positions, secret: 's3cret', label: '001/03/1' });
  return { node, versions, ballot };
}

test('ballot: letters are a deterministic permutation; new items get neutral ids', () => {
  const { ballot } = sampleRound();
  assert.deepEqual(Object.values(ballot.letterOf).sort(), ['X', 'Y', 'Z']);
  assert.deepEqual(ballot.itemIds, ['I1', 'I2', 'N1', 'N2']);
  assert.equal(ballot.originOfNeutral.N1, 'A.NEW1');
  assert.equal(ballot.originOfNeutral.N2, 'C.NEW1');
  const again = sampleRound().ballot;
  assert.deepEqual(again.letterOf, ballot.letterOf);
  const L = ballot.letterOf.groky;
  assert.equal(ballot.treatments.I2[L].status, 'drop');
  assert.equal(ballot.treatments.N2[ballot.letterOf.muse].status, 'missing');
});

test('tally: go, soft go with dissent, escalate, rework, drop via dropped letter, atomic', () => {
  const { node, ballot } = sampleRound();
  const Lm = ballot.letterOf.muse;
  const Lp = ballot.letterOf.groky;
  const Lc = ballot.letterOf.claude;
  const vote = (bot, lines, atomic) => parseVote(`---\nnode: 03\nbot: ${bot}\nround: 1\n---\n${lines}\natomic: ${atomic} — why\n`, { bot });
  const votes = {
    muse: vote('muse', `I1: ${Lp} — r\nI2: ${Lp} — r\nN1: ${Lm} — r\nN2: none — r`, 'split'),
    groky: vote('groky', `I1: ${Lp} — r\nI2: drop — r\nN1: ${Lm} — r\nN2: none — r`, 'split'),
    claude: vote('claude', `I1: ${Lc} — r\nI2: ${Lc} — r\nN1: ${Lm} — r\nN2: ${Lc} — r`, 'leaf'),
  };
  const t = tally(ballot, votes);
  const by = Object.fromEntries(t.items.map((r) => [r.id, r]));
  assert.equal(by.I1.outcome, 'soft');
  assert.equal(by.I1.choice, Lp);
  assert.deepEqual(by.I1.dissent, [{ bot: 'claude', choice: Lc }]);
  assert.equal(by.I2.outcome, 'soft');
  assert.equal(by.I2.choice, 'drop');
  assert.equal(by.N1.outcome, 'go');
  assert.equal(by.N2.outcome, 'rework');
  assert.equal(t.atomic, 'split');
  const applied = applyTally(node, ballot, t, 1);
  const ids = applied.node.items.map((i) => i.id);
  assert.deepEqual(ids, ['I1', 'I3']);
  assert.equal(applied.finalIdOf.N1, 'I3');
  assert.deepEqual(applied.splitTitles, ['Harness']);
  assert.equal(applied.node.fm.soft_go_dissents.I1[0].bot, 'claude');
  assert.equal(applied.node.fm.version_hashes.length, 1);

  const split = tally(ballot, {
    muse: vote('muse', `I1: ${Lm} — r`, 'revise'),
    groky: vote('groky', `I1: ${Lp} — r`, 'revise'),
    claude: vote('claude', `I1: ${Lc} — r`, 'revise'),
  });
  assert.equal(split.items.find((r) => r.id === 'I1').outcome, 'escalate');
  const two = tally(ballot, { muse: votes.muse, claude: votes.claude });
  assert.equal(two.valid, 2);
  assert.equal(two.atomic, 'revise');
  assert.equal(tally(ballot, { muse: votes.muse }).void, true);
});

test('order: A spread across active nodes, rotating otherwise', () => {
  assert.deepEqual(chooseOrder({ prevA: null, busyA: [] }), ['muse', 'groky', 'claude']);
  assert.deepEqual(chooseOrder({ prevA: 'muse', busyA: [] }), ['groky', 'claude', 'muse']);
  assert.deepEqual(chooseOrder({ prevA: 'muse', busyA: ['groky'] }), ['claude', 'muse', 'groky']);
});

test('next nodes: priority, dependencies, children before later roots, slots', () => {
  const nodes = [
    { topic: '001', id: '03', state: 'split', priority: 1, depends_on: [], topicActive: true },
    { topic: '001', id: '03.1', state: 'queued', priority: 1, depends_on: [], topicActive: true },
    { topic: '001', id: '05', state: 'queued', priority: 2, depends_on: ['03'], topicActive: true },
    { topic: '001', id: '01', state: 'queued', priority: 6, depends_on: [], topicActive: true },
    { topic: '001', id: '04', state: 'turn', priority: 3, depends_on: [], topicActive: true },
  ];
  assert.deepEqual(pickNextNodes(nodes, 3).map((n) => n.id), ['03.1', '01']);
  assert.deepEqual(pickNextNodes(nodes, 2).map((n) => n.id), ['03.1']);
});

test('outcome rules in priority order', () => {
  const base = (over = {}) => ({ fm: { ...newNodeFm({ id: '03', depth: 0, title: 'Arena', priority: 1 }), round: 2, ...over }, items: [] });
  const res = (over = {}) => ({ atomic: 'revise', items: [{ id: 'I1', outcome: 'go' }], split_titles: [], ...over });
  assert.equal(decideOutcome({ result: res({ items: [{ id: 'I1', outcome: 'escalate' }] }), node: base(), topicNodeCount: 1 }).state, 'needs-lou');
  assert.equal(decideOutcome({ result: res(), audit: { escalate: ['I1'] }, node: base(), topicNodeCount: 1 }).action, 'escalate');
  assert.equal(decideOutcome({ result: res({ atomic: 'leaf' }), node: base(), topicNodeCount: 1 }).action, 'leaf');
  const sp = decideOutcome({ result: res({ atomic: 'split', split_titles: ['A part', 'B part'] }), node: base(), topicNodeCount: 1 });
  assert.deepEqual(sp, { action: 'split', children: ['A part', 'B part'] });
  assert.equal(decideOutcome({ result: res({ atomic: 'split', split_titles: ['Arena'] }), node: base(), topicNodeCount: 1 }).state, 'stuck');
  assert.equal(decideOutcome({ result: res({ atomic: 'split', split_titles: ['x'] }), node: base({ depth: 4 }), topicNodeCount: 1 }).state, 'stuck');
  assert.equal(decideOutcome({ result: res(), node: base({ version_hashes: ['a', 'b', 'a'] }), topicNodeCount: 1 }).state, 'stuck');
  assert.match(decideOutcome({ result: res(), node: base({ version_hashes: ['a', 'b', 'b'] }), topicNodeCount: 1 }).reason, /converged/);
  assert.equal(decideOutcome({ result: res(), node: base({ round: 6 }), topicNodeCount: 1 }).state, 'paused');
  assert.equal(decideOutcome({ result: res(), node: base(), topicNodeCount: 1 }).action, 'queued');
  const sg = base({ soft_go_dissents: { I1: [{ round: 1, bot: 'muse', choice: 'X' }, { round: 2, bot: 'muse', choice: 'Y' }] } });
  assert.match(decideOutcome({ result: res(), node: sg, topicNodeCount: 1 }).reason, /same dissent/);
  assert.equal(decideOutcome({ result: res({ items: [{ id: 'I1', outcome: 'escalate' }], atomic: 'leaf' }), node: base(), topicNodeCount: 1, skipEscalation: true }).action, 'leaf');
});

test('bundles: highest done subtree with at most 10 leaves', () => {
  const nodes = [
    { id: '03', state: 'split' },
    { id: '03.1', state: 'leaf' },
    { id: '03.2', state: 'split' },
    { id: '03.2.1', state: 'leaf' },
    { id: '03.2.2', state: 'rejected' },
    { id: '05', state: 'leaf' },
    { id: '04', state: 'split' },
    { id: '04.1', state: 'leaf' },
    { id: '04.2', state: 'turn' },
  ];
  // 04.1 is done but waits for its sibling 04.2, so 04 can be reviewed as one bundle
  assert.deepEqual(findBundles(nodes), [
    { id: '03', leaves: ['03.1', '03.2.1'] },
    { id: '05', leaves: ['05'] },
  ]);
  assert.deepEqual(findBundles(nodes, 1).map((b) => b.id), ['03.1', '03.2', '05']);
});

test('commands', () => {
  assert.deepEqual(parseCommand('/rerun'), { name: 'rerun', n: 3 });
  assert.deepEqual(parseCommand('/rerun 5\nthanks'), { name: 'rerun', n: 5 });
  assert.deepEqual(parseCommand('/accept all'), { name: 'accept-all' });
  assert.deepEqual(parseCommand('/pick x z'), { name: 'pick', letters: ['X', 'Z'] });
  assert.deepEqual(parseCommand('/pick 03.1 03.2.1'), { name: 'pick', ids: ['03.1', '03.2.1'] });
  assert.deepEqual(parseCommand('/reject 03.2 out of scope'), { name: 'reject', ids: ['03.2'], reason: 'out of scope' });
  assert.deepEqual(parseCommand('/reword 03.1 Use one track.'), { name: 'reword', ids: ['03.1'], text: 'Use one track.' });
  assert.deepEqual(parseCommand('/reword Keep it simple.'), { name: 'reword', ids: [], text: 'Keep it simple.' });
  assert.ok(parseCommand('/pick A').error);
  assert.ok(parseCommand('/frobnicate').error);
  assert.equal(parseCommand('please rerun'), null);
});

test('audit, order and node round-trips', () => {
  const a = parseAudit('```\nresult: void\nfailed: [2, 5]\nevidence: x\nescalate: [I3]\n```');
  assert.deepEqual(a, { ok: true, result: 'void', failed: ['2', '5'], escalate: ['I3'] });
  const o = parseOrder(renderOrder({ node: '03.2', round: 3, order: ['claude', 'muse', 'groky'] }));
  assert.deepEqual(o.order, ['claude', 'muse', 'groky']);
  assert.equal(o.node, '03.2');
  const n = { fm: newNodeFm({ id: '03.10', parent: '03', depth: 1, title: 'Title: with colon', priority: 1, issue: 9 }), items: [{ id: 'I1', fields: { type: 'open', statement: 'x, y' } }], context: 'Parent said so.' };
  const back = parseNode(renderNode(n));
  assert.equal(back.fm.id, '03.10');
  assert.equal(back.fm.parent, '03');
  assert.equal(back.fm.title, 'Title: with colon');
  assert.equal(back.items[0].fields.statement, 'x, y');
  assert.equal(back.context, 'Parent said so.');
});
