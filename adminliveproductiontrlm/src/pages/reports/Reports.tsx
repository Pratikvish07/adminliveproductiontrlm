import React from 'react';
import PageShell from '../../components/common/PageShell';
import Loader from '../../components/common/Loader';
import { getSHGTrackingReports, type SHGTrackingRecord } from '../../services/reportService';
import './Reports.css';

type ReportRecord = {
  reportId: string;
  crpId: string;
  crpName: string;
  district: string;
  block: string;
  gramPanchayat: string;
  village: string;
  shgName: string;
  shgCode: string;
  memberName: string;
  memberCategory: string;
  activityName: string;
  seasonality: string;
  totalInvestment: number;
  annualIncomeBefore: number;
  annualIncomeAfter: number;
  progressStatus: string;
  assignedGeoLocation: string;
  trackingGeoLocation: string;
  trackingImage: string;
  trackingVideo: string;
  imagePath?: string;
  videoPath?: string;
  checkInDateTime: string;
  checkOutDateTime: string;
  visitDate: string;
  nextVisitDate: string;
  geoTagged: boolean;
};

type ReportSectionKey = 'shg' | 'producerGroup' | 'nonProducerGroup' | 'lhCbo' | 'fpc' | 'chc';

type ReportSection = {
  key: ReportSectionKey;
  label: string;
  csvName: string;
};

const reportSections: ReportSection[] = [
  {
    key: 'shg',
    label: 'SHG Tracking',
    csvName: 'trlm-shg-tracking-report.csv',
  },
  {
    key: 'producerGroup',
    label: 'Producer Group',
    csvName: 'trlm-producer-group-report.csv',
  },
  {
    key: 'nonProducerGroup',
    label: 'Non Producer Group',
    csvName: 'trlm-non-producer-group-report.csv',
  },
  {
    key: 'lhCbo',
    label: 'Integrated Farming Cluster (IFC)',
    csvName: 'trlm-integrated-farming-cluster-ifc-report.csv',
  },
  {
    key: 'fpc',
    label: 'FPC',
    csvName: 'trlm-fpc-report.csv',
  },
  {
    key: 'chc',
    label: 'CHC',
    csvName: 'trlm-chc-report.csv',
  },
];

const mapTrackingToReportRecord = (item: SHGTrackingRecord, index: number): ReportRecord => {
  const hasGeo = Boolean(
    (item.Latitude && item.Longitude) ||
    item.GeoStatus === 'Verified' ||
    item.GeoStatus === 'Checked' ||
    item.GeoStatus === 'Live'
  );
  const latLong = item.Latitude && item.Longitude ? `${item.Latitude}, ${item.Longitude}` : '—';

  return {
    reportId: item.TrackingId ? `TRK-${String(item.TrackingId).padStart(4, '0')}` : `RPT-${String(index + 1).padStart(4, '0')}`,
    crpId: item.CRPRegistrationId ? `CRP-${item.CRPRegistrationId}` : '—',
    crpName: item.CRPName || (item.CRPRegistrationId ? `CRP #${item.CRPRegistrationId}` : '—'),
    district: String(item.District || item.district || '—'),
    block: String(item.Block || item.block || '—'),
    gramPanchayat: String(item.GramPanchayat || item.gramPanchayat || '—'),
    village: String(item.Village || item.village || '—'),
    shgName: String(item.SHGName || '—'),
    shgCode: String(item.SHGCode || (item.SHGMemberId ? `SHG-${item.SHGMemberId}` : '—')),
    memberName: String(item.MemberName || (item.SHGMemberId ? `Member #${item.SHGMemberId}` : '—')),
    memberCategory: String(item.MemberCategory || '—'),
    activityName: String(item.ActivityName || item.Remarks || '—'),
    seasonality: String(item.Seasonality || '—'),
    totalInvestment: Number(item.TotalInvestment || 0),
    annualIncomeBefore: Number(item.AnnualIncomeBefore || 0),
    annualIncomeAfter: Number(item.AnnualIncomeAfter || 0),
    progressStatus: String(item.GeoStatus || item.ProgressStatus || 'Pending'),
    assignedGeoLocation: latLong,
    trackingGeoLocation: latLong,
    trackingImage: item.ImagePath ? 'uploaded' : (item.ImageStatus?.toLowerCase() === 'uploaded' ? 'uploaded' : 'not uploaded'),
    trackingVideo: item.VideoPath ? 'uploaded' : (item.VideoStatus?.toLowerCase() === 'uploaded' ? 'uploaded' : 'not uploaded'),
    imagePath: item.ImagePath || undefined,
    videoPath: item.VideoPath || undefined,
    checkInDateTime: item.CreatedDate ? new Date(item.CreatedDate).toLocaleString('en-IN') : '—',
    checkOutDateTime: item.CheckOutDate ? new Date(item.CheckOutDate).toLocaleString('en-IN') : '—',
    visitDate: item.CreatedDate ? new Date(item.CreatedDate).toLocaleDateString('en-IN') : '—',
    nextVisitDate: item.NextVisitDate ? String(item.NextVisitDate) : '—',
    geoTagged: hasGeo,
  };
};

