import React from 'react';
import { Download, ExternalLink, MapPin, RefreshCw, Search } from 'lucide-react';
import PageShell from '../../components/common/PageShell';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import {
  getSHGTrackingControllerReport,
  type SHGTrackingReportRecord,
} from '../../services/masterService';
import './Reports.css';

const PAGE_SIZE = 25;
const dash = '—';

const fields: Array<{ key: keyof SHGTrackingReportRecord; label: string }> = [
  { key: 'memberId', label: 'Member ID' },
  { key: 'districtId', label: 'District ID' },
  { key: 'districtName', label: 'District' },
  { key: 'blockId', label: 'Block ID' },
  { key: 'blockName', label: 'Block' },
  { key: 'gpId', label: 'Gram Panchayat ID' },
  { key: 'gpName', label: 'Gram Panchayat' },
  { key: 'villageId', label: 'Village ID' },
  { key: 'villageName', label: 'Village' },
  { key: 'shgCode', label: 'SHG Code' },
  { key: 'shgName', label: 'SHG Name' },
  { key: 'memberCode', label: 'Member Code' },
  { key: 'memberName', label: 'Member Name' },
  { key: 'activityId', label: 'Activity ID' },
  { key: 'activityName', label: 'Activity' },
  { key: 'subCategoryId', label: 'Subcategory ID' },
  { key: 'subActivityName', label: 'Subactivity' },
  { key: 'investmentAmount', label: 'Investment' },
  { key: 'incomeBeforeSupport', label: 'Income before support' },
  { key: 'futureProjection', label: 'Future income projection' },
  { key: 'latitude', label: 'Latitude' },
  { key: 'longitude', label: 'Longitude' },
  { key: 'activityImagePath', label: 'Activity image path' },
  { key: 'videoPath', label: 'Video path' },
  { key: 'geoStatus', label: 'Geo status' },
  { key: 'imageStatus', label: 'Image status' },
  { key: 'videoStatus', label: 'Video status' },
  { key: 'remarks', label: 'Remarks' },
  { key: 'trackingDate', label: 'Tracking date' },
  { key: 'trainingStatus', label: 'Training status' },
  { key: 'financialSupportStatus', label: 'Financial support status' },
];

const display = (value: unknown) => value === null || value === undefined || value === '' ? dash : String(value);
const currency = (value: number | null) => value == null
  ? dash
  : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
const formatDate = (value: string | null) => value ? new Date(value).toLocaleString('en-IN') : dash;
const mediaUrl = (path: string) => /^https?:\/\//i.test(path)
  ? path
  : `https://trlm.pickitover.com/${path.replace(/^\/+/, '')}`;
const mapsUrl = (row: SHGTrackingReportRecord) => `https://www.google.com/maps?q=${row.latitude},${row.longitude}`;

const downloadCsv = (records: SHGTrackingReportRecord[]) => {
  const csvRows = [
    fields.map((field) => field.label),
    ...records.map((record) => fields.map(({ key }) => display(record[key]))),
  ];
  const csv = csvRows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'shg-tracking-report.csv';
  anchor.click();
  URL.revokeObjectURL(url);
};

const FieldGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="tracking-report__group">
    <h3>{title}</h3>
    <div className="tracking-report__fields">{children}</div>
  </section>
);

const DataField: React.FC<{ label: string; value: React.ReactNode; wide?: boolean }> = ({ label, value, wide }) => (
  <div className={`tracking-report__field${wide ? ' tracking-report__field--wide' : ''}`}>
    <span>{label}</span>
    <strong>{value ?? dash}</strong>
  </div>
);

const Status: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <span className={`tracking-report__status tracking-report__status--${value.toLowerCase().includes('upload') || value.toLowerCase().includes('complete') ? 'good' : 'neutral'}`}>
    <span>{label}</span><strong>{value || dash}</strong>
  </span>
);

