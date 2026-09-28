import React from 'react';
import { Search, Filter, RotateCcw, Radar, X, MapPin, Printer } from 'lucide-react';
import Loader from '../../components/common/Loader';
import {
    masterService,
    getDistricts,
    getBlocks,
    getGramPanchayats,
    getVillages,
    type SHGTrackingReportRecord,
} from '../../services/masterService';
import type { District, SignupBlockOption, GramPanchayat, Village } from '../../types/master.types';
import { useAuth } from '../../context/AuthContext';
import MemberDetailCollections from './MemberDetailCollections';
import './MasterData.css';
import './Activity.css';
import '../reports/Reports.css';
import '../dashboard/Dashboard.css';

const PAGE_SIZE = 10;

const fmtCurrency = (value: number | null | undefined) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

const fmtDate = (value: string | null | undefined) =>
    value ? new Date(value).toLocaleDateString('en-IN') : '—';

const resolveMediaUrl = (path: string) => {
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `https://trlm.pickitover.com/${path.replace(/^\/+/, '')}`;
};

const mapsUrl = (lat: number, lng: number) => `https://www.google.com/maps?q=${lat},${lng}`;

const initialsOf = (name: string | null | undefined) =>
    (name || '?')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || '?';

const statusChipClass = (status: string | null | undefined) => {
    const s = (status || '').toLowerCase();
    if (s.includes('complet') || s.includes('approv') || s.includes('verif') || s.includes('yes')) return 'chip green';
    if (s.includes('pend') || s.includes('progress') || s.includes('requir')) return 'chip grey';
    if (s.includes('reject') || s.includes('fail') || s.includes('no')) return 'chip red';
    return 'chip grey';
};