const columnLabels: Record<keyof ReportRecord, string> = {
  reportId: 'Report ID',
  crpId: 'CRP ID',
  crpName: 'CRP Name',
  district: 'District',
  block: 'Block',
  gramPanchayat: 'Gram Panchayat',
  village: 'Village',
  shgName: 'SHG Name',
  shgCode: 'SHG Code',
  memberName: 'Member Name',
  memberCategory: 'Social Category',
  activityName: 'Activity',
  seasonality: 'Season',
  totalInvestment: 'Total Investment',
  annualIncomeBefore: 'Annual Income Before',
  annualIncomeAfter: 'Annual Income After',
  progressStatus: 'Progress Status',
  assignedGeoLocation: 'Assigned Geo Location (Lat, Long)',
  trackingGeoLocation: 'Tracking Geo Location (Lat, Long)',
  trackingImage: 'Tracking Image',
  trackingVideo: 'Tracking Video',
  checkInDateTime: 'Check In Date & Time',
  checkOutDateTime: 'Check Out Date & Time',
  visitDate: 'Visit Date',
  nextVisitDate: 'Next Visit Date',
  geoTagged: 'Geo Tagged',
  imagePath: 'Image Path',
  videoPath: 'Video Path',
};

const orderedColumns: Array<keyof ReportRecord> = [
  'reportId',
  'crpId',
  'crpName',
  'district',
  'block',
  'gramPanchayat',
  'village',
  'shgName',
  'shgCode',
  'memberName',
  'memberCategory',
  'activityName',
  'seasonality',
  'totalInvestment',
  'annualIncomeBefore',
  'annualIncomeAfter',
  'progressStatus',
  'assignedGeoLocation',
  'trackingGeoLocation',
  'trackingImage',
  'trackingVideo',
  'checkInDateTime',
  'checkOutDateTime',
  'visitDate',
  'nextVisitDate',
  'geoTagged',
];

// Columns that stay pinned (frozen) while the sheet scrolls horizontally.
// Order matters: this must match the left-most slice of `orderedColumns`.
const frozenColumns: Partial<Record<keyof ReportRecord, boolean>> = {
  reportId: true,
  crpId: true,
  crpName: true,
};

const getFrozenClassName = (column: keyof ReportRecord) =>
  frozenColumns[column] ? `excel-sheet__col-${column}` : undefined;

const excelLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

type PreviewState =
  | {
    type: 'image' | 'video';
    title: string;
    src: string;
  }
  | null;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

const formatCellValue = (column: keyof ReportRecord, value: ReportRecord[keyof ReportRecord]) => {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (column === 'totalInvestment' || column === 'annualIncomeBefore' || column === 'annualIncomeAfter') {
    return formatCurrency(Number(value));
  }

  return String(value);
};

const toDataUri = (svg: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const resolveMediaUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path.replace(/^\/+/, '');
  return `https://trlm.pickitover.com/${cleanPath}`;
};

