// The orchestrator: AGENTS.md section 12, passes 0–9. Mechanical only: no opinions on content.
import {
  parseHeader, withHeader, withHumanPart, titlePrefix, stripPrefix, withNeedLou, nodeRelDir, parentId, rootId,
  depthOf, roundDir, compareNodeIds, normalizeText, mdEscapeCell, isoDate, hmacPermutation, renderInlineList,
} from './util.js';
import {
  parseTopicReadme, parseSeed, parseNode, renderNode, newNodeFm, renderOrder, parseOrder, parseVersion,
  parseVote, parseAudit, parseLooseFrontmatter, publicFields,
} from './formats.js';
import { buildBallot, renderBallotMd, renderLetterMd, renderKeyMd } from './ballot.js';
import { tally, applyTally, renderResultMd } from './tally.js';
import { BOTS, ACTIVE_STATES, pickNextNodes, chooseOrder, decideOutcome, findBundles, makeDone, parseCommand } from './rules.js';
import { standardLabels } from './labels.js';
import { stringifyFrontmatter } from './util.js';

const TOPIC_STATES = ['active', 'done', 'parked', 'rejected'];
const LOU_STATES = ['needs-lou', 'paused', 'stuck'];
const ROLES = [...BOTS, 'auditor'];

export class Orchestrator {
  constructor({ gh, git, config, secret, now = () => new Date(), log = console.log }) {
    this.gh = gh;
    this.git = git;
    this.cfg = config;
    this.secret = secret;
    this.now = now;
    this.log = log;
    this.summary = [];
    this.touchedBranches = new Set();
    this.touchedNodes = new Set();
  }

  note(msg) {
    this.summary.push(msg);
    this.log(msg);
  }

  // ======================================================================
  // run
  // ======================================================================

  async run() {
    this.git.fetch();
    await this.reload();
    const passes = [
      ['0 intake', () => this.pass0Intake()],
      ['1 health', () => this.pass1Health()],
      ['2 lou', () => this.pass2Lou()],
      ['3 start', () => this.pass3Start()],
      ['4 ballots', () => this.pass4Ballots()],
      ['5 tally', () => this.pass5Tally()],
      ['6 outcome', () => this.pass6Outcome()],
      ['7 bundles', () => this.pass7Bundles()],
      ['8 topics', () => this.pass8Topics()],
      ['9 sync', () => this.pass9Sync()],
    ];
    for (const [name, fn] of passes) {
      try {
        await fn();
      } catch (e) {
        this.note(`pass ${name} failed: ${e.message}`);
      }
    }
    return this.summary;
  }

  async reload() {
    this.issues = await this.gh.listIssues({ state: 'all' });
    this.labelsCache = null;
  }

  // ---------- issue helpers ----------

  nodeIssues({ open = null } = {}) {
    return this.issues
      .filter((i) => !i.isPull && i.labels.includes('kind:node'))
      .filter((i) => (open === null ? true : open ? i.state === 'open' : i.state !== 'open'))
      .map((i) => ({ issue: i, h: parseHeader(i.body) }))
      .filter((x) => x.h && x.h.topic && x.h.node);
  }

  topicIssue(nnn) {
    return this.issues.find((i) => !i.isPull && i.labels.includes('kind:topic') && i.labels.includes(`topic:${nnn}`));
  }

  stateOf(issue) {
    return issue.labels.find((l) => l.startsWith('state:'))?.slice(6) ?? null;
  }

  async addLabels(issue, labels) {
    const add = labels.filter((l) => !issue.labels.includes(l));
    if (!add.length) return;
    await this.ensureLabels(add);
    await this.gh.addLabels(issue.number, add);
    issue.labels.push(...add);
  }

  async removeLabels(issue, labels) {
    for (const l of labels) {
      if (!issue.labels.includes(l)) continue;
      await this.gh.removeLabel(issue.number, l);
      issue.labels = issue.labels.filter((x) => x !== l);
    }
  }

  async setState(issue, state, { clearTasks = false } = {}) {
    const drop = issue.labels.filter((l) => l.startsWith('state:') && l !== `state:${state}`);
    if (clearTasks) drop.push(...issue.labels.filter((l) => /^(turn|vote):/.test(l)));
    await this.removeLabels(issue, drop);
    await this.addLabels(issue, [`state:${state}`]);
    this.touchedNodes.add(issue.number);
  }

  async setTitle(issue, title) {
    if (issue.title === title) return;
    await this.gh.updateIssue(issue.number, { title });
    issue.title = title;
  }

  async patchHeader(issue, patch) {
    const h = { ...(parseHeader(issue.body) ?? {}), ...patch };
    const body = withHeader(issue.body, h);
    if (body !== issue.body) {
      await this.gh.updateIssue(issue.number, { body });
      issue.body = body;
    }
    return h;
  }

  async comment(issue, text) {
    await this.gh.createComment(issue.number, text);
  }

  /** Comment unless the orchestrator's latest comment already says the same thing (avoids spam every run). */
  async commentOnce(issue, text) {
    const cs = await this.gh.listComments(issue.number);
    const mine = cs.filter((c) => c.user === this.cfg.orchestrator_login);
    if (mine.length && mine[mine.length - 1].body.trim() === text.trim()) return;
    await this.comment(issue, text);
  }

  async ensureLabels(names) {
    if (!this.labelsCache) this.labelsCache = new Set(await this.gh.listLabels());
    const std = new Map(standardLabels().map(([n, c, d]) => [n, [c, d]]));
    for (const n of names) {
      if (this.labelsCache.has(n)) continue;
      const [c, d] = std.get(n) ?? (n.startsWith('topic:') ? ['006b75', `Topic ${n.slice(6)}`] : ['ededed', n]);
      await this.gh.createLabel(n, c, d);
      this.labelsCache.add(n);
    }
  }

  // ---------- repo helpers ----------

  findTopicDir(wt, nnn) {
    for (const st of TOPIC_STATES) {
      for (const d of wt.list(`topics/${st}`)) {
        if (d.startsWith(`${nnn}-`) && wt.isDir(`topics/${st}/${d}`)) return { dir: `topics/${st}/${d}`, state: st, slug: d };
      }
    }
    return null;
  }

  /** Load everything needed to work on a node. */
  nodeCtx(issue) {
    const h = parseHeader(issue.body);
    if (!h) throw new Error('missing state header');
    const wt = this.git.open(h.branch);
    const td = this.findTopicDir(wt, h.topic);
    if (!td) throw new Error(`topic folder ${h.topic} not found on ${h.branch}`);
    const nodeDir = `${td.dir}/${nodeRelDir(h.node)}`;
    const text = wt.read(`${nodeDir}/node.md`);
    if (!text) throw new Error(`${nodeDir}/node.md is missing on ${h.branch}`);
    const node = parseNode(text);
    return { issue, h, wt, td, nodeDir, node, nodePath: `${nodeDir}/node.md` };
  }

  saveNode(ctx, node, message) {
    ctx.wt.write(ctx.nodePath, renderNode(node));
    ctx.node = node;
    const sha = ctx.wt.commitPush(message);
    this.touchedBranches.add(ctx.h.branch);
    this.touchedNodes.add(ctx.issue.number);
    return sha;
  }

  /** Recompute a round's ballot from the committed versions (deterministic). */
  loadRound(ctx, round) {
    const rd = `${ctx.nodeDir}/rounds/${roundDir(round)}`;
    const order = parseOrder(ctx.wt.read(`${rd}/order.md`) ?? '');
    if (!order) throw new Error(`${rd}/order.md is missing`);
    const positions = {};
    order.order.forEach((b, i) => (positions[b] = 'ABC'[i]));
    const versions = {};
    const forfeits = [];
    for (const bot of BOTS) {
      const text = ctx.wt.read(`${rd}/version-${bot}.md`);
      if (!text) {
        forfeits.push({ bot, kind: 'version', why: 'no version committed' });
        continue;
      }
      const v = parseVersion(text, { node: ctx.h.node, bot, round, position: positions[bot] });
      if (v.ok) versions[bot] = v;
      else forfeits.push({ bot, kind: 'version', why: v.errors.slice(0, 3).join('; ') });
    }
    // The ballot is built against node.md as it was before this round's tally.
    const baseNode = this.nodeAsOfRoundStart(ctx, round);
    const ballot = Object.keys(versions).length
      ? buildBallot({ node: baseNode, versions, positions, secret: this.secret, label: `${ctx.h.topic}/${ctx.h.node}/${round}` })
      : null;
    return { rd, order, positions, versions, forfeits, ballot, baseNode };
  }

