import React from 'react';
import { Download, Filter, LineChart, MapPinned, RotateCcw, TrendingUp, UsersRound } from 'lucide-react';
import {
  masterService,
  getDistricts,
  getBlocks,
  getGramPanchayats,
  getVillages,
  type DashboardAnalytics,
} from '../../services/masterService';
import type { District, SignupBlockOption, GramPanchayat, Village } from '../../types/master.types';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import '../dashboard/Dashboard.css';
import './Analytics.css';

const formatNumber = (value: number): string => new Intl.NumberFormat('en-IN').format(value);

const formatMoney = (value: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

const exportAnalyticsCSV = (data: DashboardAnalytics) => {
  const rows: (string | number)[][] = [
    ['Section', 'Name', 'Members', 'SHGs', 'Turnover'],
    ...data.districts.map((d) => ['District', d.DistrictName, d.Members, d.SHGs, d.Turnover]),
    ...data.blocks.map((b) => ['Block', b.BlockName, b.Members, b.SHGs, b.Turnover]),
    ['Section', 'Activity', 'Member Count', '', ''],
    ...data.livelihoodActivities.map((a) => ['Livelihood Activity', a.ActivityName, a.MemberCount, '', '']),
    ['Section', 'District', 'Training Required Members', '', ''],
    ...data.trainingNeed.map((t) => ['Training Need', t.DistrictName, t.TrainingRequiredMembers, '', '']),
    ['Section', 'Loan Cycle', 'Member Count', '', ''],
    ...data.fundRequirement.map((f) => ['Fund Requirement', f.CycleName, f.MemberCount, '', '']),
  ];

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'trlm-live-analytics.csv';
  anchor.click();
  URL.revokeObjectURL(url);
};

const MetricCard: React.FC<{
  label: string;
  value: string;
  note: string;
  tone: 'blue' | 'green' | 'amber' | 'red';
  icon: React.ReactNode;
}> = ({ label, value, note, tone, icon }) => (
  <article className={`analytics-kpi analytics-kpi--${tone}`}>
    <div className="analytics-kpi__icon">{icon}</div>
    <span>{label}</span>
    <strong>{value}</strong>
    <p>{note}</p>
  </article>
);

const MiniRow: React.FC<{ label: string; sub?: string; value: number; ratio: number }> = ({ label, sub, value, ratio }) => (
  <div className="analytics-mini-row">
    <div>
      <strong>{label}</strong>
      {sub && <small>{sub}</small>}
    </div>
    <b>{formatNumber(value)}</b>
    <div className="analytics-mini-row__track">
      <i style={{ width: `${Math.max(ratio, 4)}%` }} />
    </div>
  </div>
);

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const staffUserId = user?.livelihoodTrackerId ?? user?.staffId ?? user?.id;

  const [analytics, setAnalytics] = React.useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const [districts, setDistricts] = React.useState<District[]>([]);
  const [blockOptions, setBlockOptions] = React.useState<SignupBlockOption[]>([]);
  const [gramPanchayats, setGramPanchayats] = React.useState<GramPanchayat[]>([]);
  const [villages, setVillages] = React.useState<Village[]>([]);

  const [districtId, setDistrictId] = React.useState('');
  const [blockId, setBlockId] = React.useState('');
  const [gpId, setGpId] = React.useState('');
  const [villageId, setVillageId] = React.useState('');
  const [shgCode, setShgCode] = React.useState('');

  const loadAnalytics = React.useCallback(async () => {
    if (!staffUserId) {
      setError('Unable to determine your staff account for analytics.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await masterService.getDashboardAnalytics({
        staffUserId,
        districtId: districtId || undefined,
        blockId: blockId || undefined,
        gpId: gpId || undefined,
        villageId: villageId || undefined,
        shgCode: shgCode.trim() || undefined,
      });
      setAnalytics(data);
      setError('');
    } catch (err) {
      console.error('Failed to load analytics', err);
      setAnalytics(null);
      setError('Live analytics data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [staffUserId, districtId, blockId, gpId, villageId, shgCode]);

  const hasLoadedRef = React.useRef(false);
  React.useEffect(() => {
    if (hasLoadedRef.current) return;

    if (!staffUserId) {
      setError('Unable to determine your staff account for analytics.');
      setLoading(false);
      return;
    }

    hasLoadedRef.current = true;
    void loadAnalytics();
  }, [staffUserId, loadAnalytics]);

  React.useEffect(() => {
    getDistricts().then(setDistricts).catch(() => setDistricts([]));
  }, []);

  React.useEffect(() => {
    if (!districtId) { setBlockOptions([]); return; }
    let cancelled = false;
    getBlocks(districtId).then((b) => { if (!cancelled) setBlockOptions(b); }).catch(() => { if (!cancelled) setBlockOptions([]); });
    return () => { cancelled = true; };
  }, [districtId]);

  React.useEffect(() => {
    if (!blockId) { setGramPanchayats([]); return; }
    let cancelled = false;
    getGramPanchayats(blockId).then((g) => { if (!cancelled) setGramPanchayats(g); }).catch(() => { if (!cancelled) setGramPanchayats([]); });
    return () => { cancelled = true; };
  }, [blockId]);

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

  const districtsByMembers = React.useMemo(
    () => [...(analytics?.districts ?? [])].sort((a, b) => b.Members - a.Members),
    [analytics],
  );
  const maxDistrictMembers = React.useMemo(
    () => Math.max(...districtsByMembers.map((d) => d.Members), 1),
    [districtsByMembers],
  );

  const topDistrictsBySHG = React.useMemo(
    () => [...(analytics?.districts ?? [])].sort((a, b) => b.SHGs - a.SHGs).slice(0, 5),
    [analytics],
  );
  const maxDistrictSHGs = React.useMemo(() => Math.max(...topDistrictsBySHG.map((d) => d.SHGs), 1), [topDistrictsBySHG]);

  const topBlocksBySHG = React.useMemo(
    () => [...(analytics?.blocks ?? [])].sort((a, b) => b.SHGs - a.SHGs).slice(0, 5),
    [analytics],
  );
  const maxBlockSHGs = React.useMemo(() => Math.max(...topBlocksBySHG.map((b) => b.SHGs), 1), [topBlocksBySHG]);

  const activities = React.useMemo(() => analytics?.livelihoodActivities ?? [], [analytics]);
  const maxActivityMembers = React.useMemo(() => Math.max(...activities.map((a) => a.MemberCount), 1), [activities]);

  const trainingNeed = React.useMemo(() => analytics?.trainingNeed ?? [], [analytics]);
  const maxTrainingNeed = React.useMemo(() => Math.max(...trainingNeed.map((t) => t.TrainingRequiredMembers), 1), [trainingNeed]);

  const fundRequirement = React.useMemo(() => analytics?.fundRequirement ?? [], [analytics]);
  const maxFundMembers = React.useMemo(() => Math.max(...fundRequirement.map((f) => f.MemberCount), 1), [fundRequirement]);

  const topTurnoverDistrict = React.useMemo(
    () => [...(analytics?.districts ?? [])].sort((a, b) => b.Turnover - a.Turnover)[0],
    [analytics],
  );
  const topSHGDistrict = topDistrictsBySHG[0];

  const hasData = Boolean(analytics);

  return (
    <section className="page-shell analytics-page">
      <div className="page-stack">
        <section className="analytics-hero">
          <div className="analytics-hero__copy">
            <span>Live Analytics</span>
            <h2>District &amp; block livelihood analytics, live from the field</h2>
            <p>
              Member reach, SHG coverage, turnover, training needs, and fund requirements — pulled live
              from the Analytics API for your scope.
            </p>
          </div>
          <button
            className="analytics-download"
            type="button"
            onClick={() => analytics && exportAnalyticsCSV(analytics)}
            disabled={!hasData}
          >
            <Download size={18} />
            Download Details
          </button>
        </section>

        <section className="page-card dashboard-filter-panel">
          <div className="panel-head">
            <div>
              <span className="panel-eyebrow"><Filter size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />Scope Filters</span>
              <h2>Narrow analytics by location</h2>
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
                {blockOptions.map((b) => (
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
            <button type="button" className="dashboard-filter-btn dashboard-filter-btn--primary" onClick={() => void loadAnalytics()} disabled={loading}>
              {loading ? 'Applying...' : 'Apply Filters'}
            </button>
          </div>
        </section>

        {error && <div className="dashboard-alert">{error}</div>}

        {loading && !hasData && (
          <div style={{ padding: '48px', display: 'flex', justifyContent: 'center' }}>
            <Loader />
          </div>
        )}

        {hasData && analytics && (
          <>
            <section className="analytics-kpi-grid">
              <MetricCard
                label="Top Turnover District"
                value={topTurnoverDistrict?.DistrictName ?? '—'}
                note={formatMoney(topTurnoverDistrict?.Turnover ?? 0)}
                tone="blue"
                icon={<TrendingUp size={22} />}
              />
              <MetricCard
                label="Annual Turnover"
                value={formatMoney(analytics.summary.AnnualTurnover)}
                note={`${topTurnoverDistrict?.DistrictName ?? '—'} leads district turnover.`}
                tone="green"
                icon={<LineChart size={22} />}
              />
              <MetricCard
                label="SHG Coverage"
                value={formatNumber(analytics.summary.SHGsCovered)}
                note={`${topSHGDistrict?.DistrictName ?? '—'} has the highest SHG count.`}
                tone="amber"
                icon={<UsersRound size={22} />}
              />
              <MetricCard
                label="Training Pending"
                value={formatNumber(analytics.summary.TrainingPending)}
                note="Members with pending training needs."
                tone="red"
                icon={<MapPinned size={22} />}
              />
            </section>

            <article className="analytics-panel analytics-panel--wide">
              <div className="analytics-panel__head">
                <div>
                  <span className="analytics-panel__eyebrow">Member Reach</span>
                  <h2>Districts ranked by SHG members</h2>
                </div>
              </div>
              <div className="analytics-bars">
                {districtsByMembers.map((d, index) => (
                  <div className="analytics-bar" key={d.DistrictId}>
                    <div className="analytics-bar__meta">
                      <span className="analytics-bar__rank">{index + 1}</span>
                      <div>
                        <strong>{d.DistrictName}</strong>
                        <small>{formatNumber(d.SHGs)} SHGs · {formatMoney(d.Turnover)} turnover</small>
                      </div>
                      <b>{formatNumber(d.Members)}</b>
                    </div>
                    <div className="analytics-bar__track">
                      <span style={{ width: `${Math.max((d.Members / maxDistrictMembers) * 100, 4)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <div className="analytics-bifurcation">
              <div className="analytics-bifurcation__card">
                <span>SHG by District</span>
                {topDistrictsBySHG.map((d) => (
                  <MiniRow key={d.DistrictId} label={d.DistrictName} value={d.SHGs} ratio={(d.SHGs / maxDistrictSHGs) * 100} />
                ))}
              </div>
              <div className="analytics-bifurcation__card">
                <span>SHG by Block</span>
                {topBlocksBySHG.map((b) => (
                  <MiniRow key={b.BlockId} label={b.BlockName} value={b.SHGs} ratio={(b.SHGs / maxBlockSHGs) * 100} />
                ))}
              </div>
              <div className="analytics-bifurcation__card">
                <span>Livelihood Activities</span>
                {activities.length === 0 ? (
                  <p>No activity data for this scope.</p>
                ) : activities.map((a) => (
                  <MiniRow key={a.ActivityId} label={a.ActivityName} value={a.MemberCount} ratio={(a.MemberCount / maxActivityMembers) * 100} />
                ))}
              </div>
              <div className="analytics-bifurcation__card">
                <span>Training Need</span>
                {trainingNeed.length === 0 ? (
                  <p>No pending training needs.</p>
                ) : trainingNeed.map((t) => (
                  <MiniRow key={t.DistrictId} label={t.DistrictName} value={t.TrainingRequiredMembers} ratio={(t.TrainingRequiredMembers / maxTrainingNeed) * 100} />
                ))}
              </div>
            </div>

            <article className="analytics-panel analytics-panel--wide">
              <div className="analytics-panel__head">
                <div>
                  <span className="analytics-panel__eyebrow">Fund Requirement</span>
                  <h2>Members by loan cycle</h2>
                </div>
              </div>
              {fundRequirement.length === 0 ? (
                <p>No fund requirement records for this scope.</p>
              ) : (
                <div className="analytics-bars">
                  {fundRequirement.map((f) => (
                    <div className="analytics-bar" key={f.LoanCycleId}>
                      <div className="analytics-bar__meta">
                        <span className="analytics-bar__rank">{f.LoanCycleId || '—'}</span>
                        <strong>{f.CycleName}</strong>
                        <b>{formatNumber(f.MemberCount)}</b>
                      </div>
                      <div className="analytics-bar__track">
                        <span style={{ width: `${Math.max((f.MemberCount / maxFundMembers) * 100, 4)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </>
        )}
      </div>
    </section>
  );
};

export default Analytics;
