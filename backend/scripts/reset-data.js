import fs from 'node:fs';
import { config } from '../src/config.js';
import { closeDb } from '../src/db.js';

const confirmed = process.argv.includes('--confirm=RESET-MAMA-TIME');
if (!confirmed) {
  console.error('Destructive command blocked. Re-run with --confirm=RESET-MAMA-TIME.');
  process.exit(1);
}
if (config.isProduction && process.env.ALLOW_DESTRUCTIVE_RESET !== 'true') {
  console.error('Production reset blocked. Set ALLOW_DESTRUCTIVE_RESET=true only for an explicitly approved maintenance window.');
  process.exit(1);
}
closeDb();
if (fs.existsSync(config.databasePath)) fs.rmSync(config.databasePath);
console.log('Data file removed. It will be recreated on the next start.');