  nodeAsOfRoundStart(ctx, round) {
    const rd = `${ctx.nodeDir}/rounds/${roundDir(round)}`;
    const startSha = ctx.wt.run(['log', '-1', '--format=%H', '--', `${rd}/order.md`], { allowFail: true });
    if (!startSha) return ctx.node;
    const text = ctx.wt.run(['show', `${startSha}:${ctx.nodePath}`], { allowFail: true });
    return text ? parseNode(text) : ctx.node;
  }

  // ---------- escalation (9.1) ----------

  async escalate(issue, state, reason, { items = [], round = null, ctx = null } = {}) {
    const h = parseHeader(issue.body) ?? {};
    const n = (h.lou_cycles ?? 0) + 1;
    if (ctx) {
      const node = structuredClone(ctx.node);
      node.fm.lou_cycles = n;
      if (state === 'stuck') node.fm.ever_stuck = true;
      this.saveNode(ctx, node, `${h.topic}/${h.node} escalate #${n}`);
    }
    await this.setState(issue, state, { clearTasks: true });
    await this.removeLabels(issue, issue.labels.filter((l) => l.startsWith('claimed:')));
    await this.patchHeader(issue, { lou_cycles: n });
    await this.setTitle(issue, withNeedLou(issue.title, n));
    const marker = JSON.stringify({ round, items });
    let text = `<!-- need-lou #${n} ${marker} -->\n**Needs Lou (#${n}) — ${state}.** ${reason}\n`;
    if (ctx && round && items.length) {
      try {
        const r = this.loadRound(ctx, round);
        if (r.ballot) text += `\n${this.sideBySide(r.ballot, items)}\n`;
      } catch (e) {
        text += `\n(could not load round ${round}: ${e.message})\n`;
      }
    }
    if (n >= 3) text += `\nThis node has come back to you ${n} times. Consider \`/reword\`, \`/pick\` or \`/park\` instead of another \`/rerun\`.\n`;
    text += `\nReply with one command, then change the title prefix to \`[updated-lou #${n}]\`: \`/rerun [n]\`, \`/accept all\`, \`/pick X\`, \`/pick X Z\`, \`/reword <text>\`, \`/reject [reason]\`, \`/park\`.`;
    await this.comment(issue, text);
    this.note(`#${issue.number} ${h.node ?? ''} → ${state} (#${n}): ${reason}`);
  }

  sideBySide(ballot, items) {
    const show = (t) =>
      !t || t.status === 'missing' ? '—' : t.status === 'drop' ? `*dropped:* ${t.reason}` : `${t.fields.statement ?? ''}${t.fields.recommendation ? ` → **${t.fields.recommendation}**` : ''}`;
    let s = `| Item | Current | ${ballot.letters.join(' | ')} |\n| --- | --- | ${ballot.letters.map(() => '---').join(' | ')} |\n`;
    const cur = Object.fromEntries(ballot.current.map((i) => [i.id, i.fields.statement]));
    for (const id of items) {
      const tid = ballot.treatments[id] ? id : null;
      if (!tid) {
        s += `| ${id} | ${mdEscapeCell(cur[id] ?? '')} | ${ballot.letters.map(() => '').join(' | ')} |\n`;
        continue;
      }
      s += `| ${id} | ${mdEscapeCell(cur[id] ?? '(new)')} | ${ballot.letters.map((L) => mdEscapeCell(show(ballot.treatments[id][L]))).join(' | ')} |\n`;
    }
    return s;
  }

  latestEscalation(comments) {
    for (let i = comments.length - 1; i >= 0; i--) {
      const m = /<!-- need-lou #(\d+) (\{.*?\}) -->/.exec(comments[i].body);
      if (m) {
        try {
          return { n: Number(m[1]), ...JSON.parse(m[2]) };
        } catch {
          return { n: Number(m[1]), round: null, items: [] };
        }
      }
    }
    return null;
  }

  // ======================================================================
  // Pass 0 — intake sync
  // ======================================================================

  async pass0Intake() {
    const main = this.git.open('main');
    for (const d of main.list('topics/active')) {
      const m = /^(\d{3})-/.exec(d);
      if (!m || !main.isDir(`topics/active/${d}`)) continue;
      const nnn = m[1];
      const tdir = `topics/active/${d}`;
      const readme = parseTopicReadme(main.read(`${tdir}/README.md`) ?? '');
      await this.ensureLabels([...standardLabels().map((l) => l[0]), `topic:${nnn}`]);
      let topic = this.topicIssue(nnn);
      if (!topic) {
        const src = main
          .list(`${tdir}/source`)
          .filter((f) => !f.startsWith('.'))
          .map((f) => main.read(`${tdir}/source/${f}`) ?? '')
          .join('\n\n---\n\n');
        const quoted = src.slice(0, 50000).split('\n').map((l) => `> ${l}`).join('\n');
        const header = { topic: nnn };
        const body = withHeader(`**Original material** (from \`${tdir}/source/\`):\n\n${quoted}`, header);
        topic = await this.gh.createIssue({ title: `[${nnn}] ${readme.title}`, body, labels: ['kind:topic', 'topic-state:active', `topic:${nnn}`] });
        this.issues.push(topic);
        this.note(`created topic Issue #${topic.number} for ${nnn}`);
      }
      const existing = new Set(this.nodeIssues().filter((x) => x.h.topic === nnn).map((x) => x.h.node));
      for (const f of main.list(`${tdir}/seeds`).sort()) {
        if (!/^\d{2}-.*\.md$/.test(f)) continue;
        const seed = parseSeed(main.read(`${tdir}/seeds/${f}`), f);
        if (existing.has(seed.id)) continue;
        const h = {
          topic: nnn, node: seed.id, branch: `loop/${nnn}/${seed.id}`, path: `${tdir}/${nodeRelDir(seed.id)}`,
          round: 0, attempt: 1, round_limit: this.cfg.default_round_limit, order: [], lou_cycles: 0,
          priority: seed.priority, depends_on: seed.depends_on,
        };
        const human = `**Goal:** ${seed.goal}\n\n**Starting points** (from \`seeds/${f}\`):\n\n${seed.points.map((p) => `- ${p}`).join('\n')}\n`;
        const issue = await this.gh.createIssue({
          title: `[${nnn}] ${seed.id} ${seed.title}`,
          body: withHeader(human, h),
          labels: ['kind:node', 'state:queued', 'depth:0', `topic:${nnn}`],
        });
        this.issues.push(issue);
        if (topic.id) await this.gh.addSubIssue(topic.number, issue.id).catch((e) => this.note(`sub-issue link failed: ${e.message}`));
        this.note(`created node Issue #${issue.number} for ${nnn}/${seed.id}`);
      }
    }
  }

  // ======================================================================
  // Pass 1 — health: dead locks, bot errors, absent bots
  // ======================================================================

  minutesSince(ts) {
    return (this.now().getTime() - new Date(ts).getTime()) / 60000;
  }

  async labelAddedAt(issue, label) {
    const ev = await this.gh.labelEvents(issue.number);
    const last = ev.filter((e) => e.event === 'labeled' && e.label === label).pop();
    return last?.created_at ?? issue.created_at;
  }

  async bumpCounter(issue, field, role) {
    if (!issue.labels.includes('kind:node')) return 0;
    const ctx = this.nodeCtx(issue);
    const node = structuredClone(ctx.node);
    node.fm[field][role] = (node.fm[field][role] ?? 0) + 1;
    this.saveNode(ctx, node, `${ctx.h.topic}/${ctx.h.node} ${field}.${role} = ${node.fm[field][role]}`);
    return node.fm[field][role];
  }

