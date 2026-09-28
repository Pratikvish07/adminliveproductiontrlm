import React from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import {
  memberProfileService,
  type FullDetailReport,
  type MemberDisplayLookups,
} from '../../services/memberProfileService';
import './MemberDetailCollections.css';

const dash = '—';
const currency = (value: number | null | undefined) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value ?? 0);
const date = (value?: string | null) => value ? new Date(value).toLocaleDateString('en-IN') : dash;
const yesNo = (value: boolean) => value ? 'Yes' : 'No';
const displayName = (kind: string, id: number | string | null | undefined, name: string | null | undefined, lookup?: Record<string, string>) => {
  if (name?.trim()) return name;
  if (id == null || id === '') return dash;
  return lookup?.[String(id)] || `${kind} ${id}`;
};
const mediaUrl = (path?: string | null) => {
  if (!path) return '';
  return /^https?:\/\//i.test(path) ? path : `https://trlm.pickitover.com/${path.replace(/^\/+/, '')}`;
};

const DetailSection: React.FC<{ title: string; count: number; children: React.ReactNode }> = ({ title, count, children }) => (
  <section className="member-detail-section">
    <header className="member-detail-section__head">
      <h4>{title}</h4>
      <span>{count}</span>
    </header>
    {children}
  </section>
);

const Field: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="member-detail-field">
    <span>{label}</span>
    <strong>{value ?? dash}</strong>
  </div>
);

const Empty: React.FC = () => <p className="member-detail-empty">No records available.</p>;

