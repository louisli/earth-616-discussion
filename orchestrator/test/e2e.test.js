// End-to-end simulation: real git (local bare remote), in-memory GitHub, scripted bots/auditor/Lou
// following AGENTS.md runbooks. Runs topic 001's real seeds through to a finished topic.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Store, MockGitHub } from './mock-github.js';
import { Git } from '../src/git.js';
import { Orchestrator } from '../src/orchestrator.js';
import { parseHeader, nodeRelDir, roundDir, titlePrefix, stripPrefix } from '../src/util.js';
import { parseNode, parseOrder, sections } from '../src/formats.js';
import { standardLabels } from '../src/labels.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
const baseConfig = JSON.parse(fs.readFileSync(path.join(here, '..', 'config.json'), 'utf8'));
const BOTS = ['muse', 'groky', 'claude'];

function sh(cwd, args, author = 'test') {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, GIT_AUTHOR_NAME: author, GIT_AUTHOR_EMAIL: `${author}@x`, GIT_COMMITTER_NAME: author, GIT_COMMITTER_EMAIL: `${author}@x` },
  }).trim();
}

function setup() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'e616-e2e-'));
  const origin = path.join(tmp, 'origin.git');
  sh(tmp, ['init', '-q', '--bare', '-b', 'main', origin]);
  const seed = path.join(tmp, 'seed');
  sh(tmp, ['clone', '-q', origin, seed]);
  for (const f of ['AGENTS.md', 'README.md', 'MASTER.md', 'TEMPLATE.md', 'topics', 'inbox', 'outbox', 'agents']) {
    fs.cpSync(path.join(repoRoot, f), path.join(seed, f), { recursive: true });
  }
  sh(seed, ['checkout', '-q', '-b', 'main']);
  sh(seed, ['add', '-A']);
  sh(seed, ['commit', '-q', '-m', 'seed']);
  sh(seed, ['push', '-q', 'origin', 'main']);
  const clone = (name) => {
    const d = path.join(tmp, name);
    sh(tmp, ['clone', '-q', origin, d]);
    return d;
  };
  const orchDir = clone('orch');
  const botDir = clone('bots');
  const mergeDir = clone('merger');
  const store = new Store({
    onMerge: async (p) => {
      sh(mergeDir, ['fetch', '-q', 'origin']);
      sh(mergeDir, ['checkout', '-q', '-B', 'main', 'origin/main']);
      sh(mergeDir, ['merge', '-q', '--no-ff', '-m', `merge ${p.head}`, `origin/${p.head}`], 'louisli');
      sh(mergeDir, ['push', '-q', 'origin', 'main']);
    },
  });
  for (const [n] of standardLabels()) store.labels.add(n);
  return { tmp, origin, orchDir, botDir, store, mergeDir };
}

async function runOrch(env, cfg = {}) {
  const gh = new MockGitHub(env.store, 'github-actions[bot]');
  const git = new Git({ repoDir: env.orchDir, log: () => {} });
  const orch = new Orchestrator({ gh, git, config: { ...baseConfig, start_rounds: true, ...cfg }, secret: 'test-secret', now: () => env.store.clock, log: () => {} });
  try {
    return await orch.run();
  } finally {
    git.cleanup();
  }
}

// ---------- simulated bots (AGENTS.md section 11) ----------

function topicDirIn(dir, nnn) {
  for (const st of ['active', 'done', 'parked', 'rejected']) {
    const p = path.join(dir, 'topics', st);
    if (!fs.existsSync(p)) continue;
    const d = fs.readdirSync(p).find((x) => x.startsWith(`${nnn}-`));
    if (d) return `topics/${st}/${d}`;
  }
  return null;
}

function checkout(env, branch) {
  sh(env.botDir, ['fetch', '-q', 'origin']);
  sh(env.botDir, ['checkout', '-q', '-B', 'work', `origin/${branch}`]);
  sh(env.botDir, ['clean', '-qfd']);
}

