// Shared helpers for the root npm scripts. Plain Node (>= 20), no dependencies.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const color = (code) => (text) => (process.stdout.isTTY ? `\x1b[${code}m${text}\x1b[0m` : text);
export const c = { bold: color(1), dim: color(2), red: color(31), green: color(32), yellow: color(33), cyan: color(36) };

export const step = (msg) => console.log(`\n${c.cyan('▸')} ${c.bold(msg)}`);
export const ok = (msg) => console.log(`${c.green('✓')} ${msg}`);
export const fail = (msg) => {
  console.error(`${c.red('✗')} ${msg}`);
  process.exit(1);
};

/** Reads KEY=VALUE pairs from the root .env (if any); process env wins. */
export function env(key, fallback) {
  if (process.env[key]) return process.env[key];
  const file = path.join(ROOT, '.env');
  if (existsSync(file)) {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, '');
    }
  }
  return fallback;
}

export const urls = () => ({
  web: `http://localhost:${env('WEB_PORT', '5173')}`,
  api: `http://localhost:${env('API_PORT', '4000')}/api`,
});

const IS_WINDOWS = process.platform === 'win32';

/**
 * On Windows `npm` is a .cmd file and must go through the shell. Nothing else does: docker.exe is a real
 * executable, and a shell would split arguments that contain spaces or semicolons (e.g. SQL passed to psql).
 */
export const needsShell = (cmd) => IS_WINDOWS && cmd === 'npm';

/** Runs a command with inherited output; resolves on exit code 0, rejects otherwise. */
export function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: needsShell(cmd), ...opts });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`))));
  });
}

export const compose = (...args) => run('docker', ['compose', ...args]);

/** Fails early with a readable message when Docker is missing or not running. */
export function requireDocker() {
  const res = spawnSync('docker', ['info'], { stdio: 'ignore' });
  if (res.error) fail('Docker is not installed or not on PATH. Install Docker Desktop / Docker Engine first.');
  if (res.status !== 0) fail('Docker is installed but not running. Start Docker and try again.');
}

export function isServiceRunning(service) {
  const res = spawnSync('docker', ['compose', 'ps', '--status', 'running', '--services'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  return res.status === 0 && res.stdout.split(/\r?\n/).map((s) => s.trim()).includes(service);
}

export function requireService(service) {
  if (!isServiceRunning(service)) fail(`The "${service}" container is not running. Start the stack first: ${c.bold('npm start')}`);
}

/** Stops a child process and everything it started (npm → node/vite). */
export function killTree(child) {
  if (child.exitCode !== null) return;
  if (IS_WINDOWS) {
    // child.kill() on Windows only ends the cmd.exe wrapper and leaves node/vite running
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    child.kill('SIGINT');
  }
}

/** Polls a URL until it answers with a 2xx status. */
export async function waitFor(url, { timeoutMs = 120_000, label = url } = {}) {
  const started = Date.now();
  process.stdout.write(`${c.dim(`  waiting for ${label}`)}`);
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        process.stdout.write('\n');
        return;
      }
    } catch {
      // not up yet
    }
    process.stdout.write(c.dim('.'));
    await new Promise((r) => setTimeout(r, 1000));
  }
  process.stdout.write('\n');
  throw new Error(`${label} did not become ready within ${timeoutMs / 1000}s`);
}

export function printAccess() {
  const { web, api } = urls();
  console.log(`
${c.green(c.bold('ClinicFlow is running'))}

  Web  ${c.cyan(web)}
  API  ${c.cyan(api)}

  ${c.bold('Demo accounts')}
  admin@clinicflow.test   Admin123!   ${c.dim('(admin: can delete patients)')}
  staff1@clinicflow.test  Staff123!   ${c.dim('(staff)')}

  ${c.dim('Logs: npm run logs   ·   Stop: npm stop   ·   Reset data: npm run db:reset')}
`);
}
