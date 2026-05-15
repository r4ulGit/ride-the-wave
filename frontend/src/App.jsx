import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import './App.css'

// API CONFIGURATION
const API_URL = import.meta.env.DEV 
  ? "http://127.0.0.1:5000/" 
  : "https://4gep4vk4j4tdbl2uhx2pdu5gt40hkcvy.lambda-url.eu-west-1.on.aws/";

// --- HELPERS ---
const SPORT_CONFIG = {
  Run:       { icon: '🏃', color: '#fc4c02' },
  Ride:      { icon: '🚴', color: '#3b82f6' },
  Swim:      { icon: '🏊', color: '#06b6d4' },
  Hike:      { icon: '🥾', color: '#22c55e' },
  Walk:      { icon: '🚶', color: '#84cc16' },
  Workout:   { icon: '💪', color: '#a855f7' },
  Yoga:      { icon: '🧘', color: '#ec4899' },
  Default:   { icon: '⚡', color: '#f59e0b' },
};

function getSportConfig(sportType) {
  return SPORT_CONFIG[sportType] || SPORT_CONFIG.Default;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('es-ES', { 
    day: '2-digit', month: 'short', year: 'numeric' 
  });
}

function formatNumber(num, decimals = 0) {
  return (num || 0).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

// --- CUSTOM TOOLTIP FOR CHART ---
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.75rem 1rem',
        boxShadow: 'var(--shadow-card)',
      }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>{label}</p>
        <p style={{ color: 'var(--strava-orange)', fontWeight: 700, fontSize: '1rem' }}>
          {formatNumber(payload[0].value, 1)} km
        </p>
        {payload[0].payload.count && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: 2 }}>
            {payload[0].payload.count} activities
          </p>
        )}
      </div>
    );
  }
  return null;
}

