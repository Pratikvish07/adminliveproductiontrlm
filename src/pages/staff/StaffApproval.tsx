import React from 'react';
import Loader from '../../components/common/Loader';
import { staffService } from '../../services/staffService';
import { getApprovalBucket, getStaffRoleLabel, resolveStaffId } from './staffUtils';
import type { PendingStaffRecord } from '../../types/common.types';
import { isStaffApprovalRoleId } from '../../utils/roleAccess';
import './StaffApproval.css';

type TabKey = 'pending' | 'approved' | 'rejected';

type StaffApprovalLists = Record<TabKey, PendingStaffRecord[]>;

type StaffApprovalCache = {
  lists: StaffApprovalLists;
  cachedAt: number;
};

const STAFF_APPROVAL_CACHE_KEY = 'trlm_staff_approval_cache_v1';
const STAFF_APPROVAL_CACHE_TTL_MS = 15 * 60 * 1000;

const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'pending', label: 'Pending', icon: '...' },
  { key: 'approved', label: 'Approved', icon: 'OK' },
  { key: 'rejected', label: 'Rejected', icon: 'NO' },
];

const getName = (staff: PendingStaffRecord): string =>
  String(staff.officialName ?? staff.name ?? staff.livelihoodTrackerId ?? '-');

const getEmail = (staff: PendingStaffRecord): string =>
  String(staff.officialEmail ?? staff.email ?? '-');

const getFieldValue = (value: PendingStaffRecord[keyof PendingStaffRecord]): string =>
  String(value ?? '-');

const isStaffApprovalRecord = (staff: PendingStaffRecord): boolean =>
  isStaffApprovalRoleId(
    staff.roleId ?? staff.RoleId ?? staff.role ?? staff.roleName ?? staff.RoleName ?? staff.userRole,
  );

