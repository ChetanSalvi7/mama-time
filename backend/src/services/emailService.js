import nodemailer from 'nodemailer';
import { config } from '../config.js';
import { getSettings } from '../db.js';

let transporter;

function getTransporter() {
  const smtp = config.contact.smtp;
  if (!smtp.host || !smtp.user || !smtp.password) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: { user: smtp.user, pass: smtp.password },
      disableFileAccess: true,
      disableUrlAccess: true
    });
  }
  return transporter;
}

export async function sendLeadNotification(lead) {
  const transport = getTransporter();
  const settings = getSettings();
  const recipient = settings.notification_email || config.contact.notificationEmail;
  if (!transport || !recipient) return { sent: false, reason: 'not_configured' };

  const bestie = lead.offer_type === 'besties'
    ? `${lead.bestie_first_name || ''} ${lead.bestie_last_name || ''} · ${lead.bestie_email || '–'} · ${lead.bestie_phone || '–'}`
    : '–';
  const text = [
    'Neue MAMA TIME Anfrage',
    `Referenz: ${lead.reference}`,
    `Angebot: ${lead.offer_label}`,
    `Wert: CHF ${lead.amount_chf}.–`,
    `Name: ${lead.first_name} ${lead.last_name}`,
    `E-Mail: ${lead.email}`,
    `Telefon: ${lead.phone}`,
    `Kontaktart: ${lead.preferred_contact}`,
    `Start: ${lead.start_preference}`,
    `Mama-Bestie: ${bestie}`,
    `Nachricht: ${lead.message || '–'}`,
    `Quelle: ${lead.utm_source || 'direct'} / ${lead.utm_medium || 'none'}`,
    `Eingang: ${lead.created_at}`,
    `Backoffice: ${config.appBaseUrl}/admin/leads/${lead.id}`
  ].join('\n');

  await transport.sendMail({
    from: config.contact.smtp.from,
    to: recipient,
    replyTo: lead.email,
    subject: `[MAMA TIME] Neue Anfrage ${lead.reference} – ${lead.offer_label}`,
    text,
    disableFileAccess: true,
    disableUrlAccess: true
  });
  return { sent: true };
}