const buildImagePreview = (record: ReportRecord) => {
  if (record.imagePath) {
    return resolveMediaUrl(record.imagePath);
  }
  return toDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#d7f0e2"/>
          <stop offset="100%" stop-color="#a8d5ba"/>
        </linearGradient>
      </defs>
      <rect width="960" height="540" fill="url(#bg)"/>
      <rect x="48" y="48" width="864" height="444" rx="26" fill="#ffffff" opacity="0.9"/>
      <text x="90" y="130" font-family="Arial" font-size="34" font-weight="700" fill="#17324a">${record.memberName}</text>
      <text x="90" y="178" font-family="Arial" font-size="22" fill="#4b6478">${record.activityName} - ${record.village}</text>
      <text x="90" y="228" font-family="Arial" font-size="20" fill="#4b6478">Tracking Image Preview</text>
      <text x="90" y="270" font-family="Arial" font-size="20" fill="#4b6478">CRP: ${record.crpName}</text>
      <text x="90" y="312" font-family="Arial" font-size="20" fill="#4b6478">Visited: ${record.visitDate}</text>
      <text x="90" y="354" font-family="Arial" font-size="20" fill="#4b6478">Location: ${record.trackingGeoLocation}</text>
      <circle cx="770" cy="220" r="86" fill="#dff5e7"/>
      <path d="M730 246l44-58 33 42 20-24 47 62z" fill="#2f855a"/>
      <circle cx="742" cy="188" r="16" fill="#89c997"/>
      <text x="90" y="430" font-family="Arial" font-size="18" fill="#60788c">Image placeholder</text>
    </svg>
  `);
};

const buildVideoPreview = (record: ReportRecord) => {
  if (record.videoPath) {
    return resolveMediaUrl(record.videoPath);
  }
  return toDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#17324a"/>
          <stop offset="100%" stop-color="#2b5b80"/>
        </linearGradient>
      </defs>
      <rect width="960" height="540" fill="url(#bg)"/>
      <rect x="70" y="64" width="820" height="412" rx="28" fill="#0f2234" stroke="#6ea9d3" stroke-width="2"/>
      <circle cx="480" cy="270" r="72" fill="#ffffff" opacity="0.92"/>
      <path d="M455 228l68 42-68 42z" fill="#17324a"/>
      <text x="90" y="118" font-family="Arial" font-size="32" font-weight="700" fill="#ffffff">${record.memberName}</text>
      <text x="90" y="162" font-family="Arial" font-size="22" fill="#d6e7f4">Tracking Video Preview - ${record.activityName}</text>
      <text x="90" y="430" font-family="Arial" font-size="18" fill="#d6e7f4">Visit: ${record.visitDate} | Next: ${record.nextVisitDate}</text>
      <text x="90" y="458" font-family="Arial" font-size="18" fill="#d6e7f4">Geo: ${record.trackingGeoLocation}</text>
    </svg>
  `);
};

