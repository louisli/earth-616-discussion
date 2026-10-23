// In-memory GitHub with the same methods as src/github.js. One shared store; one client per actor (user).

export class Store {
  constructor({ onMerge } = {}) {
    this.issues = [];
    this.comments = [];
    this.reactions = [];
    this.labels = new Set();
    this.events = [];
    this.pulls = [];
    this.subIssues = [];
    this.next = 1;
    this.nextId = 1000;
    this.clock = new Date('2026-10-23T12:00:00Z');
    this.onMerge = onMerge;
  }
  ts() {
    return this.clock.toISOString();
  }
  advance(minutes) {
    this.clock = new Date(this.clock.getTime() + minutes * 60000);
  }
}

export class MockGitHub {
  constructor(store, user) {
    this.s = store;
    this.user = user;
    this.calls = 0;
  }
  view(i) {
    return { ...i, labels: [...i.labels] };
  }
  find(n) {
    const i = this.s.issues.find((x) => x.number === n);
    if (!i) throw new Error(`no issue #${n}`);
    return i;
  }
  labelEvent(n, event, label) {
    this.s.events.push({ n, event, label, created_at: this.s.ts() });
  }

  async listIssues({ state = 'all', labels } = {}) {
    this.calls++;
    return this.s.issues
      .filter((i) => state === 'all' || i.state === state)
      .filter((i) => !labels || labels.split(',').every((l) => i.labels.includes(l)))
      .map((i) => this.view(i));
  }
  async createIssue({ title, body, labels = [] }, extra = {}) {
    this.calls++;
    for (const l of labels) if (!this.s.labels.has(l)) throw new Error(`label ${l} does not exist`);
    const i = { number: this.s.next++, id: this.s.nextId++, title, body, labels: [...labels], state: 'open', state_reason: null, isPull: false, created_at: this.s.ts(), user: this.user, ...extra };
    this.s.issues.push(i);
    for (const l of labels) this.labelEvent(i.number, 'labeled', l);
    return this.view(i);
  }
  async updateIssue(n, fields) {
    this.calls++;
    Object.assign(this.find(n), fields);
  }
  async addLabels(n, labels) {
    this.calls++;
    const i = this.find(n);
    for (const l of labels) {
      if (!this.s.labels.has(l)) throw new Error(`label ${l} does not exist`);
      if (!i.labels.includes(l)) {
        i.labels.push(l);
        this.labelEvent(n, 'labeled', l);
      }
    }
  }
  async removeLabel(n, label) {
    this.calls++;
    const i = this.find(n);
    if (i.labels.includes(label)) {
      i.labels = i.labels.filter((x) => x !== label);
      this.labelEvent(n, 'unlabeled', label);
    }
  }
  async addSubIssue(parent, childId) {
    this.calls++;
    this.s.subIssues.push({ parent, childId });
  }
  async labelEvents(n) {
    this.calls++;
    return this.s.events.filter((e) => e.n === n).map(({ event, label, created_at }) => ({ event, label, created_at }));
  }
  async listComments(n) {
    this.calls++;
    return this.s.comments.filter((c) => c.n === n).map((c) => ({ ...c }));
  }
  async createComment(n, body) {
    this.calls++;
    const c = { id: this.s.nextId++, n, user: this.user, body, created_at: this.s.ts(), updated_at: this.s.ts() };
    this.s.comments.push(c);
    return c;
  }
  async updateComment(id, body) {
    const c = this.s.comments.find((x) => x.id === id);
    c.body = body;
    c.updated_at = this.s.ts();
  }
  async deleteComment(id) {
    this.calls++;
    this.s.comments = this.s.comments.filter((c) => c.id !== id);
  }
  async listReactions(id) {
    this.calls++;
    return this.s.reactions.filter((r) => r.commentId === id).map((r) => ({ user: r.user, content: r.content }));
  }
  async addReaction(id, content) {
    this.calls++;
    this.s.reactions.push({ commentId: id, user: this.user, content });
  }
  async listLabels() {
    this.calls++;
    return [...this.s.labels];
  }
  async createLabel(name) {
    this.calls++;
    this.s.labels.add(name);
  }
  async listPulls({ state = 'all' } = {}) {
    this.calls++;
    return this.s.pulls
      .filter((p) => state === 'all' || p.state === state)
      .map((p) => {
        const i = this.find(p.number);
        return { number: p.number, title: i.title, body: i.body, state: i.state, merged: p.merged, head: p.head };
      });
  }
  async createPull({ title, head, body }) {
    const i = await this.createIssue({ title, body, labels: [] }, { isPull: true });
    this.s.pulls.push({ number: i.number, head, merged: false, state: 'open' });
    return { number: i.number };
  }
  async updatePull(n, fields) {
    this.calls++;
    Object.assign(this.find(n), fields);
    Object.assign(this.s.pulls.find((p) => p.number === n), fields);
  }
  async mergePull(n) {
    this.calls++;
    const p = this.s.pulls.find((x) => x.number === n);
    await this.s.onMerge(p);
    p.merged = true;
    p.state = 'closed';
    this.find(n).state = 'closed';
  }
}
