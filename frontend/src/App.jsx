import { useState, useEffect } from 'react';
import './App.css';
import { API_URL, getSport } from './config';
import { ProgressSection } from './components/ProgressSection';
import { ActivityCarousel } from './components/ActivityCarousel';
import { CombinedMap } from './components/CombinedMap';
import { getAuthHeaders } from './apiAuth';

function App() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    const cacheKey = 'strava_dashboard_data';
    const cacheExpiryKey = 'strava_dashboard_data_expiry';
    const cacheTTL = 2 * 60 * 1000; // 2-minute cache TTL

    const cachedData = sessionStorage.getItem(cacheKey);
    const cachedExpiry = sessionStorage.getItem(cacheExpiryKey);
    const now = Date.now();

    // Check if valid cache exists to prevent double requests when embedding twice
    if (cachedData && cachedExpiry && now < parseInt(cachedExpiry, 10)) {
      try {
        const parsed = JSON.parse(cachedData);
        setStats(parsed);
        setLoading(false);
        return;
      } catch (e) {
        sessionStorage.removeItem(cacheKey);
        sessionStorage.removeItem(cacheExpiryKey);
      }
    }

    getAuthHeaders()
      .then(headers => fetch(API_URL, { headers }))
      .then(r => {

        if (!r.ok) return r.text().then(t => { throw new Error(t || 'Network error') });
        return r.json();
      })
      .then(data => {
        if (typeof data.total_km === 'undefined') throw new Error("Bad API response");
        
        // Cache the retrieved data
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
        sessionStorage.setItem(cacheExpiryKey, (Date.now() + cacheTTL).toString());

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

  const filterWord = stats.config?.filter_word || 'Run';
  const sportTheme = getSport(filterWord);
  const title = stats.config?.title || 'Kilómetros recorridos';

  // Parse modular view parameter
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view'); // 'map', 'activities', or null
  const containerClass = view === 'map' ? 'view-map' : (view === 'activities' ? 'view-activities' : 'view-full');

  return (
    <div className={containerClass}>
      {/* HEADER */}
      {view !== 'activities' && (
        <header className="app-header">
          <h1 className="app-title">{title}</h1>
        </header>
      )}

      {/* PROGRESS BAR */}
      {view !== 'activities' && <ProgressSection stats={stats} />}

      {/* COMBINED HEATMAP */}
      {view !== 'activities' && stats.all_polylines?.length > 0 && (
        <section id="heatmap-section">
          <CombinedMap polylines={stats.all_polylines} color={sportTheme.color} subtitle={stats.config?.subtitle} />
        </section>
      )}

      {/* RECENT ACTIVITIES INFINITE CAROUSEL */}
      {view !== 'map' && stats.last_activities?.length > 0 && (
        <section id="recent-activities">
          <p className="section-heading">Recent Activities</p>
          <ActivityCarousel activities={stats.last_activities} />
        </section>
      )}
    </div>
  );
}

export default App;
