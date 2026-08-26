import React from 'react';
import { Plus, Search, Trash2, X, UserCog, Pencil, Power } from 'lucide-react';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import {
    getCrpTypes,
    createCrpType,
    updateCrpType,
    deleteCrpType,
} from '../../services/masterService';
import type { CrpType } from '../../types/master.types';
import { getUserRoleId, ROLE_IDS, isStateAdmin } from '../../utils/roleAccess';
import './MasterData.css';
import './Activity.css';

const CrpTypePage: React.FC = () => {
    const { user } = useAuth();
    const roleId = getUserRoleId(user);
    const canManage = roleId === ROLE_IDS.STATE_ADMIN || isStateAdmin(user);

    const [items, setItems] = React.useState<CrpType[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [actionLoading, setActionLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [successMsg, setSuccessMsg] = React.useState('');

    const [search, setSearch] = React.useState('');

    const [showModal, setShowModal] = React.useState(false);
    const [modalMode, setModalMode] = React.useState<'create' | 'edit'>('create');
    const [formId, setFormId] = React.useState<number | null>(null);
    const [formName, setFormName] = React.useState('');
    const [formActive, setFormActive] = React.useState(true);
    const [formError, setFormError] = React.useState('');

    const [deleteTarget, setDeleteTarget] = React.useState<CrpType | null>(null);

    const flashSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 3500);
    };

    const load = React.useCallback(async () => {
        try {
            setLoading(true);
            const data = await getCrpTypes();
            setItems(data);
        } catch {
            setError('Failed to load CRP types. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        load();
    }, [load]);

    const filtered = React.useMemo(() => {
        return items.filter((item) =>
            item.CRPTypeName.toLowerCase().includes(search.toLowerCase())
        );
    }, [items, search]);

    const openCreateModal = () => {
        setModalMode('create');
        setFormId(null);
        setFormName('');
        setFormActive(true);
        setFormError('');
        setShowModal(true);
    };

    const openEditModal = (item: CrpType) => {
        setModalMode('edit');
        setFormId(item.CRPTypeId);
        setFormName(item.CRPTypeName);
        setFormActive(item.IsActive);
        setFormError('');
        setShowModal(true);
    };

    const handleCreate = async () => {
        const name = formName.trim();
        if (!name) { setFormError('CRP type name is required.'); return; }
        try {
            setActionLoading(true);
            setFormError('');
            await createCrpType(name);
            await load();
            setShowModal(false);
            flashSuccess(`CRP type "${name}" created successfully.`);
        } catch {
            setFormError('Failed to create CRP type. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdate = async () => {
        const name = formName.trim();
        if (!name) { setFormError('CRP type name is required.'); return; }
        if (formId === null) return;
        try {
            setActionLoading(true);
            setFormError('');
            await updateCrpType({ id: formId, name, isActive: formActive });
            setItems((prev) =>
                prev.map((i) =>
                    i.CRPTypeId === formId ? { ...i, CRPTypeName: name, IsActive: formActive } : i
                )
            );
            setShowModal(false);
            flashSuccess(`CRP type "${name}" updated successfully.`);
        } catch {
            setFormError('Failed to update CRP type. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleActive = async (item: CrpType) => {
        try {
            setActionLoading(true);
            await updateCrpType({ id: item.CRPTypeId, name: item.CRPTypeName, isActive: !item.IsActive });
            setItems((prev) =>
                prev.map((i) =>
                    i.CRPTypeId === item.CRPTypeId ? { ...i, IsActive: !i.IsActive } : i
                )
            );
            flashSuccess(`CRP type "${item.CRPTypeName}" ${!item.IsActive ? 'activated' : 'deactivated'}.`);
        } catch {
            setError('Failed to update CRP type status.');
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
            await deleteCrpType(deleteTarget.CRPTypeId);
            setItems((prev) => prev.filter((i) => i.CRPTypeId !== deleteTarget.CRPTypeId));
            flashSuccess(`CRP type "${deleteTarget.CRPTypeName}" deleted.`);
            setDeleteTarget(null);
        } catch {
            setError('Failed to delete CRP type.');
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
                    <h1 className="master-title">CRP Type</h1>
                    <p className="master-subtitle">Manage Community Resource Person types.</p>
                </div>
                {canManage && (
                    <button
                        className="act-btn-primary"
                        type="button"
                        onClick={openCreateModal}
                    >
                        <Plus size={17} />
                        Add CRP Type
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
                    <UserCog size={15} />
                    <span>{items.length} total CRP types</span>
                </div>
                <div className="act-search-wrap">
                    <Search size={15} className="act-search-icon" />
                    <input
                        type="text"
                        placeholder="Search CRP types..."
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
                            <th style={{ width: 80 }}>ID</th>
                            <th>CRP Type Name</th>
                            <th style={{ width: 110 }}>Status</th>
                            <th style={{ width: 130 }}>Created</th>
                            {canManage && <th style={{ width: 140 }}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={canManage ? 5 : 4} className="master-empty">
                                    No CRP types found matching your search.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((item) => (
                                <tr key={item.CRPTypeId}>
                                    <td>{item.CRPTypeId}</td>
                                    <td>
                                        <span className="act-name-tag">{item.CRPTypeName}</span>
                                    </td>
                                    <td>
                                        <span
                                            style={{
                                                display: 'inline-block',
                                                padding: '3px 10px',
                                                borderRadius: 999,
                                                fontSize: '0.78rem',
                                                fontWeight: 700,
                                                background: item.IsActive ? 'rgba(31,157,110,0.14)' : 'rgba(216,87,75,0.14)',
                                                color: item.IsActive ? '#1f9d6e' : '#d8574b',
                                            }}
                                        >
                                            {item.IsActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>{item.CreatedDate ? item.CreatedDate.slice(0, 10) : '-'}</td>
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
                                                    title={item.IsActive ? 'Deactivate' : 'Activate'}
                                                    onClick={() => handleToggleActive(item)}
                                                    disabled={actionLoading}
                                                    style={{
                                                        border: 'none',
                                                        borderRadius: 8,
                                                        padding: '6px 8px',
                                                        cursor: 'pointer',
                                                        background: item.IsActive ? 'rgba(242,159,5,0.14)' : 'rgba(31,157,110,0.14)',
                                                        color: item.IsActive ? '#f29f05' : '#1f9d6e',
                                                    }}
                                                >
                                                    <Power size={14} />
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
                            <h2>{modalMode === 'create' ? 'Add New CRP Type' : 'Edit CRP Type'}</h2>
                            <button onClick={() => setShowModal(false)} className="act-modal-close">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="act-modal-body">
                            <div className="act-form-group">
                                <label>CRP Type Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. GGP-BP"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="act-input"
                                    autoFocus
                                />
                            </div>
                            {modalMode === 'edit' && (
                                <div className="act-form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={formActive}
                                            onChange={(e) => setFormActive(e.target.checked)}
                                        />
                                        Active
                                    </label>
                                </div>
                            )}
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
                            <h2>Delete CRP Type</h2>
                            <button onClick={() => setDeleteTarget(null)} className="act-modal-close">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="act-modal-body">
                            <p>Are you sure you want to delete CRP type <strong>"{deleteTarget.CRPTypeName}"</strong>?</p>
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

export default CrpTypePage;