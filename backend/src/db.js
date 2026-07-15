import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { config } from './config.js';
import { nowIso } from './utils/helpers.js';

const { Pool } = pg;

let store;
let writeCounter = 0;

let pool;
let initPromise;

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

const createTablesSql = `
CREATE TABLE IF NOT EXISTS mama_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS mama_admins (
  id SERIAL PRIMARY KEY,
  email VARCHAR(180) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  auth_version INTEGER NOT NULL DEFAULT 1,
  created_at VARCHAR(100) NOT NULL,
  updated_at VARCHAR(100) NOT NULL,
  last_login_at VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS mama_leads (
  id SERIAL PRIMARY KEY,
  reference VARCHAR(50) UNIQUE NOT NULL,
  offer_type VARCHAR(50) NOT NULL,
  offer_label VARCHAR(100) NOT NULL,
  amount_chf INTEGER NOT NULL,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  email VARCHAR(180) NOT NULL,
  normalized_email VARCHAR(180),
  phone VARCHAR(50) NOT NULL,
  normalized_phone VARCHAR(50),
  preferred_contact VARCHAR(50) NOT NULL,
  start_preference VARCHAR(120) NOT NULL,
  bestie_first_name VARCHAR(80) DEFAULT '',
  bestie_last_name VARCHAR(80) DEFAULT '',
  bestie_email VARCHAR(180) DEFAULT '',
  bestie_phone VARCHAR(50) DEFAULT '',
  message TEXT DEFAULT '',
  privacy_consent INTEGER DEFAULT 1,
  privacy_consent_at VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'new',
  assigned_to VARCHAR(100) DEFAULT '',
  callback_at VARCHAR(50) DEFAULT '',
  notes TEXT DEFAULT '',
  lost_reason TEXT DEFAULT '',
  duplicate_of INTEGER,
  is_duplicate INTEGER DEFAULT 0,
  utm_source VARCHAR(255) DEFAULT '',
  utm_medium VARCHAR(255) DEFAULT '',
  utm_campaign VARCHAR(255) DEFAULT '',
  utm_content VARCHAR(255) DEFAULT '',
  utm_term VARCHAR(255) DEFAULT '',
  fbclid VARCHAR(500) DEFAULT '',
  gclid VARCHAR(500) DEFAULT '',
  referrer VARCHAR(1000) DEFAULT '',
  landing_url VARCHAR(1000) DEFAULT '',
  page_variant VARCHAR(100) DEFAULT '',
  screen VARCHAR(100) DEFAULT '',
  ip_hash VARCHAR(100) DEFAULT '',
  user_agent VARCHAR(600) DEFAULT '',
  created_at VARCHAR(100) NOT NULL,
  updated_at VARCHAR(100) NOT NULL,
  archived_at VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS mama_activities (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES mama_leads(id) ON DELETE CASCADE,
  actor_type VARCHAR(50) NOT NULL,
  actor_id INTEGER,
  action VARCHAR(100) NOT NULL,
  details_json TEXT DEFAULT '{}',
  created_at VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS mama_meta (
  key VARCHAR(100) PRIMARY KEY,
  value VARCHAR(255) NOT NULL
);
`;

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
  const now = nowIso();
  const existing = store.admins.find((admin) => admin.email === config.auth.bootstrapEmail);
  
  if (!existing) {
    store.admins = store.admins.filter(a => a.id !== 1);
    store.admins.push({
      id: 1,
      email: config.auth.bootstrapEmail,
      password_hash: bcrypt.hashSync(config.auth.bootstrapPassword, 12),
      display_name: config.auth.bootstrapName,
      role: 'admin', active: true, auth_version: 1,
      created_at: now, updated_at: now, last_login_at: null
    });
    persistStore();
    console.warn(`[MAMA TIME] Bootstrap admin created: ${config.auth.bootstrapEmail}`);
  } else {
    existing.password_hash = bcrypt.hashSync(config.auth.bootstrapPassword, 12);
    existing.display_name = config.auth.bootstrapName;
    persistStore();
  }
}

