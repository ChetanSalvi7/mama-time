import { getDb, getSettings, mutateStore } from '../db.js';
import { cleanString, normalizeEmail, normalizePhone, nowIso, referenceCode } from '../utils/helpers.js';

const STATUS_LABELS = {
  new: 'Neu', contacted: 'Kontaktiert', callback: 'Rückruf geplant', won: 'Abgeschlossen',
  lost: 'Verloren', duplicate: 'Duplikat', archived: 'Archiviert'
};

export async function publicCampaignSettings() {
  const settings = await getSettings();
  const single = Number(settings.single_price_chf || 550);
  const besties = Number(settings.besties_price_chf || 990);
  return {
    campaignName: settings.campaign_name || 'MAMA TIME',
    campaignEnforce: settings.campaign_enforce === 'true',
    campaignStart: settings.campaign_start,
    campaignEnd: settings.campaign_end,
    campaignTimezone: settings.campaign_timezone || 'Europe/Zurich',
    formEnabled: settings.form_enabled !== 'false',
    singlePriceChf: single,
    bestiesPriceChf: besties,
    savingsChf: (single * 2) - besties,
    savingsPercent: Math.round((((single * 2) - besties) / (single * 2)) * 100),
    bestiesPerPersonChf: Math.round(besties / 2),
    daytimeHours: settings.daytime_hours,
    whatsappNumber: String(settings.whatsapp_number || '').replace(/\D/g, ''),
    whatsappMessage: settings.whatsapp_message || '',
    companyName: settings.company_name || 'Sentinators Gym',
    companyLocation: settings.company_location || 'Weite SG'
  };
}

export async function createLead(data, context) {
  const settings = await publicCampaignSettings();
  const createdAt = nowIso();
  const normalizedEmail = normalizeEmail(data.email);
  const normalizedPhone = normalizePhone(data.phone);
  const duplicateCutoff = Date.now() - context.duplicateWindowHours * 3_600_000;
  
  const dbStore = await getDb();
  const existing = [...dbStore.leads].reverse().find((lead) =>
    lead.status !== 'archived' && new Date(lead.created_at).getTime() >= duplicateCutoff &&
    ((normalizedEmail && lead.normalized_email === normalizedEmail) || (normalizedPhone && lead.normalized_phone === normalizedPhone))
  );
  
  const offerType = data.offer_type;
  const amountChf = offerType === 'besties' ? settings.bestiesPriceChf : settings.singlePriceChf;
  let lead;
  
  await mutateStore((store) => {
    lead = {
      id: store.meta.nextLeadId++, reference: referenceCode(), offer_type: offerType,
      offer_label: offerType === 'besties' ? '2 Mamas / Besties' : '1 Mama', amount_chf: amountChf,
      first_name: cleanString(data.first_name, 80), last_name: cleanString(data.last_name, 80),
      email: cleanString(data.email, 180), normalized_email: normalizedEmail,
      phone: cleanString(data.phone, 50), normalized_phone: normalizedPhone,
      preferred_contact: cleanString(data.preferred_contact, 50), start_preference: cleanString(data.start_preference, 120),
      bestie_first_name: offerType === 'besties' ? cleanString(data.bestie_first_name, 80) : '',
      bestie_last_name: offerType === 'besties' ? cleanString(data.bestie_last_name, 80) : '',
      bestie_email: offerType === 'besties' ? cleanString(data.bestie_email, 180) : '',
      bestie_phone: offerType === 'besties' ? cleanString(data.bestie_phone, 50) : '',
      message: cleanString(data.message, 2000), privacy_consent: 1, privacy_consent_at: createdAt,
      status: existing ? 'duplicate' : 'new', assigned_to: '', callback_at: '', notes: '', lost_reason: '',
      duplicate_of: existing?.id || null, is_duplicate: existing ? 1 : 0,
      utm_source: cleanString(data.utm_source, 255), utm_medium: cleanString(data.utm_medium, 255),
      utm_campaign: cleanString(data.utm_campaign, 255), utm_content: cleanString(data.utm_content, 255),
      utm_term: cleanString(data.utm_term, 255), fbclid: cleanString(data.fbclid, 500), gclid: cleanString(data.gclid, 500),
      referrer: cleanString(data.referrer, 1000), landing_url: cleanString(data.landing_url, 1000),
      page_variant: cleanString(data.page_variant, 100), screen: cleanString(data.screen, 100),
      ip_hash: context.ipHash, user_agent: cleanString(context.userAgent, 600),
      created_at: createdAt, updated_at: createdAt, archived_at: null
    };
    store.leads.push(lead);
    store.activities.push({
      id: store.meta.nextActivityId++, lead_id: lead.id, actor_type: 'system', actor_id: null,
      action: existing ? 'lead_created_duplicate' : 'lead_created',
      details_json: JSON.stringify({ offer_type: offerType, amount_chf: amountChf, duplicate_of: existing?.reference || null }),
      created_at: createdAt
    });
  });
  return lead;
}

