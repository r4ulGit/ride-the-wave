import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet'
import './App.css'

// --- API CONFIGURATION ---
const API_URL = "https://4gep4vk4j4tdbl2uhx2pdu5gt40hkcvy.lambda-url.eu-west-1.on.aws/";

// --- SPORT CONFIG ---
const SPORT_CONFIG = {
  Run:     { icon: '🏃', color: '#fc4c02', label: 'Run' },
  Ride:    { icon: '🚴', color: '#3b82f6', label: 'Ride' },
  Swim:    { icon: '🏊', color: '#06b6d4', label: 'Swim' },
  Hike:    { icon: '🥾', color: '#22c55e', label: 'Hike' },
  Walk:    { icon: '🚶', color: '#84cc16', label: 'Walk' },
  Workout: { icon: '💪', color: '#a855f7', label: 'Workout' },
  Yoga:    { icon: '🧘', color: '#ec4899', label: 'Yoga' },
  Default: { icon: '⚡', color: '#f59e0b', label: 'Activity' },
};

function getSport(sportType) {
  return SPORT_CONFIG[sportType] || SPORT_CONFIG.Default;
}

// --- POLYLINE DECODER ---
// Implements the Google Encoded Polyline Algorithm
function decodePolyline(encoded) {
  if (!encoded) return [];
  const points = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let shift = 0, result = 0, b;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);

    shift = 0; result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

// --- FIT BOUNDS HELPER ---
// Zooms the Leaflet map to fit the full route after render
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length > 1) {
      map.fitBounds(positions, { padding: [18, 18] });
    }
  }, [map]);
  return null;
}

// --- ROUTE MAP COMPONENT (Leaflet) ---
function RouteMap({ polyline, color, activityId }) {
  const positions = decodePolyline(polyline);

  if (positions.length < 2) {
    return (
      <div className="card-map-empty">
        {getSport('Default').icon}
      </div>
    );
  }

  // A center estimate (midpoint of route) for initial render before FitBounds runs
  const mid = positions[Math.floor(positions.length / 2)];

  return (
    <MapContainer
      key={activityId}
      center={mid}
      zoom={13}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      touchZoom={false}
      keyboard={false}
      attributionControl={false}
    >
      {/* CartoDB Dark Matter — free, no API key, matches dark theme */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* Route polyline with glow effect via two overlapping lines */}
      <Polyline positions={positions} color={color} weight={6}  opacity={0.15} />
      <Polyline positions={positions} color={color} weight={2.5} opacity={0.95} />

      {/* Auto-fit map to route bounds */}
      <FitBounds positions={positions} />
    </MapContainer>
  );
}

