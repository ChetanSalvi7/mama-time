import express from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js';
import { leadSchema, zodFields } from '../validation.js';
import { createLead, publicCampaignSettings } from '../services/leadService.js';
import { sendLeadNotification } from '../services/emailService.js';
import { campaignStatus, ipHash } from '../utils/helpers.js';

export const publicRouter = express.Router();

const leadLimiter = rateLimit({
  windowMs: config.security.publicRateWindowMs,
  limit: config.security.publicRateMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, message: 'Zu viele Anfragen in kurzer Zeit. Bitte warte einige Minuten und versuche es erneut.' }
});

publicRouter.get('/config', (_req, res) => {
  const settings = publicCampaignSettings();
  res.json({ ok: true, ...settings, campaignStatus: campaignStatus({ campaign_start: settings.campaignStart, campaign_end: settings.campaignEnd }) });
});

publicRouter.post('/leads', leadLimiter, async (req, res, next) => {
  try {
    const parsed = leadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ ok: false, message: 'Bitte prüfe deine Angaben.', fields: zodFields(parsed.error) });
    }
    const data = parsed.data;
    if (data.website) return res.status(200).json({ ok: true, reference: 'MT-RECEIVED' });
    const elapsed = Date.now() - Number(data.form_started_at || 0);
    if (Number.isFinite(elapsed) && elapsed < config.security.minFormSeconds * 1000) {
      return res.status(400).json({ ok: false, message: 'Bitte prüfe deine Angaben und versuche es erneut.' });
    }

    const settings = publicCampaignSettings();
    const status = campaignStatus({ campaign_start: settings.campaignStart, campaign_end: settings.campaignEnd });
    if (!settings.formEnabled) return res.status(410).json({ ok: false, message: 'Das Anfrageformular ist momentan deaktiviert.' });
    if (settings.campaignEnforce && status !== 'active') {
      return res.status(410).json({ ok: false, message: status === 'scheduled' ? 'Die Aktion ist noch nicht gestartet.' : 'Die Aktion ist beendet.' });
    }

    const lead = createLead(data, {
      ipHash: ipHash(req),
      userAgent: req.get('user-agent') || '',
      duplicateWindowHours: config.security.duplicateWindowHours
    });
    sendLeadNotification(lead).catch((error) => console.error('[MAMA TIME] Notification email failed:', error.message));

    res.status(201).json({
      ok: true,
      reference: lead.reference,
      duplicate: Boolean(lead.is_duplicate),
      message: 'Danke! Deine Anfrage ist eingegangen.'
    });
  } catch (error) {
    next(error);
  }
});
