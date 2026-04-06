import React from 'react';
import { masterService } from '../../services/masterService';
import { useAuth } from '../../context/AuthContext';
import { getUserRoleId, ROLE_IDS } from '../../utils/roleAccess';
import './Dashboard.css';

type DashboardCountItem = {
  title: string;
  totalCount: number;
};

const METRIC_ACCENTS: Record<string, string> = {
  Blocks: '#0f4c81',
  Districts: '#1f78b4',
  'Gram Panchayats': '#f29f05',
  Villages: '#e15759',
};

const formatNumber = (value: number): string => new Intl.NumberFormat('en-IN').format(value);

const buildScopedCounts = (
  rawCounts: Array<{ Title: string; TotalCount: number }>,
  roleId: string | undefined,
): DashboardCountItem[] => {
  if (roleId === ROLE_IDS.STATE_ADMIN) {
    return rawCounts.map((item) => ({ title: item.Title, totalCount: item.TotalCount }));
  }

  return rawCounts
    .filter((item) => item.Title === 'Districts')
    .map((item) => ({ title: item.Title, totalCount: 1 }));
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const roleId = getUserRoleId(user);
  const hasLoadedRef = React.useRef(false);
  const [counts, setCounts] = React.useState<DashboardCountItem[]>([]);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }

    hasLoadedRef.current = true;
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        const countResult = await masterService.getDashboardCounts();

        if (cancelled) {
          return;
        }

        const scopedCounts = buildScopedCounts(countResult, roleId);
        setCounts(scopedCounts);
        setError('');
      } catch (err) {
        console.error('Failed to load dashboard counts', err);

        if (cancelled) {
          return;
        }

        setCounts([]);
        setError('Live dashboard data could not be loaded.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [roleId]);

  const visualCounts = counts;

  const maxValue = React.useMemo(
    () => Math.max(...visualCounts.map((item) => item.totalCount), 1),
    [visualCounts],
  );

  const totalValue = React.useMemo(
    () => visualCounts.reduce((sum, item) => sum + item.totalCount, 0),
    [visualCounts],
  );

  const chartPoints = React.useMemo(() => {
    if (visualCounts.length === 0) {
      return '';
    }

    if (visualCounts.length === 1) {
      return '20,88 280,24';
    }

    return visualCounts
      .map((item, index) => {
        const x = 20 + (260 / (visualCounts.length - 1)) * index;
        const y = 88 - (item.totalCount / maxValue) * 64;
        return `${x},${y}`;
      })
      .join(' ');
  }, [maxValue, visualCounts]);

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="dashboard-kicker">TRLM Admin Visual Console</p>
          <h1>Operational counts, redesigned as live graphs</h1>
          <p className="dashboard-subtitle">
            The dashboard now prioritizes visual reading: large comparative bars, distribution rings,
            and density charts driven by the live master dashboard counts API.
          </p>
          <div className="dashboard-status">
            {loading && <span className="dashboard-status-badge">Loading</span>}
            {error && <span className="dashboard-status-badge">API Error</span>}
          </div>
        </div>

        <div className="dashboard-hero-viz">
          <div className="dashboard-total-label">Total master records</div>
          <div className="dashboard-total-value">{formatNumber(totalValue)}</div>
          {visualCounts.length > 0 && (
            <svg className="dashboard-sparkline" viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="dashboardSpark" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6ec5ff" />
                  <stop offset="50%" stopColor="#ffd166" />
                  <stop offset="100%" stopColor="#ff6b6b" />
                </linearGradient>
              </defs>
              <polyline points={chartPoints} />
              {visualCounts.map((item, index) => {
                const x = visualCounts.length === 1 ? 150 : 20 + (260 / (visualCounts.length - 1)) * index;
                const y = visualCounts.length === 1 ? 24 : 88 - (item.totalCount / maxValue) * 64;
                return <circle key={item.title} cx={x} cy={y} r="4.5" />;
              })}
            </svg>
          )}
        </div>
      </section>

      {error && <div className="dashboard-alert">{error}</div>}

      <section className="dashboard-grid">
        {loading && visualCounts.length === 0 && (
          <article className="dashboard-panel dashboard-panel--wide">
            <div className="panel-head">
              <div>
                <span className="panel-eyebrow">Live Feed</span>
                <h2>Loading dashboard data</h2>
              </div>
            </div>
          </article>
        )}

        {!loading && visualCounts.length === 0 && (
          <article className="dashboard-panel dashboard-panel--wide">
            <div className="panel-head">
              <div>
                <span className="panel-eyebrow">Live Feed</span>
                <h2>No dashboard data available</h2>
              </div>
            </div>
          </article>
        )}

        {visualCounts.length > 0 && (
          <>
        <article className="dashboard-panel dashboard-panel--wide">
          <div className="panel-head">
            <div>
              <span className="panel-eyebrow">Count Comparison</span>
              <h2>Master data bar graph</h2>
            </div>
          </div>

          <div className="bar-chart">
            {visualCounts.map((item) => {
              const ratio = (item.totalCount / maxValue) * 100;

              return (
                <div className="bar-chart-row" key={item.title}>
                  <div className="bar-chart-meta">
                    <span className="bar-chart-label">{item.title}</span>
                    <strong>{formatNumber(item.totalCount)}</strong>
                  </div>
                  <div className="bar-chart-track">
                    <div
                      className="bar-chart-fill"
                      style={{
                        width: `${Math.max(ratio, 6)}%`,
                        background: `linear-gradient(90deg, ${METRIC_ACCENTS[item.title] ?? '#1f78b4'}, rgba(255,255,255,0.92))`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="dashboard-panel">
          <div className="panel-head">
            <div>
              <span className="panel-eyebrow">Share View</span>
              <h2>Distribution rings</h2>
            </div>
          </div>

          <div className="ring-grid">
            {visualCounts.map((item) => {
              const share = totalValue > 0 ? (item.totalCount / totalValue) * 100 : 0;

              return (
                <div className="ring-card" key={item.title}>
                  <div
                    className="ring-chart"
                    style={{
                      background: `conic-gradient(${METRIC_ACCENTS[item.title] ?? '#1f78b4'} ${share}%, rgba(15, 44, 73, 0.12) ${share}% 100%)`,
                    }}
                  >
                    <div className="ring-chart__inner">
                      <strong>{share.toFixed(1)}%</strong>
                    </div>
                  </div>
                  <span>{item.title}</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="dashboard-panel">
          <div className="panel-head">
            <div>
              <span className="panel-eyebrow">Density View</span>
              <h2>Visual intensity map</h2>
            </div>
          </div>

          <div className="heat-grid">
            {visualCounts.map((item) => {
              const opacity = 0.18 + (item.totalCount / maxValue) * 0.82;

              return (
                <div
                  className="heat-card"
                  key={item.title}
                  style={{
                    background: `linear-gradient(145deg, rgba(255,255,255,0.96), color-mix(in srgb, ${METRIC_ACCENTS[item.title] ?? '#1f78b4'} ${Math.round(opacity * 100)}%, white))`,
                  }}
                >
                  <span>{item.title}</span>
                  <strong>{formatNumber(item.totalCount)}</strong>
                </div>
              );
            })}
          </div>
        </article>

        <article className="dashboard-panel dashboard-panel--wide">
          <div className="panel-head">
            <div>
              <span className="panel-eyebrow">Relative Scale</span>
              <h2>Normalized skyline graph</h2>
            </div>
          </div>

          <div className="skyline-chart">
            {visualCounts.map((item) => {
              const height = `${Math.max((item.totalCount / maxValue) * 100, 8)}%`;

              return (
                <div className="skyline-column" key={item.title}>
                  <div
                    className="skyline-column__bar"
                    style={{
                      height,
                      background: `linear-gradient(180deg, ${METRIC_ACCENTS[item.title] ?? '#1f78b4'}, rgba(15, 35, 64, 0.92))`,
                    }}
                  />
                  <strong>{formatNumber(item.totalCount)}</strong>
                  <span>{item.title}</span>
                </div>
              );
            })}
          </div>
        </article>
          </>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
