import { createApp } from './app.js';
import { config, validateProductionConfig } from './config.js';
import { closeDb } from './db.js';

validateProductionConfig();
const app = createApp();
const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`[MAMA TIME] React + Node app listening on ${config.appBaseUrl}`);
  console.log(`[MAMA TIME] Backoffice: ${config.appBaseUrl}/admin`);
});

function shutdown(signal) {
  console.log(`[MAMA TIME] ${signal} received, shutting down...`);
  server.close(() => { closeDb(); process.exit(0); });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
