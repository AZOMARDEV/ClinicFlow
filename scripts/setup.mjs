// One-time local setup: creates .env from .env.example and installs backend + frontend dependencies.
// Not needed for Docker (images install their own dependencies), but useful for the editor and for npm run dev:local.
import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT, fail, ok, run, step } from './lib.mjs';

try {
  step('Environment file');
  const target = path.join(ROOT, '.env');
  if (existsSync(target)) {
    ok('.env already exists, left unchanged');
  } else {
    copyFileSync(path.join(ROOT, '.env.example'), target);
    ok('Created .env from .env.example');
  }

  for (const dir of ['backend', 'frontend']) {
    step(`Installing ${dir} dependencies`);
    await run('npm', ['ci', '--no-audit', '--no-fund'], { cwd: path.join(ROOT, dir) });
  }

  ok('Setup complete. Next: npm run build, then npm run db:migrate and npm run db:seed, then npm start');
} catch (err) {
  fail(err.message);
}
