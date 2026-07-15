import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import request from 'supertest';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mama-time-test-'));
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = path.join(tempDir, 'test-data.json');
process.env.JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-integration-tests-0123456789';
process.env.IP_HASH_SECRET = 'test-ip-secret-that-is-long-enough-for-integration-tests-0123456789';
process.env.ADMIN_BOOTSTRAP_EMAIL = 'admin@example.test';
process.env.ADMIN_BOOTSTRAP_PASSWORD = 'Strong-Test-Password-2026!';
process.env.SHOW_DEFAULT_PASSWORD_WARNING = 'false';
process.env.CAMPAIGN_ENFORCE = 'false';

const { createApp } = await import('../src/app.js');
const app = createApp();

const lead = (email = 'mama@example.test') => ({
  offer_type: 'besties', first_name: 'Anna', last_name: 'Muster', email, phone: '+41 79 123 45 67',
  bestie_first_name: 'Lisa', bestie_last_name: 'Muster', bestie_email: 'lisa@example.test', bestie_phone: '+41 79 987 65 43',
  preferred_contact: 'WhatsApp', start_preference: 'Direkt nach den Schulferien', message: 'Testanfrage',
  privacy: 1, form_started_at: Date.now() - 5000, website: '', utm_source: 'facebook', utm_medium: 'paid_social',
  landing_url: 'http://localhost/', page_variant: 'test', screen: '390x844'
});

test('health and public configuration are available', async () => {
  const health = await request(app).get('/api/health').expect(200);
  assert.equal(health.body.ok, true);
  const config = await request(app).get('/api/public/config').expect(200);
  assert.equal(config.body.singlePriceChf, 550);
  assert.equal(config.body.bestiesPriceChf, 990);
});

test('lead validation rejects incomplete input', async () => {
  const response = await request(app).post('/api/public/leads').send({ offer_type: 'single' }).expect(422);
  assert.equal(response.body.ok, false);
  assert.ok(response.body.fields.first_name);
});

test('lead creation, duplicate detection and admin workflow', async () => {
  const first = await request(app).post('/api/public/leads').send(lead()).expect(201);
  assert.equal(first.body.ok, true);
  assert.match(first.body.reference, /^MT-\d{4}-[A-F0-9]{8}$/);

  const secondPayload = lead();
  secondPayload.form_started_at = Date.now() - 5000;
  const second = await request(app).post('/api/public/leads').send(secondPayload).expect(201);
  assert.equal(second.body.duplicate, true);

  const agent = request.agent(app);
  const login = await agent.post('/api/admin/auth/login').send({ email: 'admin@example.test', password: 'Strong-Test-Password-2026!' }).expect(200);
  const csrf = login.body.csrf;
  assert.ok(csrf);

  const list = await agent.get('/api/admin/leads').expect(200);
  assert.equal(list.body.pagination.total, 2);
  const leadId = list.body.rows[0].id;

  await agent.patch(`/api/admin/leads/${leadId}`).set('X-CSRF-Token', csrf).send({
    status: 'won', assigned_to: 'Martina', callback_at: '', notes: 'Mitgliedschaft abgeschlossen', lost_reason: ''
  }).expect(200);

  const stats = await agent.get('/api/admin/stats').expect(200);
  assert.equal(stats.body.stats.won, 1);
  assert.equal(stats.body.stats.wonRevenueChf, 990);

  const csv = await agent.get('/api/admin/leads/export.csv').expect(200);
  assert.match(csv.text, /Reference/);
  assert.match(csv.text, /Anna/);

  await agent.patch('/api/admin/settings').set('X-CSRF-Token', csrf).send({
    campaign_name: 'MAMA TIME',
    company_name: 'Sentinators Gym',
    company_location: 'Weite SG',
    campaign_enforce: false,
    campaign_start: '2026-07-20T00:00',
    campaign_end: '2026-08-20T23:59',
    campaign_timezone: 'Europe/Zurich',
    single_price_chf: 550,
    besties_price_chf: 990,
    daytime_hours: 'Montag bis Freitag, 08:00–16:30 Uhr',
    whatsapp_number: '41791234567',
    whatsapp_message: 'Hallo Sentinators Gym',
    notification_email: '',
    form_enabled: true
  }).expect(200);

  const publicConfigAfterSettings = await request(app).get('/api/public/config').expect(200);
  assert.equal(publicConfigAfterSettings.body.savingsChf, 110);
  assert.equal(publicConfigAfterSettings.body.savingsPercent, 10);
  assert.match(publicConfigAfterSettings.body.campaignStart, /\+02:00$/);

  const backup = await agent.get('/api/admin/backup.json').expect(200);
  assert.match(backup.text, /MAMA TIME React \+ Node/);
  assert.doesNotMatch(backup.text, /password_hash/);
  assert.doesNotMatch(backup.text, /ip_hash/);

  await agent.post('/api/admin/auth/change-password').set('X-CSRF-Token', csrf).send({
    current_password: 'Strong-Test-Password-2026!',
    new_password: 'Changed-Test-Password-2026!'
  }).expect(200);
  await agent.get('/api/admin/auth/me').expect(401);
  await request(app).post('/api/admin/auth/login').send({ email: 'admin@example.test', password: 'Changed-Test-Password-2026!' }).expect(200);
});

test.after(async () => {
  const { closeDb } = await import('../src/db.js');
  await closeDb();
  fs.rmSync(tempDir, { recursive: true, force: true });
});
