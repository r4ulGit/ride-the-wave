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
    const fetchLockKey = 'strava_dashboard_fetching';
    const cacheTTL = 2 * 60 * 1000; // 2-minute cache TTL

    function tryReadCache() {
      const cachedData = sessionStorage.getItem(cacheKey);
      const cachedExpiry = sessionStorage.getItem(cacheExpiryKey);
      if (cachedData && cachedExpiry && Date.now() < parseInt(cachedExpiry, 10)) {
        try { return JSON.parse(cachedData); } catch { /* invalid cache */ }
      }
      return null;
    }

    // 1. Check if valid cache already exists
    const cached = tryReadCache();
    if (cached) {
      setStats(cached);
      setLoading(false);
      return;
    }

    // 2. Check if another iframe is already fetching (lock-based dedup).
    //    If a fetch lock exists and was set less than 15s ago, poll for the
    //    cached result instead of making a parallel API call.
    const lockTimestamp = sessionStorage.getItem(fetchLockKey);
    if (lockTimestamp && (Date.now() - parseInt(lockTimestamp, 10)) < 15000) {
      let attempts = 0;
      const maxAttempts = 20; // 20 × 500ms = 10s max wait
      const pollInterval = setInterval(() => {
        attempts++;
        const result = tryReadCache();
        if (result) {
          clearInterval(pollInterval);
          setStats(result);
          setLoading(false);
        } else if (attempts >= maxAttempts) {
          // Lock expired without data — fall through and fetch ourselves
          clearInterval(pollInterval);
          doFetch();
        }
      }, 500);
      return;
    }

    doFetch();

    function doFetch() {
      // Set lock so parallel iframes know a fetch is in progress
      sessionStorage.setItem(fetchLockKey, Date.now().toString());

      getAuthHeaders()
        .then(headers => fetch(API_URL, { headers }))
        .then(r => {
          if (!r.ok) return r.text().then(t => { throw new Error(t || 'Network error') });
          return r.json();
        })
        .then(data => {
          if (typeof data.total_km === 'undefined') throw new Error("Bad API response");
          
          // Cache the retrieved data and release the lock
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
          sessionStorage.setItem(cacheExpiryKey, (Date.now() + cacheTTL).toString());
          sessionStorage.removeItem(fetchLockKey);

          setStats(data);
          setLoading(false);
        })
        .catch(e => {
          sessionStorage.removeItem(fetchLockKey);
          setError(e.message);
          setLoading(false);
        });
    }
  }, []);

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <span className="loading-text">Cargando tus actividades...</span>
    </div>
  );

  if (error) return (
    <div className="error-screen">
      <div>
        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>😵</span>
        <strong>Error al cargar los datos</strong>
        <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.6 }}>{error}</p>
      </div>
    </div>
  );

  const filterWord = stats.config?.filter_word || 'Run';
  const primarySport = filterWord.split(',')[0].trim();
  const sportTheme = getSport(primarySport);
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
          <p className="section-heading">Actividades Recientes</p>
          <ActivityCarousel activities={stats.last_activities} />
        </section>
      )}
    </div>
  );
}

export default App;
