import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="admin-loading">Backoffice wird geladen …</div>;
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location }} />;
  return <Outlet />;
}
