import { useState, useEffect } from 'react';
import './App.css';
import { API_URL } from './config';
import { ProgressSection } from './components/ProgressSection';
import { ActivityCarousel } from './components/ActivityCarousel';

function App() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then(r => {
        if (!r.ok) return r.text().then(t => { throw new Error(t || 'Network error') });
        return r.json();
      })
      .then(data => {
        if (typeof data.total_km === 'undefined') throw new Error("Bad API response");
        setStats(data);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <span className="loading-text">Loading your activities...</span>
    </div>
  );

  if (error) return (
    <div className="error-screen">
      <div>
        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>😵</span>
        <strong>Error loading data</strong>
        <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.6 }}>{error}</p>
      </div>
    </div>
  );

  return (
    <div>
      {/* HEADER */}
      <header className="app-header">
        <h1 className="app-title">🌊 Ride the Wave</h1>
        <p className="app-subtitle">Strava Activity Dashboard</p>
      </header>

      {/* PROGRESS BAR */}
      <ProgressSection stats={stats} />

      {/* RECENT ACTIVITIES INFINITE CAROUSEL */}
      {stats.last_10_activities?.length > 0 && (
        <section id="recent-activities">
          <p className="section-heading">Recent Activities</p>
          <ActivityCarousel activities={stats.last_10_activities} />
        </section>
      )}
    </div>
  );
}

export default App;