  async pass1Health() {
    const open = this.issues.filter((i) => i.state === 'open');
    // dead locks
    for (const issue of open.filter((i) => i.labels.some((l) => l.startsWith('claimed:')))) {
      const comments = await this.gh.listComments(issue.number);
      for (const label of issue.labels.filter((l) => l.startsWith('claimed:'))) {
        const role = label.slice(8);
        const locks = comments.filter((c) => new RegExp(`^lock: ${role} run \\S+ heartbeat (\\S+)`).test(c.body.trim()));
        let age;
        if (locks.length) {
          const ts = new RegExp(`heartbeat (\\S+)`).exec(locks[locks.length - 1].body)[1];
          age = this.minutesSince(isNaN(Date.parse(ts)) ? locks[locks.length - 1].updated_at : ts);
        } else age = this.minutesSince(await this.labelAddedAt(issue, label));
        if (age <= this.cfg.lock_timeout_minutes) continue;
        for (const c of locks) await this.gh.deleteComment(c.id);
        await this.removeLabels(issue, [label]);
        await this.comment(issue, `lock released: ${role} no heartbeat for ${this.cfg.lock_timeout_minutes}m`);
        this.note(`#${issue.number}: released dead ${role} lock`);
        const n = await this.bumpCounter(issue, 'dead_locks', role).catch(() => 0);
        if (n >= 3 && issue.labels.includes('kind:node')) {
          await this.escalate(issue, 'stuck', `${role} lost its lock 3 times on this node`, { ctx: this.nodeCtx(issue) });
        }
      }
    }
    // bot errors
    for (const issue of open.filter((i) => i.labels.includes('bot-error'))) {
      const comments = await this.gh.listComments(issue.number);
      const err = [...comments].reverse().find((c) => /^error:\s*(\w+)/.test(c.body.trim()));
      const role = err ? /^error:\s*(\w+)/.exec(err.body.trim())[1] : null;
      await this.removeLabels(issue, ['bot-error']);
      if (!role || !ROLES.includes(role)) {
        await this.comment(issue, 'bot-error cleared (no `error: <role>` comment found).');
        continue;
      }
      const n = await this.bumpCounter(issue, 'bot_errors', role).catch(() => 0);
      this.note(`#${issue.number}: ${role} error ${n}/3`);
      if (n >= 3 && issue.labels.includes('kind:node')) {
        await this.escalate(issue, 'stuck', `${role} hit 3 errors on this node. Latest: ${err.body.trim().slice(0, 300)}`, { ctx: this.nodeCtx(issue) });
      } else {
        await this.comment(issue, `bot-error cleared (${role} ${n}/3); ${role} will retry on its next run.`);
      }
    }
    // absent bots
    for (const { issue } of this.nodeIssues({ open: true })) {
      const st = this.stateOf(issue);
      if (st !== 'turn' && st !== 'voting') continue;
      const task = issue.labels.filter((l) => /^(turn|vote):/.test(l));
      if (!task.length) continue;
      let comments = null;
      for (const label of task) {
        const bot = label.split(':')[1];
        const since = await this.labelAddedAt(issue, label);
        if (this.minutesSince(since) <= this.cfg.absent_bot_hours * 60) continue;
        comments ??= await this.gh.listComments(issue.number);
        const tried = comments.some(
          (c) => new Date(c.created_at) >= new Date(since) && new RegExp(`^(lock: ${bot}\\b|lock released: ${bot}\\b|error:\\s*${bot}\\b|r\\d+ ${bot}\\b)`).test(c.body.trim()),
        );
        if (tried) continue;
        await this.escalate(issue, 'needs-lou', `${bot} hasn't picked up its \`${label}\` task for ${this.cfg.absent_bot_hours} hours. Is its harness running?`, {
          ctx: this.nodeCtx(issue),
        });
        break;
      }
    }
  }

  // ======================================================================
  // Pass 2 — Lou's replies
  // ======================================================================

  async pass2Lou() {
    const open = this.issues.filter((i) => i.state === 'open');
    for (const issue of open) {
      const p = titlePrefix(issue.title);
      const st = this.stateOf(issue);
      try {
        if (p?.kind === 'updated-lou') await this.handleLou(issue);
        else if (!p && issue.labels.includes('kind:node') && LOU_STATES.includes(st)) {
          const comments = await this.gh.listComments(issue.number);
          const n = this.latestEscalation(comments)?.n ?? (parseHeader(issue.body)?.lou_cycles || 1);
          await this.setTitle(issue, withNeedLou(issue.title, n));
        } else if (!p && issue.isPull && issue.state === 'open' && /^bundle\//.test(this.pullHead(issue) ?? '')) {
          const comments = await this.gh.listComments(issue.number);
          await this.setTitle(issue, withNeedLou(issue.title, this.latestEscalation(comments)?.n ?? 1));
        }
      } catch (e) {
        this.note(`#${issue.number}: Lou reply failed: ${e.message}`);
        await this.commentOnce(issue, `orchestrator error while handling your command: ${e.message}`).catch(() => {});
      }
    }
  }