const ShgLivelihoodPage: React.FC = () => {
    const { user } = useAuth();
    const staffUserId = user?.livelihoodTrackerId ?? user?.staffId ?? user?.id;

    const [selectedRecord, setSelectedRecord] = React.useState<SHGTrackingReportRecord | null>(null);

    const [records, setRecords] = React.useState<SHGTrackingReportRecord[]>([]);
    // The API's totalRecords/totalPages are unreliable (observed as always 0
    // even when records are returned), so pagination is driven by whether the
    // current page came back full — a reliable "there may be more" signal.
    const [reportedTotal, setReportedTotal] = React.useState(0);
    const [hasNextPage, setHasNextPage] = React.useState(false);
    const [page, setPage] = React.useState(1);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const [search, setSearch] = React.useState('');

    const [districts, setDistricts] = React.useState<District[]>([]);
    const [blockOptions, setBlockOptions] = React.useState<SignupBlockOption[]>([]);
    const [gramPanchayats, setGramPanchayats] = React.useState<GramPanchayat[]>([]);
    const [villages, setVillages] = React.useState<Village[]>([]);

    const [districtId, setDistrictId] = React.useState('');
    const [blockId, setBlockId] = React.useState('');
    const [gpId, setGpId] = React.useState('');
    const [villageId, setVillageId] = React.useState('');
    const [shgCode, setShgCode] = React.useState('');

    const load = React.useCallback(async (targetPage: number) => {
        if (!staffUserId) {
            setError('Unable to determine your staff account for this report.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError('');
            const result = await masterService.getSHGTrackingControllerReport({
                staffUserId,
                districtId: districtId || undefined,
                blockId: blockId || undefined,
                gpId: gpId || undefined,
                villageId: villageId || undefined,
                shgCode: shgCode.trim() || undefined,
                search: search.trim() || undefined,
                pageNumber: targetPage,
                pageSize: PAGE_SIZE,
            });
            setRecords(result.records);
            setReportedTotal(result.totalRecords);
            setHasNextPage(result.records.length === PAGE_SIZE);
            setPage(result.pageNumber || targetPage);
        } catch (err) {
            console.error('Failed to load SHG tracking report', err);
            setRecords([]);
            setError('Failed to load report records. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [staffUserId, districtId, blockId, gpId, villageId, shgCode, search]);

    const hasLoadedRef = React.useRef(false);
    React.useEffect(() => {
        if (hasLoadedRef.current) return;
        if (!staffUserId) {
            setError('Unable to determine your staff account for this report.');
            setLoading(false);
            return;
        }
        hasLoadedRef.current = true;
        void load(1);
    }, [staffUserId, load]);

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
        setSearch('');
    };

    const hasActiveFilters = Boolean(districtId || blockId || gpId || villageId || shgCode || search);

    React.useEffect(() => {
        if (!selectedRecord) return;
        const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedRecord(null); };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [selectedRecord]);

    if (loading && records.length === 0 && !error) return <Loader />;

    return (
        <div className="master-page activity-page">
            <div className="master-header activity-header-row">
                <div>
                    <p className="master-kicker">Master Data</p>
                    <h1 className="master-title"><Radar size={24} style={{ verticalAlign: '-4px', marginRight: 8, color: '#10403f' }} />SHG Tracking Report</h1>
                    <p className="master-subtitle">Live, filterable member tracking report fetched from the SHG Tracking Controller API.</p>
                </div>
            </div>

            {error && <div className="master-alert">{error}</div>}

            <div className="dashboard-panel dashboard-filter-panel" style={{ marginBottom: 18 }}>
                <div className="panel-head">
                    <div>
                        <span className="panel-eyebrow"><Filter size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />Scope Filters</span>
                        <h2>Narrow the report by location</h2>
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
                        <input type="text" value={shgCode} onChange={(e) => setShgCode(e.target.value)} placeholder="e.g. 30000192459" />
                    </label>
                </div>

                <div className="dashboard-filter-actions">
                    <button type="button" className="dashboard-filter-btn dashboard-filter-btn--ghost" onClick={handleReset} disabled={!hasActiveFilters || loading}>
                        <RotateCcw size={14} /> Reset
                    </button>
                    <button type="button" className="dashboard-filter-btn dashboard-filter-btn--primary" onClick={() => void load(1)} disabled={loading}>
                        {loading ? 'Applying...' : 'Apply Filters'}
                    </button>
                </div>
            </div>

            <div className="act-controls-row">
                <div className="act-stat-pill">
                    <Radar size={15} />
                    <span>
                        {reportedTotal > 0
                            ? `${reportedTotal} total records`
                            : `${records.length} record${records.length === 1 ? '' : 's'} on this page`}
                    </span>
                </div>
                <div className="act-search-wrap">
                    <Search size={15} className="act-search-icon" />
                    <input
                        type="text"
                        placeholder="Search member, SHG..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') void load(1); }}
                        className="act-search-input"
                    />
                </div>
            </div>

            <div className="master-table-shell">
                <table className="master-table">
                    <thead>
                        <tr>
                            <th>Member</th>
                            <th>SHG</th>
                            <th>District</th>
                            <th>Block</th>
                            <th>Gram Panchayat</th>
                            <th>Village</th>
                            <th>Activity</th>
                            <th>Subactivity</th>
                            <th>Investment</th>
                            <th>Geo Status</th>
                            <th>Training</th>
                            <th>Financial Support</th>
                            <th>Tracking Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={13} className="master-empty">Loading report records...</td>
                            </tr>
                        ) : records.length === 0 ? (
                            <tr>
                                <td colSpan={13} className="master-empty">No records found matching your filters.</td>
                            </tr>
                        ) : (
                            records.map((row) => (
                                <tr key={row.memberId}>
                                    <td>
                                        <button
                                            type="button"
                                            className="act-name-tag act-name-tag--link"
                                            onClick={() => setSelectedRecord(row)}
                                        >
                                            {row.memberName || `Member #${row.memberId}`}
                                        </button>
                                        <span style={{ display: 'block', fontSize: '0.78rem', color: '#5a6b6e' }}>{row.memberCode || `ID ${row.memberId}`}</span>
                                    </td>
                                    <td>
                                        {row.shgName || '—'}
                                        {row.shgCode && <span style={{ display: 'block', fontSize: '0.78rem', color: '#5a6b6e' }}>{row.shgCode}</span>}
                                    </td>
                                    <td>{row.districtName || '—'}</td>
                                    <td>{row.blockName || '—'}</td>
                                    <td>{row.gpName || '—'}</td>
                                    <td>{row.villageName || '—'}</td>
                                    <td>{row.activityName || '—'}</td>
                                    <td>{row.subActivityName || '—'}</td>
                                    <td>{fmtCurrency(row.investmentAmount)}</td>
                                    <td>
                                        {row.geoStatus || '—'}
                                        {row.latitude != null && row.longitude != null && (
                                            <a
                                                className="geo-link"
                                                href={mapsUrl(row.latitude, row.longitude)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ display: 'block', marginTop: 4 }}
                                            >
                                                <MapPin size={12} /> View on Map
                                            </a>
                                        )}
                                    </td>
                                    <td>{row.trainingStatus}</td>
                                    <td>{row.financialSupportStatus}</td>
                                    <td>{fmtDate(row.trackingDate)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {(records.length > 0 || page > 1) && (
                <div className="report-pagination">
                    <span className="report-pagination__info">
                        {reportedTotal > 0
                            ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, reportedTotal)} of ${reportedTotal}`
                            : `Showing ${(page - 1) * PAGE_SIZE + 1}–${(page - 1) * PAGE_SIZE + records.length}`}
                    </span>
                    <div className="report-pagination__controls">
                        <button type="button" onClick={() => void load(page - 1)} disabled={page <= 1 || loading}>
                            Prev
                        </button>
                        <span className="report-pagination__page">Page {page}</span>
                        <button type="button" onClick={() => void load(page + 1)} disabled={!hasNextPage || loading}>
                            Next
                        </button>
                    </div>
                </div>
            )}

            {selectedRecord && (
                <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
                    <div className="modal-card member-report-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            {selectedRecord.activityImagePath ? (
                                <img
                                    className="modal-header__photo"
                                    src={resolveMediaUrl(selectedRecord.activityImagePath)}
                                    alt={selectedRecord.memberName || 'Member photo'}
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            ) : (
                                <div className="modal-header__avatar-fallback">{initialsOf(selectedRecord.memberName)}</div>
                            )}
                            <div>
                                <h3>{selectedRecord.memberName || `Member #${selectedRecord.memberId}`}</h3>
                                <p>
                                    {[selectedRecord.shgName, selectedRecord.villageName, selectedRecord.blockName, selectedRecord.districtName]
                                        .filter(Boolean)
                                        .join(' • ')}
                                </p>
                            </div>
                            <button type="button" className="modal-close" onClick={() => setSelectedRecord(null)}>
                                <X size={16} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="modal-grid">
                                <div className="modal-field">
                                    <span className="mf-label">Activity</span>
                                    <span className="mf-value">{selectedRecord.activityName || '—'}</span>
                                </div>
                                <div className="modal-field">
                                    <span className="mf-label">Sub Activity</span>
                                    <span className="mf-value">{selectedRecord.subActivityName || '—'}</span>
                                </div>
                                <div className="modal-field">
                                    <span className="mf-label">Investment</span>
                                    <span className="mf-value">{fmtCurrency(selectedRecord.investmentAmount)}</span>
                                </div>
                                <div className="modal-field">
                                    <span className="mf-label">Income (Before → Future)</span>
                                    <span className="mf-value">
                                        {fmtCurrency(selectedRecord.incomeBeforeSupport)} → {fmtCurrency(selectedRecord.futureProjection)}
                                    </span>
                                </div>
                                <div className="modal-field">
                                    <span className="mf-label">Training Status</span>
                                    <span className="mf-value">
                                        <span className={statusChipClass(selectedRecord.trainingStatus)}>{selectedRecord.trainingStatus || '—'}</span>
                                    </span>
                                </div>
                                <div className="modal-field">
                                    <span className="mf-label">Financial Support</span>
                                    <span className="mf-value">
                                        <span className={statusChipClass(selectedRecord.financialSupportStatus)}>{selectedRecord.financialSupportStatus || '—'}</span>
                                    </span>
                                </div>
                                <div className="modal-field full">
                                    <span className="mf-label">GPS Location</span>
                                    <span className="mf-value">
                                        {selectedRecord.latitude != null && selectedRecord.longitude != null
                                            ? `${selectedRecord.latitude.toFixed(5)}, ${selectedRecord.longitude.toFixed(5)}`
                                            : 'Not captured'}
                                    </span>
                                </div>
                            </div>

                            <div className="modal-media-row">
                                <div>
                                    <span>Activity Photo</span>
                                    {selectedRecord.activityImagePath ? (
                                        <img src={resolveMediaUrl(selectedRecord.activityImagePath)} alt="Activity" />
                                    ) : (
                                        <div className="modal-media-empty">No photo uploaded</div>
                                    )}
                                </div>
                                <div>
                                    <span>Didi&apos;s Video</span>
                                    {selectedRecord.videoPath ? (
                                        <video src={resolveMediaUrl(selectedRecord.videoPath)} controls />
                                    ) : (
                                        <div className="modal-media-empty">No video uploaded</div>
                                    )}
                                </div>
                            </div>

                            <MemberDetailCollections memberId={selectedRecord.memberId} />

                            <div className="modal-actions">
                                <button type="button" className="btn-print" onClick={() => window.print()}>
                                    <Printer size={15} /> Print
                                </button>
                                {selectedRecord.latitude != null && selectedRecord.longitude != null && (
                                    <button
                                        type="button"
                                        className="btn-map"
                                        onClick={() => window.open(mapsUrl(selectedRecord.latitude as number, selectedRecord.longitude as number), '_blank')}
                                    >
                                        <MapPin size={15} /> View on Map
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShgLivelihoodPage;
