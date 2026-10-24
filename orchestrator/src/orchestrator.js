// The orchestrator (AGENTS.md section 12): a stateless script. Every pass reads labels and files and
// does only what is still missing, so running it twice is harmless.
import { parseHeader, withHeader, withHumanPart, titlePrefix, stripPrefix, withNeedLou, mdEscapeCell, isoDate } from './util.js';
import * as F from './formats.js';
import { BOTS, ROLES, tallyOutcome, readyItems, botOrder, parseCommand, COMMANDS_FOR } from './rules.js';
import { standardLabels } from './labels.js';
import { cycleAt, nextCycleId, cycleOrdinal, WORK_END, REVIEW_START, REVIEW_END } from './clock.js';

const TOPIC_STATES = ['active', 'done', 'parked', 'rejected'];
const OPEN_TASK_STATES = ['approved', 'blocked', 'more-review', 'rework', 'needs-lou'];
const C = (msg) => `[orchestrator] ${msg}`;

export class Orchestrator {
  constructor({ gh, git, config, secret = '', now = () => new Date(), log = console.log }) {
    this.gh = gh;
    this.git = git;
    this.cfg = config;
    this.secret = secret;
    this.now = now;
    this.log = log;
    this.summary = [];
  }

  note(msg) {
    this.summary.push(msg);
    this.log(msg);
  }

