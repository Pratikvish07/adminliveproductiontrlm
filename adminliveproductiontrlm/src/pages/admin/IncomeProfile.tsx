import React from 'react';
import { IndianRupee, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import {
    deleteIncomeProfile,
    getIncomeProfiles,
    saveIncomeProfile,
    searchIncomeProfiles,
} from '../../services/incomeProfileService';
import type { IncomeProfile } from '../../types/master.types';
import { getUserRoleId, ROLE_IDS, isStateAdmin } from '../../utils/roleAccess';
import '../master/MasterData.css';
import '../master/Activity.css';

const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

const sixMonthTotal = (item: IncomeProfile): number =>
    item.Month1Income + item.Month2Income + item.Month3Income +
    item.Month4Income + item.Month5Income + item.Month6Income;

const IncomeProfilePage: React.FC = () => {
    const { user } = useAuth();
    const roleId = getUserRoleId(user);
    const canManage = roleId === ROLE_IDS.STATE_ADMIN || isStateAdmin(user);

    const [items, setItems] = React.useState<IncomeProfile[]>([]);
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
    const [formActivityProfileId, setFormActivityProfileId] = React.useState('');
    const [formTotalLastYear, setFormTotalLastYear] = React.useState('');
    const [formPresentMonth, setFormPresentMonth] = React.useState('');
    const [formFutureProjection, setFormFutureProjection] = React.useState('');
    const [formMonths, setFormMonths] = React.useState<string[]>(['', '', '', '', '', '']);
    const [formError, setFormError] = React.useState('');

    const [deleteTarget, setDeleteTarget] = React.useState<IncomeProfile | null>(null);

    const flashSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 3500);
    };

    const load = React.useCallback(async () => {
        try {
            setLoading(true);
            setItems(await getIncomeProfiles());
        } catch {
            setError('Failed to load income profiles. Please try again.');
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
        return items.filter((item) =>
            !term ||
            String(item.IncomeProfileId).includes(term) ||
            String(item.ActivityProfileId).includes(term)
        );
    }, [items, search]);

    // Server-side search (GET /income-profile/search?text=…) merged into the list
    const runSearch = React.useCallback(async (text: string) => {
        if (!text.trim()) {
            await load();
            return;
        }
        try {
            setSearching(true);
            const data = await searchIncomeProfiles(text.trim());
            if (data.length > 0) {
                setItems((prev) => {
                    const map = new Map(prev.map((p) => [p.IncomeProfileId, p]));
                    data.forEach((d) => map.set(d.IncomeProfileId, d));
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
        setFormActivityProfileId('');
        setFormTotalLastYear('');
        setFormPresentMonth('');
        setFormFutureProjection('');
        setFormMonths(['', '', '', '', '', '']);
        setFormError('');
        setShowModal(true);
    };

    const openEditModal = (item: IncomeProfile) => {
        setModalMode('edit');
        setFormId(item.IncomeProfileId);
        setFormActivityProfileId(item.ActivityProfileId ? String(item.ActivityProfileId) : '');
        setFormTotalLastYear(String(item.TotalIncomeLastYear ?? ''));
        setFormPresentMonth(String(item.PresentMonthIncome ?? ''));
        setFormFutureProjection(String(item.FutureProjection ?? ''));
        setFormMonths([
            String(item.Month1Income ?? ''),
            String(item.Month2Income ?? ''),
            String(item.Month3Income ?? ''),
            String(item.Month4Income ?? ''),
            String(item.Month5Income ?? ''),
            String(item.Month6Income ?? ''),
        ]);
        setFormError('');
        setShowModal(true);
    };
    const handleSave = async () => {
        const activityProfileId = Number(formActivityProfileId.trim());
        if (!activityProfileId || activityProfileId <= 0) {
            setFormError('A valid Activity Profile ID is required.');
            return;
        }
        const toNum = (v: string) => (v.trim() === '' ? 0 : Number(v));
        const totals = [toNum(formTotalLastYear), toNum(formPresentMonth), toNum(formFutureProjection)];
        const months = formMonths.map((m) => toNum(m));
        if (totals.some((t) => !Number.isFinite(t) || t < 0) || months.some((m) => !Number.isFinite(m) || m < 0)) {
            setFormError('Income values must be zero or positive numbers.');
            return;
        }

        try {
            setActionLoading(true);
            setFormError('');
            await saveIncomeProfile({
                incomeProfileId: modalMode === 'edit' ? (formId ?? 0) : null,
                activityProfileId,
                totalIncomeLastYear: totals[0],
                presentMonthIncome: totals[1],
                futureProjection: totals[2],
                month1Income: months[0],
                month2Income: months[1],
                month3Income: months[2],
                month4Income: months[3],
                month5Income: months[4],
                month6Income: months[5],
            });
            await load();
            setShowModal(false);
            flashSuccess(`Income profile ${modalMode === 'create' ? 'created' : 'updated'} successfully.`);
        } catch (err) {
            const detail =
                (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.detail ||
                (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.message ||
                '';
            setFormError(
                detail
                    ? `Failed to ${modalMode === 'create' ? 'create' : 'update'} income profile: ${detail}`
                    : `Failed to ${modalMode === 'create' ? 'create' : 'update'} income profile. Please try again.`,
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
            await deleteIncomeProfile(deleteTarget.IncomeProfileId);
            setItems((prev) => prev.filter((i) => i.IncomeProfileId !== deleteTarget.IncomeProfileId));
            flashSuccess(`Income profile ${deleteTarget.IncomeProfileId} deleted.`);
            setDeleteTarget(null);
        } catch {
            setError('Failed to delete income profile.');
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
                    <p className="master-kicker">Administration</p>
                    <h1 className="master-title">Income Profile</h1>
                    <p className="master-subtitle">
                        Member income profiles — yearly total, present month and 6-month projections.
                    </p>
                </div>
                {canManage && (
                    <button className="act-btn-primary" type="button" onClick={openCreateModal}>
                        <Plus size={17} />
                        Add Income Profile
                    </button>
                )}
            </div>

            {error && (
                <div className="master-alert">
                    {error}
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
                    <IndianRupee size={15} />
                    <span>{items.length} total income profiles{(searching ? ' (searching…)' : '')}</span>
                </div>
                <div className="act-search-wrap">
                    <Search size={15} className="act-search-icon" />
                    <input
                        type="text"
                        placeholder="Search by profile ID or activity profile..."
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
                            <th>Activity Profile</th>
                            <th>Last Year Income</th>
                            <th>Present Month</th>
                            <th>Future Projection</th>
                            <th>M1</th>
                            <th>M2</th>
                            <th>M3</th>
                            <th>M4</th>
                            <th>M5</th>
                            <th>M6</th>
                            <th>6-Mo Total</th>
                            {canManage && <th style={{ width: 110 }}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={canManage ? 13 : 12} className="master-empty">
                                    No income profiles found matching your search.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((item) => (
                                <tr key={item.IncomeProfileId}>
                                    <td>{item.IncomeProfileId}</td>
                                    <td>#{item.ActivityProfileId}</td>
                                    <td>{formatCurrency(item.TotalIncomeLastYear)}</td>
                                    <td>{formatCurrency(item.PresentMonthIncome)}</td>
                                    <td>{formatCurrency(item.FutureProjection)}</td>
                                    <td>{formatCurrency(item.Month1Income)}</td>
                                    <td>{formatCurrency(item.Month2Income)}</td>
                                    <td>{formatCurrency(item.Month3Income)}</td>
                                    <td>{formatCurrency(item.Month4Income)}</td>
                                    <td>{formatCurrency(item.Month5Income)}</td>
                                    <td>{formatCurrency(item.Month6Income)}</td>
                                    <td>
                                        <strong>{formatCurrency(sixMonthTotal(item))}</strong>
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
                            <h2>{modalMode === 'create' ? 'Add Income Profile' : 'Edit Income Profile'}</h2>
                            <button onClick={() => setShowModal(false)} className="act-modal-close">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="act-modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div className="act-form-group">
                                    <label>Activity Profile ID *</label>
                                    <input
                                        type="number"
                                        min={1}
                                        placeholder="e.g. 1"
                                        value={formActivityProfileId}
                                        onChange={(e) => setFormActivityProfileId(e.target.value)}
                                        className="act-input"
                                        autoFocus
                                    />
                                    <small style={{ color: '#5f7386', fontSize: '0.72rem' }}>
                                        Must reference an existing Activity Profile record
                                    </small>
                                </div>
                                <div className="act-form-group">
                                    <label>Total Income (Last Year)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        step="any"
                                        placeholder="e.g. 48000"
                                        value={formTotalLastYear}
                                        onChange={(e) => setFormTotalLastYear(e.target.value)}
                                        className="act-input"
                                    />
                                </div>
                                <div className="act-form-group">
                                    <label>Present Month Income</label>
                                    <input
                                        type="number"
                                        min={0}
                                        step="any"
                                        placeholder="e.g. 6500"
                                        value={formPresentMonth}
                                        onChange={(e) => setFormPresentMonth(e.target.value)}
                                        className="act-input"
                                    />
                                </div>
                                <div className="act-form-group">
                                    <label>Future Projection</label>
                                    <input
                                        type="number"
                                        min={0}
                                        step="any"
                                        placeholder="e.g. 8000"
                                        value={formFutureProjection}
                                        onChange={(e) => setFormFutureProjection(e.target.value)}
                                        className="act-input"
                                    />
                                </div>
                                {formMonths.map((monthValue, idx) => (
                                    <div className="act-form-group" key={idx}>
                                        <label>Month {idx + 1} Income</label>
                                        <input
                                            type="number"
                                            min={0}
                                            step="any"
                                            placeholder="0"
                                            value={monthValue}
                                            onChange={(e) =>
                                                setFormMonths((prev) =>
                                                    prev.map((v, i) => (i === idx ? e.target.value : v)),
                                                )
                                            }
                                            className="act-input"
                                        />
                                    </div>
                                ))}
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
                            <h2>Delete Income Profile</h2>
                            <button onClick={() => setDeleteTarget(null)} className="act-modal-close">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="act-modal-body">
                            <p>
                                Are you sure you want to delete income profile{' '}
                                <strong>#{deleteTarget.IncomeProfileId}</strong> for activity profile{' '}
                                <strong>#{deleteTarget.ActivityProfileId}</strong>?
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

export default IncomeProfilePage;