const readApprovalCache = (): StaffApprovalCache | null => {
  try {
    const raw = localStorage.getItem(STAFF_APPROVAL_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StaffApprovalCache;
    if (Date.now() - parsed.cachedAt > STAFF_APPROVAL_CACHE_TTL_MS) {
      localStorage.removeItem(STAFF_APPROVAL_CACHE_KEY);
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(STAFF_APPROVAL_CACHE_KEY);
    return null;
  }
};

const writeApprovalCache = (lists: StaffApprovalLists): void => {
  try {
    const payload: StaffApprovalCache = {
      lists,
      cachedAt: Date.now(),
    };
    localStorage.setItem(STAFF_APPROVAL_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures and continue with the live response.
  }
};

const StaffApproval: React.FC = () => {
  const hasLoadedRef = React.useRef(false);
  const cached = React.useMemo(() => readApprovalCache(), []);
  const [activeTab, setActiveTab] = React.useState<TabKey>('pending');
  const [lists, setLists] = React.useState<StaffApprovalLists>(
    cached?.lists ?? {
      pending: [],
      approved: [],
      rejected: [],
    },
  );
  const [loading, setLoading] = React.useState(!cached);
  const [error, setError] = React.useState('');
  const [approvingId, setApprovingId] = React.useState('');
  const [rejectingId, setRejectingId] = React.useState('');
  const [toast, setToast] = React.useState<{ msg: string; ok: boolean } | null>(null);
  const [search, setSearch] = React.useState('');

  const showToast = React.useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const loadAll = React.useCallback(async () => {
    setLoading(true);
    setError('');

    const [pendingRes, allUsersRes] = await Promise.allSettled([
      staffService.getPendingStaff(),
      staffService.getAllUsers(),
    ]);

    const pending = pendingRes.status === 'fulfilled' ? pendingRes.value.filter(isStaffApprovalRecord) : [];
    const allUsers = allUsersRes.status === 'fulfilled' ? allUsersRes.value.filter(isStaffApprovalRecord) : [];
    const pendingIds = new Set(
      pending
        .map((staff) => resolveStaffId(staff))
        .filter((staffId): staffId is string => Boolean(staffId)),
    );
    const approved = allUsers.filter((staff) => {
      const staffId = resolveStaffId(staff);
      return !pendingIds.has(staffId ?? '') && getApprovalBucket(staff) === 'approved';
    });
    const rejected = allUsers.filter((staff) => {
      const staffId = resolveStaffId(staff);
      return !pendingIds.has(staffId ?? '') && getApprovalBucket(staff) === 'rejected';
    });

    const nextLists: StaffApprovalLists = {
      pending,
      approved,
      rejected,
    };

    setLists(nextLists);
    writeApprovalCache(nextLists);

    const allFailed = [pendingRes, allUsersRes].every((result) => result.status === 'rejected');
    if (allFailed) {
      setError(
        cached?.lists
          ? 'Live staff APIs are unavailable, so cached approval data is being shown.'
          : 'Could not load staff data. Please refresh.',
      );
    } else if (pendingRes.status === 'rejected') {
      setError(
        cached?.lists
          ? 'Pending staff API returned a server error, so cached approval data is being shown.'
          : 'Pending staff API returned a server error.',
      );
    }

    setLoading(false);
  }, [cached?.lists]);

  React.useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }

    hasLoadedRef.current = true;
    void loadAll().catch((err) => {
      console.error('[StaffApproval] loadAll failed', err);
      setError(
        cached?.lists
          ? 'Live staff APIs failed, so cached approval data is being shown.'
          : 'Failed to load staff data.',
      );
      setLoading(false);
    });
  }, [cached?.lists, loadAll]);

  const handleApprove = async (staffId: string) => {
    setApprovingId(staffId);
    setError('');

    try {
      await staffService.approveStaff(staffId);
      setLists((prev) => ({
        ...prev,
        pending: prev.pending.filter((staff) => resolveStaffId(staff) !== staffId),
      }));
      showToast('Staff record approved successfully.', true);
      void loadAll();
    } catch (err: any) {
      console.error('Failed to approve staff', {
        staffId,
        status: err?.response?.status,
        data: err?.response?.data,
        url: err?.config?.url,
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

  const handleReject = async (staffId: string) => {
    setRejectingId(staffId);
    setError('');

    try {
      await staffService.rejectStaff(staffId);
      setLists((prev) => ({
        ...prev,
        pending: prev.pending.filter((staff) => resolveStaffId(staff) !== staffId),
      }));
      showToast('Staff record rejected successfully.', true);
      void loadAll();
    } catch (err: any) {
      console.error('Failed to reject staff', {
        staffId,
        status: err?.response?.status,
        data: err?.response?.data,
        url: err?.config?.url,
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

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return lists[activeTab];
    }

    return lists[activeTab].filter((staff) =>
      [
        getName(staff),
        getEmail(staff),
        staff.designation,
        staff.districtName,
        staff.blockName,
        getStaffRoleLabel(staff),
        resolveStaffId(staff),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [activeTab, lists, search]);

  if (loading) {
    return <Loader />;
  }

  const isBusy = approvingId !== '' || rejectingId !== '';

  return (
    <div className="sa-page">
      <div className="sa-header">
        <div>
          <p className="sa-sup">Staff Management</p>
          <h1 className="sa-title">Staff Approval</h1>
          <p className="sa-desc">Approve or reject district and block staff registrations from one place.</p>
        </div>

        <div className="sa-counts">
          {TABS.map((tab) => (
            <div key={tab.key} className={`sa-count-pill sa-count--${tab.key}`}>
              <span>{tab.icon}</span>
              <strong>{lists[tab.key].length}</strong>
              <span>{tab.label}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="sa-alert" role="alert">
          <span className="sa-alert-icon" aria-hidden="true">!</span>
          {error}
        </div>
      )}

      {toast && (
        <div className={`sa-toast sa-toast--${toast.ok ? 'ok' : 'err'}`} role="status">
          {toast.ok ? 'OK' : 'NO'} {toast.msg}
        </div>
      )}

      <div className="sa-toolbar">
        <div className="sa-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`sa-tab sa-tab--${tab.key}${activeTab === tab.key ? ' sa-tab--active' : ''}`}
              onClick={() => {
                setActiveTab(tab.key);
                setSearch('');
              }}
              type="button"
            >
              <span>{tab.icon}</span>
              {tab.label}
              <span className="sa-tab-badge">{lists[tab.key].length}</span>
            </button>
          ))}
        </div>

        <input
          className="sa-search"
          type="text"
          placeholder="Search name, email, district..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search staff"
        />
      </div>

      <div className="sa-card">
        {filtered.length === 0 ? (
          <div className="sa-empty">
            {search ? 'No results match your search.' : `No ${activeTab} staff requests found.`}
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
                {filtered.map((staff, index) => {
                  const staffId = resolveStaffId(staff);
                  const isApproving = approvingId === staffId;
                  const isRejecting = rejectingId === staffId;
                  const rowBusy = isApproving || isRejecting;

                  return (
                    <tr key={staffId || index} className={rowBusy ? 'sa-row--busy' : ''}>
                      <td className="sa-td-num">{index + 1}</td>
                      <td className="sa-td-name">
                        <div className="sa-avatar">{getName(staff).charAt(0).toUpperCase()}</div>
                        <span>{getName(staff)}</span>
                      </td>
                      <td className="sa-td-mono">{staffId || '-'}</td>
                      <td>{getFieldValue(staff.designation)}</td>
                      <td className="sa-td-email">{getEmail(staff)}</td>
                      <td>{getFieldValue(staff.contactNumber)}</td>
                      <td>{getFieldValue(staff.districtName)}</td>
                      <td>{getFieldValue(staff.blockName)}</td>
                      <td>
                        <span className="sa-role-badge">{getStaffRoleLabel(staff)}</span>
                      </td>

                      {activeTab === 'pending' ? (
                        <td className="sa-td-actions">
                          <button
                            className="sa-btn sa-btn--approve"
                            onClick={() => {
                              if (staffId) {
                                void handleApprove(staffId);
                              }
                            }}
                            disabled={isBusy || !staffId}
                            aria-label={`Approve ${getName(staff)}`}
                            type="button"
                          >
                            {isApproving ? <span className="sa-spinner sa-spinner--sm" /> : 'Approve'}
                          </button>
                          <button
                            className="sa-btn sa-btn--reject"
                            onClick={() => {
                              if (staffId) {
                                void handleReject(staffId);
                              }
                            }}
                            disabled={isBusy || !staffId}
                            aria-label={`Reject ${getName(staff)}`}
                            type="button"
                          >
                            {isRejecting ? <span className="sa-spinner sa-spinner--sm" /> : 'Reject'}
                          </button>
                        </td>
                      ) : (
                        <td>
                          <span className={`sa-status-badge sa-status--${activeTab}`}>
                            {activeTab === 'approved' ? 'Approved' : 'Rejected'}
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