const exportCSV = (rowsToExport: ReportRecord[], fileName: string) => {
  const headers = orderedColumns.map((column) => columnLabels[column]);
  const rows = rowsToExport.map((record) =>
    orderedColumns.map((column) => formatCellValue(column, record[column])),
  );

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

const Reports: React.FC = () => {
  const [preview, setPreview] = React.useState<PreviewState>(null);
  const [activeSectionKey, setActiveSectionKey] = React.useState<ReportSectionKey>('shg');
  const [records, setRecords] = React.useState<ReportRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const activeSection = reportSections.find((section) => section.key === activeSectionKey) ?? reportSections[0];

  const fetchReports = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getSHGTrackingReports();
      const mapped = data.map((item, index) => mapTrackingToReportRecord(item, index));
      setRecords(mapped);
    } catch (err) {
      console.error('Failed to fetch tracking reports', err);
      setError('Unable to load reports from server. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // If section is SHG, use all fetched tracking records. Otherwise empty/filtered until backend adds other sections.
  const activeRows = activeSectionKey === 'shg' ? records : [];
  const completedCount = activeRows.filter((row) =>
    row.progressStatus.toLowerCase().includes('complete') ||
    row.progressStatus.toLowerCase().includes('checked') ||
    row.progressStatus.toLowerCase().includes('verified')
  ).length;
  const geoTaggedCount = activeRows.filter((row) => row.geoTagged).length;

  return (
    <PageShell
      kicker="Reports"
      title={`${activeSection.label} Status`}
      subtitle="Live admin reports fetched from SHG Tracking API with CSV download."
    >
      {error && (
        <div className="page-card" style={{ marginBottom: '16px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px' }}>
          <span>{error}</span>
          <button
            type="button"
            className="excel-report-btn"
            style={{ background: '#b91c1c', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer' }}
            onClick={fetchReports}
          >
            Retry
          </button>
        </div>
      )}

      <section className="excel-report-hero page-card">
        <div>
          <span className="excel-report-hero__kicker">Workbook Preview</span>
          <h2>{activeSection.label} Register</h2>
          <p>
            Spreadsheet-style report view for admin review. Select a report section, scroll horizontally,
            inspect live tracking records, and download the data as CSV.
          </p>
        </div>
        <div className="excel-report-hero__stats">
          <div>
            <span>Total Records</span>
            <strong>{activeRows.length}</strong>
          </div>
          <div>
            <span>Completed / Verified</span>
            <strong>{completedCount}</strong>
          </div>
          <div>
            <span>Geo Tagged</span>
            <strong>{geoTaggedCount}</strong>
          </div>
        </div>
        <div className="excel-report-hero__actions">
          <button
            className="excel-report-btn excel-report-btn--secondary"
            type="button"
            onClick={fetchReports}
            disabled={loading}
            style={{ marginRight: '8px' }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            className="excel-report-btn excel-report-btn--primary"
            type="button"
            onClick={() => exportCSV(activeRows, activeSection.csvName)}
            disabled={activeRows.length === 0}
          >
            Download CSV
          </button>
        </div>
      </section>

      <section className="page-card excel-sheet-card">
        <div className="excel-sheet-card__bar">
          <div className="excel-sheet-card__tabs">
            {reportSections.map((section) => (
              <button
                key={section.key}
                className={section.key === activeSectionKey ? 'is-active' : undefined}
                type="button"
                onClick={() => setActiveSectionKey(section.key)}
              >
                {section.label}
              </button>
            ))}
          </div>
          <div className="excel-sheet-card__meta">
            {activeSection.label} ({activeRows.length} records)
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '48px', display: 'flex', justifyContent: 'center' }}>
            <Loader />
          </div>
        ) : (
          <div className="excel-sheet-wrap">
            <table className="excel-sheet">
              <thead>
                <tr className="excel-sheet__letters">
                  <th className="excel-sheet__row-index" />
                  {orderedColumns.map((column, index) => (
                    <th key={column} className={getFrozenClassName(column)}>
                      {excelLetters[index] || `C${index + 1}`}
                    </th>
                  ))}
                </tr>
                <tr className="excel-sheet__headers">
                  <th className="excel-sheet__row-index">1</th>
                  {orderedColumns.map((column) => (
                    <th key={column} className={getFrozenClassName(column)}>
                      {columnLabels[column]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeRows.length === 0 ? (
                  <tr>
                    <td colSpan={orderedColumns.length + 1} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                      No report records available for {activeSection.label}.
                    </td>
                  </tr>
                ) : (
                  activeRows.map((record, rowIndex) => (
                    <tr key={record.reportId}>
                      <td className="excel-sheet__row-index">{rowIndex + 2}</td>
                      {orderedColumns.map((column) => (
                        <td
                          key={`${record.reportId}-${column}`}
                          data-column={columnLabels[column]}
                          className={getFrozenClassName(column)}
                        >
                          {column === 'progressStatus' ? (
                            <span className={`excel-chip excel-chip--${String(record[column]).toLowerCase().replace(/\s+/g, '-')}`}>
                              {formatCellValue(column, record[column])}
                            </span>
                          ) : column === 'trackingImage' ? (
                            record.trackingImage === 'uploaded' ? (
                              <button
                                className="excel-preview-btn"
                                type="button"
                                onClick={() =>
                                  setPreview({
                                    type: 'image',
                                    title: `${record.memberName} - Tracking Image`,
                                    src: buildImagePreview(record),
                                  })
                                }
                              >
                                Preview Image
                              </button>
                            ) : (
                              <span className="excel-chip excel-chip--no">Not Uploaded</span>
                            )
                          ) : column === 'trackingVideo' ? (
                            record.trackingVideo === 'uploaded' ? (
                              <button
                                className="excel-preview-btn"
                                type="button"
                                onClick={() =>
                                  setPreview({
                                    type: 'video',
                                    title: `${record.memberName} - Tracking Video`,
                                    src: buildVideoPreview(record),
                                  })
                                }
                              >
                                Preview Video
                              </button>
                            ) : (
                              <span className="excel-chip excel-chip--no">Not Uploaded</span>
                            )
                          ) : column === 'geoTagged' ? (
                            <span className={`excel-chip ${record.geoTagged ? 'excel-chip--yes' : 'excel-chip--no'}`}>
                              {formatCellValue(column, record[column])}
                            </span>
                          ) : (
                            formatCellValue(column, record[column])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {preview && (
        <div className="excel-preview-modal" role="dialog" aria-modal="true">
          <div className="excel-preview-modal__backdrop" onClick={() => setPreview(null)} />
          <div className="excel-preview-modal__panel">
            <div className="excel-preview-modal__header">
              <div>
                <span className="excel-preview-modal__kicker">{preview.type === 'image' ? 'Image Preview' : 'Video Preview'}</span>
                <h3>{preview.title}</h3>
              </div>
              <button className="excel-preview-modal__close" type="button" onClick={() => setPreview(null)}>
                Close
              </button>
            </div>
            <div className="excel-preview-modal__body">
              {preview.type === 'video' && !preview.src.startsWith('data:image') ? (
                <video src={preview.src} controls autoPlay className="excel-preview-modal__media" />
              ) : (
                <img src={preview.src} alt={preview.title} className="excel-preview-modal__media" />
              )}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default Reports;