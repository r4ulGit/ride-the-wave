import { formatNum } from '../utils/helpers';

export function ProgressSection({ stats }) {
  const goal        = stats.config?.goal_km || 500;
  const filteredKm  = stats.filtered_km || 0;
  const pct         = Math.min(Math.max((filteredKm / goal) * 100, 0), 100);
  const filterWord  = stats.config?.filter_word || 'Run';

  return (
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
  );
}
