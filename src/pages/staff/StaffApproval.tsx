import React from 'react';
import Loader from '../../components/common/Loader';
import { staffService, resolveStaffId } from '../../services/staffService';
import type { PendingStaffRecord } from '../../types/common.types';
import './StaffApproval.css';

/* ─── Tab config ─────────────────────────────────────────────── */
type TabKey = 'pending' | 'approved' | 'rejected';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'pending',  label: 'Pending',  icon: '⏳' },
  { key: 'approved', label: 'Approved', icon: '✓'  },
  { key: 'rejected', label: 'Rejected', icon: '✕'  },
];

/* ─── Display helpers ────────────────────────────────────────── */
function getName(s: PendingStaffRecord): string {
  return s.officialName ?? s.name ?? s.livelihoodTrackerId ?? '—';
}
function getEmail(s: PendingStaffRecord): string {
  return s.officialEmail ?? s.email ?? '—';
}

/* ═══════════════════════════════════════════════════════════════
   StaffApproval
═══════════════════════════════════════════════════════════════ */
const StaffApproval: React.FC = () => {
  const hasLoadedRef = React.useRef(false);

  const [activeTab, setActiveTab] = React.useState<TabKey>('pending');
  const [lists, setLists] = React.useState<Record<TabKey, PendingStaffRecord[]>>({
    pending:  [],
    approved: [],
    rejected: [],
  });

  const [loading,     setLoading]     = React.useState(true);
  const [error,       setError]       = React.useState('');
  const [approvingId, setApprovingId] = React.useState('');
  const [rejectingId, setRejectingId] = React.useState('');
  const [toast,       setToast]       = React.useState<{ msg: string; ok: boolean } | null>(null);
  const [search,      setSearch]      = React.useState('');

  /* ── Toast ────────────────────────────────────────────────── */
  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Load all three lists in parallel ─────────────────────── */
  const loadAll = React.useCallback(async () => {
    setLoading(true);
    setError('');

    const [pendingRes, approvedRes, rejectedRes] = await Promise.allSettled([
      staffService.getPendingStaff(),
      staffService.getApprovedStaff(),
      staffService.getRejectedStaff(),
    ]);

    if (pendingRes.status  === 'rejected') {
      console.error('[StaffApproval] pending failed',  pendingRes.reason);
    }
    if (approvedRes.status === 'rejected') {
      console.error('[StaffApproval] approved failed', approvedRes.reason);
    }
    if (rejectedRes.status === 'rejected') {
      console.error('[StaffApproval] rejected failed', rejectedRes.reason);
    }

    setLists({
      pending:  pendingRes.status  === 'fulfilled' ? pendingRes.value  : [],
      approved: approvedRes.status === 'fulfilled' ? approvedRes.value : [],
      rejected: rejectedRes.status === 'fulfilled' ? rejectedRes.value : [],
    });

    const allFailed = [pendingRes, approvedRes, rejectedRes].every(
      (r) => r.status === 'rejected',
    );
    if (allFailed) {
      setError('Could not load staff data. Please refresh.');
    } else if (pendingRes.status === 'rejected') {
      setError('Pending staff API returned a server error.');
    }

    setLoading(false);
  }, []);

  /* Run once on mount */
  React.useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadAll().catch((err) => {
      console.error('[StaffApproval] loadAll failed', err);
      setError('Failed to load staff data.');
      setLoading(false);
    });
  }, [loadAll]);

  /* ── Approve ──────────────────────────────────────────────── */
  const handleApprove = async (staffId: string) => {
    setApprovingId(staffId);
    setError('');
    try {
      await staffService.approveStaff(staffId);

      /* Optimistic: remove from pending immediately */
      setLists((prev) => ({
        ...prev,
        pending: prev.pending.filter(
          (s) => resolveStaffId(s) !== staffId,
        ),
      }));

      showToast('Staff record approved successfully.', true);

      /* Reload approved list silently in background */
      staffService.getApprovedStaff()
        .then((data) => setLists((prev) => ({ ...prev, approved: data })))
        .catch(() => null);

    } catch (err: any) {
      console.error('Failed to approve staff', {
        staffId,
        status: err?.response?.status,
        data:   err?.response?.data,
        url:    err?.config?.url,
      });
      showToast(
        err?.response?.status === 404
          ? `Staff ID "${staffId}" not found on server.`
          : err?.response?.data?.message ?? 'Unable to approve this staff record right now.',
        false,
      );
      setError('Unable to approve this staff record right now.');
    } finally {
      setApprovingId('');
    }
  };

  /* ── Reject ───────────────────────────────────────────────── */
  const handleReject = async (staffId: string) => {
    setRejectingId(staffId);
    setError('');
    try {
      await staffService.rejectStaff(staffId);

      setLists((prev) => ({
        ...prev,
        pending: prev.pending.filter(
          (s) => resolveStaffId(s) !== staffId,
        ),
      }));

      showToast('Staff record rejected successfully.', true);

      staffService.getRejectedStaff()
        .then((data) => setLists((prev) => ({ ...prev, rejected: data })))
        .catch(() => null);

    } catch (err: any) {
      console.error('Failed to reject staff', {
        staffId,
        status: err?.response?.status,
        data:   err?.response?.data,
        url:    err?.config?.url,
      });
      showToast(
        err?.response?.status === 404
          ? `Staff ID "${staffId}" not found on server.`
          : err?.response?.data?.message ?? 'Unable to reject this staff record right now.',
        false,
      );
      setError('Unable to reject this staff record right now.');
    } finally {
      setRejectingId('');
    }
  };

  /* ── Search filter ────────────────────────────────────────── */
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return lists[activeTab];
    return lists[activeTab].filter((s) =>
      [
        getName(s),
        getEmail(s),
        s.designation,
        s.districtName,
        s.blockName,
        s.role,
        resolveStaffId(s),
      ]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    );
  }, [lists, activeTab, search]);

  /* ── Render ───────────────────────────────────────────────── */
  if (loading) return <Loader />;

  const isBusy = approvingId !== '' || rejectingId !== '';

  return (
    <div className="sa-page">

      {/* Header */}
      <div className="sa-header">
        <div>
          <p className="sa-sup">Staff Management</p>
          <h1 className="sa-title">Staff Approval</h1>
          <p className="sa-desc">
            Review pending requests and approve or reject from one place.
          </p>
        </div>
        <div className="sa-counts">
          {TABS.map((t) => (
            <div key={t.key} className={`sa-count-pill sa-count--${t.key}`}>
              <span>{t.icon}</span>
              <strong>{lists[t.key].length}</strong>
              <span>{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="sa-alert" role="alert">
          <span className="sa-alert-icon" aria-hidden="true">!</span>
          {error}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`sa-toast sa-toast--${toast.ok ? 'ok' : 'err'}`}
          role="status"
        >
          {toast.ok ? '✓' : '✕'}&nbsp;{toast.msg}
        </div>
      )}

      {/* Toolbar: tabs + search */}
      <div className="sa-toolbar">
        <div className="sa-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={activeTab === t.key}
              className={`sa-tab sa-tab--${t.key}${activeTab === t.key ? ' sa-tab--active' : ''}`}
              onClick={() => { setActiveTab(t.key); setSearch(''); }}
            >
              <span>{t.icon}</span>
              {t.label}
              <span className="sa-tab-badge">{lists[t.key].length}</span>
            </button>
          ))}
        </div>

        <input
          className="sa-search"
          type="text"
          placeholder="Search name, email, district…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search staff"
        />
      </div>

      {/* Table card */}
      <div className="sa-card">
        {filtered.length === 0 ? (
          <div className="sa-empty">
            {search
              ? 'No results match your search.'
              : `No ${activeTab} staff requests found.`}
          </div>
        ) : (
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Tracker ID</th>
                  <th>Designation</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>District</th>
                  <th>Block</th>
                  <th>Role</th>
                  {activeTab === 'pending' ? <th>Actions</th> : <th>Status</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((staff, idx) => {
                  const staffId    = resolveStaffId(staff);
                  const isApproving = approvingId === staffId;
                  const isRejecting = rejectingId === staffId;
                  const rowBusy     = isApproving || isRejecting;

                  return (
                    <tr
                      key={staffId || idx}
                      className={rowBusy ? 'sa-row--busy' : ''}
                    >
                      <td className="sa-td-num">{idx + 1}</td>

                      <td className="sa-td-name">
                        <div className="sa-avatar">
                          {getName(staff).charAt(0).toUpperCase()}
                        </div>
                        <span>{getName(staff)}</span>
                      </td>

                      <td className="sa-td-mono">{staffId || '—'}</td>
                      <td>{staff.designation   ?? '—'}</td>
                      <td className="sa-td-email">{getEmail(staff)}</td>
                      <td>{staff.contactNumber ?? '—'}</td>
                      <td>{staff.districtName  ?? '—'}</td>
                      <td>{staff.blockName     ?? '—'}</td>
                      <td>
                        {staff.role
                          ? <span className="sa-role-badge">{staff.role}</span>
                          : '—'}
                      </td>

                      {activeTab === 'pending' ? (
                        <td className="sa-td-actions">
                          <button
                            className="sa-btn sa-btn--approve"
                            onClick={() => handleApprove(staffId)}
                            disabled={isBusy || !staffId}
                            aria-label={`Approve ${getName(staff)}`}
                          >
                            {isApproving
                              ? <span className="sa-spinner sa-spinner--sm" />
                              : '✓ Approve'}
                          </button>
                          <button
                            className="sa-btn sa-btn--reject"
                            onClick={() => handleReject(staffId)}
                            disabled={isBusy || !staffId}
                            aria-label={`Reject ${getName(staff)}`}
                          >
                            {isRejecting
                              ? <span className="sa-spinner sa-spinner--sm" />
                              : '✕ Reject'}
                          </button>
                        </td>
                      ) : (
                        <td>
                          <span className={`sa-status-badge sa-status--${activeTab}`}>
                            {activeTab === 'approved' ? '✓ Approved' : '✕ Rejected'}
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default StaffApproval;