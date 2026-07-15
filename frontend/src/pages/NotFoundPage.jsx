import React from 'react';
import { Link } from 'react-router-dom';
export default function NotFoundPage() { return <div className="legal-page"><main className="page-shell legal-page__content"><p className="eyebrow">404</p><h1>Seite nicht gefunden</h1><p>Die angeforderte Seite ist nicht verfügbar.</p><Link className="btn btn--primary" to="/">Zur Landingpage</Link></main></div>; }
