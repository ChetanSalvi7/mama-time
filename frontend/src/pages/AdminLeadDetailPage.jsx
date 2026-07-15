import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../lib/AuthContext.jsx';
import { chf, dateTime, sourceLabel } from '../lib/format.js';

export default function AdminLeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [lead, setLead] = useState(null);
  const [labels, setLabels] = useState({});
  const [form, setForm] = useState({ status: 'new', assigned_to: '', callback_at: '', notes: '', lost_reason: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const result = await authFetch(`/api/admin/leads/${id}`);
      setLead(result.lead); setLabels(result.statusLabels || {});
      setForm({
        status: result.lead.status || 'new', assigned_to: result.lead.assigned_to || '',
        callback_at: toLocalInput(result.lead.callback_at), notes: result.lead.notes || '', lost_reason: result.lead.lost_reason || ''
      });
    } catch (err) { setError(err.message || 'Anfrage konnte nicht geladen werden.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setSaved(false);
    try {
      const result = await authFetch(`/api/admin/leads/${id}`, { method: 'PATCH', body: JSON.stringify(form) });
      setLead(result.lead); setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err) { setError(err.message || 'Änderungen konnten nicht gespeichert werden.'); }
    finally { setSaving(false); }
  };

  const whatsapp = useMemo(() => lead?.phone ? `https://wa.me/${lead.phone.replace(/\D/g,'')}?text=${encodeURIComponent(`Hallo ${lead.first_name}, hier ist das Sentinators Gym zu deiner MAMA TIME Anfrage ${lead.reference}.`)}` : '', [lead]);

  if (loading) return <div className="empty-state"><h3>Anfrage wird geladen …</h3></div>;
  if (!lead) return <><div className="admin-alert admin-alert--error">{error || 'Anfrage nicht gefunden.'}</div><Link className="admin-btn" to="/admin">Zurück</Link></>;

  return (
    <div className="lead-detail-page">
      <section className="admin-title"><div><p className="admin-eyebrow">{lead.reference}</p><h1>{lead.first_name} {lead.last_name}</h1><p>Eingang {dateTime(lead.created_at)} · {lead.offer_label}</p></div><div className="admin-title__actions"><button className="admin-btn" type="button" onClick={() => navigate(-1)}>Zurück</button><button className="admin-btn admin-btn--primary" type="button" onClick={() => window.print()}>Drucken</button></div></section>
      {saved && <div className="admin-alert admin-alert--success">Änderungen wurden gespeichert.</div>}
      {error && <div className="admin-alert admin-alert--error">{error}</div>}
      <section className="lead-detail-card">
        <div className="lead-detail__head"><div><span className={`status status--${lead.status}`}>{labels[lead.status] || lead.status}</span><h1>{lead.first_name} {lead.last_name}</h1><p>{lead.reference} · {chf(lead.amount_chf)}</p></div><div className="lead-detail__head-actions"><a className="admin-btn admin-btn--small" href={`tel:${lead.phone}`}><Icon name="phone" />Anrufen</a><a className="admin-btn admin-btn--small" href={`mailto:${lead.email}?subject=${encodeURIComponent(`MAMA TIME ${lead.reference}`)}`}><Icon name="mail" />E-Mail</a>{whatsapp && <a className="admin-btn admin-btn--small" href={whatsapp} target="_blank" rel="noopener"><Icon name="whatsapp" />WhatsApp</a>}</div></div>
        <div className="lead-detail__grid">
          <div className="detail-facts"><h2>Kontakt &amp; Angebot</h2><div className="detail-actions"><a className="admin-btn admin-btn--small" href={`tel:${lead.phone}`}>Telefon öffnen</a><a className="admin-btn admin-btn--small" href={`mailto:${lead.email}`}>E-Mail öffnen</a></div><dl>
            <Fact term="Angebot">{lead.offer_label} · {chf(lead.amount_chf)}</Fact><Fact term="E-Mail"><a href={`mailto:${lead.email}`}>{lead.email}</a></Fact><Fact term="Telefon"><a href={`tel:${lead.phone}`}>{lead.phone}</a></Fact><Fact term="Kontaktart">{lead.preferred_contact}</Fact><Fact term="Startwunsch">{lead.start_preference}</Fact>
            {lead.offer_type === 'besties' && <Fact term="Mama-Bestie"><strong>{lead.bestie_first_name} {lead.bestie_last_name}</strong><br />{lead.bestie_email || '–'}<br />{lead.bestie_phone || '–'}</Fact>}
            <Fact term="Nachricht">{lead.message || '–'}</Fact><Fact term="Quelle">{sourceLabel(lead)}</Fact><Fact term="UTM-Kampagne">{lead.utm_campaign || '–'}</Fact><Fact term="Landingpage">{lead.landing_url || '–'}</Fact><Fact term="Datenschutz">Bestätigt am {dateTime(lead.privacy_consent_at)}</Fact>
            {lead.is_duplicate ? <Fact term="Duplikat">Mögliches Duplikat von {lead.duplicate_reference || 'einer früheren Anfrage'}</Fact> : null}
          </dl></div>
          <form className="lead-update admin-form" onSubmit={save}><h2>Bearbeitung</h2>
            <label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{Object.entries(labels).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <label>Zuständig<input value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} placeholder="z. B. Martina" /></label>
            <label>Rückruf / Follow-up<input type="datetime-local" value={form.callback_at} onChange={(e) => setForm({ ...form, callback_at: e.target.value })} /></label>
            <label>Interne Notizen<textarea rows="8" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Gespräch, nächste Schritte, Einwände …" /></label>
            <label>Grund bei verloren<input value={form.lost_reason} onChange={(e) => setForm({ ...form, lost_reason: e.target.value })} placeholder="z. B. Preis, Zeitfenster, keine Rückmeldung" /></label>
            <div className="admin-form__actions"><button className="admin-btn" type="button" onClick={load}>Verwerfen</button><button className="admin-btn admin-btn--primary" type="submit" disabled={saving}>{saving ? 'Wird gespeichert …' : 'Änderungen speichern'}</button></div>
          </form>
        </div>
      </section>
      <section className="activity-panel"><h2>Aktivitätsverlauf</h2><div className="activity-list">{lead.activities?.length ? lead.activities.map((activity) => <article className="activity-item" key={activity.id}><span className="activity-dot" /><div><h3>{activityLabel(activity.action)} · {activity.actor_name || 'System'}</h3><p>{dateTime(activity.created_at)}</p>{Object.keys(activity.details || {}).length ? <pre>{JSON.stringify(activity.details, null, 2)}</pre> : null}</div></article>) : <p>Noch keine Aktivitäten.</p>}</div></section>
    </div>
  );
}

function Fact({ term, children }) { return <div><dt>{term}</dt><dd>{children}</dd></div>; }
function toLocalInput(value) { if (!value) return ''; const date = new Date(value); if (Number.isNaN(date.getTime())) return value.slice(0,16); const local = new Date(date.getTime() - date.getTimezoneOffset()*60000); return local.toISOString().slice(0,16); }
function activityLabel(action) { return ({ lead_created:'Anfrage erstellt', lead_created_duplicate:'Als mögliches Duplikat erstellt', lead_updated:'Anfrage aktualisiert' })[action] || action; }
