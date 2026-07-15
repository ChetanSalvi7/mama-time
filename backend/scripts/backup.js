import path from 'node:path';
import { config } from '../src/config.js';
import { backupStore, closeDb } from '../src/db.js';

const directory = path.join(path.dirname(config.databasePath), 'backups');
const stamp = new Date().toISOString().replace(/[:.]/g,'-');
const target = path.join(directory, `mama-time-${stamp}.json`);

async function main() {
  const result = await backupStore(target);
  console.log(`Backup created: ${result}`);
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
