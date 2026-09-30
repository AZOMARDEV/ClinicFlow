// Builds and starts db + api + web in the background, waits until they answer, then prints the URLs.
// Usage: node scripts/up.mjs [--fresh]   (--fresh deletes the database volume first)
import { compose, fail, ok, printAccess, requireDocker, step, urls, waitFor } from './lib.mjs';

const fresh = process.argv.includes('--fresh');

try {
  requireDocker();

  if (fresh) {
    step('Removing containers and the database volume (fresh start)');
    await compose('down', '-v', '--remove-orphans');
  }

  step('Building images and starting containers');
  await compose('up', '--build', '-d');

  step('Waiting for the services (the API runs migrations and the seeder on start)');
  const { api, web } = urls();
  await waitFor(`${api}/health`, { label: 'API' });
  ok('API is up');
  await waitFor(web, { label: 'web' });
  ok('Web is up');

  printAccess();
} catch (err) {
  console.error(`\n${err.message}`);
  fail('Startup failed. Check the logs with: npm run logs');
}