function pushWork(env, branch, files, msg, author) {
  sh(env.botDir, ['add', ...files]);
  sh(env.botDir, ['commit', '-q', '-m', msg], author);
  for (let i = 0; i < 4; i++) {
    try {
      sh(env.botDir, ['push', '-q', 'origin', `HEAD:refs/heads/${branch}`], author);
      return;
    } catch {
      sh(env.botDir, ['fetch', '-q', 'origin']);
      sh(env.botDir, ['rebase', '-q', `origin/${branch}`], author);
    }
  }
  throw new Error('bot push failed');
}

const canon = (s) => (s.startsWith('Do: ') ? s : `Do: ${s}`);

function versionFor(scn, { bot, pos, node, round, id }) {
  const lines = [`---`, `node: ${id}`, `bot: ${bot}`, `round: ${round}`, `position: ${pos}`, `---`, `## Summary`, `Node ${id}.`, ''];
  for (const it of node.items) {
    let statement = canon(it.fields.statement);
    if (scn.disagree?.(id, round) && it.id === 'I1') statement = `Option from ${bot}`;
    lines.push(`## ${it.id}`, 'action: keep', 'type: build', `statement: ${statement}`, `acceptance: ${id} ${it.id} is done`, ...(pos !== 'A' ? ['agrees_with: [A]', 'disagrees_with: []'] : []), '');
  }
  const split = scn.split?.(id, round);
  if (split) {
    const head = pos === 'A' ? 'NEW1' : 'A.NEW1';
    lines.push(`## ${head}`, 'action: keep', 'type: build', `statement: Break ${id} into parts`, `split_into: [${split.join(', ')}]`, '');
  }
  const verdict = split ? 'split' : scn.revise?.(id, round) ? 'revise' : 'leaf';
  lines.push('## Atomic', `verdict: ${verdict}`, ...(verdict === 'leaf' ? [] : ['failed_tests: [1]']), '');
  return lines.join('\n');
}

function parseBallot(text) {
  const out = {};
  for (const s of sections(text)) {
    if (s.heading === 'Atomic') continue;
    const t = {};
    let L = null;
    for (const line of s.lines) {
      const h = /^###\s+([XYZ])$/.exec(line);
      if (h) {
        L = h[1];
        t[L] = '';
        continue;
      }
      if (L && /^(statement|dropped):/.test(line)) t[L] = line.replace(/^(statement|dropped):\s*/, '');
      if (L && line.trim() === '(not addressed)') t[L] = null;
    }
    out[s.heading] = t;
  }
  return out;
}