// --- HELPERS ---
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d) ? '' : d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatPace(speedMs) {
  if (!speedMs || speedMs === 0) return '—';
  const s = 1000 / speedMs;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function formatNum(n, dec = 1) {
  return (n || 0).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

// --- ACTIVITY CARD ---
function ActivityCard({ act, onCenterMe }) {
  const sport = getSport(act.sport_type);
  const isRun = act.sport_type?.toLowerCase().includes('run');

  return (
    <div className="activity-card glass-card animate-in" onClick={onCenterMe}>
      {/* Route map */}
      <div className="card-map">
        <RouteMap polyline={act.summary_polyline} color={sport.color} activityId={act.id} />
      </div>

      {/* Card body */}
      <div className="card-body">
        {/* Sport + date row */}
        <div className="card-sport-row">
          <div className="card-sport-dot" style={{ background: sport.color }} />
          <span className="card-sport-label" style={{ color: sport.color }}>{sport.label}</span>
          <span className="card-date">{formatDate(act.date_local || act.date)}</span>
        </div>

        {/* Title */}
        <div className="card-title">{act.title}</div>

        {/* Stats grid */}
        <div className="card-stats">
          <div className="card-stat">
            <span className="card-stat-value">{formatNum(act.distance_km)} <span style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>km</span></span>
            <span className="card-stat-label">Distance</span>
          </div>
          <div className="card-stat">
            <span className="card-stat-value">{formatDuration(act.moving_time_seconds)}</span>
            <span className="card-stat-label">Time</span>
          </div>
          <div className="card-stat">
            {isRun ? (
              <>
                <span className="card-stat-value" style={{fontSize:'0.85rem'}}>{formatPace(act.average_speed)}</span>
                <span className="card-stat-label">/km</span>
              </>
            ) : (
              <>
                <span className="card-stat-value">{formatNum(act.total_elevation_gain, 0)} <span style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>m</span></span>
                <span className="card-stat-label">Elevation</span>
              </>
            )}
          </div>
        </div>

        {/* Device + kudos */}
        <div className="card-bottom-row">
          <span className="card-device">📱 {act.device_name !== 'Unknown' ? act.device_name : '—'}</span>
          {act.kudos_count > 0 && (
            <span className="card-kudos">👏 {act.kudos_count}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// --- INFINITE CAROUSEL ---
function ActivityCarousel({ activities }) {
  const stripRef  = useRef(null);
  const jumping   = useRef(false);
  const timerRef  = useRef(null);

  if (!activities?.length) return null;

  const n = activities.length;
  // Build [clone-of-last, ...real items..., clone-of-first]
  const items = [activities[n - 1], ...activities, activities[0]];

  // Scroll to the real first item (index 1) on mount — instant, no animation
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const realFirst = strip.children[1];
    if (!realFirst) return;
    const cardW  = realFirst.offsetWidth;
    const stripW = strip.clientWidth;
    strip.scrollLeft = realFirst.offsetLeft - (stripW - cardW) / 2;
  }, [activities.length]);

  // After each scroll settles, if we landed on a clone → silently jump to the real item
  const handleScroll = () => {
    if (jumping.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const strip = stripRef.current;
      if (!strip) return;
      const stripW = strip.clientWidth;

      const getCenter = (el) => el.offsetLeft - (stripW - el.offsetWidth) / 2;

      const cloneFirst = strip.children[n + 1]; // clone of first, at the end
      const cloneLast  = strip.children[0];     // clone of last, at the start
      const realFirst  = strip.children[1];
      const realLast   = strip.children[n];

      const sl = strip.scrollLeft;
      const tol = stripW * 0.15;

      let target = null;
      if (Math.abs(sl - getCenter(cloneFirst)) < tol) target = getCenter(realFirst);
      if (Math.abs(sl - getCenter(cloneLast))  < tol) target = getCenter(realLast);

      if (target !== null) {
        jumping.current = true;
        strip.scrollLeft = target;           // instant jump (no smooth)
        setTimeout(() => { jumping.current = false; }, 80);
      }
    }, 120);
  };

  // Click a card → smooth-scroll to center it
  const handleCardClick = (index) => {
    const strip = stripRef.current;
    if (!strip) return;
    const child = strip.children[index];
    if (!child) return;
    const target = child.offsetLeft - (strip.clientWidth - child.offsetWidth) / 2;
    strip.scrollTo({ left: target, behavior: 'smooth' });
  };

  return (
    <div className="carousel-wrapper">
      <div className="activities-strip" ref={stripRef} onScroll={handleScroll}>
        {items.map((act, i) => (
          <ActivityCard
            key={`${act.id || act.title}-${i}`}
            act={act}
            onCenterMe={() => handleCardClick(i)}
          />
        ))}
      </div>
    </div>
  );
}

// --- MAIN APP ---
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

  const goal        = stats.config?.goal_km || 500;
  const filteredKm  = stats.filtered_km || 0;
  const pct         = Math.min(Math.max((filteredKm / goal) * 100, 0), 100);
  const filterWord  = stats.config?.filter_word || 'Run';

  return (
    <div>
      {/* HEADER */}
      <header className="app-header">
        <h1 className="app-title">🌊 Ride the Wave</h1>
        <p className="app-subtitle">Strava Activity Dashboard</p>
      </header>

      {/* PROGRESS BAR */}
      <section className="progress-section glass-card animate-in" id="progress-section">
        <div className="progress-header">
          <span className="progress-title">{filterWord} Goal</span>
          <div className="progress-numbers">
            <span className="progress-current">{formatNum(filteredKm)}</span>
            <span className="progress-goal">/ {formatNum(goal, 0)} km</span>
          </div>
        </div>

        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
          <div className="progress-runner" style={{ left: `${pct}%` }}>🏃</div>
        </div>

        <div className="progress-footer">
          <span>0 km</span>
          <span className="progress-pct">{pct.toFixed(1)}%</span>
          <span>{formatNum(goal - filteredKm)} km to go</span>
        </div>
      </section>

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

export default App