const MemberDetailCollections: React.FC<{ memberId: number }> = ({ memberId }) => {
  const [report, setReport] = React.useState<FullDetailReport | null>(null);
  const [lookups, setLookups] = React.useState<MemberDisplayLookups | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    memberProfileService.getFullDetailReport(memberId)
      .then((data) => { if (active) setReport(data); })
      .catch((cause) => {
        console.error('Failed to load consolidated SHG member report', cause);
        const apiError = cause as {
          message?: string;
          response?: { status?: number; data?: { message?: string } };
        };
        const reason = apiError.response?.data?.message
          || (apiError.response?.status ? `Request failed (${apiError.response.status}).` : apiError.message);
        if (active) setError(reason ? `Member profile details could not be loaded: ${reason}` : 'Member profile details could not be loaded.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [memberId]);

  React.useEffect(() => {
    let active = true;
    memberProfileService.getDisplayLookups().then((data) => {
      if (active) setLookups(data);
    });
    return () => { active = false; };
  }, []);

  if (loading) return <div className="member-detail-loading" role="status">Loading full member profile…</div>;
  if (error || !report) return <div className="member-detail-error" role="alert">{error || 'No member profile found.'}</div>;

  const investments = report.InvestmentProfile ?? [];
  const income = report.IncomeProfile ?? [];
  const investmentTotal = investments.reduce((sum, row) => sum + (row.TotalInvestment || 0), 0);
  const previousIncome = income.reduce((sum, row) => sum + (row.TotalIncomeLastYear || 0), 0);
  const projectedIncome = income.reduce((sum, row) => sum + (row.FutureProjection || 0), 0);
  const trained = report.TechnicalSupport?.some((row) => row.HasSkillTraining || row.HasEDPTraining) ?? false;
  const supportRequired = report.FinancialSupport?.some((row) => row.IsFinancialSupportRequired) ?? false;

  return (
    <div className="member-detail-content">
      <div className="member-detail-summary">
        <div><span>Activity profiles</span><strong>{report.ActivityProfile?.length ?? 0}</strong></div>
        <div><span>Total investment</span><strong>{currency(investmentTotal)}</strong></div>
        <div><span>Income projection</span><strong>{currency(previousIncome)} <i>to</i> {currency(projectedIncome)}</strong></div>
        <div><span>Training</span><strong>{trained ? 'Recorded' : 'Not recorded'}</strong></div>
        <div><span>Financial support</span><strong>{supportRequired ? 'Required' : report.FinancialSupport?.length ? 'Not required' : 'No record'}</strong></div>
      </div>

      <DetailSection title="Tracking visits" count={report.SHGTracking?.length ?? 0}>
        {!report.SHGTracking?.length ? <Empty /> : report.SHGTracking.map((visit, index) => {
          const lat = Number(visit.Latitude);
          const lng = Number(visit.Longitude);
          const hasLocation = visit.Latitude != null && visit.Longitude != null
            && visit.Latitude !== '' && visit.Longitude !== ''
            && Number.isFinite(lat) && Number.isFinite(lng);
          return (
            <article className="member-detail-record" key={visit.TrackingId ?? index}>
              <div className="member-detail-record__top">
                <strong>{visit.SHGName || 'SHG visit'}</strong>
                <span>{date(visit.CreatedDate)}</span>
              </div>
              <div className="member-detail-fields">
                <Field label="CRP" value={displayName('CRP', visit.CRPRegistrationId, visit.CRPName)} />
                <Field label="Geo status" value={visit.GeoStatus} />
                <Field label="Image status" value={visit.ImageStatus} />
                <Field label="Video status" value={visit.VideoStatus} />
                <Field label="Remarks" value={visit.Remarks} />
                {hasLocation && <Field label="GPS location" value={`${lat.toFixed(5)}, ${lng.toFixed(5)}`} />}
              </div>
              {hasLocation && <a className="member-detail-map" href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noreferrer"><MapPin size={14} /> Open map <ExternalLink size={13} /></a>}
              {(visit.ImagePath || visit.VideoPath) && (
                <div className="member-detail-media">
                  {visit.ImagePath && <a href={mediaUrl(visit.ImagePath)} target="_blank" rel="noreferrer"><img src={mediaUrl(visit.ImagePath)} alt="Member activity" loading="lazy" /><span>Activity photo</span></a>}
                  {visit.VideoPath && <div><video src={mediaUrl(visit.VideoPath)} controls preload="metadata" /><span>Tracking video</span></div>}
                </div>
              )}
            </article>
          );
        })}
      </DetailSection>

      <DetailSection title="Activity profiles" count={report.ActivityProfile?.length ?? 0}>
        {!report.ActivityProfile?.length ? <Empty /> : report.ActivityProfile.map((row) => (
          <article className="member-detail-record" key={row.ActivityProfileId}>
            <div className="member-detail-record__top"><strong>{displayName('Activity', row.ActivityId, row.ActivityName, lookups?.activities)}</strong><span>{date(row.CreatedDate)}</span></div>
            <div className="member-detail-fields">
              <Field label="Area" value={row.Area} /><Field label="Unit" value={displayName('Unit', row.UnitId, row.UnitName, lookups?.units)} />
              <Field label="Activity type" value={displayName('Type', row.ActivityTypeId, row.ActivityTypeName, lookups?.activityTypes)} /><Field label="Season" value={displayName('Season', row.SeasonId, row.SeasonName, lookups?.seasons)} />
              <Field label="Land type" value={displayName('Land type', row.LandTypeId, row.LandTypeName, lookups?.landTypes)} /><Field label="Perennial" value={row.PerennialValue || dash} />
            </div>
          </article>
        ))}
      </DetailSection>

      <DetailSection title="Income profiles" count={income.length}>
        {!income.length ? <Empty /> : income.map((row) => (
          <article className="member-detail-record" key={row.IncomeProfileId}>
            <div className="member-detail-record__top"><strong>Income record #{row.IncomeProfileId}</strong><span>{date(row.CreatedDate)}</span></div>
            <div className="member-detail-fields">
              <Field label="Last year" value={currency(row.TotalIncomeLastYear)} /><Field label="Present month" value={currency(row.PresentMonthIncome)} />
              <Field label="Future projection" value={currency(row.FutureProjection)} />
            </div>
            <div className="member-detail-months">{[row.Month1Income, row.Month2Income, row.Month3Income, row.Month4Income, row.Month5Income, row.Month6Income].map((value, index) => <div key={index}><span>Month {index + 1}</span><strong>{currency(value)}</strong></div>)}</div>
          </article>
        ))}
      </DetailSection>

      <DetailSection title="Investment profiles" count={investments.length}>
        {!investments.length ? <Empty /> : investments.map((row) => (
          <article className="member-detail-record" key={row.InvestmentProfileId}>
            <div className="member-detail-record__top"><strong>Total {currency(row.TotalInvestment)}</strong><span>{date(row.CreatedDate)}</span></div>
            <div className="member-detail-fields">
              <Field label="SHG loan" value={currency(row.LoanFromSHG)} /><Field label="Bank loan" value={currency(row.LoanFromBank)} />
              <Field label="Individual financing" value={currency(row.IndividualFinancing)} /><Field label="Own contribution" value={currency(row.OwnContribution)} />
              <Field label="CSR" value={currency(row.CSR)} /><Field label="Government grant" value={currency(row.GovernmentGrant)} />
              <Field label="Other source" value={currency(row.OtherSource)} />
            </div>
          </article>
        ))}
      </DetailSection>

      <DetailSection title="Technical support & training" count={report.TechnicalSupport?.length ?? 0}>
        {!report.TechnicalSupport?.length ? <Empty /> : report.TechnicalSupport.map((row) => (
          <article className="member-detail-record" key={row.TechnicalSupportId}>
            <div className="member-detail-fields">
              <Field label="Skill training" value={yesNo(row.HasSkillTraining)} /><Field label="Skill trade" value={displayName('Trade', row.SkillTradeId, row.SkillTrade, lookups?.trades)} />
              <Field label="Skill training date" value={date(row.SkillTrainingDate)} /><Field label="Skill agency" value={displayName('Agency', row.SkillAgencyId, row.SkillAgency, lookups?.agencies)} />
              <Field label="EDP training" value={yesNo(row.HasEDPTraining)} /><Field label="EDP trade" value={displayName('Trade', row.EDPTradeId, row.EDPTrade, lookups?.trades)} />
              <Field label="EDP training date" value={date(row.EDPTrainingDate)} /><Field label="EDP agency" value={displayName('Agency', row.EDPAagencyId, row.EDPAagency, lookups?.agencies)} />
              <Field label="Training required" value={yesNo(row.TrainingRequired)} /><Field label="Required trade" value={displayName('Trade', row.RequiredTradeId, row.RequiredTrade, lookups?.trades)} />
            </div>
          </article>
        ))}
      </DetailSection>

      <DetailSection title="Financial support" count={report.FinancialSupport?.length ?? 0}>
        {!report.FinancialSupport?.length ? <Empty /> : report.FinancialSupport.map((row) => (
          <article className="member-detail-record" key={row.FinancialSupportId}>
            <div className="member-detail-record__top"><strong>Support {row.IsFinancialSupportRequired ? 'required' : 'not required'}</strong><span>{date(row.CreatedDate)}</span></div>
            <div className="member-detail-fields">
              <Field label="Activity" value={displayName('Activity', row.ActivityId, row.ActivityName, lookups?.activities)} /><Field label="Loan cycle" value={row.CycleName || (row.LoanCycleId ? `Cycle ${row.LoanCycleId}` : dash)} />
            </div>
          </article>
        ))}
      </DetailSection>
    </div>
  );
};

export default MemberDetailCollections;
