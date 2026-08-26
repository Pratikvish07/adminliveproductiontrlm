import React from 'react';
import { Plus, Search, Trash2, X, Factory, Pencil } from 'lucide-react';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import {
    getProductions,
    saveProduction,
    deleteProduction,
    searchProductions,
} from '../../services/masterService';
import type { Production } from '../../types/master.types';
import { getUserRoleId, ROLE_IDS, isStateAdmin } from '../../utils/roleAccess';
import './MasterData.css';
import './Activity.css';

const ProductionPage: React.FC = () => {
    const { user } = useAuth();
    const roleId = getUserRoleId(user);
    const canManage = roleId === ROLE_IDS.STATE_ADMIN || isStateAdmin(user);

    const [items, setItems] = React.useState<Production[]>([]);
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

    const [deleteTarget, setDeleteTarget] = React.useState<Production | null>(null);

    const flashSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 3500);
    };

    const load = React.useCallback(async () => {
        try {
            setLoading(true);
            const data = await getProductions();
            setItems(data);
        } catch {
            setError('Failed to load production entries. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        load();
    }, [load]);

    // Server-side search with debounce: calls GET /production-master/search?text=…
    const runSearch = React.useCallback(async (text: string) => {
        if (!text.trim()) {
            load();
            return;
        }
        try {
            setSearching(true);
            const data = await searchProductions(text.trim());
            setItems(data);
        } catch {
            // Fall back to loading all on search failure
            load();
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
        }, 350);
    };

    const openCreateModal = () => {
        setModalMode('create');
        setFormId(null);
        setFormName('');
        setFormError('');
        setShowModal(true);
    };

    const openEditModal = (item: Production) => {
        setModalMode('edit');
        setFormId(item.ProductionId);
        setFormName(item.ProductionName);
        setFormError('');
        setShowModal(true);
    };

    const handleCreate = async () => {
        const name = formName.trim();
        if (!name) { setFormError('Production name is required.'); return; }
        try {
            setActionLoading(true);
            setFormError('');
            await saveProduction({ name });
            await load();
            setShowModal(false);
            flashSuccess(`Production "${name}" created successfully.`);
        } catch {
            setFormError('Failed to create production entry. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdate = async () => {
        const name = formName.trim();
        if (!name) { setFormError('Production name is required.'); return; }
        if (formId === null) return;
        try {
            setActionLoading(true);
            setFormError('');
            await saveProduction({ id: formId, name });
            setItems((prev) =>
                prev.map((i) =>
                    i.ProductionId === formId ? { ...i, ProductionName: name } : i
                )
            );
            setShowModal(false);
            flashSuccess(`Production "${name}" updated successfully.`);
        } catch {
            setFormError('Failed to update production entry. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (modalMode === 'create') handleCreate();
        else handleUpdate();
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setActionLoading(true);
            await deleteProduction(deleteTarget.ProductionId);
            setItems((prev) => prev.filter((i) => i.ProductionId !== deleteTarget.ProductionId));
            flashSuccess(`Production "${deleteTarget.ProductionName}" deleted.`);
            setDeleteTarget(null);
        } catch {
            setError('Failed to delete production entry.');
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
                    <h1 className="master-title">Production</h1>
                    <p className="master-subtitle">Manage production / livelihood activity entries.</p>
                </div>
                {canManage && (
                    <button
                        className="act-btn-primary"
                        type="button"
                        onClick={openCreateModal}
                    >
                        <Plus size={17} />
                        Add Production
                    </button>
                )}
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
                    <Factory size={15} />
                    <span>{items.length} total productions{(searching ? ' (searching…)' : '')}</span>
                </div>
                <div className="act-search-wrap">
                    <Search size={15} className="act-search-icon" />
                    <input
                        type="text"
                        placeholder="Search productions (server-side)..."
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
                            <th>Production Name</th>
                            {canManage && <th style={{ width: 110 }}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={canManage ? 3 : 2} className="master-empty">
                                    No production entries found matching your search.
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.ProductionId}>
                                    <td>{item.ProductionId}</td>
                                    <td>
                                        <span className="act-name-tag">{item.ProductionName}</span>
                                    </td>
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
                    <div className="act-modal">
                        <div className="act-modal-header">
                            <h2>{modalMode === 'create' ? 'Add New Production' : 'Edit Production'}</h2>
                            <button onClick={() => setShowModal(false)} className="act-modal-close">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="act-modal-body">
                            <div className="act-form-group">
                                <label>Production Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Mushroom cultivation"
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
                            <h2>Delete Production</h2>
                            <button onClick={() => setDeleteTarget(null)} className="act-modal-close">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="act-modal-body">
                            <p>Are you sure you want to delete production <strong>"{deleteTarget.ProductionName}"</strong>?</p>
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

export default ProductionPage;