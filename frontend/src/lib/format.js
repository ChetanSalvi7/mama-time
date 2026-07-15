export const chf = (value) => `CHF ${new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 }).format(Number(value || 0))}.–`;
export const dateTime = (value) => value ? new Intl.DateTimeFormat('de-CH', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '–';
export const dateOnly = (value) => value ? new Intl.DateTimeFormat('de-CH', { dateStyle: 'medium' }).format(new Date(value)) : '–';
export const sourceLabel = (lead) => lead?.utm_source ? `${lead.utm_source}${lead.utm_medium ? ` / ${lead.utm_medium}` : ''}` : 'Direkt / unbekannt';
