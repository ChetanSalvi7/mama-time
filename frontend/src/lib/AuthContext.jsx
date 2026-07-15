import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [csrf, setCsrf] = useState('');
  const [loading, setLoading] = useState(true);
  const [defaultPasswordWarning, setDefaultPasswordWarning] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiFetch('/api/admin/auth/me');
      setUser(result.user);
      setCsrf(result.csrf);
      setDefaultPasswordWarning(Boolean(result.defaultPasswordWarning));
    } catch {
      setUser(null);
      setCsrf('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = useCallback(async (email, password) => {
    const result = await apiFetch('/api/admin/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setUser(result.user);
    setCsrf(result.csrf);
    setDefaultPasswordWarning(Boolean(result.defaultPasswordWarning));
    return result;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/admin/auth/logout', { method: 'POST', headers: { 'X-CSRF-Token': csrf } });
    } finally {
      setUser(null);
      setCsrf('');
    }
  }, [csrf]);

  const authFetch = useCallback((path, options = {}) => apiFetch(path, {
    ...options,
    headers: { ...(options.headers || {}), ...(options.method && options.method !== 'GET' ? { 'X-CSRF-Token': csrf } : {}) }
  }), [csrf]);

  const value = useMemo(() => ({ user, csrf, loading, defaultPasswordWarning, login, logout, refresh, authFetch }), [user, csrf, loading, defaultPasswordWarning, login, logout, refresh, authFetch]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
