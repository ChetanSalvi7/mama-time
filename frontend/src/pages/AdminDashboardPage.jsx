import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';
import { apiFetch, downloadUrl } from '../lib/api.js';
import { chf, dateTime, sourceLabel } from '../lib/format.js';

const defaultFilters = { q: '', status: '', offer: '', source: '', dateFrom: '', dateTo: '', sort: 'newest', includeArchived: false, page: 1, perPage: 25 };

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [data, setData] = useState({ rows: [], pagination: { page: 1, pages: 1, total: 0 }, statusLabels: {} });
  const [filters, setFilters] = useState(defaultFilters);
  const [draft, setDraft] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value !== '' && value !== false) params.set(key, String(value)); });
    try {
      const [statsResult, leadsResult] = await Promise.all([
        apiFetch('/api/admin/stats'),
        apiFetch(`/api/admin/leads?${params.toString()}`)
      ]);
      setStats(statsResult.stats);
      setData(leadsResult);
    } catch (err) {
      setError(err.message || 'Backoffice-Daten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const submitFilters = (event) => {
    event.preventDefault();
    setFilters({ ...draft, page: 1 });
  };
  const reset = () => { setDraft(defaultFilters); setFilters(defaultFilters); };
  const sourcesMax = useMemo(() => Math.max(1, ...(stats?.sources || []).map((row) => Number(row.count))), [stats]);
  const dailyMax = useMemo(() => Math.max(1, ...(stats?.daily || []).map((row) => Number(row.count))), [stats]);
  const exportParams = { ...filters, page: undefined, perPage: undefined };

  return (
    <>
      <section className="admin-title"><div><p className="admin-eyebrow">KAMPAGNE 20.07.–20.08.2026</p><h1>Formularanfragen</h1><p>Willkommen {user?.displayName}. Alle MAMA TIME Leads, Umsätze und Follow-ups an einem Ort.</p></div><div className="admin-title__actions"><a className="admin-btn" href={downloadUrl('/api/admin/leads/export.csv', exportParams)}>CSV herunterladen</a><button className="admin-btn admin-btn--primary" type="button" onClick={load}>Aktualisieren</button></div></section>
      {error && <div className="admin-alert admin-alert--error">{error}</div>}
      <section className="stat-grid" aria-label="Kennzahlen">
        <Stat label="Anfragen gesamt" value={stats?.total ?? '–'} />
        <Stat label="Neu / unbearbeitet" value={stats?.new ?? '–'} />
        <Stat label="Besties-Anfragen" value={stats?.besties ?? '–'} />
        <Stat label="Offenes Potenzial" value={stats ? chf(stats.pipelineChf) : '–'} />
        <Stat label="Abgeschlossener Umsatz" value={stats ? chf(stats.wonRevenueChf) : '–'} won />
        <Stat label="Conversion" value={stats ? `${stats.conversionRate} %` : '–'} detail={`${stats?.won || 0} abgeschlossen`} />
      </section>

      <section className="dashboard-grid">
        <article className="trend-panel"><h2>Anfragen der letzten 30 Tage</h2><div className="trend-bars">{(stats?.daily || []).length ? stats.daily.map((row) => <div key={row.day} className="trend-bar" style={{ '--height': `${Math.max(8, (row.count / dailyMax) * 100)}%` }} data-label={`${row.day}: ${row.count}`} />) : <p>Noch keine Daten.</p>}</div></article>
        <article className="source-panel"><h2>Top-Quellen</h2><div className="source-list">{(stats?.sources || []).length ? stats.sources.map((row) => <div className="source-row" key={row.source}><span>{row.source}</span><i style={{ '--width': `${(row.count / sourcesMax) * 100}%` }} /><strong>{row.count}</strong></div>) : <p>Noch keine Quellen.</p>}</div></article>
      </section>

      <section className="admin-panel">
        <form className="filters" onSubmit={submitFilters}>
          <label>Suche<input value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} placeholder="Name, E-Mail, Telefon, Referenz" /></label>
          <label>Status<select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}><option value="">Alle</option>{Object.entries(data.statusLabels || {}).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Angebot<select value={draft.offer} onChange={(e) => setDraft({ ...draft, offer: e.target.value })}><option value="">Alle</option><option value="single">1 Mama</option><option value="besties">2 Mamas / Besties</option></select></label>
          <label>Quelle<input value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value })} placeholder="facebook" /></label>
          <label>Von<input type="date" value={draft.dateFrom} onChange={(e) => setDraft({ ...draft, dateFrom: e.target.value })} /></label>
          <label>Bis<input type="date" value={draft.dateTo} onChange={(e) => setDraft({ ...draft, dateTo: e.target.value })} /></label>
          <label>Sortierung<select value={draft.sort} onChange={(e) => setDraft({ ...draft, sort: e.target.value })}><option value="newest">Neueste zuerst</option><option value="oldest">Älteste zuerst</option><option value="value_desc">Höchster Wert</option><option value="callback">Nächster Rückruf</option></select></label>
          <button className="admin-btn admin-btn--primary" type="submit">Filtern</button><button className="admin-btn" type="button" onClick={reset}>Zurücksetzen</button>
          <label className="filters__check"><input type="checkbox" checked={draft.includeArchived} onChange={(e) => setDraft({ ...draft, includeArchived: e.target.checked })} />Archivierte anzeigen</label>
        </form>
        <div className="list-head"><h2>{data.pagination.total} Anfrage{data.pagination.total === 1 ? '' : 'n'}</h2><span>{loading ? 'Wird geladen …' : `Seite ${data.pagination.page} von ${data.pagination.pages}`}</span></div>
        {loading ? <div className="empty-state"><h3>Daten werden geladen …</h3></div> : !data.rows.length ? <div className="empty-state"><h3>Noch keine passenden Anfragen</h3><p>Sobald ein Formular abgeschickt wird, erscheint der Lead hier automatisch.</p></div> : <LeadTable rows={data.rows} labels={data.statusLabels} />}
        <Pagination pagination={data.pagination} onPage={(page) => setFilters((current) => ({ ...current, page }))} />
      </section>
    </>
  );
}

