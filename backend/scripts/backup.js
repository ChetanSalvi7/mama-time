import path from 'node:path';
import { config } from '../src/config.js';
import { backupStore } from '../src/db.js';
const directory = path.join(path.dirname(config.databasePath), 'backups');
const stamp = new Date().toISOString().replace(/[:.]/g,'-');
const target = path.join(directory, `mama-time-${stamp}.json`);
console.log(`Backup created: ${backupStore(target)}`);
