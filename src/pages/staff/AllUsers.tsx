import React from 'react';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import { staffService } from '../../services/staffService';
import { toStaffRecords, getApprovalBucket, getStaffRoleLabel, getStaffId, formatStaffValue } from './staffUtils';
import { filterByDistrictAndBlock } from '../../utils/roleAccess';
import { useResolvedScope } from '../../utils/useResolvedScope';
import './Staff.css';

const ALL_USERS_CACHE_KEY = 'trlm_all_users_cache_v1';
const ALL_USERS_CACHE_TTL_MS = 15 * 60 * 1000;

type StaffAnalyticsRecord = ReturnType<typeof toStaffRecords>[number];

type AllUsersCache = {
  records: StaffAnalyticsRecord[];
  cachedAt: number;
};

const ROLE_COLORS: Record<string, string> = {
  STATE_ADMIN: '#0f4c81',
  DISTRICT_STAFF: '#1f78b4',
  BLOCK_STAFF: '#f29f05',
  USER: '#6c7f92',
};

const APPROVAL_COLORS: Record<string, string> = {
  approved: '#1f9d6e',
  pending: '#f29f05',
  rejected: '#d8574b',
  unknown: '#6c7f92',
};

const readUsersCache = (): AllUsersCache | null => {
  try {
    const raw = localStorage.getItem(ALL_USERS_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const cache = JSON.parse(raw) as AllUsersCache;
    if (Date.now() - cache.cachedAt > ALL_USERS_CACHE_TTL_MS) {
      localStorage.removeItem(ALL_USERS_CACHE_KEY);
      return null;
    }

    return cache;
  } catch {
    localStorage.removeItem(ALL_USERS_CACHE_KEY);
    return null;
  }
};

const getLoadUsersErrorMessage = (err: any): string => {
  if (err?.code === 'ECONNABORTED' || String(err?.message ?? '').toLowerCase().includes('timeout')) {
    return 'The all users API is taking too long to respond. Cached analytics are being shown.';
  }

  if (!err?.response) {
    return 'The all users API could not be reached. Cached analytics are being shown.';
  }

  if (err.response.status === 401) {
    return 'Your session is not authorized to load all users.';
  }

  if (err.response.status === 404) {
    return 'The all users API endpoint was not found on the server.';
  }

  return err?.response?.data?.message ?? 'Unable to load users right now.';
};

const formatCount = (value: number): string => new Intl.NumberFormat('en-IN').format(value);

const getLastUpdatedText = (cachedAt: number): string => {
  const diffMs = Date.now() - cachedAt;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  return diffMinutes === 0 ? 'Updated just now' : `Updated ${diffMinutes} min ago`;
};

const getDistrictName = (record: StaffAnalyticsRecord): string =>
  String(record.districtName ?? record.district ?? record.DistrictName ?? '-');

const getDisplayName = (record: StaffAnalyticsRecord): string =>
  String(record.officialName ?? record.name ?? record.livelihoodTrackerId ?? getStaffId(record) ?? '-');

const getInitials = (value: string): string => {
  const parts = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return '?';
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
};

const getFieldValue = (record: StaffAnalyticsRecord, keys: string[]): string => {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== '') {
      return formatStaffValue(value);
    }
  }

  return '-';
};

const formatCreatedDate = (value: unknown): string => {
  if (typeof value !== 'string' || !value.trim()) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
};

