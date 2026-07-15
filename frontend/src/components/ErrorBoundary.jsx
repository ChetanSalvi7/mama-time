import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[MAMA TIME] Frontend error:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="fatal-error" role="alert">
        <div className="fatal-error__card">
          <p className="eyebrow">SENTINATORS GYM</p>
          <h1>Die Seite konnte nicht vollständig geladen werden.</h1>
          <p>Bitte lade die Seite neu. Bleibt das Problem bestehen, kontaktiere das Sentinators Gym direkt.</p>
          <button className="btn btn--primary" type="button" onClick={() => window.location.reload()}>Seite neu laden</button>
        </div>
      </main>
    );
  }
}