function Stat({ label, value, detail, won }) { return <article className={`stat-card${won ? ' stat-card--won' : ''}`}><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</article>; }
function LeadTable({ rows, labels }) { return <div className="table-wrap"><table className="admin-table"><thead><tr><th>Eingang</th><th>Kontakt</th><th>Angebot</th><th>Quelle</th><th>Status</th><th className="numeric">Wert</th><th /></tr></thead><tbody>{rows.map((lead) => <tr key={lead.id}><td data-label="Eingang"><strong>{dateTime(lead.created_at)}</strong><small>{lead.reference}</small></td><td data-label="Kontakt"><strong>{lead.first_name} {lead.last_name}</strong><small>{lead.email}<br />{lead.phone}</small></td><td data-label="Angebot"><strong>{lead.offer_label}</strong>{lead.offer_type === 'besties' && <small>{lead.bestie_first_name} {lead.bestie_last_name}</small>}{lead.is_duplicate ? <span className="duplicate-pill">Mögliches Duplikat</span> : null}</td><td data-label="Quelle"><small>{sourceLabel(lead)}</small></td><td data-label="Status"><span className={`status status--${lead.status}`}>{labels[lead.status] || lead.status}</span></td><td data-label="Wert" className="numeric"><strong>{chf(lead.amount_chf)}</strong></td><td data-label="Aktion"><Link className="row-action" to={`/admin/leads/${lead.id}`}>Öffnen</Link></td></tr>)}</tbody></table></div>; }
function Pagination({ pagination, onPage }) { if (!pagination || pagination.pages <= 1) return null; const pages = []; for (let i = Math.max(1,pagination.page-2); i <= Math.min(pagination.pages,pagination.page+2); i++) pages.push(i); return <div className="pagination"><span>{pagination.total} Einträge</span><button disabled={pagination.page <= 1} onClick={() => onPage(pagination.page-1)}>‹</button>{pages.map((page) => <button key={page} className={page === pagination.page ? 'active' : ''} onClick={() => onPage(page)}>{page}</button>)}<button disabled={pagination.page >= pagination.pages} onClick={() => onPage(pagination.page+1)}>›</button></div>; }
