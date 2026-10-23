// Minimal GitHub REST client: exactly the calls the orchestrator needs, normalized shapes.
// The mock in test/mock-github.js implements the same methods.

const API = process.env.GITHUB_API_URL || 'https://api.github.com';

export class GitHub {
  constructor({ token, repo, dryRun = false, log = console.log }) {
    if (!token) throw new Error('GITHUB_TOKEN is not set');
    this.token = token;
    this.repo = repo;
    this.dryRun = dryRun;
    this.log = log;
    this.calls = 0;
  }

  async req(method, path, body, { allow404 = false } = {}) {
    const write = method !== 'GET';
    if (write && this.dryRun) {
      this.log(`[dry-run] ${method} ${path} ${body ? JSON.stringify(body).slice(0, 200) : ''}`);
      return {};
    }
    for (let attempt = 0; ; attempt++) {
      this.calls++;
      const res = await fetch(path.startsWith('http') ? path : `${API}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (allow404 && res.status === 404) return null;
      if ((res.status >= 500 || res.status === 429) && attempt < 3) {
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
        continue;
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`GitHub ${method} ${path} → ${res.status}: ${text.slice(0, 300)}`);
      }
      if (res.status === 204) return {};
      const json = await res.json();
      json.__link = res.headers.get('link');
      return json;
    }
  }

  async paged(path) {
    const out = [];
    let url = `${path}${path.includes('?') ? '&' : '?'}per_page=100`;
    while (url) {
      const page = await this.req('GET', url);
      const link = page.__link;
      delete page.__link;
      out.push(...(Array.isArray(page) ? page : Object.values(page).filter((x) => typeof x === 'object')));
      const next = link && /<([^>]+)>;\s*rel="next"/.exec(link);
      url = next ? next[1] : null;
    }
    return out;
  }

  r(path) {
    return `/repos/${this.repo}${path}`;
  }

  static issue(i) {
    return {
      number: i.number,
      id: i.id,
      title: i.title,
      body: i.body ?? '',
      state: i.state,
      state_reason: i.state_reason ?? null,
      labels: (i.labels ?? []).map((l) => (typeof l === 'string' ? l : l.name)),
      isPull: Boolean(i.pull_request),
      created_at: i.created_at,
    };
  }

  // ---- issues ----
  async listIssues({ state = 'all', labels } = {}) {
    const q = `state=${state}${labels ? `&labels=${encodeURIComponent(labels)}` : ''}`;
    return (await this.paged(this.r(`/issues?${q}`))).map(GitHub.issue);
  }
  async createIssue({ title, body, labels }) {
    const i = await this.req('POST', this.r('/issues'), { title, body, labels });
    return this.dryRun ? { number: 0, id: 0, title, body, labels, state: 'open' } : GitHub.issue(i);
  }
  async updateIssue(n, fields) {
    await this.req('PATCH', this.r(`/issues/${n}`), fields);
  }
  async addLabels(n, labels) {
    if (labels.length) await this.req('POST', this.r(`/issues/${n}/labels`), { labels });
  }
  async removeLabel(n, label) {
    await this.req('DELETE', this.r(`/issues/${n}/labels/${encodeURIComponent(label)}`), undefined, { allow404: true });
  }
  async addSubIssue(parentNumber, childId) {
    await this.req('POST', this.r(`/issues/${parentNumber}/sub_issues`), { sub_issue_id: childId });
  }
  async labelEvents(n) {
    const ev = await this.paged(this.r(`/issues/${n}/events`));
    return ev
      .filter((e) => e.event === 'labeled' || e.event === 'unlabeled')
      .map((e) => ({ event: e.event, label: e.label?.name, created_at: e.created_at }));
  }

  // ---- comments & reactions ----
  async listComments(n) {
    return (await this.paged(this.r(`/issues/${n}/comments`))).map((c) => ({
      id: c.id,
      user: c.user?.login,
      body: c.body ?? '',
      created_at: c.created_at,
      updated_at: c.updated_at,
    }));
  }
  async createComment(n, body) {
    await this.req('POST', this.r(`/issues/${n}/comments`), { body });
  }
  async deleteComment(id) {
    await this.req('DELETE', this.r(`/issues/comments/${id}`), undefined, { allow404: true });
  }
  async listReactions(commentId) {
    return (await this.paged(this.r(`/issues/comments/${commentId}/reactions`))).map((r) => ({ user: r.user?.login, content: r.content }));
  }
  async addReaction(commentId, content) {
    await this.req('POST', this.r(`/issues/comments/${commentId}/reactions`), { content });
  }

  // ---- labels ----
  async listLabels() {
    return (await this.paged(this.r('/labels'))).map((l) => l.name);
  }
  async createLabel(name, color, description) {
    await this.req('POST', this.r('/labels'), { name, color, description: description.slice(0, 100) });
  }

  // ---- pulls ----
  async listPulls({ state = 'all' } = {}) {
    return (await this.paged(this.r(`/pulls?state=${state}`))).map((p) => ({
      number: p.number,
      title: p.title,
      body: p.body ?? '',
      state: p.state,
      merged: Boolean(p.merged_at),
      head: p.head?.ref,
    }));
  }
  async createPull({ title, head, body }) {
    const p = await this.req('POST', this.r('/pulls'), { title, head, base: 'main', body });
    return { number: p.number };
  }
  async updatePull(n, fields) {
    await this.req('PATCH', this.r(`/pulls/${n}`), fields);
  }
  async mergePull(n) {
    await this.req('PUT', this.r(`/pulls/${n}/merge`), { merge_method: 'merge' });
  }
}
