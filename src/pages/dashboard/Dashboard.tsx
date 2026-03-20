import React from 'react';
import { masterService } from '../../services/masterService';
import { useAuth } from '../../context/AuthContext';
import { getUserRoleId, ROLE_IDS } from '../../utils/roleAccess';
import './Dashboard.css';

const DASHBOARD_CACHE_KEY = 'trlm_dashboard_summary_v1';
const DASHBOARD_CACHE_TTL_MS = 30 * 60 * 1000;

type DashboardCache = {
  counts: Array<{ title: string; totalCount: number }>;
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
  const { user } = useAuth();
  const roleId = getUserRoleId(user);
  const hasLoadedRef = React.useRef(false);
  const cachedDashboard = React.useMemo(() => readDashboardCache(), []);
  const [counts, setCounts] = React.useState<Array<{ title: string; totalCount: number }>>(cachedDashboard?.counts ?? []);
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
        setIsRefreshing(counts.length > 0);
        setLoading(counts.length === 0);
        const countResult = await masterService.getDashboardCounts();

        if (cancelled) {
          return;
        }

        const scopedCounts = roleId === ROLE_IDS.STATE_ADMIN
          ? countResult.map((item) => ({ title: item.Title, totalCount: item.TotalCount }))
          : countResult
              .filter((item) => item.Title === 'Districts')
              .map((item) => ({ title: item.Title, totalCount: 1 }));

        setCounts(scopedCounts);

        setError('');

        const cache: DashboardCache = {
          counts: scopedCounts,
          cachedAt: Date.now(),
        };
        localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(cache));
        updateLastUpdatedText(cache.cachedAt);
      } catch (err) {
        console.error('Failed to load dashboard counts', err);
        if (counts.length === 0) {
          setError('Unable to load dashboard counts right now.');
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
  }, [counts.length, roleId, user?.districtId]);

  const stateAdminCounts = React.useMemo(() => {
    const byTitle = new Map(counts.map((item) => [item.title, item.totalCount]));
    return [
      { eyebrow: 'Master Data', title: 'Blocks', value: byTitle.get('Blocks') ?? 0, description: 'Total configured blocks available in the system.' },
      { eyebrow: 'Master Data', title: 'Districts', value: byTitle.get('Districts') ?? 0, description: 'Total districts available for administration.' },
      { eyebrow: 'Master Data', title: 'Gram Panchayats', value: byTitle.get('Gram Panchayats') ?? 0, description: 'Total gram panchayat records currently registered.' },
      { eyebrow: 'Master Data', title: 'Villages', value: byTitle.get('Villages') ?? 0, description: 'Total villages available in the master-data hierarchy.' },
    ];
  }, [counts]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="dashboard-kicker">TRLM Overview</p>
          <h1>Admin Dashboard</h1>
          <p className="dashboard-subtitle">
            {roleId === ROLE_IDS.STATE_ADMIN
              ? 'Track master-data coverage and move directly into staff approval actions.'
              : 'Monitor district coverage, portal activity, and key operational areas from one unified control room.'}
          </p>
          {(lastUpdatedText || isRefreshing) && (
            <div className="dashboard-status">
              {lastUpdatedText && <span>{lastUpdatedText}</span>}
              {isRefreshing && <span className="dashboard-status-badge">Refreshing...</span>}
            </div>
          )}
        </div>

        <div className="dashboard-banner-card">
          <span className="dashboard-banner-label">Portal Focus</span>
          <strong>{roleId === ROLE_IDS.STATE_ADMIN ? 'Staff approval control room' : 'District administration'}</strong>
          <p>
            {roleId === ROLE_IDS.STATE_ADMIN
              ? 'Use the sidebar to review staff requests and monitor core master-data counts.'
              : 'Use the sidebar to move between staff approval, CRP operations, and payment review.'}
          </p>
        </div>
      </div>
      {error && <div className="dashboard-alert">{error}</div>}
      <div className="stats-grid">
        {stateAdminCounts.map((item, index) => (
          <div key={item.title} className={`stat-card${index === 0 ? ' stat-card--primary' : ''}`}>
            <div className="stat-card__eyebrow">{item.eyebrow}</div>
            <h3>{item.title}</h3>
            <span>{loading && counts.length === 0 ? '...' : item.value}</span>
            <p>{item.description}</p>
          </div>
        ))}
      </div>
      <div className="dashboard-content-grid">
        <div className="dashboard-panel dashboard-panel--hero">
          <div className="panel-head">
            <h2>Administration Priorities</h2>
            <p>Recommended first actions for the day based on the current portal structure.</p>
          </div>
          <div className="dashboard-priority-list">
            <div className="dashboard-priority-item">
              <span className="dashboard-priority-number">01</span>
              <div>
                <strong>Review pending staff approvals</strong>
                <p>Clear onboarding and role access requests before field operations begin.</p>
              </div>
            </div>
            <div className="dashboard-priority-item">
              <span className="dashboard-priority-number">02</span>
              <div>
                <strong>Verify district and block coverage</strong>
                <p>Check dashboard counts to confirm the master-data hierarchy is loaded correctly.</p>
              </div>
            </div>
            <div className="dashboard-priority-item">
              <span className="dashboard-priority-number">03</span>
              <div>
                <strong>Monitor portal readiness</strong>
                <p>Use the headline totals to detect missing master data before approving more staff.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-head">
            <h2>Master Data Counts</h2>
            <p>Live totals coming from the dashboard counts endpoint.</p>
          </div>
          <div className="district-chip-grid">
            {stateAdminCounts.map((item) => (
              <div className="district-chip" key={item.title}>
                {item.title}: {item.value}
              </div>
            ))}
            {loading && counts.length === 0 && (
              <div className="dashboard-empty">Loading counts...</div>
            )}
            {!loading && counts.length === 0 && (
              <div className="dashboard-empty">No dashboard counts available.</div>
            )}
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-head">
            <h2>State Admin Access</h2>
            <p>Modules available for this role in the current portal flow.</p>
          </div>
          <div className="dashboard-snapshot-grid">
            <div className="dashboard-snapshot-card">
              <strong>Staff</strong>
              <span>Approval and rejection workflow</span>
            </div>
            <div className="dashboard-snapshot-card">
              <strong>Dashboard</strong>
              <span>Counts from the master dashboard endpoint</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
