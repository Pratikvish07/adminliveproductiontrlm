import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import PageShell from '../../components/common/PageShell';
import Loader from '../../components/common/Loader';
import { getShgLivelihoods, getLivelihoodImages } from '../../services/masterService';
import { crpService } from '../../services/crpService';
import { getSHGTrackingReports } from '../../services/reportService';
import { getCRPid, toCRPRecords } from '../crp/crpUtils';
import type { ShgLivelihood, LivelihoodImage } from '../../types/master.types';
import './Reports.css';
import '../master/MasterData.css';

type CRPOption = { id: string; name: string };

const resolveMediaUrl = (path: string) => {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `https://trlm.pickitover.com/${path.replace(/^\/+/, '')}`;
};

type MemberReportRecord = {
  memberId: number;
  livelihoodId: number;
  memberName: string;
  shgName: string;
  activityName: string;
  subCategoryName: string;
  lhCbo: string;
  geoLocation: string;
  createdDate: string;
  hasGeo: boolean;
  isLhCbo: boolean;
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
    label: 'SHG Members',
    csvName: 'trlm-shg-members-report.csv',
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

const mapLivelihoodToReportRecord = (item: ShgLivelihood): MemberReportRecord => {
  const hasGeo = Boolean(item.Latitude && item.Longitude);

  return {
    memberId: item.MemberId,
    livelihoodId: item.LivelihoodId,
    memberName: item.MemberName || `Member #${item.MemberId}`,
    shgName: item.SHGName || '—',
    activityName: item.ActivityName || '—',
    subCategoryName: item.SubCategoryName || '—',
    lhCbo: item.IsLH_CBO ? (item.LH_CBO_Name || 'Yes') : 'No',
    geoLocation: hasGeo ? `${item.Latitude}, ${item.Longitude}` : '—',
    createdDate: item.CreatedDate ? new Date(item.CreatedDate).toLocaleDateString('en-IN') : '—',
    hasGeo,
    isLhCbo: item.IsLH_CBO,
  };
};

const columnLabels: Record<keyof Omit<MemberReportRecord, 'memberId' | 'livelihoodId' | 'hasGeo' | 'isLhCbo'>, string> = {
  memberName: 'Member Name',
  shgName: 'SHG Name',
  activityName: 'Activity',
  subCategoryName: 'Sub Category',
  lhCbo: 'LH-CBO',
  geoLocation: 'Geo Location (Lat, Long)',
  createdDate: 'Created Date',
};

const orderedColumns = Object.keys(columnLabels) as Array<keyof typeof columnLabels>;

const PAGE_SIZE = 10;

const exportCSV = (rowsToExport: MemberReportRecord[], fileName: string) => {
  const headers = orderedColumns.map((column) => columnLabels[column]);
  const rows = rowsToExport.map((record) => orderedColumns.map((column) => String(record[column])));

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
  const navigate = useNavigate();
  const [activeSectionKey, setActiveSectionKey] = React.useState<ReportSectionKey>('shg');
  const [records, setRecords] = React.useState<MemberReportRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [imagesFor, setImagesFor] = React.useState<MemberReportRecord | null>(null);
  const [images, setImages] = React.useState<LivelihoodImage[]>([]);
  const [imagesLoading, setImagesLoading] = React.useState(false);
  const [imagesError, setImagesError] = React.useState('');
  const [brokenImageIds, setBrokenImageIds] = React.useState<Set<number>>(new Set());
  const [crpOptions, setCrpOptions] = React.useState<CRPOption[]>([]);
  const [selectedCrpId, setSelectedCrpId] = React.useState('');
  const [memberIdsByCrp, setMemberIdsByCrp] = React.useState<Map<string, Set<number>>>(new Map());

  const activeSection = reportSections.find((section) => section.key === activeSectionKey) ?? reportSections[0];

  const fetchReports = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [data, crpList, trackingRecords] = await Promise.all([
        getShgLivelihoods(),
        crpService.getCRPList().catch(() => []),
        getSHGTrackingReports().catch(() => []),
      ]);

      setRecords(data.map(mapLivelihoodToReportRecord));

      const processedCrp = toCRPRecords(crpList);
      const options = processedCrp
        .map((record) => ({ id: getCRPid(record), name: record.name && record.name !== 'N/A' ? String(record.name) : '' }))
        .filter((option) => option.id && option.name)
        .sort((a, b) => a.name.localeCompare(b.name));
      setCrpOptions(options);

      // A CRP's jurisdiction isn't stored on the SHG member record itself — the only
      // link is through SHG Tracking visits, which stamp CRPRegistrationId per member.
      const byCrp = new Map<string, Set<number>>();
      trackingRecords.forEach((t) => {
        if (t.CRPRegistrationId === undefined || t.SHGMemberId === undefined) return;
        const crpId = String(t.CRPRegistrationId);
        const memberId = Number(t.SHGMemberId);
        if (!byCrp.has(crpId)) byCrp.set(crpId, new Set());
        byCrp.get(crpId)!.add(memberId);
      });
      setMemberIdsByCrp(byCrp);
    } catch (err) {
      console.error('Failed to fetch SHG member reports', err);
      setError('Unable to load reports from server. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // If section is SHG, use all fetched member records. Otherwise empty until backend adds other sections.
  const shgRows = activeSectionKey === 'shg' ? records : [];
  const crpMemberIds = selectedCrpId ? memberIdsByCrp.get(selectedCrpId) : undefined;
  const activeRows = crpMemberIds ? shgRows.filter((row) => crpMemberIds.has(row.memberId)) : shgRows;
  const lhCboCount = activeRows.filter((row) => row.isLhCbo).length;
  const geoTaggedCount = activeRows.filter((row) => row.hasGeo).length;

  const totalPages = Math.max(1, Math.ceil(activeRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = activeRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rangeStart = activeRows.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, activeRows.length);

  React.useEffect(() => {
    setPage(1);
  }, [activeSectionKey, records, selectedCrpId]);

  const openMemberDashboard = (record: MemberReportRecord) => {
    navigate(`/reports/shg-member/${record.memberId}`, {
      state: { memberName: record.memberName, shgName: record.shgName },
    });
  };

  const viewImages = async (record: MemberReportRecord) => {
    setImagesFor(record);
    setImages([]);
    setImagesError('');
    setBrokenImageIds(new Set());
    setImagesLoading(true);
    try {
      const data = await getLivelihoodImages(record.livelihoodId);
      setImages(data);
    } catch (err) {
      console.error('Failed to load livelihood images', err);
      setImagesError('Unable to load images for this record.');
    } finally {
      setImagesLoading(false);
    }
  };

  return (
    <PageShell
      kicker="Reports"
      title={`${activeSection.label} Register`}
      subtitle="Live admin roster fetched from the SHG Livelihood API. Click a member's name to open their full profile dashboard."
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
          <span className="excel-report-hero__kicker">SHG Member Roster</span>
          <h2>{activeSection.label}</h2>
          <p>
            Select a report section, inspect live SHG member records, click a name to drill into their
            full profile, or download the roster as CSV.
          </p>
        </div>
        <div className="excel-report-hero__stats">
          <div>
            <span>Total Members</span>
            <strong>{activeRows.length}</strong>
          </div>
          <div>
            <span>LH-CBO Members</span>
            <strong>{lhCboCount}</strong>
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

      <section className="page-card report-crp-filter">
        <label htmlFor="report-crp-filter-select">Filter by CRP</label>
        <select
          id="report-crp-filter-select"
          value={selectedCrpId}
          onChange={(e) => setSelectedCrpId(e.target.value)}
          disabled={loading}
        >
          <option value="">All CRPs ({records.length} members)</option>
          {crpOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name} ({memberIdsByCrp.get(option.id)?.size ?? 0} members)
            </option>
          ))}
        </select>
        {selectedCrpId && (
          <span className="report-crp-filter__hint">
            Showing SHG members tracked under this CRP's field visits (via SHG Tracking records).
          </span>
        )}
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
          <div className="master-table-shell" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
            <table className="master-table">
              <thead>
                <tr>
                  {orderedColumns.map((column) => (
                    <th key={column}>{columnLabels[column]}</th>
                  ))}
                  <th>Images</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={orderedColumns.length + 1} className="master-empty">
                      No report records available for {activeSection.label}.
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((record) => (
                    <tr key={record.livelihoodId}>
                      {orderedColumns.map((column) =>
                        column === 'memberName' ? (
                          <td key={column}>
                            <button
                              type="button"
                              className="excel-preview-btn"
                              onClick={() => openMemberDashboard(record)}
                            >
                              {record.memberName}
                            </button>
                          </td>
                        ) : (
                          <td key={column}>{record[column]}</td>
                        ),
                      )}
                      <td>
                        <button
                          type="button"
                          className="excel-preview-btn"
                          onClick={() => viewImages(record)}
                        >
                          View Images
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && activeRows.length > 0 && (
          <div className="report-pagination">
            <span className="report-pagination__info">
              Showing {rangeStart}–{rangeEnd} of {activeRows.length}
            </span>
            <div className="report-pagination__controls">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              <span className="report-pagination__page">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {imagesFor && (
        <div className="report-images-modal-backdrop" onClick={() => setImagesFor(null)}>
          <div className="report-images-modal" onClick={(e) => e.stopPropagation()}>
            <div className="report-images-modal__header">
              <h3>Livelihood Images — {imagesFor.memberName}</h3>
              <button type="button" onClick={() => setImagesFor(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="report-images-modal__body">
              {imagesLoading ? (
                <Loader />
              ) : imagesError ? (
                <p className="master-empty">{imagesError}</p>
              ) : images.length === 0 ? (
                <p className="master-empty">No images uploaded for this livelihood record.</p>
              ) : (
                <div className="report-images-grid">
                  {images.map((img) => (
                    <a
                      key={img.ImageId}
                      href={resolveMediaUrl(img.ImagePath)}
                      target="_blank"
                      rel="noreferrer"
                      className="report-images-grid__item"
                    >
                      {brokenImageIds.has(img.ImageId) ? (
                        <div className="report-images-grid__broken">Image unavailable</div>
                      ) : (
                        <img
                          src={resolveMediaUrl(img.ImagePath)}
                          alt={`Livelihood ${img.LivelihoodId}`}
                          onError={() =>
                            setBrokenImageIds((prev) => new Set(prev).add(img.ImageId))
                          }
                        />
                      )}
                      <span>{img.UploadedDate ? new Date(img.UploadedDate).toLocaleDateString('en-IN') : '—'}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default Reports;
