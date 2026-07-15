import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';

export default function AdminLoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(import.meta.env.DEV ? 'admin@sentinators.local' : '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.body.className = 'admin-mode';
    return () => { document.body.className = ''; };
  }, []);

  if (!loading && user) return <Navigate to="/admin" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || '/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Anmeldung fehlgeschlagen.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-brand"><strong>SENTINATORS GYM</strong><span>MAMA TIME BACKOFFICE</span></div>
        <h1>Anmelden</h1>
        <p>Geschützter Zugriff auf Formularanfragen, Status und Kampagneneinstellungen.</p>
        {error && <div className="admin-alert admin-alert--error" role="alert">{error}</div>}
        <form onSubmit={submit}>
          <label>E-Mail-Adresse<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required /></label>
          <label>Passwort<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
          <button className="admin-btn admin-btn--primary" type="submit" disabled={submitting}>{submitting ? 'Anmeldung läuft …' : 'Sicher anmelden'}</button>
        </form>
        <small>Der Standardzugang ist nur für die lokale Installation gedacht. Passwort vor dem Livegang zwingend ändern.</small>
      </section>
    </div>
  );
}
