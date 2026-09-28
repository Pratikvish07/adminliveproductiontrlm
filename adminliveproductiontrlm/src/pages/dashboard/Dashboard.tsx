import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import {
  masterService,
  getDistricts,
  getBlocks,
  getGramPanchayats,
  getVillages,
  type DashboardOverview,
} from '../../services/masterService';
import type { District, SignupBlockOption, GramPanchayat, Village } from '../../types/master.types';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

const ACTIVITY_ACCENTS = ['#0f4c81', '#1f78b4', '#f29f05', '#e15759', '#2f855a', '#7c3aed'];

const accentFor = (index: number): string => ACTIVITY_ACCENTS[index % ACTIVITY_ACCENTS.length];

const formatNumber = (value: number): string => new Intl.NumberFormat('en-IN').format(value);

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // The Dashboard API's StaffUserId is the user's own Livelihood Tracker ID
  // (what they log in with) — not a different internal staff record id.
  const staffUserId = user?.livelihoodTrackerId ?? user?.staffId ?? user?.id;

  const [overview, setOverview] = React.useState<DashboardOverview | null>(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  const [districts, setDistricts] = React.useState<District[]>([]);
  const [blocks, setBlocks] = React.useState<SignupBlockOption[]>([]);
  const [gramPanchayats, setGramPanchayats] = React.useState<GramPanchayat[]>([]);
  const [villages, setVillages] = React.useState<Village[]>([]);

  const [districtId, setDistrictId] = React.useState('');
  const [blockId, setBlockId] = React.useState('');
  const [gpId, setGpId] = React.useState('');
  const [villageId, setVillageId] = React.useState('');
  const [shgCode, setShgCode] = React.useState('');

  const loadDashboard = React.useCallback(async () => {
    if (!staffUserId) {
      setError('Unable to determine your staff account for the dashboard.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await masterService.getDashboardOverview({
        staffUserId,
        districtId: districtId || undefined,
        blockId: blockId || undefined,
        gpId: gpId || undefined,
        villageId: villageId || undefined,
        shgCode: shgCode.trim() || undefined,
      });
      setOverview(data);
      setError('');
    } catch (err) {
      console.error('Failed to load dashboard overview', err);
      setOverview(null);
      setError('Live dashboard data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [staffUserId, districtId, blockId, gpId, villageId, shgCode]);

  // Initial load, with no filters applied.
  const hasLoadedRef = React.useRef(false);
  React.useEffect(() => {
    if (hasLoadedRef.current) return;

    if (!staffUserId) {
      setError('Unable to determine your staff account for the dashboard.');
      setLoading(false);
      return;
    }

    hasLoadedRef.current = true;
    void loadDashboard();
  }, [staffUserId, loadDashboard]);

  // District list, loaded once.
  React.useEffect(() => {
    getDistricts().then(setDistricts).catch(() => setDistricts([]));
  }, []);

  // Blocks for the selected district.
  React.useEffect(() => {
    if (!districtId) { setBlocks([]); return; }
    let cancelled = false;
    getBlocks(districtId).then((b) => { if (!cancelled) setBlocks(b); }).catch(() => { if (!cancelled) setBlocks([]); });
    return () => { cancelled = true; };
  }, [districtId]);

  // Gram Panchayats for the selected block.
  React.useEffect(() => {
    if (!blockId) { setGramPanchayats([]); return; }
    let cancelled = false;
    getGramPanchayats(blockId).then((g) => { if (!cancelled) setGramPanchayats(g); }).catch(() => { if (!cancelled) setGramPanchayats([]); });
    return () => { cancelled = true; };
  }, [blockId]);

  // Villages for the selected Gram Panchayat.
  React.useEffect(() => {
    if (!gpId) { setVillages([]); return; }
    let cancelled = false;
    getVillages(gpId).then((v) => { if (!cancelled) setVillages(v); }).catch(() => { if (!cancelled) setVillages([]); });
    return () => { cancelled = true; };
  }, [gpId]);

  const handleDistrictChange = (value: string) => {
    setDistrictId(value);
    setBlockId('');
    setGpId('');
    setVillageId('');
  };

  const handleBlockChange = (value: string) => {
    setBlockId(value);
    setGpId('');
    setVillageId('');
  };

  const handleGpChange = (value: string) => {
    setGpId(value);
    setVillageId('');
  };

  const handleReset = () => {
    setDistrictId('');
    setBlockId('');
    setGpId('');
    setVillageId('');
    setShgCode('');
  };

  const hasActiveFilters = Boolean(districtId || blockId || gpId || villageId || shgCode);

  const activities = React.useMemo(() => overview?.livelihoodActivities ?? [], [overview]);
  const trainingRequirements = React.useMemo(() => overview?.trainingRequirements ?? [], [overview]);
  const loanCycles = React.useMemo(() => overview?.loanCycles ?? [], [overview]);

  const maxActivityMembers = React.useMemo(
    () => Math.max(...activities.map((item) => item.memberCount), 1),
    [activities],
  );
  const totalActivityMembers = React.useMemo(
    () => activities.reduce((sum, item) => sum + item.memberCount, 0),
    [activities],
  );
  const maxTrainingPending = React.useMemo(
    () => Math.max(...trainingRequirements.map((item) => item.pendingCount), 1),
    [trainingRequirements],
  );
  const maxLoanMembers = React.useMemo(
    () => Math.max(...loanCycles.map((item) => item.memberCount), 1),
    [loanCycles],
  );

  const hasData = Boolean(overview);

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="dashboard-kicker">TRLM Admin Visual Console</p>
          <h1>Livelihood dashboard, live from the field</h1>
          <p className="dashboard-subtitle">
            SHG members, livelihood activities, training needs, financial support requests, and loan
            cycles — pulled live from the Dashboard API for your scope.
          </p>
          <div className="dashboard-status">
            {loading && <span className="dashboard-status-badge">Loading</span>}
            {error && <span className="dashboard-status-badge">API Error</span>}
          </div>
        </div>

        <div className="dashboard-hero-viz">
          <div className="dashboard-kpi-grid">
            <div className="dashboard-kpi">
              <span>SHG Members</span>
              <strong>{formatNumber(overview?.summary.shgMembers ?? 0)}</strong>
            </div>
            <div className="dashboard-kpi">
              <span>SHGs Covered</span>
              <strong>{formatNumber(overview?.summary.shGsCovered ?? 0)}</strong>
            </div>
            <div className="dashboard-kpi">
              <span>Annual Turnover</span>
              <strong>{formatCurrency(overview?.summary.annualTurnover ?? 0)}</strong>
            </div>
            <div className="dashboard-kpi">
              <span>Training Pending</span>
              <strong>{formatNumber(overview?.summary.trainingPending ?? 0)}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-panel dashboard-filter-panel">
        <div className="panel-head">
          <div>
            <span className="panel-eyebrow"><Filter size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />Scope Filters</span>
            <h2>Narrow the dashboard by location or member</h2>
          </div>
        </div>

        <div className="dashboard-filter-grid">
          <label className="dashboard-filter-field">
            <span>District</span>
            <select value={districtId} onChange={(e) => handleDistrictChange(e.target.value)}>
              <option value="">All districts</option>
              {districts.map((d) => (
                <option key={d.districtId} value={d.districtId}>{d.districtName}</option>
              ))}
            </select>
          </label>
          <label className="dashboard-filter-field">
            <span>Block</span>
            <select value={blockId} onChange={(e) => handleBlockChange(e.target.value)} disabled={!districtId}>
              <option value="">{districtId ? 'All blocks' : 'Select district first'}</option>
              {blocks.map((b) => (
                <option key={b.blockId} value={b.blockId}>{b.blockName}</option>
              ))}
            </select>
          </label>
          <label className="dashboard-filter-field">
            <span>Gram Panchayat</span>
            <select value={gpId} onChange={(e) => handleGpChange(e.target.value)} disabled={!blockId}>
              <option value="">{blockId ? 'All gram panchayats' : 'Select block first'}</option>
              {gramPanchayats.map((gp) => (
                <option key={gp.GPId} value={gp.GPId}>{gp.GPName}</option>
              ))}
            </select>
          </label>
          <label className="dashboard-filter-field">
            <span>Village</span>
            <select value={villageId} onChange={(e) => setVillageId(e.target.value)} disabled={!gpId}>
              <option value="">{gpId ? 'All villages' : 'Select gram panchayat first'}</option>
              {villages.map((v) => (
                <option key={v.VillageId} value={v.VillageId}>{v.VillageName}</option>
              ))}
            </select>
          </label>
          <label className="dashboard-filter-field">
            <span>SHG Code</span>
            <input type="text" value={shgCode} onChange={(e) => setShgCode(e.target.value)} placeholder="e.g. 30001059619" />
          </label>
        </div>

        <div className="dashboard-filter-actions">
          <button type="button" className="dashboard-filter-btn dashboard-filter-btn--ghost" onClick={handleReset} disabled={!hasActiveFilters || loading}>
            <RotateCcw size={14} /> Reset
          </button>
          <button type="button" className="dashboard-filter-btn dashboard-filter-btn--primary" onClick={() => void loadDashboard()} disabled={loading}>
            {loading ? 'Applying...' : 'Apply Filters'}
          </button>
        </div>
      </section>

      {error && <div className="dashboard-alert">{error}</div>}

      <section className="dashboard-grid">
        {loading && !hasData && (
          <article className="dashboard-panel dashboard-panel--wide">
            <div className="panel-head">
              <div>
                <span className="panel-eyebrow">Live Feed</span>
                <h2>Loading dashboard data</h2>
              </div>
            </div>
          </article>
        )}

        {!loading && !hasData && (
          <article className="dashboard-panel dashboard-panel--wide">
            <div className="panel-head">
              <div>
                <span className="panel-eyebrow">Live Feed</span>
                <h2>No dashboard data available</h2>
              </div>
            </div>
          </article>
        )}

        {hasData && (
          <>
            <article className="dashboard-panel dashboard-panel--wide">
              <div className="panel-head">
                <div>
                  <span className="panel-eyebrow">Member Reach</span>
                  <h2>Livelihood activities by member count</h2>
                </div>
              </div>

              <div className="bar-chart">
                {activities.map((item, index) => {
                  const ratio = (item.memberCount / maxActivityMembers) * 100;
                  return (
                    <div className="bar-chart-row" key={item.activityId}>
                      <div className="bar-chart-meta">
                        <span className="bar-chart-label">{item.activityName}</span>
                        <strong>{formatNumber(item.memberCount)}</strong>
                      </div>
                      <div className="bar-chart-track">
                        <div
                          className="bar-chart-fill"
                          style={{
                            width: `${Math.max(ratio, 6)}%`,
                            background: `linear-gradient(90deg, ${accentFor(index)}, rgba(255,255,255,0.92))`,
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
                  <h2>Activity distribution</h2>
                </div>
              </div>

              <div className="ring-grid">
                {activities.map((item, index) => {
                  const share = totalActivityMembers > 0 ? (item.memberCount / totalActivityMembers) * 100 : 0;
                  return (
                    <div className="ring-card" key={item.activityId}>
                      <div
                        className="ring-chart"
                        style={{
                          background: `conic-gradient(${accentFor(index)} ${share}%, rgba(15, 44, 73, 0.12) ${share}% 100%)`,
                        }}
                      >
                        <div className="ring-chart__inner">
                          <strong>{share.toFixed(1)}%</strong>
                        </div>
                      </div>
                      <span>{item.activityName}</span>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="dashboard-panel">
              <div className="panel-head">
                <div>
                  <span className="panel-eyebrow">Training Needs</span>
                  <h2>Pending training by activity</h2>
                </div>
              </div>

              <div className="heat-grid">
                {trainingRequirements.map((item, index) => {
                  const opacity = 0.18 + (item.pendingCount / maxTrainingPending) * 0.82;
                  return (
                    <div
                      className="heat-card"
                      key={item.activityId}
                      style={{
                        background: `linear-gradient(145deg, rgba(255,255,255,0.96), color-mix(in srgb, ${accentFor(index)} ${Math.round(opacity * 100)}%, white))`,
                      }}
                    >
                      <span>{item.activityName}</span>
                      <strong>{formatNumber(item.pendingCount)}</strong>
                    </div>
                  );
                })}
                {trainingRequirements.length === 0 && (
                  <div className="heat-card heat-card--empty">No pending training requirements.</div>
                )}
              </div>
            </article>

            <article className="dashboard-panel dashboard-panel--wide">
              <div className="panel-head">
                <div>
                  <span className="panel-eyebrow">Loan Activity</span>
                  <h2>Members by loan cycle</h2>
                </div>
                <div className="panel-callout">
                  <span>Financial Support Required</span>
                  <strong>{formatNumber(overview?.financialSupport.financialSupportRequired ?? 0)}</strong>
                </div>
              </div>

              {loanCycles.length === 0 ? (
                <p className="dashboard-empty-note">No loan cycle records available.</p>
              ) : (
                <div className="skyline-chart">
                  {loanCycles.map((item, index) => {
                    const height = `${Math.max((item.memberCount / maxLoanMembers) * 100, 8)}%`;
                    return (
                      <div className="skyline-column" key={item.loanCycleId}>
                        <div
                          className="skyline-column__bar"
                          style={{
                            height,
                            background: `linear-gradient(180deg, ${accentFor(index)}, rgba(15, 35, 64, 0.92))`,
                          }}
                        />
                        <strong>{formatNumber(item.memberCount)}</strong>
                        <span>{item.cycleName}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          </>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
