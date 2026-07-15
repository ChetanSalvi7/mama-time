import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { IconSprite } from './components/Icon.jsx';
import { AuthProvider } from './lib/AuthContext.jsx';
import LandingPage from './pages/LandingPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import AdminLeadDetailPage from './pages/AdminLeadDetailPage.jsx';
import AdminSettingsPage from './pages/AdminSettingsPage.jsx';
import AdminAccountPage from './pages/AdminAccountPage.jsx';
import LegalPage from './pages/LegalPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return <BrowserRouter><IconSprite /><AuthProvider><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/impressum" element={<LegalPage type="imprint" />} />
    <Route path="/datenschutz" element={<LegalPage type="privacy" />} />
    <Route path="/admin/login" element={<AdminLoginPage />} />
    <Route element={<ProtectedRoute />}><Route path="/admin" element={<AdminLayout />}><Route index element={<AdminDashboardPage />} /><Route path="leads/:id" element={<AdminLeadDetailPage />} /><Route path="settings" element={<AdminSettingsPage />} /><Route path="account" element={<AdminAccountPage />} /></Route></Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes></AuthProvider></BrowserRouter>;
}