function App() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- WIDGET DETECTION ---
  const searchParams = new URLSearchParams(window.location.search);
  const isWidget = searchParams.get('mode') === 'widget';

  useEffect(() => {
    fetch(API_URL)
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => { throw new Error(text || 'Network response was not ok') });
        }
        return response.json();
      })
      .then(data => {
        if (typeof data.total_km === 'undefined') {
          throw new Error("Backend format error: Missing 'total_km'.");
        }
        setStats(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching data:", error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <span className="loading-text">Loading your activities...</span>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (error) {
    return (
      <div className="error-screen">
        <div>
          <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>😵</span>
          <strong>Error loading data</strong>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.7 }}>{error}</p>
        </div>
      </div>
    );
  }

  const goal = stats.config?.goal_km || 500;
  const filteredKm = stats.filtered_km || 0;
  const percentage = Math.min(Math.max((filteredKm / goal) * 100, 0), 100);

  return (
    <div className={isWidget ? 'widget-mode' : ''}>
      
      {/* --- HEADER --- */}
      <header className="app-header" id="app-header">
        <h1 className="app-title">🌊 Ride the Wave</h1>
        <p className="app-subtitle">Personal Strava Activity Dashboard</p>
      </header>

      {/* --- HERO STATS --- */}
      <section className="hero-stats" id="hero-stats">
        <div className="stat-card animate-in">
          <div className="stat-icon">📏</div>
          <div className="stat-label">Total Distance</div>
          <div className="stat-value">
            {formatNumber(stats.total_km, 1)}
            <span className="stat-unit">km</span>
          </div>
        </div>
        <div className="stat-card animate-in">
          <div className="stat-icon">🏋️</div>
          <div className="stat-label">Activities</div>
          <div className="stat-value">{stats.total_activities || 0}</div>
        </div>
        <div className="stat-card animate-in">
          <div className="stat-icon">⛰️</div>
          <div className="stat-label">Elevation Gain</div>
          <div className="stat-value">
            {formatNumber(stats.total_elevation, 0)}
            <span className="stat-unit">m</span>
          </div>
        </div>
        <div className="stat-card animate-in">
          <div className="stat-icon">⏱️</div>
          <div className="stat-label">Total Time</div>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>
            {stats.total_time_display || '0m'}
          </div>
        </div>
      </section>

      {/* --- PROGRESS BAR --- */}
      <section className="progress-section animate-in" id="progress-section">
        <div className="progress-header">
          <span className="progress-title">
            {stats.config?.filter_word || 'Run'} Goal Progress
          </span>
          <span className="progress-goal">
            Goal: {formatNumber(goal)} km
          </span>
        </div>
        
        <div className="progress-track" style={{ position: 'relative' }}>
          <div 
            className="progress-fill" 
            style={{ width: `${percentage}%` }}
          />
          <div 
            className="progress-runner"
            style={{ left: `${percentage}%` }}
          >
            🏃
          </div>
        </div>
        
        <div className="progress-info">
          <span>{formatNumber(filteredKm, 1)} km</span>
          <span className="progress-percentage">{percentage.toFixed(1)}%</span>
          <span>{formatNumber(goal - filteredKm, 1)} km remaining</span>
        </div>
      </section>

      {/* --- CONTENT GRID: CHART + SPORT BREAKDOWN --- */}
      <div className="content-grid">
        
        {/* Weekly Chart */}
        <div className="section-card animate-in" id="weekly-chart">
          <h2 className="section-title">
            <span className="title-icon">📊</span>
            Weekly Distance
          </h2>
          {stats.weekly_chart && stats.weekly_chart.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weekly_chart} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="week" 
                    tick={{ fill: '#666677', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#666677', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar 
                    dataKey="distance_km" 
                    fill="var(--strava-orange)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="chart-empty">No weekly data available yet</div>
          )}
        </div>

        {/* Sport Breakdown */}
        <div className="section-card animate-in" id="sport-breakdown">
          <h2 className="section-title">
            <span className="title-icon">🏅</span>
            By Sport
          </h2>
          <div className="sport-list">
            {stats.sport_breakdown && stats.sport_breakdown.map((sport) => {
              const config = getSportConfig(sport.sport);
              return (
                <div className="sport-item" key={sport.sport}>
                  <div className="sport-dot" style={{ background: config.color }} />
                  <div style={{ fontSize: '1.2rem', flexShrink: 0 }}>{config.icon}</div>
                  <div className="sport-info">
                    <div className="sport-name">{sport.sport}</div>
                    <div className="sport-meta">
                      {sport.count} activities · {sport.time_display} · ⛰️ {formatNumber(sport.elevation)}m
                    </div>
                  </div>
                  <div className="sport-distance">
                    {formatNumber(sport.distance_km, 1)}
                    <span className="unit"> km</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- RECENT ACTIVITIES --- */}
      {stats.last_10_activities && stats.last_10_activities.length > 0 && (
        <section className="activities-section section-card animate-in" id="recent-activities">
          <h2 className="section-title">
            <span className="title-icon">🕐</span>
            Recent Activities
          </h2>
          <div className="activity-list">
            {stats.last_10_activities.map((act, index) => {
              const config = getSportConfig(act.sport_type);
              return (
                <div className="activity-item animate-in" key={act.id || index}>
                  <div 
                    className="activity-sport-badge"
                    style={{ background: `${config.color}20` }}
                  >
                    {config.icon}
                  </div>
                  <div className="activity-details">
                    <div className="activity-title">{act.title}</div>
                    <div className="activity-meta">
                      <span>{formatDate(act.date_local || act.date)}</span>
                      <span>{act.moving_time_display}</span>
                      {act.pace && <span>⚡ {act.pace} /km</span>}
                      {act.total_elevation_gain > 0 && (
                        <span>⛰️ {formatNumber(act.total_elevation_gain)}m</span>
                      )}
                      {act.kudos_count > 0 && <span>👏 {act.kudos_count}</span>}
                    </div>
                  </div>
                  <div className="activity-stats">
                    <div className="activity-stat">
                      <div className="activity-stat-value">
                        {formatNumber(act.distance_km, 2)}
                      </div>
                      <div className="activity-stat-label">km</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}

export default App
