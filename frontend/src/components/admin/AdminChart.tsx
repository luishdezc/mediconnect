import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api';
import styles from './AdminCharts.module.scss';

interface StatusCount { _id: string; count: number; }

const STATUS_LABELS: Record<string, string> = {
  pending:     'Pendientes',
  confirmed:   'Confirmadas',
  in_progress: 'En consulta',
  completed:   'Completadas',
  cancelled:   'Canceladas',
  no_show:     'No asistió',
};

const STATUS_COLORS: Record<string, string> = {
  pending:     '#f0b96a',
  confirmed:   '#1a6b5c',
  in_progress: '#2b6cb0',
  completed:   '#38a169',
  cancelled:   '#a0aec0',
  no_show:     '#e53e3e',
};

const AdminCharts: React.FC = () => {
  const [byStatus, setByStatus] = useState<StatusCount[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    adminApi.getStats()
      .then(r => setByStatus(r.data.appointmentsByStatus || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = byStatus.reduce((s, x) => s + x.count, 0);

  if (loading) return (
    <div className={styles.loading}>
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 48, borderRadius: 8 }} />)}
    </div>
  );

  if (total === 0) return (
    <div className={styles.empty}>
      <span>📊</span>
      <p>Sin datos de citas todavía</p>
    </div>
  );

  return (
    <div className={styles.wrap}>
      {/* Donut chart */}
      <div className={styles.donut}>
        <div className={styles.donutRings}>
          {(() => {
            let offset = 0;
            const r = 54; const circ = 2 * Math.PI * r;
            return byStatus.map(s => {
              const pct = s.count / total;
              const dash = pct * circ;
              const gap  = circ - dash;
              const rot  = offset * 360 - 90;
              offset += pct;
              return (
                <circle
                  key={s._id}
                  r={r} cx={64} cy={64}
                  fill="none"
                  stroke={STATUS_COLORS[s._id] || '#cbd5e0'}
                  strokeWidth={20}
                  strokeDasharray={`${dash} ${gap}`}
                  transform={`rotate(${rot} 64 64)`}
                  style={{ transition: 'stroke-dasharray 0.6s ease' }}
                />
              );
            });
          })()}
        </div>
        <svg viewBox="0 0 128 128" className={styles.donutSvg}>
          <circle r={54} cx={64} cy={64} fill="none" stroke="#f1f5f9" strokeWidth={20}/>
          {(() => {
            let offset = 0;
            const r = 54; const circ = 2 * Math.PI * r;
            return byStatus.map(s => {
              const pct = s.count / total;
              const dash = pct * circ;
              const gap  = circ - dash;
              const rot  = offset * 360 - 90;
              offset += pct;
              return (
                <circle
                  key={s._id}
                  r={r} cx={64} cy={64}
                  fill="none"
                  stroke={STATUS_COLORS[s._id] || '#cbd5e0'}
                  strokeWidth={20}
                  strokeDasharray={`${dash} ${gap}`}
                  transform={`rotate(${rot} 64 64)`}
                  style={{ transition: 'all 0.6s ease' }}
                />
              );
            });
          })()}
          <text x={64} y={60} textAnchor="middle" className={styles.donutTotal}>{total}</text>
          <text x={64} y={76} textAnchor="middle" className={styles.donutLabel}>citas</text>
        </svg>
      </div>

      {/* Bar chart */}
      <div className={styles.bars}>
        {byStatus
          .sort((a, b) => b.count - a.count)
          .map(s => {
            const pct = total > 0 ? (s.count / total) * 100 : 0;
            return (
              <div key={s._id} className={styles.barRow}>
                <div className={styles.barLabel}>
                  <span className={styles.barDot} style={{ background: STATUS_COLORS[s._id] || '#cbd5e0' }}/>
                  <span className={styles.barName}>{STATUS_LABELS[s._id] || s._id}</span>
                  <span className={styles.barCount}>{s.count}</span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${pct}%`,
                      background: STATUS_COLORS[s._id] || '#cbd5e0',
                    }}
                  />
                </div>
                <span className={styles.barPct}>{pct.toFixed(0)}%</span>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default AdminCharts;