export async function dashboardStats() {
  const store = await getDb();
  const leads = store.leads.filter((lead) => lead.status !== 'archived');
  const stats = { total: leads.length, new: 0, besties: 0, pipelineChf: 0, wonRevenueChf: 0, won: 0, lost: 0, duplicates: 0 };
  const sources = new Map();
  const daily = new Map();
  const cutoff = Date.now() - 30 * 86400000;
  for (const lead of leads) {
    if (lead.status === 'new') stats.new++;
    if (lead.offer_type === 'besties') stats.besties++;
    if (['new','contacted','callback'].includes(lead.status)) stats.pipelineChf += Number(lead.amount_chf || 0);
    if (lead.status === 'won') { stats.won++; stats.wonRevenueChf += Number(lead.amount_chf || 0); }
    if (lead.status === 'lost') stats.lost++;
    if (lead.status === 'duplicate') stats.duplicates++;
    const source = lead.utm_source || 'direct';
    sources.set(source, (sources.get(source) || 0) + 1);
    const time = new Date(lead.created_at).getTime();
    if (time >= cutoff) {
      const day = String(lead.created_at).slice(0,10);
      daily.set(day, (daily.get(day) || 0) + 1);
    }
  }
  const qualifiedTotal = Math.max(0, stats.total - stats.duplicates);
  return {
    ...stats,
    qualifiedTotal,
    conversionRate: qualifiedTotal ? Math.round((stats.won / qualifiedTotal) * 1000) / 10 : 0,
    sources: [...sources.entries()].map(([source,count]) => ({ source, count })).sort((a,b) => b.count-a.count).slice(0,8),
    daily: [...daily.entries()].map(([day,count]) => ({ day, count })).sort((a,b) => a.day.localeCompare(b.day))
  };
}

function matches(lead, filters) {
  if (!filters.includeArchived && lead.status === 'archived') return false;
  if (filters.status && lead.status !== filters.status) return false;
  if (filters.offer && lead.offer_type !== filters.offer) return false;
  if (filters.source && (lead.utm_source || 'direct') !== filters.source) return false;
  if (filters.dateFrom && lead.created_at < `${filters.dateFrom}T00:00:00`) return false;
  if (filters.dateTo && lead.created_at > `${filters.dateTo}T23:59:59`) return false;
  if (filters.q) {
    const phoneTerm = filters.q.replace(/\D/g,'');
    const haystack = [lead.reference, lead.first_name, lead.last_name, lead.email, lead.phone, lead.bestie_first_name, lead.bestie_last_name].join(' ').toLowerCase();
    if (!haystack.includes(filters.q.toLowerCase()) && !(phoneTerm && lead.normalized_phone.includes(phoneTerm))) return false;
  }
  return true;
}

function decorateLead(lead, store) {
  const duplicate = lead.duplicate_of ? store.leads.find((row) => row.id === lead.duplicate_of) : null;
  const { normalized_email: _normalizedEmail, normalized_phone: _normalizedPhone, ip_hash: _ipHash, ...safe } = lead;
  return { ...safe, duplicate_reference: duplicate?.reference || null };
}

export async function listLeads(filters = {}) {
  const store = await getDb();
  const page = Math.max(1, Number(filters.page || 1));
  const perPage = Math.min(100000, Math.max(10, Number(filters.perPage || 25)));
  const sorters = {
    oldest: (a,b) => a.created_at.localeCompare(b.created_at),
    value_desc: (a,b) => Number(b.amount_chf)-Number(a.amount_chf) || b.created_at.localeCompare(a.created_at),
    callback: (a,b) => (a.callback_at || '9999').localeCompare(b.callback_at || '9999'),
    newest: (a,b) => b.created_at.localeCompare(a.created_at)
  };
  const rows = store.leads.filter((lead) => matches(lead, filters)).sort(sorters[filters.sort] || sorters.newest);
  const total = rows.length;
  return {
    rows: rows.slice((page-1)*perPage, page*perPage).map((lead) => decorateLead(lead, store)),
    pagination: { page, perPage, total, pages: Math.max(1, Math.ceil(total/perPage)) }
  };
}

export async function getLead(idOrReference) {
  const store = await getDb();
  const lead = /^\d+$/.test(String(idOrReference))
    ? store.leads.find((row) => row.id === Number(idOrReference))
    : store.leads.find((row) => row.reference === String(idOrReference));
  if (!lead) return null;
  const admins = new Map(store.admins.map((admin) => [admin.id, admin.display_name]));
  const activities = store.activities.filter((row) => row.lead_id === lead.id).sort((a,b) => b.created_at.localeCompare(a.created_at)).map((row) => ({
    ...row, actor_name: row.actor_id ? admins.get(row.actor_id) || null : null,
    details: (() => { try { return JSON.parse(row.details_json || '{}'); } catch { return {}; } })()
  }));
  return { ...decorateLead(lead, store), activities };
}

export async function updateLead(id, patch, admin) {
  let found = false;
  await mutateStore((store) => {
    const lead = store.leads.find((row) => row.id === Number(id));
    if (!lead) return;
    found = true;
    const changes = {};
    for (const key of ['status','assigned_to','callback_at','notes','lost_reason']) {
      if (String(lead[key] || '') !== String(patch[key] || '')) changes[key] = { from: lead[key] || '', to: patch[key] || '' };
      lead[key] = patch[key] || '';
    }
    lead.archived_at = patch.status === 'archived' ? (lead.archived_at || nowIso()) : null;
    lead.updated_at = nowIso();
    store.activities.push({ id: store.meta.nextActivityId++, lead_id: lead.id, actor_type: 'admin', actor_id: admin.id, action: 'lead_updated', details_json: JSON.stringify(changes), created_at: lead.updated_at });
  });
  return found ? await getLead(id) : null;
}

export function statusLabels() { return STATUS_LABELS; }
export async function exportLeadRows(filters = {}) {
  const result = await listLeads({ ...filters, page: 1, perPage: 100000 });
  return result.rows;
}
