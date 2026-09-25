import React from 'react';
import { Plus, Search, Trash2, X, HandCoins, Pencil, Calculator } from 'lucide-react';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import {
    getFinancialSupports,
    insertFinancialSupport,
    updateFinancialSupport,
    deleteFinancialSupport,
    searchFinancialSupports,
    getLoanProjection,
} from '../../services/financialSupportService';
import { getActivities } from '../../services/masterService';
import type { FinancialSupport, LoanProjection, LivelihoodActivity } from '../../types/master.types';
import { getUserRoleId, ROLE_IDS, isStateAdmin } from '../../utils/roleAccess';
import '../master/MasterData.css';
import '../master/Activity.css';

const formatDate = (value: string): string => (value ? String(value).slice(0, 10) : '-');

const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

const FinancialSupportPage: React.FC = () => {
    const { user } = useAuth();
    const roleId = getUserRoleId(user);
    const canManage = roleId === ROLE_IDS.STATE_ADMIN || isStateAdmin(user);

    const [items, setItems] = React.useState<FinancialSupport[]>([]);
    const [activities, setActivities] = React.useState<LivelihoodActivity[]>([]);
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
    const [formMemberId, setFormMemberId] = React.useState('');
    const [formActivityId, setFormActivityId] = React.useState('');
    const [formSupportRequired, setFormSupportRequired] = React.useState(true);
    const [formLoanCycleId, setFormLoanCycleId] = React.useState('');
    const [formError, setFormError] = React.useState('');

    const [deleteTarget, setDeleteTarget] = React.useState<FinancialSupport | null>(null);

    // Loan projection panel
    const [projActivityId, setProjActivityId] = React.useState('');
    const [projCycleId, setProjCycleId] = React.useState('1');
    const [projection, setProjection] = React.useState<LoanProjection | null>(null);
    const [projLoading, setProjLoading] = React.useState(false);
    const [projError, setProjError] = React.useState('');

    const flashSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 3500);
    };

    const load = React.useCallback(async () => {
        try {
            setLoading(true);
            const [data, acts] = await Promise.all([
                getFinancialSupports(),
                getActivities().catch(() => [] as LivelihoodActivity[]),
            ]);
            setItems(data);
            setActivities(acts);
        } catch {
            setError('Failed to load financial support records. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        load();
    }, [load]);

    // Client-side filter used as a fallback when the server search fails
    const filtered = React.useMemo(() => {
        const term = search.toLowerCase();
        return items.filter((item) =>
            !term ||
            String(item.SHGMemberId).includes(term) ||
            item.ActivityName.toLowerCase().includes(term) ||
            (item.CycleName ?? '').toLowerCase().includes(term)
        );
    }, [items, search]);

    // Server-side search (POST /financial-support/search) with client fallback
    const runSearch = React.useCallback(async (text: string) => {
        if (!text.trim()) {
            await load();
            return;
        }
        try {
            setSearching(true);
            const data = await searchFinancialSupports(text.trim());
            setItems(data);
        } catch {
            // Server search is currently unreliable — keep client-side filtering
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
        setFormMemberId('');
        setFormActivityId(activities.length ? String(activities[0].ActivityId) : '');
        setFormSupportRequired(true);
        setFormLoanCycleId('');
        setFormError('');
        setShowModal(true);
    };

    const openEditModal = (item: FinancialSupport) => {
        setModalMode('edit');
        setFormId(item.FinancialSupportId);
        setFormMemberId(String(item.SHGMemberId));
        setFormActivityId(item.ActivityId ? String(item.ActivityId) : '');
        setFormSupportRequired(item.IsFinancialSupportRequired);
        setFormLoanCycleId(item.LoanCycleId === null || item.LoanCycleId === undefined ? '' : String(item.LoanCycleId));
        setFormError('');
        setShowModal(true);
    };

    const handleSave = async () => {
        const memberId = Number(formMemberId.trim());
        const activityId = Number(formActivityId);
        const loanCycleId = formLoanCycleId.trim() === '' ? null : Number(formLoanCycleId.trim());

        if (!memberId || memberId <= 0) { setFormError('A valid SHG Member ID is required.'); return; }
        if (!activityId) { setFormError('Please select an activity.'); return; }
        if (formLoanCycleId.trim() !== '' && (!loanCycleId || loanCycleId <= 0)) {
            setFormError('Loan Cycle ID must be a positive number.');
            return;
        }

        try {
            setActionLoading(true);
            setFormError('');
            const payload = {
                financialSupportId: modalMode === 'edit' ? (formId ?? 0) : 0,
                shgMemberId: memberId,
                activityId,
                isFinancialSupportRequired: formSupportRequired,
                loanCycleId,
            };
            if (modalMode === 'create') {
                await insertFinancialSupport(payload);
            } else {
                await updateFinancialSupport(payload);
            }
            await load();
            setShowModal(false);
            flashSuccess(`Financial support record ${modalMode === 'create' ? 'created' : 'updated'} successfully.`);
        } catch {
            setFormError(`Failed to ${modalMode === 'create' ? 'create' : 'update'} record. Please try again.`);
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
            await deleteFinancialSupport(deleteTarget.FinancialSupportId);
            setItems((prev) => prev.filter((i) => i.FinancialSupportId !== deleteTarget.FinancialSupportId));
            flashSuccess(`Financial support record ${deleteTarget.FinancialSupportId} deleted.`);
            setDeleteTarget(null);
        } catch {
            setError('Failed to delete financial support record.');
            setDeleteTarget(null);
        } finally {
            setActionLoading(false);
        }
    };

    const fetchProjection = async () => {
        const activityId = Number(projActivityId);
        const cycleId = Number(projCycleId);
        if (!activityId || !cycleId) {
            setProjError('Select an activity and loan cycle to view the projection.');
            setProjection(null);
            return;
        }
        try {
            setProjLoading(true);
            setProjError('');
            const data = await getLoanProjection(activityId, cycleId);
            setProjection(data);
        } catch {
            setProjError('Unable to load loan projection for this selection.');
            setProjection(null);
        } finally {
            setProjLoading(false);
        }
    };
    if (loading) return <Loader />;

    return (
        <div className="master-page activity-page">
            <div className="master-header activity-header-row">
                <div>
                    <p className="master-kicker">Administration</p>
                    <h1 className="master-title">Financial Support</h1>
                    <p className="master-subtitle">SHG member financial support requests and loan cycles.</p>
                </div>
                {canManage && (
                    <button
                        className="act-btn-primary"
                        type="button"
                        onClick={openCreateModal}
                    >
                        <Plus size={17} />
                        Add Financial Support
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

            {/* Loan Projection Panel */}
            {canManage && activities.length > 0 && (
                <div className="master-table-shell" style={{ padding: 18, marginBottom: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Calculator size={16} color="#10403f" />
                        <strong style={{ color: '#0b2d2c' }}>Loan Projection</strong>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
                        <div className="act-form-group" style={{ minWidth: 200 }}>
                            <label>Activity</label>
                            <select
                                className="act-input"
                                value={projActivityId}
                                onChange={(e) => setProjActivityId(e.target.value)}
                            >
                                <option value="">Select activity…</option>
                                {activities.map((a) => (
                                    <option key={a.ActivityId} value={a.ActivityId}>{a.ActivityName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="act-form-group" style={{ minWidth: 140 }}>
                            <label>Loan Cycle ID</label>
                            <input
                                type="number"
                                min={1}
                                className="act-input"
                                value={projCycleId}
                                onChange={(e) => setProjCycleId(e.target.value)}
                            />
                        </div>
                        <button
                            type="button"
                            className="act-btn-primary"
                            onClick={fetchProjection}
                            disabled={projLoading}
                        >
                            {projLoading ? 'Loading…' : 'Show Projection'}
                        </button>
                    </div>

                    {projError && (
                        <p className="act-form-error" style={{ marginTop: 10 }}>{projError}</p>
                    )}

                    {projection && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginTop: 14 }}>
                            {[
                                { label: 'Activity', value: projection.Activity },
                                { label: 'Cycle', value: projection.Cycle },
                                { label: 'Loan Amount', value: formatCurrency(projection.LoanAmount) },
                                { label: 'Tenure', value: `${projection.TenureMonths} months` },
                                { label: 'ROI', value: `${projection.ROI}%` },
                                { label: 'Interest', value: formatCurrency(projection.InterestAmount) },
                                { label: 'Total Repayable', value: formatCurrency(projection.TotalRepayable) },
                                { label: 'Monthly Installment', value: formatCurrency(projection.MonthlyInstallment) },
                            ].map((cell) => (
                                <div
                                    key={cell.label}
                                    style={{
                                        background: 'rgba(237,245,250,0.9)',
                                        borderRadius: 12,
                                        padding: '10px 12px',
                                    }}
                                >
                                    <div style={{ fontSize: '0.72rem', color: '#5f7386', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        {cell.label}
                                    </div>
                                    <div style={{ color: '#0b2d2c', fontWeight: 700, marginTop: 2 }}>{cell.value}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
<div className="act-controls-row">
                <div className="act-stat-pill">
                    <HandCoins size={15} />
                    <span>{items.length} total records{(searching ? ' (searching…)' : '')}</span>
                </div>
                <div className="act-search-wrap">
                    <Search size={15} className="act-search-icon" />
                    <input
                        type="text"
                        placeholder="Search by member ID or activity..."
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
                            <th style={{ width: 60 }}>ID</th>
                            <th>SHG Member ID</th>
                            <th>Activity</th>
                            <th style={{ width: 130 }}>Support Required</th>
                            <th>Loan Cycle</th>
                            <th style={{ width: 120 }}>Created</th>
                            {canManage && <th style={{ width: 110 }}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={canManage ? 7 : 6} className="master-empty">
                                    No financial support records found matching your search.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((item) => (
                                <tr key={item.FinancialSupportId}>
                                    <td>{item.FinancialSupportId}</td>
                                    <td>
                                        <span className="act-name-tag">{item.SHGMemberId}</span>
                                    </td>
                                    <td>{item.ActivityName}</td>
                                    <td>
                                        <span
                                            style={{
                                                display: 'inline-block',
                                                padding: '3px 10px',
                                                borderRadius: 999,
                                                fontSize: '0.78rem',
                                                fontWeight: 700,
                                                background: item.IsFinancialSupportRequired ? 'rgba(31,157,110,0.14)' : 'rgba(107,114,128,0.14)',
                                                color: item.IsFinancialSupportRequired ? '#1f9d6e' : '#6b7280',
                                            }}
                                        >
                                            {item.IsFinancialSupportRequired ? 'Required' : 'Not Required'}
                                        </span>
                                    </td>
                                    <td>{item.CycleName || (item.LoanCycleId ? `Cycle ${item.LoanCycleId}` : '—')}</td>
                                    <td>{formatDate(item.CreatedDate)}</td>
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
                            <h2>{modalMode === 'create' ? 'Add Financial Support' : 'Edit Financial Support'}</h2>
                            <button onClick={() => setShowModal(false)} className="act-modal-close">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="act-modal-body">
                            <div className="act-form-group">
                                <label>SHG Member ID</label>
                                <input
                                    type="number"
                                    min={1}
                                    placeholder="e.g. 108941"
                                    value={formMemberId}
                                    onChange={(e) => setFormMemberId(e.target.value)}
                                    className="act-input"
                                    autoFocus
                                />
                            </div>
                            <div className="act-form-group">
                                <label>Activity</label>
                                <select
                                    className="act-input"
                                    value={formActivityId}
                                    onChange={(e) => setFormActivityId(e.target.value)}
                                >
                                    <option value="">Select activity…</option>
                                    {activities.map((a) => (
                                        <option key={a.ActivityId} value={a.ActivityId}>{a.ActivityName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="act-form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formSupportRequired}
                                        onChange={(e) => setFormSupportRequired(e.target.checked)}
                                    />
                                    Financial Support Required
                                </label>
                            </div>
                            <div className="act-form-group">
                                <label>Loan Cycle ID (optional)</label>
                                <input
                                    type="number"
                                    min={1}
                                    placeholder="e.g. 1"
                                    value={formLoanCycleId}
                                    onChange={(e) => setFormLoanCycleId(e.target.value)}
                                    className="act-input"
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
                            <h2>Delete Financial Support</h2>
                            <button onClick={() => setDeleteTarget(null)} className="act-modal-close">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="act-modal-body">
                            <p>
                                Are you sure you want to delete financial support record{' '}
                                <strong>#{deleteTarget.FinancialSupportId}</strong> for member{' '}
                                <strong>{deleteTarget.SHGMemberId}</strong>?
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

export default FinancialSupportPage;