async function botStep(env, scn, bot) {
  const gh = new MockGitHub(env.store, 'earth616-bots');
  const open = await gh.listIssues({ state: 'open' });
  if (open.some((i) => i.labels.includes(`claimed:${bot}`))) return false;
  const task =
    open.find((i) => i.labels.includes(`vote:${bot}`) && !i.labels.includes('bot-error')) ??
    open.find((i) => i.labels.includes(`turn:${bot}`) && !i.labels.includes('bot-error') && !i.labels.some((l) => l.startsWith('claimed:')));
  if (!task) return false;
  await gh.addLabels(task.number, [`claimed:${bot}`]);
  const lock = await gh.createComment(task.number, `[${bot}] lock: ${bot} run sim heartbeat ${env.store.ts()}`);
  const h = parseHeader(task.body);
  checkout(env, h.branch);
  const td = topicDirIn(env.botDir, h.topic);
  const nodeDir = `${td}/${nodeRelDir(h.node)}`;
  const node = parseNode(fs.readFileSync(path.join(env.botDir, nodeDir, 'node.md'), 'utf8'));
  const rd = `${nodeDir}/rounds/${roundDir(node.fm.round)}`;
  const author = `${bot}-bot`;
  if (task.labels.includes(`vote:${bot}`)) {
    const ballot = parseBallot(fs.readFileSync(path.join(env.botDir, rd, 'ballot', 'ballot.md'), 'utf8'));
    const lines = [`---`, `node: ${h.node}`, `bot: ${bot}`, `round: ${node.fm.round}`, `---`];
    for (const [id, ts] of Object.entries(ballot)) {
      const own = Object.entries(ts).find(([, s]) => s && s.includes(`from ${bot}`));
      const best = Object.entries(ts).filter(([, s]) => s !== null).sort((a, b) => a[1].localeCompare(b[1]) || a[0].localeCompare(b[0]))[0];
      lines.push(`${id}: ${(own ?? best)?.[0] ?? 'none'} — consistent with the goal`);
    }
    const verdict = scn.split?.(h.node, node.fm.round) ? 'split' : scn.revise?.(h.node, node.fm.round) ? 'revise' : scn.disagree?.(h.node, node.fm.round) ? 'revise' : 'leaf';
    lines.push(`atomic: ${verdict} — per the ballot`);
    fs.writeFileSync(path.join(env.botDir, rd, `vote-${bot}.md`), lines.join('\n') + '\n');
    pushWork(env, h.branch, [`${rd}/vote-${bot}.md`], `${h.topic}/${h.node} ${roundDir(node.fm.round)} ${bot} vote`, author);
    await gh.removeLabel(task.number, `vote:${bot}`);
  } else {
    const order = parseOrder(fs.readFileSync(path.join(env.botDir, rd, 'order.md'), 'utf8')).order;
    const pos = 'ABC'[order.indexOf(bot)];
    fs.writeFileSync(path.join(env.botDir, rd, `research-${bot}.md`), `---\nnode: ${h.node}\nbot: ${bot}\nround: ${node.fm.round}\n---\nweb_access: no\n`);
    fs.writeFileSync(path.join(env.botDir, rd, `version-${bot}.md`), versionFor(scn, { bot, pos, node, round: node.fm.round, id: h.node }));
    pushWork(env, h.branch, [`${rd}/research-${bot}.md`, `${rd}/version-${bot}.md`], `${h.topic}/${h.node} ${roundDir(node.fm.round)} ${bot} version`, author);
    await gh.removeLabel(task.number, `turn:${bot}`);
    if (pos === 'C') {
      await gh.removeLabel(task.number, 'state:turn');
      await gh.addLabels(task.number, ['state:ballot']);
    } else await gh.addLabels(task.number, [`turn:${order['ABC'.indexOf(pos) + 1]}`]);
  }
  await gh.deleteComment(lock.id);
  await gh.removeLabel(task.number, `claimed:${bot}`);
  await gh.createComment(task.number, `[${bot}] ${roundDir(node.fm.round)} ${bot} committed`);
  return true;
}

async function auditorStep(env, scn) {
  const gh = new MockGitHub(env.store, 'earth616-bots');
  const open = await gh.listIssues({ state: 'open' });
  const task = open.find((i) => i.labels.includes('state:audit'));
  if (!task) return false;
  const h = parseHeader(task.body);
  checkout(env, h.branch);
  const td = topicDirIn(env.botDir, h.topic);
  const nodeDir = `${td}/${nodeRelDir(h.node)}`;
  const node = parseNode(fs.readFileSync(path.join(env.botDir, nodeDir, 'node.md'), 'utf8'));
  const rd = `${nodeDir}/rounds/${roundDir(node.fm.round)}`;
  const voidIt = scn.voidAudit?.(h.node, node.fm.round);
  fs.writeFileSync(path.join(env.botDir, rd, 'audit.md'), `result: ${voidIt ? 'void' : 'pass'}\nfailed: [${voidIt ? '5' : ''}]\nevidence: sim\nescalate: []\n`);
  pushWork(env, h.branch, [`${rd}/audit.md`], `${h.topic}/${h.node} audit`, 'auditor-bot');
  await gh.removeLabel(task.number, 'state:audit');
  await gh.addLabels(task.number, ['state:audited']);
  return true;
}

