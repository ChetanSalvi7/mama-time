import bcrypt from 'bcryptjs';
import { getDb, mutateStore, closeDb } from '../src/db.js';
import { nowIso } from '../src/utils/helpers.js';

const [emailArg, passwordArg, nameArg] = process.argv.slice(2);
if (!emailArg || !passwordArg) {
  console.error('Usage: npm run create-admin -w backend -- email@example.com StrongPassword "Display Name"');
  process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const name = nameArg || 'Sentinators Admin';
const now = nowIso();

async function main() {
  await getDb();
  await mutateStore((store) => {
    let admin = store.admins.find((row) => row.email === email);
    if (!admin) {
      admin = { id: store.meta.nextAdminId++, email, created_at: now };
      store.admins.push(admin);
    }
    Object.assign(admin, {
      password_hash: bcrypt.hashSync(passwordArg, 12),
      display_name: name,
      role: 'admin',
      active: true,
      auth_version: Number(admin.auth_version || 0) + 1,
      updated_at: now,
      last_login_at: admin.last_login_at || null
    });
  });
  console.log(`Admin ready: ${email}`);
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
