import { getSport } from '../config';
import { formatDate, formatDuration, formatPace, formatNum } from '../utils/helpers';
import { RouteMap } from './RouteMap';

export function ActivityCard({ act, onCenterMe }) {
  const sport = getSport(act.sport_type);
  const isRun = act.sport_type?.toLowerCase().includes('run');

  return (
    <div className="activity-card glass-card animate-in" onClick={onCenterMe}>
      {/* Route map */}
      <div className="card-map">
        <RouteMap polyline={act.summary_polyline} color={sport.color} />
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
