// End-to-end simulation of even-hour cycles: real git (local bare remote), in-memory GitHub, scripted bots,
// auditor and Lou following AGENTS.md runbooks. Runs topic 001's real seeds until the topic is done.
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
import { parseHeader, titlePrefix, stripPrefix } from '../src/util.js';
import * as F from '../src/formats.js';
import { standardLabels } from '../src/labels.js';
import { cycleAt } from '../src/clock.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
const baseConfig = JSON.parse(fs.readFileSync(path.join(here, '..', 'config.json'), 'utf8'));
const BOTS = ['muse', 'groky', 'claude'];

function sh(cwd, args, author = 'test') {
  return execFileSync('git', args, {
    cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, GIT_AUTHOR_NAME: author, GIT_AUTHOR_EMAIL: `${author}@x`, GIT_COMMITTER_NAME: author, GIT_COMMITTER_EMAIL: `${author}@x` },
  }).trim();
}

function setup() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'e616-e2e-'));
  const origin = path.join(tmp, 'origin.git');
  sh(tmp, ['init', '-q', '--bare', '-b', 'main', origin]);
  const seed = path.join(tmp, 'seed');
  sh(tmp, ['clone', '-q', origin, seed]);
  for (const f of ['AGENTS.md', 'README.md', 'MASTER.md', 'TEMPLATE.md', 'topics']) fs.cpSync(path.join(repoRoot, f), path.join(seed, f), { recursive: true });
  sh(seed, ['checkout', '-q', '-b', 'main']);
  sh(seed, ['add', '-A']);
  sh(seed, ['commit', '-q', '-m', 'seed']);
  sh(seed, ['push', '-q', 'origin', 'main']);
  const orchDir = path.join(tmp, 'orch');
  const botDir = path.join(tmp, 'bots');
  sh(tmp, ['clone', '-q', origin, orchDir]);
  sh(tmp, ['clone', '-q', origin, botDir]);
  const store = new Store();
  store.clock = new Date('2026-10-24T04:05:00Z'); // 00:05 EDT
  for (const [n] of standardLabels()) store.labels.add(n);
  return { tmp, orchDir, botDir, store };
}

async function runOrch(env, cfg = {}) {
  const gh = new MockGitHub(env.store, 'github-actions[bot]');
  const git = new Git({ repoDir: env.orchDir, log: () => {} });
  const orch = new Orchestrator({ gh, git, config: { ...baseConfig, start_cycles: true, ...cfg }, now: () => env.store.clock, log: () => {} });
  try {
    return await orch.run();
  } finally {
    git.cleanup();
  }
}

const at = (env, minute) => {
  const c = cycleAt(env.store.clock);
  env.store.advance(minute - c.minute);
};
const nextCycle = (env) => env.store.advance(120 - cycleAt(env.store.clock).minute + 5);

// ---------- simulated bots (AGENTS.md 11) ----------

function topicDir(dir) {
  for (const st of ['active', 'done', 'parked', 'rejected']) {
    const p = path.join(dir, 'topics', st);
    const d = fs.existsSync(p) && fs.readdirSync(p).find((x) => x.startsWith('001-'));
    if (d && fs.existsSync(path.join(dir, 'topics', st, d, 'README.md'))) return `topics/${st}/${d}`;
  }
  return null;
}

function checkout(env, branch) {
  sh(env.botDir, ['fetch', '-q', 'origin']);
  sh(env.botDir, ['checkout', '-q', '-B', 'w', `origin/${branch}`]);
  sh(env.botDir, ['clean', '-qfd']);
}

function push(env, branch, file, msg, author) {
  sh(env.botDir, ['add', file]);
  sh(env.botDir, ['commit', '-q', '-m', msg], author);
  for (let i = 0; i < 4; i++) {
    try {
      return sh(env.botDir, ['push', '-q', 'origin', `HEAD:refs/heads/${branch}`], author);
    } catch {
      sh(env.botDir, ['fetch', '-q', 'origin']);
      sh(env.botDir, ['rebase', '-q', `origin/${branch}`], author);
    }
  }
  throw new Error('push failed');
}