  async run() {
    this.git.fetch();
    await this.reload();
    const passes = [
      ['0 setup', () => this.passSetup()],
      ['1 housekeeping', () => this.passHousekeeping()],
      ['2 lou', () => this.passLou()],
      ['5 tally', () => this.passTally()],
      ['4 review sheets', () => this.passSheets()],
      ['3 prep', () => this.passPrep()],
      ['6 close-out', () => this.passCloseOut()],
      ['7 sync', () => this.passSync()],
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
    this.issues = (await this.gh.listIssues({ state: 'all' })).filter((i) => !i.isPull);
    this.labelsCache = null;
  }

  // ---------------------------------------------------------------- issue helpers

  ofKind(kind, { open = null } = {}) {
    return this.issues
      .filter((i) => i.labels.includes(`kind:${kind}`))
      .filter((i) => (open === null ? true : open ? i.state === 'open' : i.state !== 'open'))
      .map((i) => ({ issue: i, h: parseHeader(i.body) }))
      .filter((x) => x.h && x.h.topic);
  }
  items(opts) {
    return this.ofKind('item', opts).filter((x) => x.h.item);
  }
  tasksOf(nnn, id) {
    return this.ofKind('task').filter((x) => String(x.h.topic) === String(nnn) && String(x.h.item) === String(id));
  }
  itemIssue(nnn, id) {
    return this.items().find((x) => String(x.h.topic) === String(nnn) && String(x.h.item) === String(id))?.issue;
  }
  topicIssue(nnn) {
    return this.issues.find((i) => i.labels.includes('kind:topic') && i.labels.includes(`topic:${nnn}`));
  }
  stateOf(issue) {
    return issue.labels.find((l) => l.startsWith('state:'))?.slice(6) ?? null;
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
  async setState(issue, state) {
    await this.removeLabels(issue, issue.labels.filter((l) => l.startsWith('state:') && l !== `state:${state}`));
    await this.addLabels(issue, [`state:${state}`]);
  }
  async clearTodo(issue) {
    await this.removeLabels(issue, issue.labels.filter((l) => l.startsWith('todo:')));
  }
  async close(issue, reason) {
    if (issue.state !== 'open') return;
    await this.gh.updateIssue(issue.number, { state: 'closed', state_reason: reason });
    issue.state = 'closed';
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
  async setHuman(issue, human) {
    const body = withHumanPart(issue.body, human);
    if (body !== issue.body) {
      await this.gh.updateIssue(issue.number, { body });
      issue.body = body;
    }
  }
  async comment(issue, text) {
    await this.gh.createComment(issue.number, text);
  }
  async statusIssue() {
    let s = this.issues.find((i) => i.labels.includes('kind:status') && i.state === 'open');
    if (!s) {
      await this.ensureLabels(['kind:status']);
      s = await this.gh.createIssue({ title: '[status] Bots', body: 'Notes on missed windows and stale locks (AGENTS.md 3.3).', labels: ['kind:status'] });
      this.issues.push(s);
    }
    return s;
  }
  async statusNote(text) {
    const s = await this.statusIssue();
    await this.comment(s, C(text));
  }
  minutesSince(ts) {
    return (this.now().getTime() - new Date(ts).getTime()) / 60000;
  }
  async labelAddedAt(issue, label) {
    const ev = await this.gh.labelEvents(issue.number);
    return ev.filter((e) => e.event === 'labeled' && e.label === label).pop()?.created_at ?? issue.created_at;
  }

  // ---------------------------------------------------------------- repo helpers

  findTopicDir(wt, nnn) {
    const found = [];
    for (const st of TOPIC_STATES) {
      for (const d of wt.list(`topics/${st}`)) {
        if (d.startsWith(`${nnn}-`) && wt.isDir(`topics/${st}/${d}`)) found.push({ dir: `topics/${st}/${d}`, state: st, slug: d });
      }
    }
    return found.find((f) => wt.exists(`${f.dir}/README.md`)) ?? found[0] ?? null;
  }
  topicStates() {
    const main = this.git.open('main');
    const out = new Map();
    for (const st of TOPIC_STATES) for (const d of main.list(`topics/${st}`)) if (/^\d{3}-/.test(d)) out.set(d.slice(0, 3), st);
    return out;
  }

  /** Open an item's work branch. ctx.dir is the item folder; ctx.save(msg) commits and pushes. */
  itemCtx(issue) {
    const h = parseHeader(issue.body);
    if (!h?.branch) throw new Error(`#${issue.number}: no state header`);
    const wt = this.git.open(h.branch);
    const td = this.findTopicDir(wt, h.topic);
    if (!td) throw new Error(`topic ${h.topic} not found on ${h.branch}`);
    const dir = `${td.dir}/items/${h.item}`;
    const item = F.parseItem(wt.read(`${dir}/item.md`));
    const ctx = {
      issue, h, wt, td, dir, item, nnn: String(h.topic), id: String(h.item),
      cdir: (cycle) => `${dir}/cycles/${cycle}`,
      taskPath: (t) => `${dir}/tasks/${t}/task.md`,
      readTask: (t) => F.parseTask(wt.read(`${dir}/tasks/${t}/task.md`)),
      writeTask: (t) => wt.write(`${dir}/tasks/${t.task}/task.md`, F.renderTask(t)),
      saveItem: () => wt.write(`${dir}/item.md`, F.renderItem(ctx.item)),
      save: (msg) => wt.commitPush(C(msg)),
    };
    return ctx;
  }

  // ================================================================ pass 0: setup

  async passSetup() {
    const main = this.git.open('main');
    const active = main.list('topics/active').filter((d) => /^\d{3}-/.test(d) && main.isDir(`topics/active/${d}`));
    const seedsOf = new Map();
    for (const d of active) {
      const nnn = d.slice(0, 3);
      const tdir = `topics/active/${d}`;
      const readme = F.parseTopicReadme(main.read(`${tdir}/README.md`) ?? '');
      const seeds = main.list(`${tdir}/seeds`).filter((f) => /^\d{2}-.*\.md$/.test(f)).sort().map((f) => F.parseSeed(main.read(`${tdir}/seeds/${f}`), f));
      seedsOf.set(nnn, seeds);
      await this.ensureLabels([...standardLabels().map((l) => l[0]), `topic:${nnn}`]);
      if (!this.topicIssue(nnn)) {
        const src = main.list(`${tdir}/source`).filter((f) => !f.startsWith('.')).map((f) => main.read(`${tdir}/source/${f}`) ?? '').join('\n\n---\n\n');
        const quoted = src.slice(0, 50000).split('\n').map((l) => `> ${l}`).join('\n');
        const body = withHeader(`**Goal:** ${readme.goal}\n\n**Target:** ${readme.target || '(none set)'}\n\n**Original material** (from \`${tdir}/source/\`):\n\n${quoted}`, { topic: nnn, lou_cycles: 0 });
        const t = await this.gh.createIssue({ title: `[${nnn}] ${readme.title}`, body, labels: ['kind:topic', 'topic-state:active', `topic:${nnn}`] });
        this.issues.push(t);
        this.note(`created topic Issue #${t.number} for ${nnn}`);
      }
    }
    // work branches: create, merge main, item files
    const branches = new Set([...this.git.listBranches('work/').map((b) => b), ...active.map((d) => `work/${d.slice(0, 3)}`)]);
    for (const branch of branches) {
      const nnn = branch.split('/')[1];
      const wt = this.git.open(branch, { from: 'main' });
      if (!wt.created && !wt.hasMain()) {
        if (wt.mergeMain()) {
          wt.push();
          this.note(`${branch}: merged main`);
        } else this.note(`${branch}: merging main conflicted — needs a human`);
      }
      // a topic folder moved on main (park, done…) leaves the work-only items/ behind: move it along
      const home = this.findTopicDir(main, nnn);
      if (home) {
        for (const st of TOPIC_STATES) {
          const old = `topics/${st}/${home.slug}/items`;
          if (st === home.state || !wt.isDir(old)) continue;
          wt.mv(old, `${home.dir}/items`);
          wt.commitPush(C(`${branch}: items follow topic ${nnn} to ${home.state}/`));
          this.note(`${branch}: items moved to ${home.dir}`);
        }
      }
      const seeds = seedsOf.get(nnn);
      if (!seeds) continue;
      const td = this.findTopicDir(wt, nnn);
      if (!td) continue;
      for (const seed of seeds) {
        const p = `${td.dir}/items/${seed.id}/item.md`;
        if (!wt.exists(p)) wt.write(p, F.renderItem(F.newItem({ topic: nnn, seed })));
      }
      if (wt.commitPush(C(`${branch}: item files`))) this.note(`${branch}: item files written`);
    }
    // item Issues
    for (const [nnn, seeds] of seedsOf) {
      const topic = this.topicIssue(nnn);
      for (const seed of seeds) {
        if (this.itemIssue(nnn, seed.id)) continue;
        const h = { topic: nnn, item: seed.id, branch: `work/${nnn}`, cycle: null, phase: 'closed', priority: seed.priority, depends_on: seed.depends_on, author: null, lou_cycles: 0 };
        const human = `**Goal:** ${seed.goal}\n\n**Starting points**\n\n${seed.points.map((p) => `- ${p}`).join('\n')}\n`;
        const issue = await this.gh.createIssue({ title: `[${nnn}] ${seed.id} ${seed.title}`, body: withHeader(human, h), labels: ['kind:item', 'state:todo', `topic:${nnn}`] });
        this.issues.push(issue);
        if (topic?.id) await this.gh.addSubIssue(topic.number, issue.id).catch((e) => this.note(`sub-issue link failed: ${e.message}`));
        this.note(`created item Issue #${issue.number} for ${nnn}/${seed.id}`);
      }
    }
  }

  // ================================================================ pass 1: housekeeping

  /** The item Issue an Issue belongs to (itself, or a task's item). */
  itemFor(issue) {
    if (issue.labels.includes('kind:item')) return issue;
    const h = parseHeader(issue.body);
    return h?.item ? this.itemIssue(h.topic, h.item) : null;
  }

  async bump(issue, field, role) {
    const ii = this.itemFor(issue);
    if (!ii) return 0;
    const ctx = this.itemCtx(ii);
    ctx.item.fm[field] = { ...(ctx.item.fm[field] ?? {}) };
    ctx.item.fm[field][role] = (ctx.item.fm[field][role] ?? 0) + 1;
    ctx.saveItem();
    ctx.save(`${ctx.nnn}/${ctx.id} ${field}.${role} = ${ctx.item.fm[field][role]}`);
    if (ctx.item.fm[field][role] >= 3 && ii.state === 'open' && this.stateOf(ii) !== 'needs-lou') {
      await this.clearTodo(ii);
      await this.setState(ii, 'needs-lou');
      await this.comment(ii, C(`${role} hit 3 ${field === 'bot_errors' ? 'errors' : 'dead locks'} on this item.`));
    }
    return ctx.item.fm[field][role];
  }

  async passHousekeeping() {
    const open = this.issues.filter((i) => i.state === 'open');
    for (const issue of open.filter((i) => i.labels.some((l) => l.startsWith('claimed:')))) {
      const comments = await this.gh.listComments(issue.number);
      for (const label of issue.labels.filter((l) => l.startsWith('claimed:'))) {
        const role = label.slice(8);
        const re = new RegExp(`^(?:\\[\\w+\\]\\s*)?lock: ${role} run \\S+ heartbeat (\\S+)`);
        const locks = comments.filter((c) => re.test(c.body.trim()));
        let age;
        if (locks.length) {
          const last = locks[locks.length - 1];
          const ts = re.exec(last.body.trim())[1];
          age = this.minutesSince(isNaN(Date.parse(ts)) ? last.updated_at : ts);
        } else age = this.minutesSince(await this.labelAddedAt(issue, label));
        if (age <= this.cfg.lock_timeout_minutes) continue;
        for (const c of locks) await this.gh.deleteComment(c.id);
        await this.removeLabels(issue, [label]);
        await this.comment(issue, C(`lock released: ${role} no heartbeat for ${this.cfg.lock_timeout_minutes}m`));
        this.note(`#${issue.number}: released dead ${role} lock`);
        await this.bump(issue, 'dead_locks', role).catch((e) => this.note(`counter failed: ${e.message}`));
      }
    }
    for (const issue of open.filter((i) => i.labels.includes('bot-error'))) {
      const comments = await this.gh.listComments(issue.number);
      const ERR = /^\[(\w+)\]\s*error:/;
      const err = [...comments].reverse().find((c) => ERR.test(c.body.trim()));
      const role = err ? ERR.exec(err.body.trim())[1] : null;
      await this.removeLabels(issue, ['bot-error']);
      if (!role || !ROLES.includes(role)) {
        await this.comment(issue, C('bot-error cleared (no `[<role>] error:` comment found).'));
        continue;
      }
      const n = await this.bump(issue, 'bot_errors', role).catch(() => 0);
      this.note(`#${issue.number}: ${role} error ${n}/3`);
      if (n < 3) await this.comment(issue, C(`bot-error cleared (${role} ${n}/3).`));
    }
    // give every needs-lou Issue its title prefix and summary (AGENTS.md 9.1)
    for (const issue of this.issues.filter((i) => i.state === 'open' && this.stateOf(i) === 'needs-lou' && !titlePrefix(i.title))) {
      const h = parseHeader(issue.body) ?? {};
      const n = (Number(h.lou_cycles) || 0) + 1;
      await this.patchHeader(issue, { lou_cycles: n });
      await this.setTitle(issue, withNeedLou(issue.title, n));
      const kind = issue.labels.includes('kind:task') ? 'task' : 'item';
      const cmds = COMMANDS_FOR[kind].map((c) => `\`/${c}${['reword', 'rework'].includes(c) ? ' <text>' : ''}\``).join(', ');
      await this.comment(
        issue,
        `<!-- need-lou #${n} -->\n${C(`**Lou, this ${kind} needs your decision** (round ${n}). The reason is in the comments above.`)}\n\nReply with one command (${cmds}), then change the title prefix to \`[updated-lou #${n}]\`.${n >= 3 ? `\n\nThis is round ${n}: consider \`/reword\`, \`/approve\` or \`/park\` instead of another rework.` : ''}`,
      );
      this.note(`#${issue.number}: [need-lou #${n}]`);
    }
  }

  // ================================================================ pass 2: Lou

  async passLou() {
    for (const issue of this.issues.filter((i) => i.state === 'open' && titlePrefix(i.title)?.kind === 'updated-lou')) {
      try {
        await this.handleLou(issue);
      } catch (e) {
        this.note(`#${issue.number}: Lou command failed: ${e.message}`);
        await this.comment(issue, C(`error while handling your command: ${e.message}`)).catch(() => {});
      }
    }
  }

  async handleLou(issue) {
    const comments = await this.gh.listComments(issue.number);
    const h = parseHeader(issue.body) ?? {};
    const n = Number(h.lou_cycles) || 1;
    const kind = issue.labels.includes('kind:topic') ? 'topic' : issue.labels.includes('kind:task') ? 'task' : 'item';
    let cmdComment = null;
    for (let i = comments.length - 1; i >= 0; i--) {
      const c = comments[i];
      if (c.user !== this.cfg.lou_login || !c.body.trim().startsWith('/')) continue; // bot comments start with "["
      const reactions = await this.gh.listReactions(c.id);
      if (reactions.some((r) => r.user === this.cfg.orchestrator_login && r.content === '+1')) break;
      cmdComment = c;
      break;
    }
    const retry = async (why) => {
      await this.setTitle(issue, kind === 'topic' ? stripPrefix(issue.title) : withNeedLou(issue.title, n));
      await this.comment(issue, C(`${why} Reply with one command (${COMMANDS_FOR[kind].map((c) => `\`/${c}\``).join(', ')}), then set the title prefix to \`[updated-lou${kind === 'topic' ? '' : ` #${n}`}]\`.`));
    };
    if (!cmdComment) return retry('I found `[updated-lou]` but no new command from you.');
    const cmd = parseCommand(cmdComment.body);
    if (!cmd || cmd.error) return retry(`I couldn't read that command${cmd?.error ? `: ${cmd.error}` : ''}.`);
    if (!COMMANDS_FOR[kind].includes(cmd.name)) return retry(`\`/${cmd.name}\` doesn't apply to a ${kind} Issue.`);

    const outcome = kind === 'topic' ? await this.topicCommand(issue, cmd) : kind === 'task' ? await this.taskCommand(issue, cmd) : await this.itemCommand(issue, cmd);
    if (outcome?.retry) return retry(outcome.retry);
    await this.gh.addReaction(cmdComment.id, '+1');
    const where = kind === 'topic' ? 'topic' : kind === 'task' ? `${h.item}-${h.task}` : String(h.item);
    await this.appendOverride(String(h.topic), where, cmdComment.body.trim());
    await this.setTitle(issue, stripPrefix(issue.title));
    await this.comment(issue, C(`Done: \`${cmdComment.body.trim().split('\n')[0].slice(0, 120)}\` → ${outcome.did}.`));
    this.note(`#${issue.number}: Lou /${cmd.name} → ${outcome.did}`);
  }

  async appendOverride(nnn, where, command) {
    const main = this.git.open('main');
    const td = this.findTopicDir(main, nnn);
    if (!td) return;
    const p = `${td.dir}/overrides.md`;
    let text = main.read(p) ?? `# Overrides — ${nnn}\n\n| Date | Where | Command |\n| --- | --- | --- |\n`;
    if (!text.endsWith('\n')) text += '\n';
    text += `| ${isoDate(this.now())} | ${mdEscapeCell(where)} | ${mdEscapeCell(command)} |\n`;
    main.write(p, text);
    main.commitPush(C(`overrides: ${nnn} ${where}`));
  }

  async taskCommand(issue, cmd) {
    const h = parseHeader(issue.body);
    const ii = this.itemIssue(h.topic, h.item);
    if (!ii) return { retry: 'Its item Issue is missing.' };
    const ctx = this.itemCtx(ii);
    const t = ctx.readTask(h.task);
    if (!t) return { retry: `task.md for ${h.task} not found.` };
    const day = isoDate(this.now());
    let state;
    let did;
    switch (cmd.name) {
      case 'approve':
        state = 'approved';
        t.lou_approved = true;
        did = 'approved by Lou; the auditor exports it as is';
        break;
      case 'reword':
        state = 'approved';
        t.lou_approved = true;
        t.description = cmd.text;
        did = 'reworded and approved; the auditor exports it as is';
        break;
      case 'rework':
        state = 'more-review';
        t.changes.push(`${day} lou: ${cmd.text}`);
        did = 'sent back for rework at the next cycle';
        break;
      case 'reject':
        state = 'rejected';
        did = 'rejected';
        break;
      case 'park':
        state = 'parked';
        did = 'parked';
        break;
      case 'resume':
        if (this.stateOf(issue) !== 'parked') return { retry: 'Only a parked task can be resumed.' };
        state = 'more-review';
        did = 'resumed (more review)';
        break;
    }
    t.state = state;
    t.history.push(`${day}: Lou /${cmd.name} → ${state}`);
    ctx.writeTask(t);
    ctx.save(`${ctx.nnn}/${ctx.id} ${h.task}: Lou /${cmd.name}`);
    await this.setState(issue, state);
    if (t.lou_approved) await this.addLabels(issue, ['lou-approved']);
    if (state === 'rejected') await this.close(issue, 'not_planned');
    return { did };
  }

  async itemCommand(issue, cmd) {
    const h = parseHeader(issue.body);
    switch (cmd.name) {
      case 'rerun':
        await this.clearTodo(issue);
        await this.patchHeader(issue, { phase: 'closed', author: null });
        await this.setState(issue, 'todo');
        return { did: 'back in the queue for another breakdown' };
      case 'park':
        await this.clearTodo(issue);
        await this.patchHeader(issue, { phase: 'closed' });
        await this.setState(issue, 'parked');
        return { did: 'parked' };
      case 'resume':
        if (this.stateOf(issue) !== 'parked') return { retry: 'Only a parked item can be resumed.' };
        await this.setState(issue, 'todo');
        return { did: 'resumed' };
      case 'reject': {
        await this.clearTodo(issue);
        await this.patchHeader(issue, { phase: 'closed' });
        await this.setState(issue, 'rejected');
        for (const { issue: ti } of this.tasksOf(h.topic, h.item).filter((x) => x.issue.state === 'open')) {
          await this.setState(ti, 'rejected');
          await this.close(ti, 'not_planned');
        }
        await this.close(issue, 'not_planned');
        return { did: 'item and its open tasks rejected' };
      }
    }
    return { retry: 'Unknown command.' };
  }

  async topicCommand(issue, cmd) {
    const nnn = String(parseHeader(issue.body)?.topic);
    const main = this.git.open('main');
    const td = this.findTopicDir(main, nnn);
    if (!td) return { retry: `Topic folder ${nnn} not found.` };
    const move = async (to) => {
      if (td.state === to) return;
      main.mv(td.dir, `topics/${to}/${td.slug}`);
      main.commitPush(C(`topic ${nnn} → ${to}`));
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
      case 'reject':
        await move('rejected');
        for (const x of [...this.items({ open: true }), ...this.ofKind('task', { open: true })].filter((x) => String(x.h.topic) === nnn)) {
          await this.clearTodo(x.issue);
          await this.setState(x.issue, 'rejected');
          await this.close(x.issue, 'not_planned');
        }
        await this.close(issue, 'not_planned');
        return { did: 'topic rejected; its open Issues closed' };
    }
    return { retry: 'Unknown command.' };
  }

  // ================================================================ pass 5: tally (and dropped cycles)

  async passTally() {
    const cur = cycleAt(this.now());
    for (const { issue, h } of this.items({ open: true })) {
      if (!['work', 'review'].includes(h.phase) || !h.cycle) continue;
      const over = String(h.cycle) < cur.id || (String(h.cycle) === cur.id && cur.minute >= REVIEW_END);
      if (!over) continue;
      try {
        if (h.phase === 'review') await this.tally(issue);
        else await this.dropCycle(issue, 'the review sheets were never built (orchestrator down?)');
      } catch (e) {
        this.note(`#${issue.number}: tally failed: ${e.message}`);
      }
    }
  }

  /** Undo a cycle that can't be reviewed any more: new item back to todo, reworks back to more-review. */
  async dropCycle(issue, why) {
    const ctx = this.itemCtx(issue);
    const a = F.parseAssignments(ctx.wt.read(`${ctx.cdir(ctx.h.cycle)}/assignments.md`));
    for (const w of (a?.work ?? []).filter((w) => w.what === 'rework')) await this.revertRework(ctx, w.task, `cycle ${ctx.h.cycle} dropped`);
    ctx.item.cycles.push(`${ctx.h.cycle}: dropped (${why})`);
    ctx.saveItem();
    ctx.save(`${ctx.nnn}/${ctx.id} ${ctx.h.cycle} dropped`);
    await this.clearTodo(issue);
    const isNew = (a?.work ?? []).some((w) => w.what === 'breakdown');
    await this.patchHeader(issue, { phase: 'closed', ...(isNew ? { author: null } : {}) });
    await this.setState(issue, isNew ? 'todo' : this.itemRestState(ctx.nnn, ctx.id));
    await this.statusNote(`${ctx.h.cycle} ${ctx.nnn}/${ctx.id}: cycle dropped — ${why}`);
    this.note(`#${issue.number}: ${ctx.h.cycle} dropped`);
  }

  async revertRework(ctx, task, why) {
    const t = ctx.readTask(task);
    if (t) {
      t.reworks = Math.max(0, t.reworks - 1);
      t.state = 'more-review';
      t.history.push(`${ctx.h.cycle}: rework not done (${why}) → more-review`);
      ctx.writeTask(t);
    }
    const ti = this.tasksOf(ctx.nnn, ctx.id).find((x) => x.h.task === task)?.issue;
    if (ti) {
      await this.patchHeader(ti, { reworks: t?.reworks ?? 0 });
      await this.setState(ti, 'more-review');
    }
  }

  /** done when no task of the item is still in more-review or rework, else waiting. */
  itemRestState(nnn, id) {
    const busy = this.tasksOf(nnn, id).some((x) => x.issue.state === 'open' && ['more-review', 'rework'].includes(this.stateOf(x.issue)));
    return busy ? 'waiting' : 'done';
  }

  async tally(issue) {
    const ctx = this.itemCtx(issue);
    const cycle = String(ctx.h.cycle);
    const cdir = ctx.cdir(cycle);
    const a = F.parseAssignments(ctx.wt.read(`${cdir}/assignments.md`));
    if (!a?.review) return this.dropCycle(issue, 'assignments.md has no review section');
    const rv = a.review;
    // every task under review: id → { author, text, rework }
    const tasks = [];
    const sheetTexts = {};
    for (const b of rv.sheets) Object.assign(sheetTexts, F.parseSheet(ctx.wt.read(`${cdir}/review-sheet-${b}.md`)));
    for (const [id, author] of Object.entries(rv.fresh ?? {})) tasks.push({ id, author, text: sheetTexts[id] ?? {}, rework: false });
    for (const id of rv.reworks ?? []) {
      const t = ctx.readTask(id);
      if (t) tasks.push({ id, author: t.author, text: t, rework: true, t });
    }
    // votes
    const votes = {};
    const missed = [];
    for (const b of rv.sheets) {
      const text = ctx.wt.read(`${cdir}/review-${b}.md`);
      const r = text ? F.parseReview(text, { item: ctx.id, bot: b, cycle }) : { ok: false, error: 'missing' };
      if (r.ok) votes[b] = r.votes;
      else missed.push(`${b} review (${r.error})`);
    }
    const day = isoDate(this.now());
    const results = [];
    for (const task of tasks) {
      const reviewers = BOTS.filter((b) => b !== task.author);
      const vs = reviewers.map((r) => votes[r]?.[task.id] ?? null);
      const reworks = task.rework ? task.t.reworks : 0;
      const outcome = tallyOutcome(vs, reworks);
      const changes = [];
      reviewers.forEach((r, k) => {
        const v = vs[k];
        if (v?.vote === 'maybe') changes.push(`${cycle} ${r} (maybe): ${v.changes || v.reason || '(no change given)'}`);
        if (v?.vote === 'no') changes.push(`${cycle} ${r} (no): ${v.reason || '(no reason given)'}`);
      });
      const voteText = reviewers.map((r, k) => `${r} ${vs[k]?.vote ?? 'missing'}`).join(', ');
      let t;
      if (task.rework) {
        t = task.t;
        t.history.push(`${cycle}: rework ${t.reworks} reviewed; ${voteText} → ${outcome}`);
      } else {
        t = {
          topic: ctx.nnn, item: ctx.id, task: task.id, author: task.author, state: outcome, reworks: 0, first_cycle: cycle, issue: null, lou_approved: false,
          ...task.text, changes: [], history: [`${cycle}: proposed by ${task.author}; ${voteText} → ${outcome}`],
        };
      }
      t.state = outcome;
      t.changes.push(...changes);
      results.push({ t, outcome, voteText, rework: task.rework });
    }
    // Issues for every task except first-review rejections
    for (const r of results) {
      const t = r.t;
      let ti = this.tasksOf(ctx.nnn, ctx.id).find((x) => x.h.task === t.task)?.issue;
      if (!ti && !(r.outcome === 'rejected' && !r.rework)) {
        const h = { topic: ctx.nnn, item: ctx.id, task: t.task, branch: ctx.h.branch, cycle, author: t.author, reworks: t.reworks, lou_cycles: 0 };
        ti = await this.gh.createIssue({ title: `[${ctx.nnn}] ${ctx.id}-${t.task} ${String(t.title ?? '').slice(0, 200)}`, body: withHeader(F.taskBodyMd(t), h), labels: ['kind:task', `state:${r.outcome}`, `topic:${ctx.nnn}`] });
        this.issues.push(ti);
        if (issue.id) await this.gh.addSubIssue(issue.number, ti.id).catch((e) => this.note(`sub-issue link failed: ${e.message}`));
      } else if (ti) {
        await this.patchHeader(ti, { cycle, reworks: t.reworks });
        await this.setState(ti, r.outcome);
        if (r.outcome === 'rejected') await this.close(ti, 'not_planned');
      }
      if (ti) t.issue = ti.number;
      ctx.writeTask(t);
    }
    // result.md, item.md
    const count = (o) => results.filter((r) => r.outcome === o).length;
    const sum = `${results.length} tasks: ${count('approved')} approved, ${count('more-review')} more review, ${count('blocked')} blocked, ${count('rejected')} rejected`;
    for (const w of a.work.filter((w) => w.what === 'breakdown')) if (!rv.fresh || !Object.values(rv.fresh).includes(w.bot)) missed.push(`${w.bot} breakdown`);
    const result = `# Result — ${ctx.nnn}/${ctx.id} cycle ${cycle}\n\n${sum}.\n\n| Task | Author | Rework | Votes | Outcome | Title |\n| --- | --- | --- | --- | --- | --- |\n${results
      .map((r) => `| ${r.t.task} | ${r.t.author} | ${r.rework ? r.t.reworks : '—'} | ${r.voteText} | **${r.outcome}** | ${mdEscapeCell(r.t.title)} |`)
      .join('\n')}\n${missed.length ? `\nMissed: ${missed.join('; ')}\n` : ''}`;
    ctx.wt.write(`${cdir}/result.md`, result);
    ctx.item.cycles.push(`${cycle}: ${a.author ? `author ${a.author}; ` : ''}${sum}`);
    ctx.saveItem();
    ctx.save(`${ctx.nnn}/${ctx.id} ${cycle} tally`);
    await this.clearTodo(issue);
    await this.patchHeader(issue, { phase: 'closed' });
    await this.setState(issue, this.itemRestState(ctx.nnn, ctx.id));
    const firstRejects = results.filter((r) => r.outcome === 'rejected' && !r.rework).map((r) => `${r.t.task} ${r.t.title}`);
    await this.comment(issue, C(`${cycle} tally: ${sum}.${firstRejects.length ? `\n\nRejected on first review (no Issue):\n${firstRejects.map((x) => `- ${x}`).join('\n')}` : ''}\n\nDetails: \`${ctx.h.branch}:${cdir}/result.md\``));
    if (missed.length) await this.statusNote(`${cycle} ${ctx.nnn}/${ctx.id}: missed — ${missed.join('; ')}`);
    this.note(`#${issue.number}: ${cycle} tally — ${sum}`);
  }

  // ================================================================ pass 4: review sheets

  async passSheets() {
    const cur = cycleAt(this.now());
    if (cur.minute < WORK_END || cur.minute >= REVIEW_END) return;
    for (const { issue, h } of this.items({ open: true })) {
      if (h.phase !== 'work' || String(h.cycle) !== cur.id) continue;
      try {
        await this.buildSheets(issue, cur.minute >= REVIEW_START);
      } catch (e) {
        this.note(`#${issue.number}: review sheets failed: ${e.message}`);
      }
    }
  }

  async buildSheets(issue, force) {
    const ctx = this.itemCtx(issue);
    const cycle = String(ctx.h.cycle);
    const cdir = ctx.cdir(cycle);
    const a = F.parseAssignments(ctx.wt.read(`${cdir}/assignments.md`));
    if (!a) throw new Error('assignments.md missing');
    const present = (w) => ctx.wt.exists(`${cdir}/${w.what === 'breakdown' ? `breakdown-${w.bot}.md` : `rework-${w.task}-${w.bot}.md`}`);
    if (!force && !a.work.every(present)) return;

    const fresh = []; // { id, author, ...task }
    const reworks = []; // { id, author, ...task, changes, response }
    const problems = [];
    for (const w of a.work) {
      if (w.what === 'breakdown') {
        const text = ctx.wt.read(`${cdir}/breakdown-${w.bot}.md`);
        const b = text ? F.parseBreakdown(text, { item: ctx.id, bot: w.bot, cycle }) : { ok: false, error: 'missing' };
        if (!b.ok) {
          problems.push(`${w.bot} breakdown: ${b.error}`);
          continue;
        }
        for (const t of b.tasks) fresh.push({ id: `T${ctx.item.fm.next_task++}`, author: w.bot, ...t });
        if (b.truncated) problems.push(`${w.bot} breakdown had more than ${F.MAX_TASKS} tasks; only the first ${F.MAX_TASKS} count`);
      } else {
        const text = ctx.wt.read(`${cdir}/rework-${w.task}-${w.bot}.md`);
        const r = text ? F.parseRework(text, { item: ctx.id, task: w.task, bot: w.bot }) : { ok: false, error: 'missing' };
        if (!r.ok) {
          problems.push(`${w.bot} rework ${w.task}: ${r.error}`);
          await this.revertRework(ctx, w.task, r.error);
          continue;
        }
        const t = ctx.readTask(w.task);
        Object.assign(t, r.task);
        t.history.push(`${cycle}: reworked by ${w.bot}${r.response ? ` — ${r.response.replace(/\s+/g, ' ').slice(0, 300)}` : ''}`);
        ctx.writeTask(t);
        reworks.push({ id: w.task, author: t.author, ...r.task, changes: t.changes.slice(-4), response: r.response });
      }
    }
    const sheets = [];
    for (const reviewer of BOTS) {
      const f = fresh.filter((t) => t.author !== reviewer);
      const rw = reworks.filter((t) => t.author !== reviewer);
      if (!f.length && !rw.length) continue;
      ctx.wt.write(`${cdir}/review-sheet-${reviewer}.md`, F.renderSheet({ topic: ctx.nnn, item: ctx.id, cycle, reviewer, fresh: f, reworks: rw }));
      sheets.push(reviewer);
    }
    if (!sheets.length) {
      ctx.item.cycles.push(`${cycle}: nothing to review${problems.length ? ` (${problems.join('; ')})` : ''}`);
      ctx.saveItem();
      ctx.save(`${ctx.nnn}/${ctx.id} ${cycle}: nothing to review`);
      const isNew = a.work.some((w) => w.what === 'breakdown');
      await this.clearTodo(issue);
      await this.patchHeader(issue, { phase: 'closed', ...(isNew ? { author: null } : {}) });
      await this.setState(issue, isNew ? 'todo' : this.itemRestState(ctx.nnn, ctx.id));
      if (problems.length) await this.statusNote(`${cycle} ${ctx.nnn}/${ctx.id}: ${problems.join('; ')}`);
      this.note(`#${issue.number}: ${cycle} nothing to review`);
      return;
    }
    a.review = { sheets, fresh: Object.fromEntries(fresh.map((t) => [t.id, t.author])), reworks: reworks.map((t) => t.id) };
    ctx.wt.write(`${cdir}/assignments.md`, F.renderAssignments(a));
    ctx.saveItem();
    ctx.save(`${ctx.nnn}/${ctx.id} ${cycle} review sheets`);
    await this.clearTodo(issue);
    await this.addLabels(issue, sheets.map((b) => `todo:${b}`));
    await this.patchHeader(issue, { phase: 'review' });
    if (problems.length) await this.statusNote(`${cycle} ${ctx.nnn}/${ctx.id}: ${problems.join('; ')}`);
    this.note(`#${issue.number}: ${cycle} review sheets for ${sheets.join(', ')} (${fresh.length} new, ${reworks.length} reworked)`);
  }

  // ================================================================ pass 3: prep

  async passPrep() {
    const now = this.now();
    const cur = cycleAt(now);
    const target = cur.minute >= REVIEW_END ? nextCycleId(now) : cur.minute < 15 ? cur.id : null;
    if (!target) return;
    const topicState = this.topicStates();
    const all = this.items();
    // items already in a cycle (current or target) aren't touched
    const busy = (h) => ['work', 'review'].includes(h.phase);
    const plan = new Map(); // issue number → { issue, h, work: [], author }

    // reworks: every more-review task with reworks < 2, back to its author
    for (const { issue, h } of all.filter((x) => x.issue.state === 'open' && !busy(x.h))) {
      if (topicState.get(String(h.topic)) !== 'active') continue;
      if (!['waiting', 'done', 'todo'].includes(this.stateOf(issue))) continue;
      const due = this.tasksOf(h.topic, h.item).filter((x) => x.issue.state === 'open' && this.stateOf(x.issue) === 'more-review' && (Number(x.h.reworks) || 0) < 2);
      if (!due.length) continue;
      plan.set(issue.number, { issue, h, work: due.map((x) => ({ bot: x.h.author, what: 'rework', task: x.h.task, ti: x.issue })), author: due[0].h.author });
    }
    // new items: up to one per bot, rotating who goes first
    if (this.cfg.start_cycles && !all.some((x) => String(x.h.new_in ?? '') === target)) {
      const ready = readyItems(
        all.filter((x) => !plan.has(x.issue.number)).map((x) => ({
          topic: String(x.h.topic), id: String(x.h.item), state: this.stateOf(x.issue),
          priority: Number(x.h.priority ?? 99), depends_on: (x.h.depends_on ?? []).map(String), topicActive: topicState.get(String(x.h.topic)) === 'active', x,
        })),
      );
      const order = botOrder(cycleOrdinal(target));
      ready.slice(0, BOTS.length).forEach((r, k) => {
        plan.set(r.x.issue.number, { issue: r.x.issue, h: r.x.h, work: [{ bot: order[k], what: 'breakdown' }], author: order[k], isNew: true });
      });
    }
    for (const p of plan.values()) {
      try {
        await this.prepItem(p, target);
      } catch (e) {
        this.note(`#${p.issue.number}: prep failed: ${e.message}`);
      }
    }
  }

  async prepItem(p, target) {
    const ctx = this.itemCtx(p.issue);
    for (const w of p.work.filter((w) => w.what === 'rework')) {
      const t = ctx.readTask(w.task);
      if (!t) continue;
      t.reworks += 1;
      t.state = 'rework';
      t.history.push(`${target}: rework ${t.reworks} assigned to ${t.author}`);
      ctx.writeTask(t);
    }
    const work = p.work.map(({ bot, what, task }) => (task ? { bot, what, task } : { bot, what }));
    ctx.wt.write(`${ctx.cdir(target)}/assignments.md`, F.renderAssignments({ topic: ctx.nnn, item: ctx.id, cycle: target, author: p.author, work }));
    ctx.save(`${ctx.nnn}/${ctx.id} ${target} assignments (${work.map((w) => `${w.bot} ${w.what}${w.task ? ` ${w.task}` : ''}`).join(', ')})`);
    for (const w of p.work.filter((w) => w.ti)) {
      await this.patchHeader(w.ti, { reworks: (Number(parseHeader(w.ti.body)?.reworks) || 0) + 1, cycle: target });
      await this.setState(w.ti, 'rework');
    }
    await this.patchHeader(p.issue, { cycle: target, phase: 'work', author: p.author, ...(p.isNew ? { new_in: target } : {}) });
    await this.setState(p.issue, 'working');
    await this.addLabels(p.issue, [...new Set(work.map((w) => `todo:${w.bot}`))]);
    this.note(`#${p.issue.number}: ${target} ${work.map((w) => `${w.bot} ${w.what}${w.task ? ` ${w.task}` : ''}`).join(', ')}`);
  }

  // ================================================================ pass 6: close-out

  async passCloseOut() {
    const main = this.git.open('main');
    for (const d of main.list('topics/active')) {
      const nnn = /^(\d{3})-/.exec(d)?.[1];
      if (!nnn) continue;
      const items = this.items().filter((x) => String(x.h.topic) === nnn);
      if (!items.length) continue;
      const itemsDone = items.every((x) => ['done', 'rejected', 'parked'].includes(this.stateOf(x.issue)) && !['work', 'review'].includes(x.h.phase));
      const openTasks = this.ofKind('task').some((x) => String(x.h.topic) === nnn && x.issue.state === 'open' && OPEN_TASK_STATES.includes(this.stateOf(x.issue)));
      if (!itemsDone || openTasks) continue;
      main.mv(`topics/active/${d}`, `topics/done/${d}`);
      main.commitPush(C(`topic ${nnn} done`));
      const ti = this.topicIssue(nnn);
      if (ti) {
        await this.removeLabels(ti, ti.labels.filter((l) => l.startsWith('topic-state:')));
        await this.addLabels(ti, ['topic-state:done']);
        await this.close(ti, 'completed');
      }
      for (const x of items) if (x.issue.state === 'open') await this.close(x.issue, 'completed');
      this.note(`topic ${nnn} done`);
    }
  }

  // ================================================================ pass 7: sync

  async passSync() {
    // task.md state follows the labels (e.g. after the auditor's decisions); item.md lists every task
    const byItem = new Map();
    for (const x of this.ofKind('task')) {
      const k = `${x.h.topic}/${x.h.item}`;
      if (!byItem.has(k)) byItem.set(k, []);
      byItem.get(k).push(x);
    }
    for (const { issue, h } of this.items()) {
      const tasks = byItem.get(`${h.topic}/${h.item}`) ?? [];
      try {
        const ctx = this.itemCtx(issue);
        const day = isoDate(this.now());
        for (const x of tasks) {
          const t = ctx.readTask(x.h.task);
          if (!t) continue;
          const st = this.stateOf(x.issue);
          if (st && t.state !== st) {
            t.state = st;
            t.history.push(`${day}: state → ${st}`);
            ctx.writeTask(t);
          }
          const human = F.taskBodyMd(t);
          if (x.issue.state === 'open') await this.setHuman(x.issue, human);
        }
        const listed = [];
        for (const f of ctx.wt.list(`${ctx.dir}/tasks`).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))) {
          const t = ctx.readTask(f);
          if (t) listed.push(`${t.task} (${t.state}, ${t.author}): ${t.title}`);
        }
        ctx.item.tasks = listed;
        ctx.saveItem();
        ctx.save(`${ctx.nnn}/${ctx.id} sync`);
        const human = `**Goal:** ${ctx.item.goal}\n\n**Starting points**\n\n${ctx.item.points.map((p) => `- ${p}`).join('\n')}\n\n**Tasks**\n\n${listed.map((l) => `- ${l}`).join('\n') || '- (none yet)'}\n\nFiles: \`${ctx.h.branch}:${ctx.dir}\``;
        if (issue.state === 'open') await this.setHuman(issue, human);
      } catch (e) {
        this.note(`#${issue.number}: sync failed: ${e.message}`);
      }
    }
    const main = this.git.open('main');
    const master = this.renderMaster(main);
    if (main.read('MASTER.md') !== master) {
      main.write('MASTER.md', master);
      main.commitPush(C('MASTER.md sync'));
    }
  }

