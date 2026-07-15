import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';

export default function AdminAccountPage() {
  const { user, authFetch, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault(); setError('');
    if (form.new_password !== form.confirm) return setError('Die neuen Passwörter stimmen nicht überein.');
    setSaving(true);
    try {
      await authFetch('/api/admin/auth/change-password', { method: 'POST', body: JSON.stringify({ current_password: form.current_password, new_password: form.new_password }) });
      await logout();
      navigate('/admin/login', { replace: true, state: { message: 'Passwort geändert.' } });
    } catch (err) { setError(err.message || 'Passwort konnte nicht geändert werden.'); }
    finally { setSaving(false); }
  };

  return <><section className="admin-title"><div><p className="admin-eyebrow">SICHERHEIT</p><h1>Administratorkonto</h1><p>Login-Daten und Zugriffsschutz verwalten.</p></div></section><section className="settings-card account-card"><div className="account-meta"><div><span>Angemeldet als</span><strong>{user?.displayName}</strong></div><div><span>E-Mail</span><strong>{user?.email}</strong></div></div>{error && <div className="admin-alert admin-alert--error">{error}</div>}<form className="admin-form" onSubmit={submit}><label>Aktuelles Passwort<input type="password" value={form.current_password} onChange={(e) => setForm({ ...form, current_password: e.target.value })} autoComplete="current-password" required /></label><label>Neues Passwort<input type="password" value={form.new_password} onChange={(e) => setForm({ ...form, new_password: e.target.value })} autoComplete="new-password" minLength="12" required /></label><label>Neues Passwort wiederholen<input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} autoComplete="new-password" minLength="12" required /></label><div className="admin-form__actions"><button className="admin-btn admin-btn--primary" type="submit" disabled={saving}>{saving ? 'Wird geändert …' : 'Passwort ändern'}</button></div></form></section></>;
}