async function louStep(env, scn) {
  const gh = new MockGitHub(env.store, 'louisli');
  const open = await gh.listIssues({ state: 'open' });
  let acted = false;
  for (const i of open) {
    const p = titlePrefix(i.title);
    if (p?.kind !== 'need-lou') continue;
    const cmd = scn.lou(i);
    if (cmd === 'merge') {
      await gh.mergePull(i.number);
      acted = true;
      continue;
    }
    if (!cmd) continue;
    await gh.createComment(i.number, cmd);
    await gh.updateIssue(i.number, { title: `[updated-lou #${p.n}] ${stripPrefix(i.title)}` });
    acted = true;
  }
  return acted;
}

async function simulate(env, scn, { maxCycles = 120 } = {}) {
  const log = [];
  for (let c = 0; c < maxCycles; c++) {
    log.push(...(await runOrch(env)));
    let busy = false;
    for (const b of BOTS) busy = (await botStep(env, scn, b)) || busy;
    busy = (await auditorStep(env, scn)) || busy;
    busy = (await louStep(env, scn)) || busy;
    env.store.advance(5);
    sh(env.mergeDir, ['fetch', '-q', 'origin']);
    if (sh(env.mergeDir, ['ls-tree', '--name-only', 'origin/main', 'topics/done/']).includes('001-')) {
      log.push(...(await runOrch(env)));
      return { log, cycles: c + 1 };
    }
  }
  return { log, cycles: maxCycles };
}

const show = (env, ref, p) => sh(env.mergeDir, ['show', `${ref}:${p}`]);

