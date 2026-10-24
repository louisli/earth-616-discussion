// Entry point: node src/main.js  (env: GITHUB_TOKEN, GITHUB_REPOSITORY, DRY_RUN, REPO_DIR)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GitHub } from './github.js';
import { Git } from './git.js';
import { Orchestrator } from './orchestrator.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(fs.readFileSync(path.join(here, '..', 'config.json'), 'utf8'));
const dryRun = /^(1|true|yes)$/i.test(process.env.DRY_RUN ?? '');
const repo = process.env.GITHUB_REPOSITORY || 'louisli/earth-616-discussion';
const repoDir = process.env.REPO_DIR || path.resolve(here, '..', '..');

const gh = new GitHub({ token: process.env.GITHUB_TOKEN || process.env.GH_TOKEN, repo, dryRun });
const git = new Git({ repoDir, dryRun });
const orch = new Orchestrator({ gh, git, config, secret: '' });

try {
  if (process.env.GITHUB_ACTIONS) console.log(`::notice title=orchestrator::start_cycles is ${config.start_cycles}; dry run: ${dryRun}`);
  if (!config.start_cycles) console.log('start_cycles is false in orchestrator/config.json — no new items will be assigned.');
  const summary = await orch.run();
  const text = `## Orchestrator run${dryRun ? ' (dry run)' : ''}\n\n${summary.length ? summary.map((s) => `- ${s}`).join('\n') : '- nothing to do'}\n\nAPI calls: ${gh.calls}\n`;
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
} finally {
  git.cleanup();
}