const AllUsers: React.FC = () => {
  const { user } = useAuth();
  const { scopedUser } = useResolvedScope(user);
  const hasLoadedRef = React.useRef(false);
  const cachedUsers = React.useMemo(() => readUsersCache(), []);
  const [records, setRecords] = React.useState<StaffAnalyticsRecord[]>(cachedUsers?.records ?? []);
  const [loading, setLoading] = React.useState(!cachedUsers);
  const [error, setError] = React.useState('');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [lastUpdatedText, setLastUpdatedText] = React.useState(
    cachedUsers ? getLastUpdatedText(cachedUsers.cachedAt) : '',
  );

  const loadUsers = React.useCallback(async (preferRefreshState: boolean) => {
    try {
      setError('');
      setIsRefreshing(preferRefreshState);
      setLoading(!preferRefreshState && records.length === 0);

      const response = await staffService.getAllUsers();
      const filteredRecords = filterByDistrictAndBlock(
        toStaffRecords(response),
        scopedUser,
        ['districtId', 'district', 'districtName'],
        ['blockId', 'block', 'blockName'],
      );

      setRecords(filteredRecords);

      const cache: AllUsersCache = {
        records: filteredRecords,
        cachedAt: Date.now(),
      };
      localStorage.setItem(ALL_USERS_CACHE_KEY, JSON.stringify(cache));
      setLastUpdatedText(getLastUpdatedText(cache.cachedAt));
    } catch (err: any) {
      console.error('Failed to load all users', {
        code: err?.code,
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
        url: err?.config?.url,
      });
      setError(getLoadUsersErrorMessage(err));
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [records.length, scopedUser]);

  React.useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }

    hasLoadedRef.current = true;
    void loadUsers(Boolean(cachedUsers?.records.length));
  }, [cachedUsers?.records.length, loadUsers]);

  const roleBreakdown = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const record of records) {
      const label = getStaffRoleLabel(record);
      map.set(label, (map.get(label) ?? 0) + 1);
    }

    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [records]);

  const approvalBreakdown = React.useMemo(() => {
    const buckets: Array<'approved' | 'pending' | 'rejected' | 'unknown'> = ['approved', 'pending', 'rejected', 'unknown'];
    return buckets.map((bucket) => ({
      label: bucket,
      count: records.filter((record) => getApprovalBucket(record) === bucket).length,
    }));
  }, [records]);

  const districtBreakdown = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const record of records) {
      const district = getDistrictName(record);
      map.set(district, (map.get(district) ?? 0) + 1);
    }

    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .filter((item) => item.label !== '-')
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [records]);

  const topValue = React.useMemo(() => {
    const candidateValues = [
      ...roleBreakdown.map((item) => item.count),
      ...approvalBreakdown.map((item) => item.count),
      ...districtBreakdown.map((item) => item.count),
    ];

    return Math.max(...candidateValues, 1);
  }, [approvalBreakdown, districtBreakdown, roleBreakdown]);

  const totalUsers = records.length;
  const approvedUsers = approvalBreakdown.find((item) => item.label === 'approved')?.count ?? 0;
  const pendingUsers = approvalBreakdown.find((item) => item.label === 'pending')?.count ?? 0;
  const rejectedUsers = approvalBreakdown.find((item) => item.label === 'rejected')?.count ?? 0;
  const tablePreview = React.useMemo(() => records.slice(0, 8), [records]);

  if (loading && records.length === 0) {
    return <Loader />;
  }

  return (
    <div className="staff-page staff-page--analytics">
      <section className="staff-hero">
        <div className="staff-hero__copy">
          <p className="staff-kicker">User Analytics</p>
          <h1>All users, visualized for faster review</h1>
          <p className="staff-subtitle">
            This page now loads from the live all-users API with cache-first rendering, then turns the user base
            into role, approval, and district graphs so you can scan the system quickly.
          </p>
          <div className="staff-hero__status">
            {lastUpdatedText && <span>{lastUpdatedText}</span>}
            {isRefreshing && <span className="staff-status-badge">Refreshing</span>}
            {error && <span className="staff-status-badge staff-status-badge--warn">Cached</span>}
          </div>
        </div>

        <div className="staff-hero__metric">
          <span>Total visible users</span>
          <strong>{formatCount(totalUsers)}</strong>
          <p>
            Approved {formatCount(approvedUsers)} · Pending {formatCount(pendingUsers)} · Rejected {formatCount(rejectedUsers)}
          </p>
        </div>
      </section>

      {error && <div className="staff-alert staff-alert--analytics">{error}</div>}

      <section className="staff-analytics-grid">
        <article className="staff-panel staff-panel--wide">
          <div className="staff-panel-head">
            <div>
              <h2>Role distribution graph</h2>
              <p>Compare how users are split across role categories.</p>
            </div>
          </div>

          <div className="staff-bar-chart">
            {roleBreakdown.map((item) => {
              const width = (item.count / topValue) * 100;
              const color = ROLE_COLORS[item.label] ?? ROLE_COLORS.USER;

              return (
                <div className="staff-bar-chart__row" key={item.label}>
                  <div className="staff-bar-chart__meta">
                    <span>{item.label}</span>
                    <strong>{formatCount(item.count)}</strong>
                  </div>
                  <div className="staff-bar-chart__track">
                    <div
                      className="staff-bar-chart__fill"
                      style={{
                        width: `${Math.max(width, 7)}%`,
                        background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.9))`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="staff-panel">
          <div className="staff-panel-head">
            <div>
              <h2>Approval rings</h2>
              <p>Status mix across the current users dataset.</p>
            </div>
          </div>

          <div className="staff-ring-grid">
            {approvalBreakdown.map((item) => {
              const share = totalUsers > 0 ? (item.count / totalUsers) * 100 : 0;
              const color = APPROVAL_COLORS[item.label] ?? APPROVAL_COLORS.unknown;

              return (
                <div className="staff-ring-card" key={item.label}>
                  <div
                    className="staff-ring-chart"
                    style={{
                      background: `conic-gradient(${color} ${share}%, rgba(18, 50, 74, 0.12) ${share}% 100%)`,
                    }}
                  >
                    <div className="staff-ring-chart__inner">
                      <strong>{share.toFixed(0)}%</strong>
                    </div>
                  </div>
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="staff-panel">
          <div className="staff-panel-head">
            <div>
              <h2>District heat view</h2>
              <p>Top districts by user presence in the current dataset.</p>
            </div>
          </div>

          <div className="staff-heat-grid">
            {districtBreakdown.map((item) => {
              const intensity = Math.round((item.count / topValue) * 100);
              return (
                <div
                  className="staff-heat-card"
                  key={item.label}
                  style={{
                    background: `linear-gradient(145deg, rgba(255,255,255,0.96), color-mix(in srgb, #1f78b4 ${Math.max(intensity, 20)}%, white))`,
                  }}
                >
                  <span>{item.label}</span>
                  <strong>{formatCount(item.count)}</strong>
                </div>
              );
            })}
            {districtBreakdown.length === 0 && (
              <div className="staff-empty">No district distribution available.</div>
            )}
          </div>
        </article>

        <article className="staff-panel staff-panel--wide">
          <div className="staff-panel-head">
            <div>
              <h2>Quick user preview</h2>
              <p>A small list preview, with the graphs kept as the main focus.</p>
            </div>
          </div>

          {tablePreview.length === 0 ? (
            <div className="staff-empty">No users found.</div>
          ) : (
            <div className="staff-mini-table">
              <div className="staff-mini-table__head">
                <span>Name</span>
                <span>Role</span>
                <span>Location</span>
                <span>Joined</span>
                <span>Status</span>
              </div>
              {tablePreview.map((record, index) => (
                <div className="staff-mini-table__row" key={getStaffId(record) ?? index}>
                  <div className="staff-mini-table__identity">
                    <span className="staff-mini-table__avatar">{getInitials(getDisplayName(record))}</span>
                    <span className="staff-mini-table__name-wrap">
                      <strong>{getDisplayName(record)}</strong>
                      <small>{getFieldValue(record, ['designation'])}</small>
                    </span>
                  </div>
                  <span className="staff-mini-table__role-pill">{getStaffRoleLabel(record)}</span>
                  <span className="staff-mini-table__location">
                    <strong>{getFieldValue(record, ['districtName', 'district', 'DistrictName'])}</strong>
                    <small>
                      {getFieldValue(record, ['blockName', 'block', 'BlockName']) !== '-'
                        ? getFieldValue(record, ['blockName', 'block', 'BlockName'])
                        : 'District level'}
                    </small>
                  </span>
                  <span className="staff-mini-table__joined">
                    <strong>{formatCreatedDate(record.createdDate ?? record.CreatedDate)}</strong>
                    <small>ID {getFieldValue(record, ['livelihoodTrackerId'])}</small>
                  </span>
                  <span className={`staff-mini-table__status staff-mini-table__status--${getApprovalBucket(record)}`}>
                    {getApprovalBucket(record)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
};

export default AllUsers;
