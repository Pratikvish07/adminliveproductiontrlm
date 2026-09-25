import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  X,
  Sprout,
  Wallet,
  TrendingUp,
  MapPinned,
  GraduationCap,
  HandCoins,
} from 'lucide-react';
import PageShell from '../../components/common/PageShell';
import Loader from '../../components/common/Loader';
import {
  memberProfileService,
  type ActivityProfile,
  type IncomeProfile,
  type InvestmentProfile,
  type TechnicalSupport,
  type FinancialSupport,
  type LoanProjection,
} from '../../services/memberProfileService';
import type { SHGTrackingRecord } from '../../services/reportService';
import '../master/MasterData.css';
import './ShgMemberDashboard.css';

type LocationState = { memberName?: string; shgName?: string };

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

const formatDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString('en-IN') : '—';

const formatBool = (value: boolean | null | undefined) => (value ? 'Yes' : 'No');

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'M';

const SectionHead: React.FC<{ icon: React.ComponentType<{ size?: number }>; title: string; count: number }> = ({ icon: Icon, title, count }) => (
  <div className="member-dash-section-head">
    <span className="member-dash-section-icon"><Icon size={18} /></span>
    <h2>{title}</h2>
    <span className="member-dash-count">{count} record{count === 1 ? '' : 's'}</span>
  </div>
);

const resolveMediaUrl = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `https://trlm.pickitover.com/${path.replace(/^\/+/, '')}`;
};