/**
 * Votes by task title marker: "[ok]" yes·yes, "[no]" no·no, "[fix]" maybe until reworked once,
 * "[stuck]" maybe forever (→ blocked after 2 reworks).
 */
function voteFor(t) {
  const reworked = /\(reworked/.test(t.title);
  if (/\[no\]/.test(t.title)) return { vote: 'no', reason: 'out of scope' };
  if (/\[fix\]/.test(t.title) && !reworked) return { vote: 'maybe', reason: 'vague', changes: 'name the metric' };
  if (/\[stuck\]/.test(t.title)) return { vote: 'maybe', reason: 'still vague', changes: 'be concrete' };
  return { vote: 'yes', reason: 'clear' };
}

async function botsWork(env, { skip = [] } = {}) {
  const gh = new MockGitHub(env.store, 'thelouis7789');
  for (const bot of BOTS) {
    if (skip.includes(bot)) continue;
    for (const issue of await gh.listIssues({ state: 'open', labels: `todo:${bot}` })) {
      const h = parseHeader(issue.body);
      checkout(env, h.branch);
      const td = topicDir(env.botDir);
      const cdir = `${td}/items/${h.item}/cycles/${h.cycle}`;
      const a = F.parseAssignments(fs.readFileSync(path.join(env.botDir, cdir, 'assignments.md'), 'utf8'));
      const c = cycleAt(env.store.clock);
      if (c.minute < 25) {
        for (const w of a.work.filter((w) => w.bot === bot)) {
          let file, text;
          if (w.what === 'breakdown') {
            file = `${cdir}/breakdown-${bot}.md`;
            const marks = ['[ok]', '[fix]', '[no]', h.item === '03' ? '[stuck]' : '[ok]'];
            text = `---\ntopic: "001"\nitem: "${h.item}"\nbot: ${bot}\ncycle: ${h.cycle}\n---\n## Summary\nBy ${bot}.\n\n${marks.map((m, k) => `## ${k + 1}\ntitle: ${h.item} task ${k + 1} ${m}\ndescription: Do part ${k + 1} of item ${h.item}.\ndone_when: part ${k + 1} exists\n`).join('\n')}`;
          } else {
            file = `${cdir}/rework-${w.task}-${bot}.md`;
            const t = F.parseTask(fs.readFileSync(path.join(env.botDir, `${td}/items/${h.item}/tasks/${w.task}/task.md`), 'utf8'));
            const base = t.title.replace(/ \(reworked.*$/, '');
            text = `---\ntopic: "001"\nitem: "${h.item}"\ntask: ${w.task}\nbot: ${bot}\ncycle: ${h.cycle}\nrework: ${t.reworks}\n---\ntitle: ${base} (reworked ${t.reworks})\ndescription: ${t.description} Now concrete.\ndone_when: ${t.done_when}\nresponse:\n- named the metric\n`;
          }
          fs.mkdirSync(path.dirname(path.join(env.botDir, file)), { recursive: true });
          fs.writeFileSync(path.join(env.botDir, file), text);
          push(env, h.branch, file, `[${bot}] ${h.cycle} ${w.what}`, `${bot}-bot`);
        }
      } else if (c.minute >= 30 && c.minute < 45) {
        const sheetPath = path.join(env.botDir, cdir, `review-sheet-${bot}.md`);
        if (!fs.existsSync(sheetPath)) continue;
        const sheet = F.parseSheet(fs.readFileSync(sheetPath, 'utf8'));
        const body = Object.entries(sheet).map(([id, t]) => {
          const v = voteFor(t);
          return `## ${id}\nvote: ${v.vote}\nreason: ${v.reason}\n${v.changes ? `changes: ${v.changes}\n` : ''}`;
        });
        const file = `${cdir}/review-${bot}.md`;
        fs.writeFileSync(path.join(env.botDir, file), `---\ntopic: "001"\nitem: "${h.item}"\nbot: ${bot}\ncycle: ${h.cycle}\n---\n${body.join('\n')}`);
        push(env, h.branch, file, `[${bot}] ${h.cycle} review`, `${bot}-bot`);
      }
      await gh.removeLabel(issue.number, `todo:${bot}`);
    }
  }
}

/** Auditor (AGENTS.md 13): exports approved, rejects blocked. */
async function audit(env) {
  const gh = new MockGitHub(env.store, 'thelouis7789');
  const open = await gh.listIssues({ state: 'open', labels: 'kind:task' });
  let n = 0;
  for (const t of open) {
    if (t.labels.includes('state:approved')) {
      await gh.removeLabel(t.number, 'state:approved');
      await gh.addLabels(t.number, ['state:exported']);
      await gh.createComment(t.number, '[auditor] exported to v-ideas');
      await gh.updateIssue(t.number, { state: 'closed', state_reason: 'completed' });
      n++;
    } else if (t.labels.includes('state:blocked')) {
      await gh.removeLabel(t.number, 'state:blocked');
      await gh.addLabels(t.number, ['state:needs-lou']);
      await gh.createComment(t.number, '[auditor] needs Lou: still vague after 2 reworks');
    }
  }
  return n;
}

/** Lou answers every need-lou task with /reword. */
async function lou(env) {
  const gh = new MockGitHub(env.store, 'louisli');
  for (const t of await gh.listIssues({ state: 'open' })) {
    const p = titlePrefix(t.title);
    if (p?.kind !== 'need-lou') continue;
    await gh.createComment(t.number, '/reword Measure accuracy on the 50-prompt set.');
    await gh.updateIssue(t.number, { title: `[updated-lou #${p.n}] ${stripPrefix(t.title)}` });
  }
}

async function cycle(env, opts = {}) {
  at(env, 5);
  await runOrch(env);
  at(env, 10);
  await botsWork(env, opts);
  at(env, 26);
  await runOrch(env);
  at(env, 31);
  await botsWork(env, opts);
  at(env, 46);
  await runOrch(env);
  nextCycle(env);
}

test('topic 001 runs through even-hour cycles to done', async () => {
  const env = setup();
  const s = env.store;
  let cycles = 0;
  let exported = 0;
  const authors = new Map();
  while (cycles < 40) {
    await cycle(env);
    cycles++;
    for (const i of s.issues.filter((i) => i.labels.includes('kind:item'))) {
      const h = parseHeader(i.body);
      if (h.author && h.new_in && !authors.has(h.item)) authors.set(h.item, h.author);
    }
    if (cycles % 3 === 0) {
      exported += await audit(env);
      await lou(env);
    }
    if (s.issues.some((i) => i.labels.includes('kind:topic') && i.state === 'closed')) break;
  }
  const items = s.issues.filter((i) => i.labels.includes('kind:item'));
  const tasks = s.issues.filter((i) => i.labels.includes('kind:task'));
  assert.equal(items.length, 8, 'one item Issue per seed');
  assert.ok(items.every((i) => i.labels.includes('state:done')), 'every item done');
  assert.ok(s.issues.find((i) => i.labels.includes('kind:topic')).labels.includes('topic-state:done'), 'topic done');
  // one bot per item, and all three bots got items
  assert.equal(authors.size, 8);
  assert.deepEqual(new Set(authors.values()), new Set(BOTS));
  // [no] tasks rejected on first review get no Issue; every other task does
  assert.equal(tasks.length, 8 * 3);
  assert.ok(tasks.every((t) => t.state === 'closed' && t.labels.includes('state:exported')), 'all exported');
  assert.ok(exported >= 20);
  // 03's [stuck] task went blocked → Lou → reworded and approved
  const stuck = tasks.find((t) => /^\[001\] 03-T\d+ 03 task 4/.test(t.title));
  assert.ok(stuck.labels.includes('lou-approved'));
  // a [fix] task was reworked once, then approved
  await runOrch(env); // items/ follow the topic folder to done/
  checkout(env, 'work/001');
  const td = topicDir(env.botDir);
  assert.equal(td, 'topics/done/001-2026-09-prompt-optimizer-arena');
  assert.ok(!fs.existsSync(path.join(env.botDir, 'topics/active/001-2026-09-prompt-optimizer-arena')), 'nothing left behind in active/');
  const fix = F.parseTask(fs.readFileSync(path.join(env.botDir, `${td}/items/05/tasks/T2/task.md`), 'utf8'));
  assert.equal(fix.reworks, 1);
  assert.match(fix.title, /reworked 1/);
  assert.equal(fix.changes.length, 2);
  // overrides logged, MASTER updated
  sh(env.botDir, ['checkout', '-q', '-B', 'm', 'origin/main']);
  assert.match(fs.readFileSync(path.join(env.botDir, 'topics/done/001-2026-09-prompt-optimizer-arena/overrides.md'), 'utf8'), /\/reword/);
  assert.match(fs.readFileSync(path.join(env.botDir, 'MASTER.md'), 'utf8'), /\| 03 \|.*\| done \|/);
  assert.ok(cycles < 20, `finished in ${cycles} cycles`);
});

test('first cycle: three items, one bot each, dependencies respected', async () => {
  const env = setup();
  at(env, 5);
  await runOrch(env);
  const working = env.store.issues.filter((i) => i.labels.includes('state:working')).map((i) => parseHeader(i.body));
  // priority order 03(1) → 05(2, needs 03) ... only items without pending deps: 03, 01, 02? 02 needs 01.
  assert.deepEqual(working.map((h) => h.item).sort(), ['01', '03']);
  assert.equal(new Set(working.map((h) => h.author)).size, 2);
  for (const i of env.store.issues.filter((i) => i.labels.includes('state:working'))) {
    const h = parseHeader(i.body);
    assert.deepEqual(i.labels.filter((l) => l.startsWith('todo:')), [`todo:${h.author}`]);
  }
});

test('missed work and review are noted; missing rework reverts', async () => {
  const env = setup();
  await cycle(env, { skip: ['groky'] });
  const status = env.store.issues.find((i) => i.labels.includes('kind:status'));
  assert.ok(status, 'status Issue created');
  const notes = env.store.comments.filter((c) => c.n === status.number).map((c) => c.body).join('\n');
  assert.match(notes, /missed|nothing to review|missing/);
  // an item whose author skipped is back in todo
  const back = env.store.issues.filter((i) => i.labels.includes('kind:item') && i.labels.includes('state:todo'));
  assert.ok(back.length >= 1);
});

test('orchestrator down for a whole cycle: the cycle is dropped and the item goes back to todo', async () => {
  const env = setup();
  at(env, 5);
  await runOrch(env); // assigns
  at(env, 10);
  await botsWork(env);
  nextCycle(env); // no sheets, no tally
  at(env, 6);
  await runOrch(env);
  const status = env.store.issues.find((i) => i.labels.includes('kind:status'));
  assert.match(env.store.comments.filter((c) => c.n === status.number).map((c) => c.body).join('\n'), /dropped/);
  // and the new cycle reassigned work
  assert.ok(env.store.issues.some((i) => i.labels.includes('state:working')));
});

test('Lou parks and resumes an item; start_cycles false assigns nothing', async () => {
  const env = setup();
  at(env, 5);
  await runOrch(env, { start_cycles: false });
  assert.equal(env.store.issues.filter((i) => i.labels.includes('state:working')).length, 0);
  const item = env.store.issues.find((i) => i.labels.includes('kind:item') && parseHeader(i.body).item === '03');
  const lou = new MockGitHub(env.store, 'louisli');
  await lou.createComment(item.number, '/park');
  await lou.updateIssue(item.number, { title: `[updated-lou] ${item.title}` });
  await runOrch(env);
  assert.ok(item.labels.includes('state:parked'));
  assert.equal(titlePrefix(item.title), null);
  assert.ok(!env.store.issues.some((i) => i.labels.includes('state:working') && parseHeader(i.body).item === '03'));
  // a bot comment that looks like a command is ignored
  const bot = new MockGitHub(env.store, 'louisli');
  await bot.createComment(item.number, '[muse] /resume');
  await lou.updateIssue(item.number, { title: `[updated-lou] ${item.title}` });
  await runOrch(env);
  assert.ok(item.labels.includes('state:parked'));
  await lou.createComment(item.number, '/resume');
  await lou.updateIssue(item.number, { title: `[updated-lou] ${stripPrefix(item.title)}` });
  await runOrch(env);
  assert.ok(item.labels.includes('state:todo') || item.labels.includes('state:working'));
});
