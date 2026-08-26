import React from 'react';
import { Search, Trash2, X, Sprout } from 'lucide-react';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import {
    getShgLivelihoods,
    deleteShgLivelihood,
} from '../../services/masterService';
import type { ShgLivelihood } from '../../types/master.types';
import { getUserRoleId, ROLE_IDS, isStateAdmin } from '../../utils/roleAccess';
import './MasterData.css';
import './Activity.css';

const formatCoordinates = (lat: number | null, lng: number | null): string => {
    if (lat === null || lat === undefined || lng === null || lng === undefined) return '-';
    return `${lat}, ${lng}`;
};

const formatDate = (value: string): string =>
    value ? String(value).slice(0, 10) : '-';

const ShgLivelihoodPage: React.FC = () => {
    const { user } = useAuth();
    const roleId = getUserRoleId(user);
    const canManage = roleId === ROLE_IDS.STATE_ADMIN || isStateAdmin(user);

    const [items, setItems] = React.useState<ShgLivelihood[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [actionLoading, setActionLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [successMsg, setSuccessMsg] = React.useState('');

    const [search, setSearch] = React.useState('');
    const [deleteTarget, setDeleteTarget] = React.useState<ShgLivelihood | null>(null);

    const flashSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 3500);
    };

    const load = React.useCallback(async () => {
        try {
            setLoading(true);
            const data = await getShgLivelihoods();
            setItems(data);
        } catch {
            setError('Failed to load SHG livelihood records. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        load();
    }, [load]);

    const filtered = React.useMemo(() => {
        const term = search.toLowerCase();
        return items.filter((item) =>
            !term ||
            item.MemberName.toLowerCase().includes(term) ||
            item.SHGName.toLowerCase().includes(term) ||
            item.ActivityName.toLowerCase().includes(term) ||
            item.SubCategoryName.toLowerCase().includes(term) ||
            (item.LH_CBO_Name ?? '').toLowerCase().includes(term)
        );
    }, [items, search]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setActionLoading(true);
            await deleteShgLivelihood(deleteTarget.LivelihoodId);
            setItems((prev) => prev.filter((i) => i.LivelihoodId !== deleteTarget.LivelihoodId));
            flashSuccess(`Livelihood record ${deleteTarget.LivelihoodId} deleted.`);
            setDeleteTarget(null);
        } catch {
            setError('Failed to delete livelihood record.');
            setDeleteTarget(null);
        } finally {
            setActionLoading(false);
        }
    };
    if (loading) return <Loader />;

    return (
        <div className="master-page activity-page">
            <div className="master-header activity-header-row">
                <div>
                    <p className="master-kicker">Master Data</p>
                    <h1 className="master-title">SHG Livelihood</h1>
                    <p className="master-subtitle">Member-level livelihood records & SHG promotion activities.</p>
                </div>
            </div>

            {error && (
                <div className="master-alert">
                    {error}
                    <button className="act-alert-close" onClick={() => setError('')} type="button">
                        <X size={14} />
                    </button>
                </div>
            )}
            {successMsg && (
                <div className="act-success-banner">
                    {successMsg}
                </div>
            )}

            <div className="act-controls-row">
                <div className="act-stat-pill">
                    <Sprout size={15} />
                    <span>{items.length} total livelihood records</span>
                </div>
                <div className="act-search-wrap">
                    <Search size={15} className="act-search-icon" />
                    <input
                        type="text"
                        placeholder="Search member, SHG, activity..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="act-search-input"
                    />
                </div>
            </div>

            <div className="master-table-shell">
                <table className="master-table">
                    <thead>
                        <tr>
                            <th style={{ width: 60 }}>ID</th>
                            <th>Member</th>
                            <th>SHG Name</th>
                            <th>Activity</th>
                            <th>Sub Category</th>
                            <th>LH-CBO</th>
                            <th>Location (Lat, Lng)</th>
                            <th>Created</th>
                            {canManage && <th style={{ width: 110 }}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={canManage ? 9 : 8} className="master-empty">
                                    No SHG livelihood records found matching your search.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((item) => (
                                <tr key={item.LivelihoodId}>
                                    <td>{item.LivelihoodId}</td>
                                    <td>
                                        <span className="act-name-tag">{item.MemberName}</span>
                                        <span style={{ display: 'block', fontSize: '0.78rem', color: '#5f7386' }}>ID {item.MemberId}</span>
                                    </td>
                                    <td>{item.SHGName}</td>
                                    <td>{item.ActivityName}</td>
                                    <td>{item.SubCategoryName}</td>
                                    <td>{item.IsLH_CBO ? item.LH_CBO_Name || 'LH-CBO' : '—'}</td>
                                    <td>{formatCoordinates(item.Latitude, item.Longitude)}</td>
                                    <td>{formatDate(item.CreatedDate)}</td>
                                    {canManage && (
                                        <td>
                                            <div className="act-action-btns">
                                                <button
                                                    className="act-btn-delete"
                                                    title="Delete"
                                                    onClick={() => setDeleteTarget(item)}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Delete Modal */}
            {deleteTarget && (
                <div className="act-modal-backdrop">
                    <div className="act-modal act-modal--sm">
                        <div className="act-modal-header">
                            <h2>Delete Livelihood Record</h2>
                            <button onClick={() => setDeleteTarget(null)} className="act-modal-close">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="act-modal-body">
                            <p>
                                Are you sure you want to delete livelihood record{' '}
                                <strong>#{deleteTarget.LivelihoodId}</strong> for member{' '}
                                <strong>"{deleteTarget.MemberName}"</strong>?
                            </p>
                            <div className="act-modal-actions">
                                <button
                                    type="button"
                                    className="act-btn-secondary"
                                    onClick={() => setDeleteTarget(null)}
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="act-btn-danger"
                                    onClick={handleDelete}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShgLivelihoodPage;