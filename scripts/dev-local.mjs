// Runs the API and the web app on your machine (hot reload), with only PostgreSQL in Docker.
// Requires `npm run setup` first (.env with DATABASE_URL on localhost, dependencies installed).
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT, c, compose, fail, killTree, needsShell, ok, requireDocker, run, step } from './lib.mjs';

if (!existsSync(path.join(ROOT, '.env'))) fail('No .env found. Run: npm run setup');
for (const dir of ['backend', 'frontend']) {
  if (!existsSync(path.join(ROOT, dir, 'node_modules'))) fail(`${dir} dependencies are missing. Run: npm run setup`);
}

try {
  requireDocker();
  step('Starting PostgreSQL (Docker) and waiting until it is healthy');
  // Stop the containerised api/web if they are running, otherwise ports 4000/5173 are taken
  await compose('stop', 'api', 'web');
  await compose('up', '-d', '--wait', 'db');

  const backend = path.join(ROOT, 'backend');
  step('Migrating and seeding');
  await run('npm', ['run', 'migrate'], { cwd: backend });
  await run('npm', ['run', 'seed'], { cwd: backend });
  ok('Database ready');
} catch (err) {
  fail(err.message);
}

step('Starting API and web (Ctrl+C stops both)');

const children = [
  { name: 'api', color: c.cyan, dir: 'backend' },
  { name: 'web', color: c.yellow, dir: 'frontend' },
].map(({ name, color, dir }) => {
  const child = spawn('npm', ['run', 'dev'], { cwd: path.join(ROOT, dir), shell: needsShell('npm') });
  const prefix = color(`[${name}]`);
  const pipe = (stream, out) =>
    stream.on('data', (chunk) => {
      for (const line of chunk.toString().split(/\r?\n/)) if (line.trim()) out.write(`${prefix} ${line}\n`);
    });
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on('exit', (code) => {
    console.log(`${prefix} exited with code ${code}`);
    shutdown();
  });
  return child;
});

let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  for (const child of children) killTree(child);
  setTimeout(() => process.exit(0), 500);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
