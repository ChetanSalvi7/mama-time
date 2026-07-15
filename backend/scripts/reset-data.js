import fs from 'node:fs';
import pg from 'pg';
import { config } from '../src/config.js';
import { closeDb } from '../src/db.js';

const { Pool } = pg;

const confirmed = process.argv.includes('--confirm=RESET-MAMA-TIME');
if (!confirmed) {
  console.error('Destructive command blocked. Re-run with --confirm=RESET-MAMA-TIME.');
  process.exit(1);
}
if (config.isProduction && process.env.ALLOW_DESTRUCTIVE_RESET !== 'true') {
  console.error('Production reset blocked. Set ALLOW_DESTRUCTIVE_RESET=true only for an explicitly approved maintenance window.');
  process.exit(1);
}

async function main() {
  await closeDb();

  if (config.databaseUrl) {
    console.log('Resetting PostgreSQL database...');
    const pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false }
    });
    const client = await pool.connect();
    try {
      await client.query('DROP TABLE IF EXISTS mama_activities CASCADE;');
      await client.query('DROP TABLE IF EXISTS mama_leads CASCADE;');
      await client.query('DROP TABLE IF EXISTS mama_admins CASCADE;');
      await client.query('DROP TABLE IF EXISTS mama_settings CASCADE;');
      await client.query('DROP TABLE IF EXISTS mama_meta CASCADE;');
      console.log('PostgreSQL tables dropped.');
    } finally {
      client.release();
      await pool.end();
    }
  } else {
    if (fs.existsSync(config.databasePath)) {
      fs.rmSync(config.databasePath);
      console.log('Data file removed.');
    }
  }
  console.log('Reset completed successfully.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
