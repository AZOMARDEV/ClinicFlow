import { createApp } from './app';
import { env } from './config/env';
import { pool } from './db/pool';

const server = createApp().listen(env.PORT, () => {
  console.log(`ClinicFlow API listening on port ${env.PORT}`);
});

function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
