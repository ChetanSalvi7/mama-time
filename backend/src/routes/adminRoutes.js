import express from 'express';
import { requireAdmin, requireCsrf } from '../middleware/auth.js';
import { dashboardStats, exportLeadRows, getLead, listLeads, statusLabels, updateLead } from '../services/leadService.js';
import { getDb, getSettings, updateSettings } from '../db.js';
import { leadUpdateSchema, settingsUpdateSchema, zodFields } from '../validation.js';
import { formatCsvCell, normalizeCampaignDateTime } from '../utils/helpers.js';

export const adminRouter = express.Router();
adminRouter.use(requireAdmin);

adminRouter.get('/stats', async (_req, res, next) => {
  try {
    const stats = await dashboardStats();
    res.json({ ok: true, stats });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/leads', async (req, res, next) => {
  try {
    const result = await listLeads({
      q: String(req.query.q || '').trim(),
      status: String(req.query.status || '').trim(),
      offer: String(req.query.offer || '').trim(),
      source: String(req.query.source || '').trim(),
      dateFrom: String(req.query.dateFrom || '').trim(),
      dateTo: String(req.query.dateTo || '').trim(),
      sort: String(req.query.sort || 'newest').trim(),
      page: Number(req.query.page || 1),
      perPage: Number(req.query.perPage || 25),
      includeArchived: String(req.query.includeArchived || '') === 'true'
    });
    res.json({ ok: true, ...result, statusLabels: statusLabels() });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/backup.json', async (_req, res, next) => {
  try {
    const store = await getDb();
    const payload = {
      product: 'MAMA TIME React + Node',
      schemaVersion: store.schemaVersion,
      exportedAt: new Date().toISOString(),
      settings: store.settings,
      leads: store.leads.map(({ normalized_email: _normalizedEmail, normalized_phone: _normalizedPhone, ip_hash: _ipHash, ...lead }) => lead),
      activities: store.activities
    };
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="mama-time-backup-${new Date().toISOString().slice(0,10)}.json"`);
    res.send(`${JSON.stringify(payload, null, 2)}\n`);
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/leads/export.csv', async (req, res, next) => {
  try {
    const rows = await exportLeadRows({
      q: String(req.query.q || '').trim(),
      status: String(req.query.status || '').trim(),
      offer: String(req.query.offer || '').trim(),
      source: String(req.query.source || '').trim(),
      dateFrom: String(req.query.dateFrom || '').trim(),
      dateTo: String(req.query.dateTo || '').trim(),
      sort: String(req.query.sort || 'newest').trim(),
      includeArchived: String(req.query.includeArchived || '') === 'true'
    });
    const headers = [
      'Reference','Created at','Status','Offer','Amount CHF','First name','Last name','Email','Phone','Preferred contact',
      'Start preference','Bestie first name','Bestie last name','Bestie email','Bestie phone','Message','Assigned to','Callback at',
      'Notes','Lost reason','UTM source','UTM medium','UTM campaign','UTM content','UTM term','FBCLID','GCLID','Landing URL','Duplicate'
    ];
    const fields = [
      'reference','created_at','status','offer_label','amount_chf','first_name','last_name','email','phone','preferred_contact',
      'start_preference','bestie_first_name','bestie_last_name','bestie_email','bestie_phone','message','assigned_to','callback_at',
      'notes','lost_reason','utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid','gclid','landing_url','is_duplicate'
    ];
    const csv = '\uFEFF' + [headers.map(formatCsvCell).join(';'), ...rows.map((row) => fields.map((field) => formatCsvCell(row[field])).join(';'))].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="mama-time-leads-${new Date().toISOString().slice(0,10)}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/leads/:id', async (req, res, next) => {
  try {
    const lead = await getLead(req.params.id);
    if (!lead) return res.status(404).json({ ok: false, message: 'Anfrage nicht gefunden.' });
    res.json({ ok: true, lead, statusLabels: statusLabels() });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/leads/:id', requireCsrf, async (req, res, next) => {
  try {
    const parsed = leadUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(422).json({ ok: false, message: 'Bitte prüfe die Angaben.', fields: zodFields(parsed.error) });
    const lead = await updateLead(Number(req.params.id), parsed.data, req.admin);
    if (!lead) return res.status(404).json({ ok: false, message: 'Anfrage nicht gefunden.' });
    res.json({ ok: true, lead });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/settings', async (_req, res, next) => {
  try {
    const settings = await getSettings();
    res.json({ ok: true, settings: {
      campaign_name: settings.campaign_name,
      company_name: settings.company_name,
      company_location: settings.company_location,
      campaign_enforce: settings.campaign_enforce === 'true',
      campaign_start: settings.campaign_start,
      campaign_end: settings.campaign_end,
      campaign_timezone: settings.campaign_timezone || 'Europe/Zurich',
      single_price_chf: Number(settings.single_price_chf || 550),
      besties_price_chf: Number(settings.besties_price_chf || 990),
      daytime_hours: settings.daytime_hours,
      whatsapp_number: settings.whatsapp_number,
      whatsapp_message: settings.whatsapp_message,
      notification_email: settings.notification_email,
      form_enabled: settings.form_enabled !== 'false'
    }});
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/settings', requireCsrf, async (req, res, next) => {
  try {
    const parsed = settingsUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(422).json({ ok: false, message: 'Bitte prüfe die Einstellungen.', fields: zodFields(parsed.error) });
    const timezone = parsed.data.campaign_timezone || 'Europe/Zurich';
    const saved = await updateSettings({
      campaign_name: parsed.data.campaign_name,
      company_name: parsed.data.company_name,
      company_location: parsed.data.company_location,
      campaign_enforce: parsed.data.campaign_enforce,
      campaign_start: normalizeCampaignDateTime(parsed.data.campaign_start, timezone),
      campaign_end: normalizeCampaignDateTime(parsed.data.campaign_end, timezone),
      campaign_timezone: timezone,
      single_price_chf: parsed.data.single_price_chf,
      besties_price_chf: parsed.data.besties_price_chf,
      daytime_hours: parsed.data.daytime_hours,
      whatsapp_number: parsed.data.whatsapp_number.replace(/\D/g, ''),
      whatsapp_message: parsed.data.whatsapp_message,
      notification_email: parsed.data.notification_email,
      form_enabled: parsed.data.form_enabled
    });
    res.json({ ok: true, settings: saved });
  } catch (err) {
    next(err);
  }
});