const ShgMemberDashboard: React.FC = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as LocationState) || {};
  const memberIdNum = Number(memberId);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [activityProfiles, setActivityProfiles] = React.useState<ActivityProfile[]>([]);
  const [incomeProfiles, setIncomeProfiles] = React.useState<IncomeProfile[]>([]);
  const [investmentProfiles, setInvestmentProfiles] = React.useState<InvestmentProfile[]>([]);
  const [technicalSupports, setTechnicalSupports] = React.useState<TechnicalSupport[]>([]);
  const [financialSupports, setFinancialSupports] = React.useState<FinancialSupport[]>([]);
  const [trackingRecords, setTrackingRecords] = React.useState<SHGTrackingRecord[]>([]);

  const [projectionFor, setProjectionFor] = React.useState<FinancialSupport | null>(null);
  const [projection, setProjection] = React.useState<LoanProjection | null>(null);
  const [projectionLoading, setProjectionLoading] = React.useState(false);
  const [projectionError, setProjectionError] = React.useState('');

  const load = React.useCallback(async () => {
    if (!Number.isFinite(memberIdNum)) {
      setError('Invalid member id.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const [report, allActivityProfiles] = await Promise.all([
        memberProfileService.getFullDetailReport(memberIdNum),
        memberProfileService.getActivityProfiles().catch(() => []),
      ]);

      // The per-member report only returns raw ids for Activity Profile; enrich
      // with friendly names from the unfiltered list where a match exists.
      const activityNamesById = new Map(allActivityProfiles.map((a) => [a.ActivityProfileId, a]));
      const enrichedActivityProfiles = (report.ActivityProfile || []).map((a) => ({
        ...activityNamesById.get(a.ActivityProfileId),
        ...a,
      }));

      setActivityProfiles(enrichedActivityProfiles);
      setIncomeProfiles(report.IncomeProfile || []);
      setInvestmentProfiles(report.InvestmentProfile || []);
      setTechnicalSupports(report.TechnicalSupport || []);
      setFinancialSupports(report.FinancialSupport || []);
      setTrackingRecords(report.SHGTracking || []);
    } catch (err) {
      console.error('Failed to load SHG member dashboard', err);
      setError("Unable to load this member's profile data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [memberIdNum]);

  React.useEffect(() => {
    load();
  }, [load]);

  const viewProjection = async (fs: FinancialSupport) => {
    if (!fs.ActivityId || !fs.LoanCycleId) return;
    setProjectionFor(fs);
    setProjection(null);
    setProjectionError('');
    setProjectionLoading(true);
    try {
      const result = await memberProfileService.getLoanProjection(fs.ActivityId, fs.LoanCycleId);
      setProjection(result);
    } catch (err) {
      console.error('Failed to load loan projection', err);
      setProjectionError('Unable to compute loan projection for this record.');
    } finally {
      setProjectionLoading(false);
    }
  };

  if (loading) return <Loader />;

  const displayName = state.memberName || `Member #${memberId}`;

  return (
    <PageShell
      kicker="SHG Member"
      title={displayName}
      subtitle={state.shgName ? `SHG: ${state.shgName}` : 'Full profile dashboard'}
    >
      <button type="button" className="member-dash-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back to Reports
      </button>

      {error && <div className="master-alert">{error}</div>}

      <section className="member-dash-hero">
        <div className="member-dash-hero__avatar">{getInitials(displayName)}</div>
        <div className="member-dash-hero__info">
          <span className="member-dash-hero__kicker">SHG Member Profile</span>
          <h2>{displayName}</h2>
          <p>{state.shgName ? `Member of ${state.shgName}` : `Member ID ${memberId}`}</p>
        </div>
        <div className="member-dash-hero__stats">
          <div><span>Activity</span><strong>{activityProfiles.length}</strong></div>
          <div><span>Investment</span><strong>{investmentProfiles.length}</strong></div>
          <div><span>Income</span><strong>{incomeProfiles.length}</strong></div>
          <div><span>Tracking</span><strong>{trackingRecords.length}</strong></div>
          <div><span>Tech. Support</span><strong>{technicalSupports.length}</strong></div>
          <div><span>Fin. Support</span><strong>{financialSupports.length}</strong></div>
        </div>
      </section>

      <section className="page-card">
        <SectionHead icon={Sprout} title="Activity Profile" count={activityProfiles.length} />
        {activityProfiles.length === 0 ? (
          <p className="member-dash-empty">No activity profile records for this member.</p>
        ) : (
          <div className="master-table-shell">
            <table className="master-table">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Area</th>
                  <th>Unit</th>
                  <th>Activity Type</th>
                  <th>Season</th>
                  <th>Land Type</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {activityProfiles.map((row) => (
                  <tr key={row.ActivityProfileId}>
                    <td>{row.ActivityName || `Activity #${row.ActivityId}`}</td>
                    <td>{row.Area}</td>
                    <td>{row.UnitName || row.UnitId}</td>
                    <td>{row.ActivityTypeName || row.ActivityTypeId}</td>
                    <td>{row.SeasonName || '—'}</td>
                    <td>{row.LandTypeName || row.LandTypeId}</td>
                    <td>{formatDate(row.CreatedDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="page-card">
        <SectionHead icon={Wallet} title="Investment Profile" count={investmentProfiles.length} />
        {investmentProfiles.length === 0 ? (
          <p className="member-dash-empty">No investment profile records for this member.</p>
        ) : (
          <div className="master-table-shell">
            <table className="master-table">
              <thead>
                <tr>
                  <th>Total Investment</th>
                  <th>Loan From SHG</th>
                  <th>Loan From Bank</th>
                  <th>Individual Financing</th>
                  <th>Own Contribution</th>
                  <th>CSR</th>
                  <th>Government Grant</th>
                  <th>Other Source</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {investmentProfiles.map((row) => (
                  <tr key={row.InvestmentProfileId}>
                    <td>{formatCurrency(row.TotalInvestment)}</td>
                    <td>{formatCurrency(row.LoanFromSHG)}</td>
                    <td>{formatCurrency(row.LoanFromBank)}</td>
                    <td>{formatCurrency(row.IndividualFinancing)}</td>
                    <td>{formatCurrency(row.OwnContribution)}</td>
                    <td>{formatCurrency(row.CSR)}</td>
                    <td>{formatCurrency(row.GovernmentGrant)}</td>
                    <td>{formatCurrency(row.OtherSource)}</td>
                    <td>{formatDate(row.CreatedDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="page-card">
        <SectionHead icon={TrendingUp} title="Income Profile" count={incomeProfiles.length} />
        {incomeProfiles.length === 0 ? (
          <p className="member-dash-empty">No income profile records for this member.</p>
        ) : (
          <div className="master-table-shell">
            <table className="master-table">
              <thead>
                <tr>
                  <th>Total Income (Last Year)</th>
                  <th>Present Month</th>
                  <th>Future Projection</th>
                  <th>Month 1–6</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {incomeProfiles.map((row) => (
                  <tr key={row.IncomeProfileId}>
                    <td>{formatCurrency(row.TotalIncomeLastYear)}</td>
                    <td>{formatCurrency(row.PresentMonthIncome)}</td>
                    <td>{formatCurrency(row.FutureProjection)}</td>
                    <td>
                      {[row.Month1Income, row.Month2Income, row.Month3Income, row.Month4Income, row.Month5Income, row.Month6Income]
                        .map((m) => formatCurrency(m))
                        .join(' / ')}
                    </td>
                    <td>{formatDate(row.CreatedDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="page-card">
        <SectionHead icon={MapPinned} title="Tracking Their Activity" count={trackingRecords.length} />
        {trackingRecords.length === 0 ? (
          <p className="member-dash-empty">No activity tracking records for this member.</p>
        ) : (
          <div className="master-table-shell">
            <table className="master-table">
              <thead>
                <tr>
                  <th>Geo Status</th>
                  <th>Remarks</th>
                  <th>Image</th>
                  <th>Video</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {trackingRecords.map((row) => (
                  <tr key={row.TrackingId}>
                    <td>
                      {row.GeoStatus ? (
                        <span className={`member-dash-status-chip member-dash-status-chip--${row.GeoStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                          {row.GeoStatus}
                        </span>
                      ) : '—'}
                    </td>
                    <td>{row.Remarks || '—'}</td>
                    <td>
                      {row.ImagePath ? (
                        <a href={resolveMediaUrl(row.ImagePath)} target="_blank" rel="noreferrer">
                          View Image
                        </a>
                      ) : '—'}
                    </td>
                    <td>
                      {row.VideoPath ? (
                        <a href={resolveMediaUrl(row.VideoPath)} target="_blank" rel="noreferrer">
                          View Video
                        </a>
                      ) : '—'}
                    </td>
                    <td>{formatDate(row.CreatedDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="page-card">
        <SectionHead icon={GraduationCap} title="Technical Support" count={technicalSupports.length} />
        {technicalSupports.length === 0 ? (
          <p className="member-dash-empty">No technical support records for this member.</p>
        ) : (
          <div className="master-table-shell">
            <table className="master-table">
              <thead>
                <tr>
                  <th>Skill Training</th>
                  <th>Skill Trade</th>
                  <th>EDP Training</th>
                  <th>EDP Trade</th>
                  <th>Training Required</th>
                  <th>Required Trade</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {technicalSupports.map((row) => (
                  <tr key={row.TechnicalSupportId}>
                    <td>{formatBool(row.HasSkillTraining)}</td>
                    <td>{row.SkillTrade || (row.SkillTradeId ? `Trade #${row.SkillTradeId}` : '—')}</td>
                    <td>{formatBool(row.HasEDPTraining)}</td>
                    <td>{row.EDPTrade || (row.EDPTradeId ? `Trade #${row.EDPTradeId}` : '—')}</td>
                    <td>{formatBool(row.TrainingRequired)}</td>
                    <td>{row.RequiredTrade || (row.RequiredTradeId ? `Trade #${row.RequiredTradeId}` : '—')}</td>
                    <td>{formatDate(row.CreatedDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="page-card">
        <SectionHead icon={HandCoins} title="Financial Support" count={financialSupports.length} />
        {financialSupports.length === 0 ? (
          <p className="member-dash-empty">No financial support records for this member.</p>
        ) : (
          <div className="master-table-shell">
            <table className="master-table">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Support Required</th>
                  <th>Loan Cycle</th>
                  <th>Created Date</th>
                  <th>Loan Projection</th>
                </tr>
              </thead>
              <tbody>
                {financialSupports.map((row) => (
                  <tr key={row.FinancialSupportId}>
                    <td>{row.ActivityName || (row.ActivityId ? `Activity #${row.ActivityId}` : '—')}</td>
                    <td>{formatBool(row.IsFinancialSupportRequired)}</td>
                    <td>{row.CycleName || (row.LoanCycleId ? `Cycle ${row.LoanCycleId}` : '—')}</td>
                    <td>{formatDate(row.CreatedDate)}</td>
                    <td>
                      <button
                        type="button"
                        className="excel-preview-btn"
                        disabled={!row.ActivityId || !row.LoanCycleId}
                        title={!row.ActivityId || !row.LoanCycleId ? 'No loan cycle assigned for this record yet' : undefined}
                        onClick={() => viewProjection(row)}
                      >
                        View Projection
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {projectionFor && (
        <div className="member-dash-modal-backdrop" onClick={() => setProjectionFor(null)}>
          <div className="member-dash-modal" onClick={(e) => e.stopPropagation()}>
            <div className="member-dash-modal-header">
              <h3>Loan Projection</h3>
              <button type="button" onClick={() => setProjectionFor(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="member-dash-modal-body">
              {projectionLoading ? (
                <Loader />
              ) : projectionError ? (
                <p className="member-dash-empty">{projectionError}</p>
              ) : projection ? (
                <div className="member-dash-kv-grid">
                  <div><span>Loan Amount</span><strong>{formatCurrency(projection.LoanAmount)}</strong></div>
                  <div><span>Tenure (Months)</span><strong>{projection.TenureMonths}</strong></div>
                  <div><span>Rate of Interest</span><strong>{projection.ROI}%</strong></div>
                  <div><span>Interest Amount</span><strong>{formatCurrency(projection.InterestAmount)}</strong></div>
                  <div><span>Total Repayable</span><strong>{formatCurrency(projection.TotalRepayable)}</strong></div>
                  <div><span>Monthly Installment</span><strong>{formatCurrency(projection.MonthlyInstallment)}</strong></div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default ShgMemberDashboard;