  renderMaster(main) {
    const topics = [];
    for (const st of TOPIC_STATES) for (const d of main.list(`topics/${st}`)) if (/^\d{3}-/.test(d)) topics.push({ nnn: d.slice(0, 3), dir: `topics/${st}/${d}`, state: st });
    topics.sort((a, b) => a.nnn.localeCompare(b.nnn));
    const forLou = (i) => i.state === 'open' && titlePrefix(i.title)?.kind === 'need-lou';
    let s = `# Master list\n\nThe orchestrator updates this after every cycle. Lou: start here. Anything titled \`[need-lou #n]\` is waiting for you.\n\n## Topics\n\n| # | Topic | State | Folder | Topic Issue | Waiting for Lou |\n| --- | --- | --- | --- | --- | --- |\n`;
    for (const t of topics) {
      const readme = F.parseTopicReadme(main.read(`${t.dir}/README.md`) ?? '');
      const ti = this.topicIssue(t.nnn);
      const waiting = this.issues.filter((i) => forLou(i) && String(parseHeader(i.body)?.topic) === t.nnn).length;
      s += `| ${t.nnn} | ${mdEscapeCell(readme.title)} | ${t.state} | [${t.dir}](${t.dir}/README.md) | ${ti ? `#${ti.number}` : '—'} | ${waiting} |\n`;
    }
    for (const t of topics) {
      const items = this.items().filter((x) => String(x.h.topic) === t.nnn).sort((a, b) => String(a.h.item).localeCompare(String(b.h.item)));
      if (!items.length) continue;
      s += `\n## ${t.nnn} — items\n\n| Id | Title | Priority | Depends on | Issue | State | Last cycle | Approved | More review | Blocked | Exported |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n`;
      for (const x of items) {
        const ts = this.tasksOf(t.nnn, x.h.item).map((y) => this.stateOf(y.issue));
        const n = (st) => ts.filter((v) => v === st).length;
        s += `| ${x.h.item} | ${mdEscapeCell(stripPrefix(x.issue.title).replace(/^\[\d{3}\]\s*\S+\s*/, ''))} | ${x.h.priority ?? ''} | ${(x.h.depends_on ?? []).join(', ') || '—'} | #${x.issue.number} | ${this.stateOf(x.issue)} | ${x.h.cycle ?? '—'} | ${n('approved')} | ${n('more-review') + n('rework')} | ${n('blocked')} | ${n('exported')} |\n`;
      }
    }
    return s;
  }
}
