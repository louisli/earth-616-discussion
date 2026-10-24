// Git access through detached worktrees: one per branch, always synced to origin before use.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export class Git {
  constructor({ repoDir, dryRun = false, log = console.log, author = 'orchestrator-bot' }) {
    this.repoDir = repoDir;
    this.dryRun = dryRun;
    this.log = log;
    this.author = author;
    this.base = fs.mkdtempSync(path.join(os.tmpdir(), 'e616-wt-'));
    this.trees = new Map();
  }

  run(args, cwd = this.repoDir, { allowFail = false } = {}) {
    try {
      return execFileSync('git', args, {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          GIT_AUTHOR_NAME: this.author,
          GIT_AUTHOR_EMAIL: `${this.author}@users.noreply.github.com`,
          GIT_COMMITTER_NAME: this.author,
          GIT_COMMITTER_EMAIL: `${this.author}@users.noreply.github.com`,
        },
      }).trim();
    } catch (e) {
      if (allowFail) return null;
      throw new Error(`git ${args.join(' ')} failed: ${(e.stderr || e.message).toString().slice(0, 400)}`);
    }
  }

  fetch() {
    this.run(['fetch', '--prune', 'origin', '+refs/heads/*:refs/remotes/origin/*']);
  }

  branchExists(branch) {
    return this.run(['rev-parse', '--verify', '--quiet', `refs/remotes/origin/${branch}`], this.repoDir, { allowFail: true }) !== null;
  }

  listBranches(prefix) {
    const out = this.run(['for-each-ref', '--format=%(refname:strip=3)', `refs/remotes/origin/${prefix}`]);
    return out ? out.split('\n').filter(Boolean) : [];
  }

  /** Open (or refresh) a worktree on origin/<branch>. Creates the branch from `from` if it doesn't exist. */
  open(branch, { from = null, fresh = false } = {}) {
    this.run(['fetch', 'origin', `+refs/heads/${branch}:refs/remotes/origin/${branch}`], this.repoDir, { allowFail: true });
    let created = false;
    let startRef = `origin/${branch}`;
    if (fresh || !this.branchExists(branch)) {
      if (!from) throw new Error(`branch ${branch} does not exist`);
      this.run(['fetch', 'origin', `+refs/heads/${from}:refs/remotes/origin/${from}`]);
      startRef = `origin/${from}`;
      created = true;
    }
    let dir = this.trees.get(branch);
    if (!dir) {
      dir = path.join(this.base, branch.replace(/[^A-Za-z0-9._-]/g, '_'));
      this.run(['worktree', 'add', '--detach', dir, startRef]);
      this.trees.set(branch, dir);
    } else {
      this.run(['reset', '--hard', startRef], dir);
      this.run(['clean', '-fd'], dir);
    }
    const wt = new Worktree(this, branch, dir, created);
    wt.force = fresh;
    return wt;
  }

  cleanup() {
    for (const dir of this.trees.values()) this.run(['worktree', 'remove', '--force', dir], this.repoDir, { allowFail: true });
    fs.rmSync(this.base, { recursive: true, force: true });
  }
}

export class Worktree {
  constructor(git, branch, dir, created) {
    this.git = git;
    this.branch = branch;
    this.dir = dir;
    this.created = created;
  }
  p(rel) {
    return path.join(this.dir, rel);
  }
  exists(rel) {
    return fs.existsSync(this.p(rel));
  }
  read(rel) {
    return fs.existsSync(this.p(rel)) ? fs.readFileSync(this.p(rel), 'utf8') : null;
  }
  write(rel, content) {
    fs.mkdirSync(path.dirname(this.p(rel)), { recursive: true });
    fs.writeFileSync(this.p(rel), content);
  }
  list(rel) {
    return fs.existsSync(this.p(rel)) ? fs.readdirSync(this.p(rel)) : [];
  }
  isDir(rel) {
    return fs.existsSync(this.p(rel)) && fs.statSync(this.p(rel)).isDirectory();
  }
  run(args, opts) {
    return this.git.run(args, this.dir, opts);
  }
  head() {
    return this.run(['rev-parse', 'HEAD']);
  }
  mv(from, to) {
    fs.mkdirSync(path.dirname(this.p(to)), { recursive: true });
    this.run(['mv', from, to]);
  }
  /** Copy a path from another ref into this tree (at a possibly different path). */
  copyFromRef(ref, fromRel, toRel = fromRel) {
    const files = this.run(['ls-tree', '-r', '--name-only', ref, '--', fromRel]);
    for (const f of files ? files.split('\n') : []) {
      const content = this.run(['show', `${ref}:${f}`]);
      this.write(toRel + f.slice(fromRel.length), content + '\n');
    }
  }
  deleteRemote() {
    if (this.git.dryRun) return this.git.log(`[dry-run] delete branch ${this.branch}`);
    this.run(['push', 'origin', '--delete', this.branch], { allowFail: true });
  }
  /** Merge origin/main into this branch. Returns false on conflict (merge aborted). */
  mergeMain() {
    this.git.run(['fetch', 'origin', '+refs/heads/main:refs/remotes/origin/main'], this.git.repoDir);
    const out = this.run(['merge', '--no-edit', '-m', `merge main into ${this.branch}`, 'origin/main'], { allowFail: true });
    if (out === null) {
      this.run(['merge', '--abort'], { allowFail: true });
      return false;
    }
    return true;
  }
  /** Commit everything and push, rebasing on conflict. Returns the new HEAD sha, or null if nothing changed. */
  commitPush(message, { allowEmpty = false } = {}) {
    this.run(['add', '-A']);
    const dirty = this.run(['status', '--porcelain']);
    if (!dirty && !allowEmpty && !this.created) return null;
    if (dirty || allowEmpty) this.run(['commit', '-q', '-m', message, ...(allowEmpty ? ['--allow-empty'] : [])]);
    if (this.git.dryRun) {
      this.git.log(`[dry-run] push ${this.branch}: ${message}`);
      return this.head();
    }
    return this.push();
  }
  /** Is origin/main already contained in this branch? */
  hasMain() {
    this.git.run(['fetch', 'origin', '+refs/heads/main:refs/remotes/origin/main'], this.git.repoDir);
    return this.run(['merge-base', '--is-ancestor', 'origin/main', 'HEAD'], { allowFail: true }) !== null;
  }
  /** Push HEAD, rebasing on conflict. */
  push() {
    if (this.git.dryRun) return this.head();
    for (let attempt = 0; attempt < 4; attempt++) {
      const ok = this.run(['push', ...(this.force ? ['--force'] : []), 'origin', `HEAD:refs/heads/${this.branch}`], { allowFail: true });
      if (ok !== null) {
        this.created = false;
        return this.head();
      }
      this.run(['fetch', 'origin', `+refs/heads/${this.branch}:refs/remotes/origin/${this.branch}`]);
      const rebased = this.run(['rebase', `origin/${this.branch}`], { allowFail: true });
      if (rebased === null) {
        this.run(['rebase', '--abort'], { allowFail: true });
        throw new Error(`push to ${this.branch} conflicted and could not be rebased`);
      }
    }
    throw new Error(`push to ${this.branch} failed after retries`);
  }
}