  pullHead(issue) {
    return this.pulls?.find((p) => p.number === issue.number)?.head ?? /<!-- bundle .*"branch":"([^"]+)"/.exec(issue.body)?.[1];
  }

  async handleLou(issue) {
    const comments = await this.gh.listComments(issue.number);
    const esc = this.latestEscalation(comments);
    const n = esc?.n ?? (parseHeader(issue.body)?.lou_cycles || 1);
    let cmdComment = null;
    for (let i = comments.length - 1; i >= 0; i--) {
      const c = comments[i];
      if (c.user !== this.cfg.lou_login || !c.body.trim().startsWith('/')) continue;
      const reactions = await this.gh.listReactions(c.id);
      if (reactions.some((r) => r.user === this.cfg.orchestrator_login && r.content === '+1')) break;
      cmdComment = c;
      break;
    }
    const isTopic = issue.labels.includes('kind:topic');
    const retry = async (why) => {
      await this.setTitle(issue, isTopic ? stripPrefix(issue.title) : withNeedLou(issue.title, n));
      await this.comment(issue, `${why} Reply with one command (\`/rerun [n]\`, \`/accept all\`, \`/pick X\`, \`/pick X Z\`, \`/reword <text>\`, \`/reject [reason]\`, \`/park\`, \`/resume\`), then set the title prefix to \`[updated-lou${isTopic ? '' : ` #${n}`}]\`.`);
    };
    if (!cmdComment) return retry('I found `[updated-lou]` but no new command from you.');
    const cmd = parseCommand(cmdComment.body);
    if (!cmd || cmd.error) return retry(`I couldn't read that command${cmd?.error ? `: ${cmd.error}` : ''}.`);

    let outcome;
    if (issue.isPull) outcome = await this.bundleCommand(issue, cmd);
    else if (isTopic) outcome = await this.topicCommand(issue, cmd);
    else outcome = await this.nodeCommand(issue, cmd, esc);
    if (outcome?.retry) return retry(outcome.retry);

    await this.gh.addReaction(cmdComment.id, '+1');
    const h = parseHeader(issue.body) ?? {};
    const nnn = h.topic ?? /<!-- bundle .*"topic":"(\d{3})"/.exec(issue.body)?.[1];
    if (nnn) await this.appendOverride(nnn, h.node ?? (issue.isPull ? `bundle #${issue.number}` : 'topic'), cmdComment.body.trim());
    if (!outcome?.keepTitle) await this.setTitle(issue, stripPrefix(issue.title));
    await this.comment(issue, `Done: \`${cmdComment.body.trim().split('\n')[0].slice(0, 120)}\` → ${outcome?.did ?? 'applied'}.`);
    this.note(`#${issue.number}: Lou command ${cmd.name} → ${outcome?.did}`);
  }

  async appendOverride(nnn, where, command) {
    const main = this.git.open('main');
    const td = this.findTopicDir(main, nnn);
    if (!td) return;
    const path = `${td.dir}/overrides.md`;
    let text = main.read(path) ?? `# Overrides — ${nnn}\n\n| Date | Node | Command |\n| --- | --- | --- |\n`;
    if (!text.endsWith('\n')) text += '\n';
    text += `| ${isoDate(this.now())} | ${mdEscapeCell(where)} | ${mdEscapeCell(command)} |\n`;
    main.write(path, text);
    main.commitPush(`overrides: ${nnn} ${where}`);
  }

  ensureRoom(node, extra = 1) {
    if (node.fm.round + extra > node.fm.round_limit) node.fm.round_limit = node.fm.round + extra;
  }

  async requeue(issue, ctx, node, message) {
    this.ensureRoom(node);
    this.saveNode(ctx, node, message);
    await this.setState(issue, 'queued', { clearTasks: true });
    await this.patchHeader(issue, { attempt: node.fm.attempt, round_limit: node.fm.round_limit });
  }

  /** Apply chosen treatments of a round to node.md. choiceOf: itemId -> letter */
  applyChoices(ctx, r, choiceOf) {
    const node = structuredClone(ctx.node);
    const result = parseLooseFrontmatter(ctx.wt.read(`${r.rd}/result.md`) ?? '').data ?? {};
    const finalOf = Object.fromEntries((result.items ?? []).map((x) => [x.id, x.final_id]));
    const byId = new Map(node.items.map((i) => [i.id, i]));
    for (const [id, L] of Object.entries(choiceOf)) {
      const t = r.ballot.treatments[id]?.[L];
      if (!t || t.status === 'missing') continue;
      const accepted = finalOf[id] && finalOf[id] !== 'null' ? finalOf[id] : null;
      const isNew = id.startsWith('N') && !accepted;
      if (t.status === 'drop') {
        if (!isNew) byId.delete(accepted ?? id);
        continue;
      }
      const fid = isNew ? `I${node.fm.next_item++}` : accepted ?? id;
      byId.set(fid, { id: fid, fields: { ...publicFields(t.fields), from: roundDir(r.order.round), author: 'lou-pick' } });
    }
    node.items = [...byId.values()].sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));
    return node;
  }

  async nodeCommand(issue, cmd, esc) {
    const ctx = this.nodeCtx(issue);
    const st = this.stateOf(issue);
    const node = structuredClone(ctx.node);
    const tag = `${ctx.h.topic}/${ctx.h.node}`;
    switch (cmd.name) {
      case 'rerun':
        node.fm.attempt += 1;
        node.fm.round_limit = node.fm.round + cmd.n;
        await this.requeue(issue, ctx, node, `${tag} /rerun ${cmd.n}`);
        return { did: `new attempt ${node.fm.attempt}, up to round ${node.fm.round_limit}` };
      case 'reject':
        await this.setState(issue, 'rejected', { clearTasks: true });
        await this.gh.updateIssue(issue.number, { state: 'closed', state_reason: 'not_planned' });
        issue.state = 'closed';
        return { did: 'rejected and closed' };
      case 'park':
        await this.setState(issue, 'parked', { clearTasks: true });
        return { did: 'parked' };
      case 'resume':
        if (st !== 'parked') return { retry: '`/resume` only works on a parked node.' };
        await this.requeue(issue, ctx, node, `${tag} /resume`);
        return { did: 'resumed (queued)' };
      case 'reword': {
        if (cmd.ids.length) return { retry: 'On a node Issue, use `/reword <text>` without an id.' };
        const id = `I${node.fm.next_item++}`;
        node.items = [{ id, fields: { type: 'claim', statement: cmd.text.replace(/\s+/g, ' '), author: 'lou', from: roundDir(node.fm.round) } }];
        await this.requeue(issue, ctx, node, `${tag} /reword`);
        return { did: `replaced the accepted items with Lou's text as ${id}; queued` };
      }
      case 'accept-all':
      case 'pick': {
        if (cmd.ids) return { retry: 'On a node Issue, `/pick` takes ballot letters (X, Y, Z).' };
        if (!esc?.round) return { retry: 'There is no ballot attached to this escalation, so there is nothing to pick or accept. Use `/rerun`, `/reword` or `/park`.' };
        const r = this.loadRound(ctx, esc.round);
        if (!r.ballot) return { retry: `Round ${esc.round} has no ballot.` };
        const items = esc.items?.length ? esc.items : r.ballot.itemIds;
        if (cmd.name === 'pick' && cmd.letters.length === 2) {
          for (const L of cmd.letters) if (!r.ballot.letters.includes(L)) return { retry: `Round ${esc.round} has no version ${L}.` };
          node.fm.merge_of = { round: esc.round, letters: cmd.letters };
          await this.requeue(issue, ctx, node, `${tag} /pick ${cmd.letters.join(' ')} (merge round)`);
          return { did: `next round is a merge round of ${cmd.letters.join(' + ')} from ${roundDir(esc.round)}` };
        }
        const choiceOf = {};
        if (cmd.name === 'pick') {
          const L = cmd.letters[0];
          if (!r.ballot.letters.includes(L)) return { retry: `Round ${esc.round} has no version ${L}.` };
          for (const id of items) choiceOf[id] = L;
        } else {
          const conflicts = [];
          for (const id of items) {
            const ts = r.ballot.letters.map((L) => [L, r.ballot.treatments[id]?.[L]]).filter(([, t]) => t && t.status !== 'missing');
            const distinct = new Set(ts.map(([, t]) => (t.status === 'drop' ? 'drop' : normalizeText(t.fields.statement))));
            if (distinct.size > 1) conflicts.push(id);
            else if (ts.length) choiceOf[id] = ts[0][0];
          }
          if (conflicts.length) return { retry: `The versions disagree on ${conflicts.join(', ')}, so I can't accept them all. Pick one with \`/pick X\`, or merge two with \`/pick X Z\`.` };
        }
        const updated = this.applyChoices(ctx, r, choiceOf);
        this.saveNode(ctx, updated, `${tag} ${cmd.name === 'pick' ? `/pick ${cmd.letters[0]}` : '/accept all'}`);
        const result = parseLooseFrontmatter(ctx.wt.read(`${r.rd}/result.md`) ?? '').data ?? {};
        const res = { atomic: result.atomic ?? 'revise', items: [], split_titles: result.split_titles ?? [] };
        const topicCount = this.nodeIssues().filter((x) => x.h.topic === ctx.h.topic).length;
        const d = decideOutcome({ result: res, audit: null, node: ctx.node, topicNodeCount: topicCount, skipEscalation: true, limits: this.limits() });
        await this.applyOutcome(issue, ctx, d, esc.round);
        return { did: `accepted ${Object.keys(choiceOf).length} item(s); outcome: ${d.action}${d.state ? ` (${d.state})` : ''}`, keepTitle: d.action === 'escalate' };
      }
      default:
        return { retry: `\`/${cmd.name}\` doesn't apply to a node Issue.` };
    }
  }

  async topicCommand(issue, cmd) {
    const nnn = parseHeader(issue.body)?.topic;
    const main = this.git.open('main');
    const td = this.findTopicDir(main, nnn);
    if (!td) return { retry: `Topic folder ${nnn} not found.` };
    const move = async (to) => {
      if (td.state === to) return;
      main.mv(td.dir, `topics/${to}/${td.slug}`);
      main.commitPush(`topic ${nnn} → ${to}`);
      await this.removeLabels(issue, issue.labels.filter((l) => l.startsWith('topic-state:')));
      await this.addLabels(issue, [`topic-state:${to}`]);
    };
    switch (cmd.name) {
      case 'park':
        await move('parked');
        return { did: 'topic parked' };
      case 'resume':
        if (td.state !== 'parked') return { retry: 'Only a parked topic can be resumed.' };
        await move('active');
        return { did: 'topic resumed' };
      case 'reject': {
        await move('rejected');
        for (const { issue: ni } of this.nodeIssues({ open: true }).filter((x) => x.h.topic === nnn)) {
          await this.setState(ni, 'rejected', { clearTasks: true });
          await this.gh.updateIssue(ni.number, { state: 'closed', state_reason: 'not_planned' });
          ni.state = 'closed';
        }
        for (const p of (this.pulls ?? (this.pulls = await this.gh.listPulls())).filter((p) => p.state === 'open' && p.head?.startsWith(`bundle/${nnn}/`))) {
          await this.gh.updatePull(p.number, { state: 'closed' });
        }
        await this.gh.updateIssue(issue.number, { state: 'closed', state_reason: 'not_planned' });
        issue.state = 'closed';
        return { did: 'topic rejected; its open Issues and bundle PRs closed' };
      }
      default:
        return { retry: `\`/${cmd.name}\` doesn't apply to a topic Issue (use /park, /reject or /resume).` };
    }
  }

  bundleMarker(body) {
    const m = /<!-- bundle (\{.*?\}) -->/.exec(body ?? '');
    try {
      return m ? JSON.parse(m[1]) : null;
    } catch {
      return null;
    }
  }

  async closeBundle(pr, marker) {
    await this.gh.updatePull(pr.number, { state: 'closed' });
    pr.state = 'closed';
    const wt = this.git.open(marker.branch);
    wt.deleteRemote();
  }

  leafIssue(nnn, id) {
    return this.nodeIssues().find((x) => x.h.topic === nnn && x.h.node === id)?.issue;
  }

  async bundleCommand(pr, cmd) {
    const marker = this.bundleMarker(pr.body);
    if (!marker) return { retry: 'This PR has no bundle marker, so I can’t act on it.' };
    const leaves = marker.leaves;
    const pick = (ids) => (ids?.length ? ids : leaves);
    for (const id of cmd.ids ?? []) if (!leaves.includes(id)) return { retry: `${id} is not a leaf in this bundle (${leaves.join(', ')}).` };
    const requeueLeaf = async (id, n = 3) => {
      const li = this.leafIssue(marker.topic, id);
      const ctx = this.nodeCtx(li);
      const node = structuredClone(ctx.node);
      node.fm.attempt += 1;
      node.fm.round_limit = node.fm.round + n;
      await this.requeue(li, ctx, node, `${marker.topic}/${id} requeued from bundle PR #${pr.number}`);
    };
    switch (cmd.name) {
      case 'accept-all':
        await this.gh.mergePull(pr.number);
        return { did: 'merged; the leaves are approved on the next pass', keepTitle: true };
      case 'rerun':
        for (const id of leaves) await requeueLeaf(id, cmd.n);
        await this.closeBundle(pr, marker);
        return { did: `PR closed; ${leaves.length} leaf(s) back into rounds` };
      case 'reject':
        for (const id of pick(cmd.ids)) {
          const li = this.leafIssue(marker.topic, id);
          await this.setState(li, 'rejected', { clearTasks: true });
          await this.gh.updateIssue(li.number, { state: 'closed', state_reason: 'not_planned' });
          li.state = 'closed';
        }
        await this.closeBundle(pr, marker);
        return { did: `rejected ${pick(cmd.ids).join(', ')}; PR closed${cmd.ids?.length ? ' and will be rebuilt without them' : ''}` };
      case 'pick': {
        if (!cmd.ids) return { retry: 'On a bundle PR, `/pick` takes leaf ids, e.g. `/pick 03.1 03.2`.' };
        const rest = leaves.filter((l) => !cmd.ids.includes(l));
        for (const id of rest) await requeueLeaf(id);
        await this.closeBundle(pr, marker);
        return { did: `kept ${cmd.ids.join(', ')}; ${rest.length} leaf(s) back into rounds; PR will be rebuilt` };
      }
      case 'reword': {
        const ids = cmd.ids.length ? cmd.ids : leaves.length === 1 ? leaves : null;
        if (!ids) return { retry: 'On a bundle with several leaves, use `/reword <leaf id> <text>`.' };
        const li = this.leafIssue(marker.topic, ids[0]);
        const ctx = this.nodeCtx(li);
        const node = structuredClone(ctx.node);
        const id = `I${node.fm.next_item++}`;
        node.items = [{ id, fields: { type: 'claim', statement: cmd.text.replace(/\s+/g, ' '), author: 'lou', from: roundDir(node.fm.round) } }];
        await this.requeue(li, ctx, node, `${marker.topic}/${ids[0]} /reword from bundle PR #${pr.number}`);
        await this.closeBundle(pr, marker);
        return { did: `reworded ${ids[0]} and queued it; PR closed` };
      }
      case 'park':
        for (const id of leaves) await this.setState(this.leafIssue(marker.topic, id), 'parked', { clearTasks: true });
        await this.closeBundle(pr, marker);
        return { did: 'bundle parked; PR closed' };
      default:
        return { retry: `\`/${cmd.name}\` doesn't apply to a bundle PR.` };
    }
  }

  // ======================================================================
  // Pass 3 — start rounds
  // ======================================================================

  topicStates() {
    const main = this.git.open('main');
    const out = {};
    for (const st of TOPIC_STATES) for (const d of main.list(`topics/${st}`)) if (/^\d{3}-/.test(d)) out[d.slice(0, 3)] = st;
    return out;
  }

  async pass3Start() {
    if (!this.cfg.start_rounds) return;
    const topicState = this.topicStates();
    const all = this.nodeIssues().map((x) => ({
      issue: x.issue, h: x.h, topic: x.h.topic, id: String(x.h.node), state: this.stateOf(x.issue),
      priority: Number(x.h.priority ?? 99), depends_on: (x.h.depends_on ?? []).map(String), topicActive: topicState[x.h.topic] === 'active',
    }));
    const next = pickNextNodes(all, this.cfg.max_active_nodes);
    for (const n of next) {
      try {
        await this.startRound(n.issue, all);
        n.state = 'turn';
      } catch (e) {
        this.note(`#${n.issue.number}: start failed: ${e.message}`);
        await this.commentOnce(n.issue, `orchestrator error starting a round: ${e.message}`);
      }
    }
  }

  async startRound(issue, all) {
    const h = parseHeader(issue.body);
    let wt;
    const isRoot = depthOf(h.node) === 0;
    if (isRoot && !this.git.branchExists(h.branch)) {
      wt = this.git.open(h.branch, { from: 'main' });
    } else wt = this.git.open(h.branch);
    if (!wt.created && !wt.mergeMain()) throw new Error(`merging main into ${h.branch} conflicted`);
    const td = this.findTopicDir(wt, h.topic);
    if (!td) throw new Error(`topic ${h.topic} folder not found on ${h.branch}`);
    const nodeDir = `${td.dir}/${nodeRelDir(h.node)}`;
    let node;
    const existing = wt.read(`${nodeDir}/node.md`);
    if (existing) node = parseNode(existing);
    else if (isRoot) {
      const seedFile = wt.list(`${td.dir}/seeds`).find((f) => f.startsWith(`${h.node}-`));
      if (!seedFile) throw new Error(`seed ${h.node} not found`);
      const seed = parseSeed(wt.read(`${td.dir}/seeds/${seedFile}`), seedFile);
      node = {
        fm: newNodeFm({ id: h.node, depth: 0, title: seed.title, priority: seed.priority, depends_on: seed.depends_on, issue: issue.number, round_limit: h.round_limit ?? this.cfg.default_round_limit }),
        items: seed.points.map((p, i) => ({ id: `I${i + 1}`, fields: { type: 'open', statement: p } })),
        context: seed.goal ? `Goal: ${seed.goal}` : '',
      };
      node.fm.next_item = node.items.length + 1;
    } else throw new Error(`${nodeDir}/node.md is missing`);

    const round = node.fm.round + 1;
    const busyA = all.filter((x) => ACTIVE_STATES.includes(x.state) && x.issue.number !== issue.number).map((x) => parseHeader(x.issue.body)?.order?.[0]).filter(Boolean);
    const order = chooseOrder({ prevA: h.order?.[0] ?? null, busyA });
    const merge_of = node.fm.merge_of ?? null;
    node.fm.round = round;
    node.fm.merge_of = null;
    wt.write(`${nodeDir}/rounds/${roundDir(round)}/order.md`, renderOrder({ node: h.node, round, order, merge_of }));
    wt.write(`${nodeDir}/node.md`, renderNode(node));
    wt.commitPush(`${h.topic}/${h.node} ${roundDir(round)} start`);
    this.touchedBranches.add(h.branch);
    await this.patchHeader(issue, { round, order, attempt: node.fm.attempt, round_limit: node.fm.round_limit, path: nodeDir });
    await this.setState(issue, 'turn', { clearTasks: true });
    await this.addLabels(issue, [`turn:${order[0]}`]);
    await this.comment(issue, `${roundDir(round)} started: A=${order[0]}, B=${order[1]}, C=${order[2]}${merge_of ? ` (merge round of ${merge_of.letters.join(' + ')} from ${roundDir(merge_of.round)})` : ''}`);
    this.note(`#${issue.number} ${h.topic}/${h.node}: ${roundDir(round)} started (${order.join(' → ')})`);
  }

  // ======================================================================
  // Pass 4 — ballots
  // ======================================================================

  async afterVoid(issue, ctx, why) {
    await this.comment(issue, `${roundDir(ctx.node.fm.round)} void: ${why}`);
    if (ctx.node.fm.round >= ctx.node.fm.round_limit) {
      await this.escalate(issue, 'paused', `round limit ${ctx.node.fm.round_limit} reached (the last round was void: ${why})`, { ctx });
    } else await this.setState(issue, 'queued', { clearTasks: true });
  }

  async pass4Ballots() {
    for (const { issue } of this.nodeIssues({ open: true }).filter((x) => this.stateOf(x.issue) === 'ballot')) {
      try {
        const ctx = this.nodeCtx(issue);
        const round = ctx.node.fm.round;
        const r = this.loadRound(ctx, round);
        if (Object.keys(r.versions).length < 2) {
          await this.afterVoid(issue, ctx, `fewer than 2 valid versions (${r.forfeits.map((f) => `${f.bot}: ${f.why}`).join('; ')})`);
          continue;
        }
        const b = r.ballot;
        const meta = { node: ctx.h.node, round };
        ctx.wt.write(`${r.rd}/ballot/ballot.md`, renderBallotMd(b, meta));
        for (const L of b.letters) ctx.wt.write(`${r.rd}/ballot/${L}.md`, renderLetterMd(b, L, meta));
        ctx.wt.commitPush(`${ctx.h.topic}/${ctx.h.node} ${roundDir(round)} ballot`);
        this.touchedBranches.add(ctx.h.branch);
        await this.setState(issue, 'voting', { clearTasks: true });
        await this.addLabels(issue, BOTS.map((b) => `vote:${b}`));
        const forf = r.forfeits.length ? ` Forfeited: ${r.forfeits.map((f) => `${f.bot} (${f.why})`).join('; ')}.` : '';
        const warn = b.warnings.length ? ` Notes: ${b.warnings.join('; ')}.` : '';
        await this.comment(issue, `${roundDir(round)} ballot ready: ${b.itemIds.length} items, versions ${b.letters.join('/')}.${forf}${warn}`);
        this.note(`#${issue.number} ${ctx.h.node}: ballot ${roundDir(round)}`);
      } catch (e) {
        this.note(`#${issue.number}: ballot failed: ${e.message}`);
        await this.commentOnce(issue, `orchestrator error building the ballot: ${e.message}`);
      }
    }
  }

  // ======================================================================
  // Pass 5 — tally
  // ======================================================================

  async pass5Tally() {
    const ready = this.nodeIssues({ open: true }).filter((x) => this.stateOf(x.issue) === 'voting' && !x.issue.labels.some((l) => l.startsWith('vote:')));
    for (const { issue } of ready) {
      try {
        const ctx = this.nodeCtx(issue);
        const round = ctx.node.fm.round;
        const r = this.loadRound(ctx, round);
        if (!r.ballot) throw new Error('no ballot for this round');
        const votes = {};
        const forfeits = [];
        for (const bot of BOTS) {
          const text = ctx.wt.read(`${r.rd}/vote-${bot}.md`);
          if (!text) {
            forfeits.push(`${bot}: no vote`);
            continue;
          }
          const v = parseVote(text, { node: ctx.h.node, bot, round });
          if (v.ok) votes[bot] = v;
          else forfeits.push(`${bot}: ${v.errors.slice(0, 3).join('; ')}`);
        }
        const t = tally(r.ballot, votes);
        const meta = { node: ctx.h.node, round };
        ctx.wt.write(`${r.rd}/ballot/key.md`, renderKeyMd(r.ballot, meta));
        if (t.void) {
          const { data, human } = renderResultMd({ ...meta, ballot: r.ballot, t, finalIdOf: {}, splitTitles: [], forfeits });
          ctx.wt.write(`${r.rd}/result.md`, stringifyFrontmatter({ ...data, void: true }, human));
          ctx.wt.commitPush(`${ctx.h.topic}/${ctx.h.node} ${roundDir(round)} result (void)`);
          await this.afterVoid(issue, ctx, `fewer than 2 valid votes (${forfeits.join('; ')})`);
          continue;
        }
        const applied = applyTally(ctx.node, r.ballot, t, round);
        const { data, human } = renderResultMd({ ...meta, ballot: r.ballot, t, finalIdOf: applied.finalIdOf, splitTitles: applied.splitTitles, forfeits });
        ctx.wt.write(`${r.rd}/result.md`, stringifyFrontmatter(data, human));
        ctx.wt.commitPush(`${ctx.h.topic}/${ctx.h.node} ${roundDir(round)} key + result`);
        const sha = this.saveNode(ctx, applied.node, `${ctx.h.topic}/${ctx.h.node} ${roundDir(round)} tally → node.md`);
        await this.patchHeader(issue, { tally_sha: sha });
        if (t.items.some((x) => x.outcome === 'soft')) await this.addLabels(issue, ['soft-go']);
        await this.setState(issue, 'audit', { clearTasks: true });
        const lines = t.items.map((x) => `- ${x.id}: ${x.outcome}${x.choice ? ` (${x.choice}, ${x.support}/${t.valid})` : ''}${applied.finalIdOf[x.id] && applied.finalIdOf[x.id] !== x.id ? ` → ${applied.finalIdOf[x.id]}` : ''}`);
        await this.comment(issue, `${roundDir(round)} tally (${t.valid} valid votes, atomic: ${t.atomic}):\n${lines.join('\n')}${forfeits.length ? `\nForfeited: ${forfeits.join('; ')}` : ''}`);
        this.note(`#${issue.number} ${ctx.h.node}: tally ${roundDir(round)} → audit`);
      } catch (e) {
        this.note(`#${issue.number}: tally failed: ${e.message}`);
        await this.commentOnce(issue, `orchestrator error tallying: ${e.message}`);
      }
    }
  }

  // ======================================================================
  // Pass 6 — outcome
  // ======================================================================

  limits() {
    return { maxDepth: this.cfg.max_depth, maxNodes: this.cfg.max_topic_nodes };
  }

  async pass6Outcome() {
    for (const { issue } of this.nodeIssues({ open: true }).filter((x) => this.stateOf(x.issue) === 'audited')) {
      try {
        const ctx = this.nodeCtx(issue);
        const round = ctx.node.fm.round;
        const rd = `${ctx.nodeDir}/rounds/${roundDir(round)}`;
        const audit = parseAudit(ctx.wt.read(`${rd}/audit.md`) ?? '');
        if (!audit.ok) {
          await this.escalate(issue, 'needs-lou', `mismatch: state:audited but ${rd}/audit.md is missing or has no result`, { ctx });
          continue;
        }
        if (audit.result === 'void') {
          const sha = ctx.h.tally_sha;
          const before = sha ? ctx.wt.run(['show', `${sha}^:${ctx.nodePath}`], { allowFail: true }) : null;
          if (before) {
            const old = parseNode(before);
            const restored = structuredClone(ctx.node);
            restored.items = old.items;
            restored.fm.version_hashes = old.fm.version_hashes;
            restored.fm.soft_go_dissents = old.fm.soft_go_dissents;
            restored.fm.next_item = Math.max(old.fm.next_item, restored.fm.next_item);
            this.saveNode(ctx, restored, `${ctx.h.topic}/${ctx.h.node} ${roundDir(round)} void: tally undone`);
          }
          await this.afterVoid(issue, ctx, `audit failed checks ${audit.failed.join(', ')}`);
          continue;
        }
        const result = parseLooseFrontmatter(ctx.wt.read(`${rd}/result.md`) ?? '').data;
        if (!result) {
          await this.escalate(issue, 'needs-lou', `mismatch: ${rd}/result.md is missing`, { ctx });
          continue;
        }
        result.items = (result.items ?? []).map((x) => ({ ...x }));
        const topicCount = this.nodeIssues().filter((x) => x.h.topic === ctx.h.topic).length;
        const d = decideOutcome({ result, audit, node: ctx.node, topicNodeCount: topicCount, limits: this.limits() });
        await this.applyOutcome(issue, ctx, d, round);
      } catch (e) {
        this.note(`#${issue.number}: outcome failed: ${e.message}`);
        await this.commentOnce(issue, `orchestrator error applying the outcome: ${e.message}`);
      }
    }
  }

  async applyOutcome(issue, ctx, d, round) {
    switch (d.action) {
      case 'escalate':
        return this.escalate(issue, d.state, d.reason, { items: d.items ?? [], round, ctx });
      case 'leaf':
        await this.setState(issue, 'leaf', { clearTasks: true });
        await this.comment(issue, `${roundDir(round)}: all three voted **leaf**. Waiting for its bundle.`);
        this.note(`#${issue.number} ${ctx.h.node}: leaf`);
        return;
      case 'split':
        return this.split(issue, ctx, d.children);
      default:
        await this.setState(issue, 'queued', { clearTasks: true });
        this.note(`#${issue.number} ${ctx.h.node}: next round queued`);
    }
  }

  async split(issue, ctx, titles) {
    const parent = ctx.node;
    const topic = this.topicIssue(ctx.h.topic);
    const contextLines = [`From parent ${parent.fm.id} "${parent.fm.title}":`, ...parent.items.map((i) => `- ${i.id} (${i.fields.type}): ${i.fields.statement}`)];
    const created = [];
    for (let k = 0; k < titles.length; k++) {
      const id = `${parent.fm.id}.${k + 1}`;
      if (this.nodeIssues().some((x) => x.h.topic === ctx.h.topic && x.h.node === id)) continue;
      const depth = parent.fm.depth + 1;
      const nodeDir = `${ctx.td.dir}/${nodeRelDir(id)}`;
      const h = {
        topic: ctx.h.topic, node: id, branch: ctx.h.branch, path: nodeDir, round: 0, attempt: 1,
        round_limit: this.cfg.default_round_limit, order: [], lou_cycles: 0, priority: parent.fm.priority, depends_on: [],
      };
      const child = await this.gh.createIssue({
        title: `[${ctx.h.topic}] ${id} ${titles[k]}`,
        body: withHeader(`Split from ${parent.fm.id} in ${roundDir(parent.fm.round)}.\n\n**Starting point:** ${titles[k]}`, h),
        labels: ['kind:node', 'state:queued', `depth:${depth}`, `topic:${ctx.h.topic}`],
      });
      this.issues.push(child);
      await this.gh.addSubIssue(issue.number, child.id).catch((e) => this.note(`sub-issue link failed: ${e.message}`));
      const fm = newNodeFm({ id, parent: parent.fm.id, depth, title: titles[k], priority: parent.fm.priority, issue: child.number, round_limit: this.cfg.default_round_limit });
      fm.next_item = 2;
      ctx.wt.write(`${nodeDir}/node.md`, renderNode({ fm, items: [{ id: 'I1', fields: { type: 'open', statement: titles[k] } }], context: contextLines.join('\n') }));
      created.push(`#${child.number} ${id} ${titles[k]}`);
    }
    ctx.wt.commitPush(`${ctx.h.topic}/${ctx.h.node} split into ${titles.length}`);
    this.touchedBranches.add(ctx.h.branch);
    await this.setState(issue, 'split', { clearTasks: true });
    await this.comment(issue, `${roundDir(parent.fm.round)}: split into:\n${created.map((c) => `- ${c}`).join('\n')}`);
    this.note(`#${issue.number} ${ctx.h.node}: split into ${created.length}`);
    void topic;
  }

  // ======================================================================
  // Pass 7 — bundles
  // ======================================================================

  async pass7Bundles() {
    this.pulls = await this.gh.listPulls({ state: 'all' });
    const bundlePrs = this.pulls.filter((p) => p.head?.startsWith('bundle/'));
    // merged → approve
    for (const pr of bundlePrs.filter((p) => p.merged)) {
      const prIssue = this.issues.find((i) => i.number === pr.number) ?? { body: pr.body };
      const marker = this.bundleMarker(pr.body ?? prIssue.body);
      if (!marker) continue;
      const pending = marker.leaves.map((id) => this.leafIssue(marker.topic, id)).filter((i) => i && this.stateOf(i) === 'leaf');
      if (!pending.length) continue;
      try {
        await this.approveBundle(pr, marker, pending);
      } catch (e) {
        this.note(`PR #${pr.number}: approve failed: ${e.message}`);
      }
    }
    // open new bundles
    const topicState = this.topicStates();
    const byTopic = new Map();
    for (const x of this.nodeIssues()) {
      if (!byTopic.has(x.h.topic)) byTopic.set(x.h.topic, []);
      byTopic.get(x.h.topic).push({ id: String(x.h.node), state: this.stateOf(x.issue) });
    }
    for (const [nnn, nodes] of byTopic) {
      if (topicState[nnn] !== 'active') continue;
      const firstBundle = !bundlePrs.some((p) => p.head?.startsWith(`bundle/${nnn}/`));
      for (const b of findBundles(nodes, this.cfg.max_bundle_leaves)) {
        const branch = `bundle/${nnn}/${b.id}`;
        const same = (p) => {
          const m = this.bundleMarker(p.body);
          return m && JSON.stringify(m.leaves) === JSON.stringify(b.leaves);
        };
        if (bundlePrs.some((p) => p.head === branch && (p.state === 'open' || same(p)))) continue;
        try {
          await this.openBundle(nnn, b, branch, firstBundle);
        } catch (e) {
          this.note(`bundle ${nnn}/${b.id} failed: ${e.message}`);
        }
      }
    }
  }

  readLoopNode(nnn, id) {
    const wt = this.git.open(`loop/${nnn}/${rootId(id)}`);
    const td = this.findTopicDir(wt, nnn);
    const dir = `${td.dir}/${nodeRelDir(id)}`;
    return { wt, td, dir, node: parseNode(wt.read(`${dir}/node.md`)) };
  }

  voteOf(wt, dir, item) {
    const from = item.fields.from;
    if (!from) return '';
    const res = parseLooseFrontmatter(wt.read(`${dir}/rounds/${from}/result.md`) ?? '').data;
    const r = res?.items?.find((x) => x.final_id === item.id);
    return r ? ` (${r.support}/${(res.valid_voters ?? []).length})` : '';
  }

  renderBrief(nnn, b, firstBundle) {
    const rootInfo = this.readLoopNode(nnn, b.id);
    const leaves = b.leaves.map((id) => ({ id, ...this.readLoopNode(nnn, id) }));
    const decisions = [];
    const assumptions = [];
    const flags = [];
    for (const l of leaves) {
      for (const it of l.node.items) {
        const line = `- **${l.id} ${it.id}:** ${it.fields.statement}${it.fields.recommendation ? ` → **${it.fields.recommendation}**` : ''}${this.voteOf(l.wt, l.dir, it)}${it.fields.reason ? ` — ${it.fields.reason}` : ''}`;
        if (it.fields.type === 'decision') decisions.push(line);
        if (it.fields.type === 'claim') assumptions.push(line);
        if (it.fields.type === 'question') flags.push(`- ${l.id} ${it.id}: open question — ${it.fields.statement}`);
      }
      for (const [iid, ds] of Object.entries(l.node.fm.soft_go_dissents ?? {})) flags.push(`- ${l.id} ${iid}: accepted 2/3; dissent from ${[...new Set(ds.map((d) => d.bot))].join(', ')}`);
      if (l.node.fm.ever_stuck) flags.push(`- ${l.id}: was stuck at some point`);
    }
    flags.push('- Check yourself: anything hard to undo, costing money, or public-facing (not detected automatically).');
    const shown = firstBundle ? leaves : [leaves[this.secret ? hmacPermutation(this.secret, `${nnn}/${b.id}`, leaves.map((_, i) => i))[0] : 0]];
    let s = `## Bundle ${b.id}: ${rootInfo.node.fm.title}\n\n`;
    s += `**What it delivers.** ${b.leaves.length} agreed, atomic piece(s) under ${b.id} "${rootInfo.node.fm.title}": ${leaves.map((l) => `${l.id} ${l.node.fm.title}`).join('; ')}.\n\n`;
    s += `### Decisions\n${decisions.join('\n') || '- (none)'}\n\n### Assumptions\n${assumptions.join('\n') || '- (none)'}\n\n### Flags\n${flags.join('\n')}\n\n`;
    s += `### Size\n- Leaves: ${b.leaves.length}\n- Depth: ${Math.max(...b.leaves.map(depthOf))}\n\n`;
    s += `### ${firstBundle ? 'All leaves (first bundle of this topic)' : 'Spot check: one leaf in full'}\n`;
    for (const l of shown) {
      s += `\n#### ${l.id} ${l.node.fm.title}\n`;
      for (const it of l.node.items) s += `- **${it.id}** (${it.fields.type}): ${it.fields.statement}${it.fields.acceptance ? ` — *done when:* ${it.fields.acceptance}` : ''}\n`;
    }
    s += `\n---\nMerge to approve. Otherwise comment one command (\`/rerun [n]\`, \`/reject [leaf ids] [reason]\`, \`/pick <leaf ids>\`, \`/reword <leaf id> <text>\`, \`/park\`) and change the title prefix to \`[updated-lou #1]\`.\n`;
    return { text: s, title: rootInfo.node.fm.title };
  }

  async openBundle(nnn, b, branch, firstBundle) {
    const brief = this.renderBrief(nnn, b, firstBundle);
    const wt = this.git.open(branch, { from: 'main', fresh: true });
    const mainTd = this.findTopicDir(wt, nnn);
    const loopBranch = `loop/${nnn}/${rootId(b.id)}`;
    const loopWt = this.git.open(loopBranch);
    const loopTd = this.findTopicDir(loopWt, nnn);
    const rel = nodeRelDir(b.id);
    wt.copyFromRef(`origin/${loopBranch}`, `${loopTd.dir}/${rel}/`, `${mainTd.dir}/${rel}/`);
    wt.write(`${mainTd.dir}/briefs/${b.id}.md`, `# [${nnn}] ${brief.text.replace(/^## /, '')}`);
    wt.commitPush(`bundle ${nnn}/${b.id}: ${b.leaves.length} leaf(s)`);
    const marker = { topic: nnn, id: b.id, branch, leaves: b.leaves };
    const pr = await this.gh.createPull({
      title: `[need-lou #1] [${nnn}] bundle ${b.id}: ${brief.title}`,
      head: branch,
      body: `${brief.text}\n<!-- bundle ${JSON.stringify(marker)} -->\n`,
    });
    for (const id of b.leaves) {
      const li = this.leafIssue(nnn, id);
      if (li) await this.comment(li, `In bundle PR #${pr.number}.`);
    }
    this.pulls.push({ number: pr.number, head: branch, state: 'open', merged: false, body: `<!-- bundle ${JSON.stringify(marker)} -->` });
    this.note(`opened bundle PR #${pr.number} for ${nnn}/${b.id} (${b.leaves.length} leaves)`);
  }

  async approveBundle(pr, marker, pending) {
    const main = this.git.open('main');
    const td = this.findTopicDir(main, marker.topic);
    const readme = parseTopicReadme(main.read(`${td.dir}/README.md`) ?? '');
    const leaves = marker.leaves.map((id) => {
      const dir = `${td.dir}/${nodeRelDir(id)}`;
      const text = main.read(`${dir}/node.md`);
      return { id, node: text ? parseNode(text) : null };
    }).filter((l) => l.node);
    const rootRead = main.read(`${td.dir}/${nodeRelDir(marker.id)}/node.md`);
    const root = rootRead ? parseNode(rootRead) : null;
    const decisions = [];
    const risks = [];
    let tasks = '';
    for (const l of leaves) {
      tasks += `\n### ${l.id} ${l.node.fm.title}\n`;
      for (const it of l.node.items) {
        tasks += `- **${it.id}** (${it.fields.type}): ${it.fields.statement}${it.fields.recommendation ? ` → ${it.fields.recommendation}` : ''}\n`;
        tasks += `  - Acceptance: ${it.fields.acceptance ?? '_not stated — the planner should define it_'}\n`;
        if (it.fields.type === 'decision') decisions.push(`- ${l.id} ${it.id}: ${it.fields.statement}${it.fields.recommendation ? ` → **${it.fields.recommendation}**` : ''}${it.fields.reason ? ` — ${it.fields.reason}` : ''}`);
        if (it.fields.type === 'question') risks.push(`- ${l.id} ${it.id}: open question — ${it.fields.statement}`);
      }
      for (const [iid, ds] of Object.entries(l.node.fm.soft_go_dissents ?? {})) risks.push(`- ${l.id} ${iid}: accepted 2/3 (dissent: ${[...new Set(ds.map((d) => d.bot))].join(', ')})`);
    }
    const rootDeps = this.nodeIssues().find((x) => x.h.topic === marker.topic && x.h.node === rootId(marker.id))?.h.depends_on ?? [];
    const date = isoDate(this.now());
    let s = `# [${marker.topic}] Bundle ${marker.id}: ${root?.fm.title ?? ''}\n\nApproved by merging PR #${pr.number} on ${date}. Brief: \`${td.dir}/briefs/${marker.id}.md\`.\n\n`;
    s += `## Goal\n\n${readme.goal || readme.title}\n\n## Decisions\n\n${decisions.join('\n') || '- (none)'}\n\n`;
    s += `## Scope\n\nIn scope: the tasks below (${leaves.map((l) => l.id).join(', ')}).\n\nOut of scope:\n${readme.outOfScope.map((o) => `- ${o}`).join('\n') || '- (see topic README)'}\n\n`;
    s += `## Tasks\n${tasks}\n## Dependencies\n\n${rootDeps.length ? rootDeps.map((d) => `- Seed ${d} of topic ${marker.topic}`).join('\n') : '- None recorded'}\n\n`;
    s += `## Open risks\n\n${risks.join('\n') || '- None recorded'}\n`;
    const out = `outbox/${date}-${marker.topic}-${marker.id}.md`;
    main.write(out, s);
    main.commitPush(`outbox: ${marker.topic} bundle ${marker.id}`);
    for (const li of pending) {
      await this.setState(li, 'approved', { clearTasks: true });
      await this.gh.updateIssue(li.number, { state: 'closed', state_reason: 'completed' });
      li.state = 'closed';
    }
    this.note(`approved bundle ${marker.topic}/${marker.id} → ${out}`);
  }

  // ======================================================================
  // Pass 8 — topics
  // ======================================================================

  async pass8Topics() {
    const main = this.git.open('main');
    for (const d of main.list('topics/active')) {
      const nnn = /^(\d{3})-/.exec(d)?.[1];
      if (!nnn) continue;
      const nodes = this.nodeIssues().filter((x) => x.h.topic === nnn).map((x) => ({ id: String(x.h.node), state: this.stateOf(x.issue) }));
      const roots = nodes.filter((n) => depthOf(n.id) === 0);
      if (!roots.length) continue;
      const done = makeDone(new Map(nodes.map((n) => [n.id, n])));
      if (!roots.every((r) => done(r.id)) || nodes.some((n) => n.state === 'leaf')) continue;
      main.mv(`topics/active/${d}`, `topics/done/${d}`);
      main.commitPush(`topic ${nnn} done`);
      const ti = this.topicIssue(nnn);
      if (ti) {
        await this.removeLabels(ti, ti.labels.filter((l) => l.startsWith('topic-state:')));
        await this.addLabels(ti, ['topic-state:done']);
        await this.gh.updateIssue(ti.number, { state: 'closed', state_reason: 'completed' });
        ti.state = 'closed';
      }
      this.note(`topic ${nnn} done`);
    }
  }

  // ======================================================================
  // Pass 9 — sync
  // ======================================================================

  async pass9Sync() {
    const main = this.git.open('main');
    const master = this.renderMaster(main);
    if (main.read('MASTER.md') !== master) {
      main.write('MASTER.md', master);
      main.commitPush('MASTER.md sync');
    }
    for (const branch of this.touchedBranches) {
      try {
        const wt = this.git.open(branch);
        const nnn = branch.split('/')[1];
        const root = branch.split('/')[2];
        const td = this.findTopicDir(wt, nnn);
        if (!td) continue;
        const nodes = this.nodeIssues().filter((x) => x.h.topic === nnn && rootId(String(x.h.node)) === root).sort((a, b) => compareNodeIds(String(a.h.node), String(b.h.node)));
        const tree = `# Tree — ${nnn}/${root}\n\nGenerated by the orchestrator.\n\n${nodes
          .map((x) => `${'  '.repeat(depthOf(String(x.h.node)))}- ${x.h.node} ${stripPrefix(x.issue.title).replace(/^\[\d{3}\]\s*\S+\s*/, '')} — **${this.stateOf(x.issue)}**${x.h.round ? ` (r${x.h.round})` : ''} #${x.issue.number}`)
          .join('\n')}\n`;
        const p = `${td.dir}/loop/${root}/tree.md`;
        if (wt.read(p) !== tree) {
          wt.write(p, tree);
          wt.commitPush(`${nnn}/${root} tree.md`);
        }
      } catch (e) {
        this.note(`tree.md for ${branch} failed: ${e.message}`);
      }
    }
    for (const num of this.touchedNodes) {
      const issue = this.issues.find((i) => i.number === num);
      if (!issue || !issue.labels.includes('kind:node')) continue;
      try {
        const ctx = this.nodeCtx(issue);
        const human = `**${ctx.node.fm.id} ${ctx.node.fm.title}** — state \`${this.stateOf(issue)}\`, round ${ctx.node.fm.round}/${ctx.node.fm.round_limit}, attempt ${ctx.node.fm.attempt}.\n\n${
          ctx.node.context ? `> ${ctx.node.context.replace(/\n/g, '\n> ')}\n\n` : ''
        }**Accepted items**\n\n${ctx.node.items.map((i) => `- **${i.id}** (${i.fields.type}): ${i.fields.statement}${i.fields.recommendation ? ` → **${i.fields.recommendation}**` : ''}`).join('\n') || '- (none)'}\n\nFiles: \`${ctx.h.branch}:${ctx.nodePath}\``;
        const body = withHumanPart(issue.body, human);
        if (body !== issue.body) {
          await this.gh.updateIssue(issue.number, { body });
          issue.body = body;
        }
      } catch {
        // node.md may not exist yet (queued root before its first round)
      }
    }
  }

  renderMaster(main) {
    const topics = [];
    for (const st of TOPIC_STATES) for (const d of main.list(`topics/${st}`)) if (/^\d{3}-/.test(d)) topics.push({ nnn: d.slice(0, 3), dir: `topics/${st}/${d}`, state: st });
    topics.sort((a, b) => a.nnn.localeCompare(b.nnn));
    const forLou = (i) => i.state === 'open' && titlePrefix(i.title)?.kind === 'need-lou';
    let s = `# Master list\n\nGenerated by the orchestrator after every run. Lou: start here. Anything titled \`[need-lou #n]\` is waiting for you.\n\n## Topics\n\n| # | Topic | State | Folder | Topic Issue | Waiting for Lou |\n| --- | --- | --- | --- | --- | --- |\n`;
    for (const t of topics) {
      const readme = parseTopicReadme(main.read(`${t.dir}/README.md`) ?? '');
      const ti = this.topicIssue(t.nnn);
      const waiting = this.issues.filter((i) => forLou(i) && (parseHeader(i.body)?.topic === t.nnn || this.bundleMarker(i.body)?.topic === t.nnn)).length;
      s += `| ${t.nnn} | ${mdEscapeCell(readme.title)} | ${t.state} | [${t.dir}](${t.dir}/README.md) | ${ti ? `#${ti.number}` : '—'} | ${waiting} |\n`;
    }
    for (const t of topics) {
      const nodes = this.nodeIssues().filter((x) => x.h.topic === t.nnn);
      if (!nodes.length) continue;
      const roots = nodes.filter((x) => depthOf(String(x.h.node)) === 0).sort((a, b) => compareNodeIds(String(a.h.node), String(b.h.node)));
      s += `\n## ${t.nnn} — root nodes\n\n| Id | Title | Priority | Depends on | Branch | Issue | State | Round | Nodes in tree |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n`;
      for (const r of roots) {
        const sub = nodes.filter((x) => rootId(String(x.h.node)) === String(r.h.node)).length;
        s += `| ${r.h.node} | ${mdEscapeCell(stripPrefix(r.issue.title).replace(/^\[\d{3}\]\s*\S+\s*/, ''))} | ${r.h.priority ?? ''} | ${(r.h.depends_on ?? []).join(', ') || '—'} | \`${r.h.branch}\` | #${r.issue.number} | ${this.stateOf(r.issue)} | ${r.h.round || '—'} | ${sub} |\n`;
      }
    }
    return s;
  }
}

export { renderInlineList, parentId };
