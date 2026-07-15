import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { nowIso } from './utils/helpers.js';

let store;
let writeCounter = 0;

const defaultSettings = {
  campaign_name: 'MAMA TIME',
  campaign_enforce: String(config.campaign.enforce),
  campaign_start: config.campaign.start,
  campaign_end: config.campaign.end,
  campaign_timezone: config.campaign.timezone,
  single_price_chf: String(config.campaign.singlePrice),
  besties_price_chf: String(config.campaign.bestiesPrice),
  daytime_hours: config.campaign.daytimeHours,
  whatsapp_number: config.contact.whatsappNumber,
  whatsapp_message: config.contact.whatsappMessage,
  notification_email: config.contact.notificationEmail,
  company_name: 'Sentinators Gym',
  company_location: 'Weite SG',
  form_enabled: 'true'
};

function emptyStore() {
  return {
    schemaVersion: 1,
    meta: { nextAdminId: 1, nextLeadId: 1, nextActivityId: 1, createdAt: nowIso(), updatedAt: nowIso() },
    admins: [],
    settings: { ...defaultSettings },
    leads: [],
    activities: []
  };
}

function ensureDirectory() {
  fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });
}

function loadStore() {
  ensureDirectory();
  if (!fs.existsSync(config.databasePath)) {
    store = emptyStore();
    persistStore();
  } else {
    try {
      const parsed = JSON.parse(fs.readFileSync(config.databasePath, 'utf8'));
      store = {
        ...emptyStore(),
        ...parsed,
        meta: { ...emptyStore().meta, ...(parsed.meta || {}) },
        settings: { ...defaultSettings, ...(parsed.settings || {}) },
        admins: Array.isArray(parsed.admins) ? parsed.admins.map((admin) => ({ auth_version: 1, ...admin })) : [],
        leads: Array.isArray(parsed.leads) ? parsed.leads : [],
        activities: Array.isArray(parsed.activities) ? parsed.activities : []
      };
    } catch (error) {
      const broken = `${config.databasePath}.broken-${Date.now()}`;
      fs.copyFileSync(config.databasePath, broken);
      throw new Error(`Data file is invalid JSON. A copy was saved as ${broken}. ${error.message}`);
    }
  }
  ensureBootstrapAdmin();
  return store;
}

function persistStore() {
  ensureDirectory();
  if (!store) return;
  store.meta.updatedAt = nowIso();
  const temp = `${config.databasePath}.tmp-${process.pid}-${++writeCounter}`;
  try {
    fs.writeFileSync(temp, `${JSON.stringify(store, null, 2)}\n`, { mode: 0o600 });
    try {
      fs.renameSync(temp, config.databasePath);
    } catch (error) {
      // Windows may reject replacing an existing file. Local development gets a safe fallback; Linux keeps atomic rename.
      if (process.platform === 'win32' && ['EEXIST', 'EPERM'].includes(error.code)) {
        fs.rmSync(config.databasePath, { force: true });
        fs.renameSync(temp, config.databasePath);
      } else {
        throw error;
      }
    }
    try { fs.chmodSync(config.databasePath, 0o600); } catch { /* best effort on non-POSIX filesystems */ }
  } finally {
    if (fs.existsSync(temp)) fs.rmSync(temp, { force: true });
  }
}

function ensureBootstrapAdmin() {
  if (store.admins.length > 0) return;
  const now = nowIso();
  store.admins.push({
    id: store.meta.nextAdminId++,
    email: config.auth.bootstrapEmail,
    password_hash: bcrypt.hashSync(config.auth.bootstrapPassword, 12),
    display_name: config.auth.bootstrapName,
    role: 'admin', active: true, auth_version: 1,
    created_at: now, updated_at: now, last_login_at: null
  });
  persistStore();
  console.warn(`[MAMA TIME] Bootstrap admin created: ${config.auth.bootstrapEmail}`);
  if (config.auth.showDefaultPasswordWarning) console.warn('[MAMA TIME] Change the bootstrap password before production.');
}

export function getDb() {
  if (!store) loadStore();
  return store;
}

export function mutateStore(mutator) {
  const data = getDb();
  const result = mutator(data);
  persistStore();
  return result;
}

export function getSettings() {
  return { ...getDb().settings };
}

export function updateSettings(pairs) {
  mutateStore((data) => {
    for (const [key, value] of Object.entries(pairs)) data.settings[key] = String(value ?? '');
  });
  return getSettings();
}

export function backupStore(targetPath) {
  getDb();
  ensureDirectory();
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(config.databasePath, targetPath);
  return targetPath;
}

export function closeDb() {
  if (store) persistStore();
  store = undefined;
}