const Reports: React.FC = () => {
  const { user } = useAuth();
  const staffUserId = user?.livelihoodTrackerId ?? user?.staffId ?? user?.id;
  const [memberIdInput, setMemberIdInput] = React.useState('');
  const [memberIdFilter, setMemberIdFilter] = React.useState('');
  const [records, setRecords] = React.useState<SHGTrackingReportRecord[]>([]);
  const [page, setPage] = React.useState(1);
  const [totalRecords, setTotalRecords] = React.useState(0);
  const [hasNextPage, setHasNextPage] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [refreshVersion, setRefreshVersion] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      if (!staffUserId) {
        setError('Your staff account ID is unavailable. Sign in again and retry.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const result = await getSHGTrackingControllerReport({
          staffUserId,
          memberId: memberIdFilter || undefined,
          pageNumber: page,
          pageSize: PAGE_SIZE,
        });
        if (active) {
          setRecords(result.records ?? []);
          setTotalRecords(result.totalRecords ?? 0);
          setHasNextPage((result.totalPages ?? 0) > page || (result.records?.length ?? 0) === PAGE_SIZE);
        }
      } catch (cause) {
        console.error('Failed to load SHG tracking report', cause);
        if (active) setError('Unable to load SHG tracking records. Please retry.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, [staffUserId, memberIdFilter, page, refreshVersion]);

  const applyMemberFilter = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setMemberIdFilter(memberIdInput.trim());
  };

  const pageStart = records.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const pageEnd = (page - 1) * PAGE_SIZE + records.length;
  const totalLabel = totalRecords || (hasNextPage ? `${pageEnd}+` : pageEnd);

  return (
    <PageShell kicker="Reports" title="SHG Tracking Report" subtitle="Member, livelihood, support, visit, location, and media details from the tracking report API.">
      <div className="tracking-report">
        <form className="tracking-report__toolbar" onSubmit={applyMemberFilter}>
          <label htmlFor="tracking-member-filter">Member ID</label>
          <div className="tracking-report__search">
            <Search size={16} aria-hidden="true" />
            <input
              id="tracking-member-filter"
              inputMode="numeric"
              pattern="[0-9]*"
              value={memberIdInput}
              onChange={(event) => setMemberIdInput(event.target.value)}
              placeholder="Search by member ID"
            />
          </div>
          <button className="tracking-report__button tracking-report__button--primary" type="submit">
            <Search size={16} /> Search
          </button>
          <button className="tracking-report__icon-button" type="button" title="Refresh report" aria-label="Refresh report" onClick={() => setRefreshVersion((value) => value + 1)} disabled={loading}>
            <RefreshCw size={17} className={loading ? 'tracking-report__spinning' : ''} />
          </button>
          <button className="tracking-report__button" type="button" onClick={() => downloadCsv(records)} disabled={!records.length}>
            <Download size={16} /> Export page
          </button>
          <span className="tracking-report__count">{totalLabel} records</span>
        </form>

        {error && <div className="tracking-report__error" role="alert">{error}</div>}
        {loading && records.length > 0 && <div className="tracking-report__progress" role="status">Updating report…</div>}

        {loading && records.length === 0 ? (
          <div className="tracking-report__loading"><Loader /></div>
        ) : records.length === 0 ? (
          <div className="tracking-report__empty">{error ? 'No records to display.' : 'No SHG tracking records found.'}</div>
        ) : (
          <div className="tracking-report__list">
            {records.map((row, index) => {
              const hasLocation = row.latitude != null && row.longitude != null;
              return (
                <article className="tracking-report__record" key={`${row.memberId}-${row.trackingDate ?? page}-${index}`}>
                  <header className="tracking-report__record-head">
                    <div>
                      <p>SHG MEMBER · {display(row.memberCode)}</p>
                      <h2>{row.memberName || `Member ${row.memberId}`}</h2>
                      <span>{row.shgName || dash} <span aria-hidden="true">·</span> {row.shgCode || dash}</span>
                    </div>
                    <div className="tracking-report__record-id">
                      <span>Member ID</span><strong>{row.memberId}</strong>
                      <small>{formatDate(row.trackingDate)}</small>
                    </div>
                  </header>

                  <div className="tracking-report__record-body">
                    <FieldGroup title="Location">
                      <DataField label="District" value={`${display(row.districtName)} · ${display(row.districtId)}`} />
                      <DataField label="Block" value={`${display(row.blockName)} · ${display(row.blockId)}`} />
                      <DataField label="Gram Panchayat" value={`${display(row.gpName)} · ${display(row.gpId)}`} />
                      <DataField label="Village" value={`${display(row.villageName)} · ${display(row.villageId)}`} />
                      <DataField label="Coordinates" value={hasLocation ? `${row.latitude}, ${row.longitude}` : 'Not captured'} />
                      {hasLocation && <DataField label="Map" value={<a className="tracking-report__map-link" href={mapsUrl(row)} target="_blank" rel="noreferrer"><MapPin size={14} /> Open map <ExternalLink size={13} /></a>} />}
                    </FieldGroup>

                    <FieldGroup title="Livelihood & income">
                      <DataField label="Activity" value={`${display(row.activityName)} · ${display(row.activityId)}`} />
                      <DataField label="Subactivity" value={`${display(row.subActivityName)} · ${display(row.subCategoryId)}`} />
                      <DataField label="Investment" value={currency(row.investmentAmount)} />
                      <DataField label="Income before support" value={currency(row.incomeBeforeSupport)} />
                      <DataField label="Future projection" value={currency(row.futureProjection)} />
                    </FieldGroup>

                    <FieldGroup title="Visit status">
                      <div className="tracking-report__statuses">
                        <Status label="Geo" value={row.geoStatus || dash} />
                        <Status label="Image" value={row.imageStatus || dash} />
                        <Status label="Video" value={row.videoStatus || dash} />
                        <Status label="Training" value={row.trainingStatus || dash} />
                        <Status label="Financial support" value={row.financialSupportStatus || dash} />
                      </div>
                      <DataField label="Remarks" value={row.remarks || dash} wide />
                    </FieldGroup>

                    <FieldGroup title="Visit media">
                      <div className="tracking-report__media">
                        {row.activityImagePath ? (
                          <a className="tracking-report__media-item" href={mediaUrl(row.activityImagePath)} target="_blank" rel="noreferrer">
                            <img src={mediaUrl(row.activityImagePath)} alt={`Activity for ${row.memberName}`} loading="lazy" />
                            <span>Activity image</span><code>{row.activityImagePath}</code>
                          </a>
                        ) : <div className="tracking-report__media-empty">No activity image</div>}
                        {row.videoPath ? (
                          <div className="tracking-report__media-item">
                            <video src={mediaUrl(row.videoPath)} controls preload="metadata" />
                            <span>Visit video</span><code>{row.videoPath}</code>
                          </div>
                        ) : <div className="tracking-report__media-empty">No visit video</div>}
                      </div>
                    </FieldGroup>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <footer className="tracking-report__pagination">
          <span>{pageStart ? `Showing ${pageStart}–${pageEnd}` : 'No records'}{totalRecords ? ` of ${totalRecords}` : ''}</span>
          <div>
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading}>Previous</button>
            <strong>Page {page}</strong>
            <button type="button" onClick={() => setPage((current) => current + 1)} disabled={!hasNextPage || loading}>Next</button>
          </div>
        </footer>
      </div>
    </PageShell>
  );
};

export default Reports;
