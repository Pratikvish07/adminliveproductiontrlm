import React from 'react';
import { masterService } from '../../services/masterService';
import type { District } from '../../types/master.types';
import './Dashboard.css';

const DASHBOARD_CACHE_KEY = 'trlm_dashboard_summary_v1';
const DASHBOARD_CACHE_TTL_MS = 30 * 60 * 1000;

type DashboardCache = {
  districts: District[];
  cachedAt: number;
};

const readDashboardCache = (): DashboardCache | null => {
  try {
    const rawCache = localStorage.getItem(DASHBOARD_CACHE_KEY);
    if (!rawCache) {
      return null;
    }

    const cache = JSON.parse(rawCache) as DashboardCache;
    const isExpired = Date.now() - cache.cachedAt > DASHBOARD_CACHE_TTL_MS;

    if (isExpired) {
      localStorage.removeItem(DASHBOARD_CACHE_KEY);
      return null;
    }

    return cache;
  } catch (err) {
    console.error('Failed to read dashboard cache', err);
    localStorage.removeItem(DASHBOARD_CACHE_KEY);
    return null;
  }
};

const Dashboard: React.FC = () => {
  const hasLoadedRef = React.useRef(false);
  const cachedDashboard = React.useMemo(() => readDashboardCache(), []);
  const [districts, setDistricts] = React.useState<District[]>(cachedDashboard?.districts ?? []);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(!cachedDashboard);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [lastUpdatedText, setLastUpdatedText] = React.useState(() => {
    if (!cachedDashboard) {
      return '';
    }

    const diffMs = Date.now() - cachedDashboard.cachedAt;
    const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
    return diffMinutes === 0 ? 'Updated just now' : `Updated ${diffMinutes} min ago`;
  });

  React.useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }

    hasLoadedRef.current = true;
    let cancelled = false;

    const updateLastUpdatedText = (cachedAt: number) => {
      const diffMs = Date.now() - cachedAt;
      const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
      setLastUpdatedText(diffMinutes === 0 ? 'Updated just now' : `Updated ${diffMinutes} min ago`);
    };

    const loadDashboard = async () => {
      try {
        setIsRefreshing(districts.length > 0);
        setLoading(districts.length === 0);
        const districtResult = await masterService.getDistricts();

        if (cancelled) {
          return;
        }

        setDistricts(districtResult);

        setError('');

        const cache: DashboardCache = {
          districts: districtResult,
          cachedAt: Date.now(),
        };
        localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(cache));
        updateLastUpdatedText(cache.cachedAt);
      } catch (err) {
        console.error('Failed to load districts', err);
        if (districts.length === 0) {
          setError('Unable to load districts right now.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [districts.length]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <p className="dashboard-kicker">TRLM Overview</p>
        <h1>Dashboard</h1>
        <p className="dashboard-subtitle">Quick access to district summary data.</p>
        {(lastUpdatedText || isRefreshing) && (
          <div className="dashboard-status">
            {lastUpdatedText && <span>{lastUpdatedText}</span>}
            {isRefreshing && <span className="dashboard-status-badge">Refreshing...</span>}
          </div>
        )}
      </div>
      {error && <div className="dashboard-alert">{error}</div>}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Districts</h3>
          <span>{loading && districts.length === 0 ? '...' : districts.length}</span>
        </div>
      </div>
      <div className="dashboard-content-grid dashboard-content-grid-single">
        <div className="dashboard-panel">
          <div className="panel-head">
            <h2>Districts</h2>
            <p>Showing district names in the dashboard card.</p>
          </div>
          <div className="district-chip-grid">
            {districts.map((district) => (
              <div className="district-chip" key={district.districtId}>
                {district.districtName}
              </div>
            ))}
            {loading && districts.length === 0 && (
              <div className="dashboard-empty">Loading districts...</div>
            )}
            {!loading && districts.length === 0 && (
              <div className="dashboard-empty">No district data available.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
