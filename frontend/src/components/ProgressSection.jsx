import { formatNum } from '../utils/helpers';
import { getSport } from '../config';

export function ProgressSection({ stats }) {
  const goal        = stats.config?.goal_km;
  const filteredKm  = stats.filtered_km || 0;
  const filterWord  = stats.config?.filter_word || 'Run';

  const primarySport = filterWord.split(',')[0].trim();
  const sportTheme   = getSport(primarySport);
  const sportIcon    = sportTheme.icon;

  if (goal === undefined || goal === null || goal <= 0) {
    return (
      <section className="progress-section glass-card animate-in" id="progress-section" style={{ padding: '1.5rem 2rem', marginBottom: '2.5rem' }}>
        <div className="progress-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
          <span className="progress-title" style={{ fontSize: '1.1rem', fontWeight: 700 }}>Total</span>
          <div className="progress-numbers" style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.25rem' }}>{sportIcon}</span>
            <span className="progress-current" style={{ fontSize: '1.8rem', fontWeight: 900 }}>{formatNum(filteredKm)}</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>km</span>
          </div>
        </div>
      </section>
    );
  }

  const pct = Math.min(Math.max((filteredKm / goal) * 100, 0), 100);

  return (
    <section className="progress-section glass-card animate-in" id="progress-section">
      <div className="progress-header">
        <span className="progress-title">Objetivo</span>
        <div className="progress-numbers">
          <span className="progress-current">{formatNum(filteredKm)}</span>
          <span className="progress-goal">/ {formatNum(goal, 0)} km</span>
        </div>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
        <div className="progress-runner" style={{ left: `${pct}%` }}>{sportIcon}</div>
      </div>

      <div className="progress-footer">
        <span>0 km</span>
        <span className="progress-pct">{pct.toFixed(1)}%</span>
        <span>Quedan {formatNum(goal - filteredKm)} km</span>
      </div>
    </section>
  );
}
