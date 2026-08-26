import React from 'react';
import { LandPlot, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import {
    deleteLandType,
    getErrDetail,
    getLandTypes,
    saveLandType,
    searchLandTypes,
} from '../../services/landTypeService';
import type { LandType } from '../../types/master.types';
import { getUserRoleId, ROLE_IDS, isStateAdmin } from '../../utils/roleAccess';
import './MasterData.css';
import './Activity.css';

const LandTypePage: React.FC = () => {
    const { user } = useAuth();
    const roleId = getUserRoleId(user);
    const canManage = roleId === ROLE_IDS.STATE_ADMIN || isStateAdmin(user);

    const [items, setItems] = React.useState<LandType[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searching, setSearching] = React.useState(false);
    const [actionLoading, setActionLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [successMsg, setSuccessMsg] = React.useState('');

    const [search, setSearch] = React.useState('');
    const searchTimer = React.useRef<number | null>(null);

    const [showModal, setShowModal] = React.useState(false);
    const [modalMode, setModalMode] = React.useState<'create' | 'edit'>('create');
    const [formId, setFormId] = React.useState<number | null>(null);
    const [formName, setFormName] = React.useState('');
    const [formError, setFormError] = React.useState('');

    const [deleteTarget, setDeleteTarget] = React.useState<LandType | null>(null);

    const flashSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 3500);
    };

    const load = React.useCallback(async () => {
        try {
            setLoading(true);
            setItems(await getLandTypes());
            setError('');
        } catch (err) {
            const detail = getErrDetail(err);
            setError(
                detail
                    ? `Failed to load land types: ${detail}`
                    : 'Failed to load land types. Please try again.',
            );
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        load();
    }, [load]);

    // Client-side filter — always applied, also covers server-search failures
    const filtered = React.useMemo(() => {
        const term = search.toLowerCase().trim();
        return items.filter(
            (item) =>
                !term ||
                item.LandTypeName.toLowerCase().includes(term) ||
                String(item.LandTypeId).includes(term),
        );
    }, [items, search]);

    // Server-side search (GET /Land-type/search?text=…) merged into the list
    const runSearch = React.useCallback(async (text: string) => {
        if (!text.trim()) {
            await load();
            return;
        }
        try {
            setSearching(true);
            const data = await searchLandTypes(text.trim());
            if (data.length > 0) {
                setItems((prev) => {
                    const map = new Map(prev.map((p) => [p.LandTypeId, p]));
                    data.forEach((d) => map.set(d.LandTypeId, d));
                    return Array.from(map.values());
                });
            }
        } catch {
            // Server search unavailable — client-side filtering still applies
        } finally {
            setSearching(false);
        }
    }, [load]);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        if (searchTimer.current) {
            window.clearTimeout(searchTimer.current);
        }
        searchTimer.current = window.setTimeout(() => {
            runSearch(value);
        }, 400);
    };

    const openCreateModal = () => {
        setModalMode('create');
        setFormId(null);
        setFormName('');
        setFormError('');
        setShowModal(true);
    };

    const openEditModal = (item: LandType) => {
        setModalMode('edit');
        setFormId(item.LandTypeId);
        setFormName(item.LandTypeName);
        setFormError('');
        setShowModal(true);
    };

    const handleSave = async () => {
        const name = formName.trim();
        if (!name) {
            setFormError('Land type name is required.');
            return;
        }
        try {
            setActionLoading(true);
            setFormError('');
            await saveLandType(modalMode === 'edit' ? formId : null, name);
            await load();
            setShowModal(false);
            flashSuccess(`Land type "${name}" ${modalMode === 'create' ? 'created' : 'updated'} successfully.`);
        } catch (err) {
            const detail = getErrDetail(err);
            setFormError(
                detail
                    ? `Failed to ${modalMode === 'create' ? 'create' : 'update'} land type: ${detail}`
                    : `Failed to ${modalMode === 'create' ? 'create' : 'update'} land type. Please try again.`,
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSave();
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setActionLoading(true);
            await deleteLandType(deleteTarget.LandTypeId);
            setItems((prev) => prev.filter((i) => i.LandTypeId !== deleteTarget.LandTypeId));
            flashSuccess(`Land type "${deleteTarget.LandTypeName}" deleted.`);
            setDeleteTarget(null);
        } catch (err) {
            const detail = getErrDetail(err);
            setError(
                detail
                    ? `Failed to delete land type: ${detail}`
                    : 'Failed to delete land type. Please try again.',
            );
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
                    <h1 className="master-title">Land Type</h1>
                    <p className="master-subtitle">Classification of land used across activity profiles.</p>
                </div>
                {canManage && (
                    <button className="act-btn-primary" type="button" onClick={openCreateModal}>
                        <Plus size={17} />
                        Add Land Type
                    </button>
                )}
            </div>

            {error && (
                <div className="master-alert" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ flex: 1 }}>{error}</span>
                    <button
                        className="act-btn-secondary"
                        onClick={() => load()}
                        type="button"
                        disabled={loading}
                    >
                        Retry
                    </button>
                    <button className="act-alert-close" onClick={() => setError('')} type="button">
                        <X size={15} />
                    </button>
                </div>
            )}
            {successMsg && (
                <div
                    className="master-alert"
                    style={{ borderColor: '#2e9e6b', color: '#1d7a4f', background: '#eaf7f0' }}
                >
                    {successMsg}
                </div>
            )}

            <div className="act-controls-row">
                <div className="act-stat-pill">
                    <LandPlot size={15} />
                    <span>{items.length} total land types{(searching ? ' (searching…)' : '')}</span>
                </div>
                <div className="act-search-wrap">
                    <Search size={15} className="act-search-icon" />
                    <input
                        type="text"
                        placeholder="Search by land type name or ID..."
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="act-search-input"
                    />
                </div>
            </div>

            <div className="master-table-shell">
                <table className="master-table">
                    <thead>
                        <tr>
                            <th style={{ width: 80 }}>ID</th>
                            <th>Land Type Name</th>
                            {canManage && <th style={{ width: 110 }}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={canManage ? 3 : 2} className="master-empty">
                                    No land types found matching your search.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((item) => (
                                <tr key={item.LandTypeId}>
                                    <td>{item.LandTypeId}</td>
                                    <td>{item.LandTypeName}</td>
                                    {canManage && (
                                        <td>
                                            <div className="act-action-btns">
                                                <button
                                                    className="act-btn-edit"
                                                    title="Edit"
                                                    onClick={() => openEditModal(item)}
                                                >
                                                    <Pencil size={14} />
                                                </button>
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

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="act-modal-backdrop">
                    <div className="act-modal act-modal--sm">
                        <div className="act-modal-header">
                            <h2>{modalMode === 'create' ? 'Add Land Type' : 'Edit Land Type'}</h2>
                            <button onClick={() => setShowModal(false)} className="act-modal-close">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="act-modal-body">
                            <div className="act-form-group">
                                <label>Land Type Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Agricultural Land"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="act-input"
                                    autoFocus
                                />
                            </div>
                            {formError && <p className="act-form-error">{formError}</p>}
                            <div className="act-modal-actions">
                                <button
                                    type="button"
                                    className="act-btn-secondary"
                                    onClick={() => setShowModal(false)}
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="act-btn-primary"
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? 'Processing...' : modalMode === 'create' ? 'Create' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteTarget && (
                <div className="act-modal-backdrop">
                    <div className="act-modal act-modal--sm">
                        <div className="act-modal-header">
                            <h2>Delete Land Type</h2>
                            <button onClick={() => setDeleteTarget(null)} className="act-modal-close">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="act-modal-body">
                            <p>
                                Are you sure you want to delete land type{' '}
                                <strong>"{deleteTarget.LandTypeName}"</strong> (#{deleteTarget.LandTypeId})?
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

export default LandTypePage;