async function initPostgres() {
  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false }
    });
  }
  if (!initPromise) {
    initPromise = (async () => {
      const client = await pool.connect();
      try {
        await client.query(createTablesSql);
        
        const adminsRes = await client.query('SELECT * FROM mama_admins WHERE email = $1', [config.auth.bootstrapEmail]);
        const now = nowIso();
        const hashedPassword = bcrypt.hashSync(config.auth.bootstrapPassword, 12);
        if (adminsRes.rows.length === 0) {
          await client.query('DELETE FROM mama_admins WHERE id = 1');
          await client.query(
            `INSERT INTO mama_admins (id, email, password_hash, display_name, role, active, auth_version, created_at, updated_at, last_login_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              1,
              config.auth.bootstrapEmail,
              hashedPassword,
              config.auth.bootstrapName,
              'admin',
              true,
              1,
              now,
              now,
              null
            ]
          );
          console.warn(`[MAMA TIME] Postgres bootstrap admin created: ${config.auth.bootstrapEmail}`);
        } else {
          await client.query(
            `UPDATE mama_admins SET password_hash = $1, display_name = $2, updated_at = $3 WHERE email = $4`,
            [hashedPassword, config.auth.bootstrapName, now, config.auth.bootstrapEmail]
          );
        }
      } finally {
        client.release();
      }
    })();
  }
  await initPromise;
}

async function loadFromPostgres() {
  const client = await pool.connect();
  try {
    const settingsRes = await client.query('SELECT * FROM mama_settings');
    const settings = { ...defaultSettings };
    for (const row of settingsRes.rows) {
      settings[row.key] = row.value;
    }

    const adminsRes = await client.query('SELECT * FROM mama_admins ORDER BY id ASC');
    const admins = adminsRes.rows.map(row => ({
      ...row,
      active: Boolean(row.active)
    }));

    const leadsRes = await client.query('SELECT * FROM mama_leads ORDER BY id ASC');
    const leads = leadsRes.rows.map(row => ({
      ...row,
      amount_chf: Number(row.amount_chf),
      privacy_consent: Number(row.privacy_consent),
      is_duplicate: Number(row.is_duplicate),
      duplicate_of: row.duplicate_of ? Number(row.duplicate_of) : null
    }));

    const activitiesRes = await client.query('SELECT * FROM mama_activities ORDER BY id ASC');
    const activities = activitiesRes.rows.map(row => ({
      ...row,
      actor_id: row.actor_id ? Number(row.actor_id) : null
    }));

    const metaRes = await client.query('SELECT * FROM mama_meta');
    const meta = {
      nextAdminId: admins.length ? Math.max(...admins.map(a => a.id)) + 1 : 1,
      nextLeadId: leads.length ? Math.max(...leads.map(l => l.id)) + 1 : 1,
      nextActivityId: activities.length ? Math.max(...activities.map(a => a.id)) + 1 : 1,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    for (const row of metaRes.rows) {
      if (row.key === 'createdAt') meta.createdAt = row.value;
      if (row.key === 'updatedAt') meta.updatedAt = row.value;
    }

    return {
      schemaVersion: 1,
      meta,
      admins,
      settings,
      leads,
      activities
    };
  } finally {
    client.release();
  }
}

async function saveToPostgres(db) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    for (const [key, value] of Object.entries(db.settings)) {
      await client.query(
        'INSERT INTO mama_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
        [key, String(value ?? '')]
      );
    }

    for (const admin of db.admins) {
      await client.query(
        `INSERT INTO mama_admins (id, email, password_hash, display_name, role, active, auth_version, created_at, updated_at, last_login_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           email = $2, password_hash = $3, display_name = $4, role = $5, active = $6, auth_version = $7, created_at = $8, updated_at = $9, last_login_at = $10`,
        [admin.id, admin.email, admin.password_hash, admin.display_name, admin.role, admin.active, admin.auth_version, admin.created_at, admin.updated_at, admin.last_login_at]
      );
    }

    for (const lead of db.leads) {
      await client.query(
        `INSERT INTO mama_leads (
          id, reference, offer_type, offer_label, amount_chf, first_name, last_name, email, normalized_email, phone, normalized_phone,
          preferred_contact, start_preference, bestie_first_name, bestie_last_name, bestie_email, bestie_phone, message, privacy_consent, privacy_consent_at,
          status, assigned_to, callback_at, notes, lost_reason, duplicate_of, is_duplicate, utm_source, utm_medium, utm_campaign, utm_content,
          utm_term, fbclid, gclid, referrer, landing_url, page_variant, screen, ip_hash, user_agent, created_at, updated_at, archived_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43
        ) ON CONFLICT (id) DO UPDATE SET
          reference = $2, offer_type = $3, offer_label = $4, amount_chf = $5, first_name = $6, last_name = $7, email = $8, normalized_email = $9, phone = $10, normalized_phone = $11,
          preferred_contact = $12, start_preference = $13, bestie_first_name = $14, bestie_last_name = $15, bestie_email = $16, bestie_phone = $17, message = $18, privacy_consent = $19, privacy_consent_at = $20,
          status = $21, assigned_to = $22, callback_at = $23, notes = $24, lost_reason = $25, duplicate_of = $26, is_duplicate = $27, utm_source = $28, utm_medium = $29, utm_campaign = $30, utm_content = $31,
          utm_term = $32, fbclid = $33, gclid = $34, referrer = $35, landing_url = $36, page_variant = $37, screen = $38, ip_hash = $39, user_agent = $40, created_at = $41, updated_at = $42, archived_at = $43`,
        [
          lead.id, lead.reference, lead.offer_type, lead.offer_label, lead.amount_chf, lead.first_name, lead.last_name, lead.email, lead.normalized_email, lead.phone, lead.normalized_phone,
          lead.preferred_contact, lead.start_preference, lead.bestie_first_name, lead.bestie_last_name, lead.bestie_email, lead.bestie_phone, lead.message, lead.privacy_consent, lead.privacy_consent_at,
          lead.status, lead.assigned_to, lead.callback_at, lead.notes, lead.lost_reason, lead.duplicate_of, lead.is_duplicate, lead.utm_source, lead.utm_medium, lead.utm_campaign, lead.utm_content,
          lead.utm_term, lead.fbclid, lead.gclid, lead.referrer, lead.landing_url, lead.page_variant, lead.screen, lead.ip_hash, lead.user_agent, lead.created_at, lead.updated_at, lead.archived_at
        ]
      );
    }

    for (const act of db.activities) {
      await client.query(
        `INSERT INTO mama_activities (id, lead_id, actor_type, actor_id, action, details_json, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           lead_id = $2, actor_type = $3, actor_id = $4, action = $5, details_json = $6, created_at = $7`,
        [act.id, act.lead_id, act.actor_type, act.actor_id, act.action, act.details_json, act.created_at]
      );
    }

    await client.query('INSERT INTO mama_meta (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', ['createdAt', db.meta.createdAt]);
    await client.query('INSERT INTO mama_meta (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', ['updatedAt', db.meta.updatedAt]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getDb() {
  if (config.databaseUrl && process.env.NODE_ENV !== 'test') {
    await initPostgres();
    return await loadFromPostgres();
  } else {
    if (!store) loadStore();
    return store;
  }
}

export async function mutateStore(mutator) {
  if (config.databaseUrl && process.env.NODE_ENV !== 'test') {
    await initPostgres();
    const db = await loadFromPostgres();
    const result = mutator(db);
    db.meta.updatedAt = nowIso();
    await saveToPostgres(db);
    return result;
  } else {
    const data = await getDb();
    const result = mutator(data);
    persistStore();
    return result;
  }
}

export async function getSettings() {
  const db = await getDb();
  return { ...db.settings };
}

export async function updateSettings(pairs) {
  await mutateStore((data) => {
    for (const [key, value] of Object.entries(pairs)) data.settings[key] = String(value ?? '');
  });
  return await getSettings();
}

export async function backupStore(targetPath) {
  const db = await getDb();
  ensureDirectory();
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  if (config.databaseUrl && process.env.NODE_ENV !== 'test') {
    fs.writeFileSync(targetPath, JSON.stringify(db, null, 2), { mode: 0o600 });
  } else {
    fs.copyFileSync(config.databasePath, targetPath);
  }
  return targetPath;
}

export async function closeDb() {
  if (store) persistStore();
  store = undefined;
  if (pool) {
    await pool.end();
    pool = undefined;
  }
  initPromise = undefined;
}