test('end to end: topic 001 runs from seeds to done', { timeout: 600000 }, async () => {
  const env = setup();
  const scn = {
    split: (id, r) => (id === '03' && r === 1 ? ['Tracks', 'Entrants'] : null),
    disagree: (id, r) => id === '01' && r === 1,
    voidAudit: (id, r) => id === '03.2' && r === 1,
    lou: (issue) => {
      const h = parseHeader(issue.body);
      if (issue.isPull) return /bundle 01:/.test(issue.title) ? '/reject 01 not now' : 'merge';
      if (h?.node === '01') return '/pick X';
      return '/rerun 2';
    },
  };
  const { log, cycles } = await simulate(env, scn);
  const errors = log.filter((l) => /failed|error/i.test(l));
  assert.deepEqual(errors, [], `orchestrator reported errors:\n${errors.join('\n')}`);

  // topic finished and moved
  const doneTree = sh(env.mergeDir, ['ls-tree', '-r', '--name-only', 'origin/main', 'topics/done/']);
  assert.ok(doneTree.includes('001-2026-09-prompt-optimizer-arena/README.md'), `topic not done after ${cycles} cycles`);

  const s = env.store;
  const nodes = s.issues.filter((i) => i.labels.includes('kind:node'));
  const byNode = Object.fromEntries(nodes.map((i) => [parseHeader(i.body).node, i]));
  // 8 seeds + 2 children of 03
  assert.equal(nodes.length, 10);
  assert.deepEqual(Object.keys(byNode).sort(), ['01', '02', '03', '03.1', '03.2', '04', '05', '06', '07', '08']);
  assert.ok(s.subIssues.some((x) => x.parent === byNode['03'].number && x.childId === byNode['03.1'].id), '03.1 is a sub-issue of 03');

  // 01: escalated on a 3-way split, Lou picked X, then leaf, then bundle rejected
  const c01 = s.comments.filter((c) => c.n === byNode['01'].number).map((c) => c.body);
  assert.ok(c01.some((b) => b.includes('<!-- need-lou #1') && b.includes('votes split')), '01 escalated');
  assert.ok(c01.some((b) => b.startsWith('Done: `/pick X`')), '01 /pick X applied');
  assert.equal(byNode['01'].state, 'closed');
  assert.equal(byNode['01'].state_reason, 'not_planned');
  assert.ok(byNode['01'].labels.includes('state:rejected'));

  // 03.2: one void round, then leaf → approved
  const c032 = s.comments.filter((c) => c.n === byNode['03.2'].number).map((c) => c.body);
  assert.ok(c032.some((b) => /^r01 void: audit failed/.test(b)), '03.2 r01 void');
  assert.ok(c032.some((b) => b.startsWith('r02 started')), '03.2 ran r02');
  for (const id of ['03.1', '03.2', '04', '05', '06', '07', '02', '08']) {
    assert.ok(byNode[id].labels.includes('state:approved'), `${id} approved (labels: ${byNode[id].labels})`);
    assert.equal(byNode[id].state, 'closed');
  }
  assert.ok(byNode['03'].labels.includes('state:split'));

  // bundles: 03 bundle contains both children; outbox written; rejected 01 bundle closed unmerged
  const prs = s.pulls.map((p) => ({ ...p, title: s.issues.find((i) => i.number === p.number).title }));
  const b03 = prs.find((p) => p.head === 'bundle/001/03');
  assert.ok(b03?.merged, 'bundle 03 merged');
  assert.ok(prs.find((p) => p.head === 'bundle/001/01' && !p.merged && p.state === 'closed'), 'bundle 01 closed unmerged');
  const outbox = sh(env.mergeDir, ['ls-tree', '--name-only', 'origin/main', 'outbox/']);
  assert.match(outbox, /outbox\/2026-10-2\d-001-03\.md/);
  const plan = show(env, 'origin/main', outbox.split('\n').find((f) => /-001-03\.md$/.test(f)));
  assert.match(plan, /### 03\.1 Tracks/);
  assert.match(plan, /### 03\.2 Entrants/);
  assert.match(plan, /Acceptance: 03\.1 I1 is done/);
  assert.ok(!outbox.includes('-001-01.md'), 'no plan for the rejected bundle');

  // overrides logged, master list generated, ballot blind (key only after voting)
  const ov = show(env, 'origin/main', 'topics/done/001-2026-09-prompt-optimizer-arena/overrides.md');
  assert.match(ov, /\| 01 \| \/pick X \|/);
  assert.match(ov, /bundle #\d+ \| \/reject 01 not now/);
  const master = show(env, 'origin/main', 'MASTER.md');
  assert.match(master, /\| 001 \| .* \| done \|/);
  const keyLog = sh(env.mergeDir, ['log', '--format=%s', 'origin/loop/001/03', '--', 'topics/active/001-2026-09-prompt-optimizer-arena/nodes/03/rounds/r01/ballot/key.md']);
  const voteLog = sh(env.mergeDir, ['log', '--format=%s', 'origin/loop/001/03', '--', 'topics/active/001-2026-09-prompt-optimizer-arena/nodes/03/rounds/r01/vote-muse.md']);
  assert.ok(keyLog && voteLog, 'key and votes exist');
  const keyTime = Number(sh(env.mergeDir, ['log', '-1', '--format=%ct', 'origin/loop/001/03', '--', 'topics/active/001-2026-09-prompt-optimizer-arena/nodes/03/rounds/r01/ballot/key.md']));
  const voteTime = Number(sh(env.mergeDir, ['log', '-1', '--format=%ct', 'origin/loop/001/03', '--', 'topics/active/001-2026-09-prompt-optimizer-arena/nodes/03/rounds/r01/vote-muse.md']));
  assert.ok(keyTime >= voteTime, 'key written after votes');

  // the orchestrator only ever commits as orchestrator-bot, bots only touch their own files
  const authors = sh(env.mergeDir, ['log', '--all', '--format=%an %s']).split('\n');
  for (const line of authors.filter((l) => l.startsWith('muse-bot'))) assert.match(line, /muse (version|vote)$/);
  assert.ok(authors.some((l) => l.startsWith('orchestrator-bot')));

  // dependency order: 05 started only after 03 was done
  const startOf = (id) => s.comments.find((c) => c.n === byNode[id].number && c.body.startsWith('r01 started'))?.created_at;
  const splitAt = s.comments.find((c) => c.n === byNode['03'].number && /split into/.test(c.body))?.created_at;
  assert.ok(startOf('05') > splitAt, '05 waited for 03');
  console.log(`simulation finished in ${cycles} cycles; ${s.issues.length} issues/PRs; ${s.comments.length} comments`);
});

test('health: dead locks, bot errors and absent bots', { timeout: 120000 }, async () => {
  const env = setup();
  const s = env.store;
  await runOrch(env); // creates issues and starts 03 and 01
  const gh = new MockGitHub(s, 'earth616-bots');
  const n03 = s.issues.find((i) => parseHeader(i.body)?.node === '03');
  const n01 = s.issues.find((i) => parseHeader(i.body)?.node === '01');
  assert.ok(n03.labels.includes('turn:muse'), `03 starts with muse (labels: ${n03.labels})`);
  assert.ok(n01.labels.includes('turn:groky'), '01 starts with groky (A spread across nodes)');

  // dead lock: label + stale heartbeat
  await gh.addLabels(n03.number, ['claimed:muse']);
  await gh.createComment(n03.number, `[muse] lock: muse run x heartbeat ${s.ts()}`);
  s.advance(31);
  // bot error on 03 (a different role than the dead lock)
  await gh.addLabels(n03.number, ['bot-error']);
  await gh.createComment(n03.number, '[claude] error: claude could not parse header');
  await runOrch(env);
  assert.ok(!n03.labels.includes('claimed:muse'), 'dead lock released');
  assert.ok(n03.labels.includes('turn:muse'), 'task label kept');
  assert.ok(s.comments.some((c) => c.n === n03.number && c.body === 'lock released: muse no heartbeat for 30m'));
  assert.ok(!n03.labels.includes('bot-error'), 'bot-error cleared');
  sh(env.mergeDir, ['fetch', '-q', 'origin']);
  const node03 = parseNode(show(env, 'origin/loop/001/03', 'topics/active/001-2026-09-prompt-optimizer-arena/nodes/03/node.md'));
  assert.equal(node03.fm.dead_locks.muse, 1);
  assert.equal(node03.fm.bot_errors.claude, 1);

  // absent bot: nobody touches 01 for 6+ hours (groky never takes its turn)
  s.advance(6 * 60 + 5);
  await runOrch(env);
  assert.ok(n01.labels.includes('state:needs-lou'), `01 escalated (labels: ${n01.labels})`);
  assert.match(n01.title, /^\[need-lou #1\]/);
  assert.ok(!n01.labels.some((l) => l.startsWith('turn:')), 'task labels cleared on escalation');
  // 03 was released by a dead lock, which counts as the bot having tried, so it stays in turn
  assert.ok(n03.labels.includes('state:turn'));

  // Lou removes the prefix without a command → restored
  await new MockGitHub(s, 'louisli').updateIssue(n01.number, { title: stripPrefix(n01.title) });
  await runOrch(env);
  assert.match(n01.title, /^\[need-lou #1\]/);

  // a bot (not Lou) posting a command is ignored, and so is a tagged comment from a bot running as louisli
  await gh.createComment(n01.number, '/reject');
  await new MockGitHub(s, 'louisli').createComment(n01.number, '[claude] /reject this is a bot quoting a command');
  await new MockGitHub(s, 'louisli').updateIssue(n01.number, { title: `[updated-lou #1] ${stripPrefix(n01.title)}` });
  await runOrch(env);
  assert.equal(n01.state, 'open', 'bot command ignored');
  assert.match(n01.title, /^\[need-lou #1\]/);
  assert.ok(s.comments.some((c) => c.n === n01.number && c.body.startsWith('I found `[updated-lou]` but no new command')));
});
