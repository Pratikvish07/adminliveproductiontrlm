import React from 'react';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import { staffService } from '../../services/staffService';
import { toStaffRecords, getApprovalBucket, getStaffRoleLabel, getStaffId, formatStaffValue } from './staffUtils';
import { filterByDistrictAndBlock } from '../../utils/roleAccess';
import { useResolvedScope } from '../../utils/useResolvedScope';
import './Staff.css';

type StaffAnalyticsRecord = ReturnType<typeof toStaffRecords>[number];
const USERS_PER_PAGE = 10;

type UserEditForm = {
  officialName: string;
  officialEmail: string;
  contactNumber: string;
  designation: string;
  districtName: string;
  blockName: string;
  livelihoodTrackerId: string;
};

const ROLE_COLORS: Record<string, string> = {
  STATE_ADMIN: '#0f4c81',
  DISTRICT_STAFF: '#1f78b4',
  BLOCK_STAFF: '#f29f05',
  USER: '#6c7f92',
};

const APPROVAL_COLORS: Record<string, string> = {
  approved: '#1f9d6e',
  pending: '#f29f05',
  rejected: '#d8574b',
  unknown: '#6c7f92',
};

const getLoadUsersErrorMessage = (err: any): string => {
  if (err?.code === 'ECONNABORTED' || String(err?.message ?? '').toLowerCase().includes('timeout')) {
    return 'The all users API is taking too long to respond.';
  }

  if (!err?.response) {
    return 'The all users API could not be reached.';
  }

  if (err.response.status === 401) {
    return 'Your session is not authorized to load all users.';
  }

  if (err.response.status === 404) {
    return 'The all users API endpoint was not found on the server.';
  }

  return err?.response?.data?.message ?? 'Unable to load users right now.';
};

const formatCount = (value: number): string => new Intl.NumberFormat('en-IN').format(value);

const getDistrictName = (record: StaffAnalyticsRecord): string =>
  String(record.districtName ?? record.district ?? record.DistrictName ?? '-');

const getDisplayName = (record: StaffAnalyticsRecord): string =>
  String(record.officialName ?? record.name ?? record.livelihoodTrackerId ?? getStaffId(record) ?? '-');

const getInitials = (value: string): string => {
  const parts = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return '?';
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
};

const getFieldValue = (record: StaffAnalyticsRecord, keys: string[]): string => {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== '') {
      return formatStaffValue(value);
    }
  }

  return '-';
};

const formatCreatedDate = (value: unknown): string => {
  if (typeof value !== 'string' || !value.trim()) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
};

const createEditForm = (record: StaffAnalyticsRecord): UserEditForm => ({
  officialName: String(record.officialName ?? record.name ?? ''),
  officialEmail: String(record.officialEmail ?? record.email ?? ''),
  contactNumber: String(record.contactNumber ?? record.mobile ?? ''),
  designation: String(record.designation ?? ''),
  districtName: String(record.districtName ?? record.district ?? record.DistrictName ?? ''),
  blockName: String(record.blockName ?? record.block ?? record.BlockName ?? ''),
  livelihoodTrackerId: String(record.livelihoodTrackerId ?? ''),
});

const buildUpdatePayload = (record: StaffAnalyticsRecord, form: UserEditForm): Record<string, unknown> => ({
  ...record,
  staffId: record.staffId ?? record.id ?? record.userId ?? record.districtStaffId ?? record.blockStaffId,
  id: record.id ?? record.staffId ?? record.userId ?? record.districtStaffId ?? record.blockStaffId,
  officialName: form.officialName,
  name: form.officialName,
  officialEmail: form.officialEmail,
  email: form.officialEmail,
  contactNumber: form.contactNumber,
  mobile: form.contactNumber,
  designation: form.designation,
  districtName: form.districtName,
  district: form.districtName,
  blockName: form.blockName,
  block: form.blockName,
  livelihoodTrackerId: form.livelihoodTrackerId,
});

const AllUsers: React.FC = () => {
  const { user } = useAuth();
  const { scopedUser } = useResolvedScope(user);
  const hasLoadedRef = React.useRef(false);
  const [records, setRecords] = React.useState<StaffAnalyticsRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [editingRecord, setEditingRecord] = React.useState<StaffAnalyticsRecord | null>(null);
  const [editForm, setEditForm] = React.useState<UserEditForm | null>(null);
  const [saveError, setSaveError] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const loadUsers = React.useCallback(async () => {
    try {
      setError('');
      setLoading(true);

      const response = await staffService.getAllUsers();
      const filteredRecords = filterByDistrictAndBlock(
        toStaffRecords(response),
        scopedUser,
        ['districtId', 'district', 'districtName'],
        ['blockId', 'block', 'blockName'],
      );

      setRecords(filteredRecords);
    } catch (err: any) {
      setError(getLoadUsersErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [scopedUser]);

  React.useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }

    hasLoadedRef.current = true;
    void loadUsers();
  }, [loadUsers]);

  const roleBreakdown = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const record of records) {
      const label = getStaffRoleLabel(record);
      map.set(label, (map.get(label) ?? 0) + 1);
    }

    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [records]);

  const approvalBreakdown = React.useMemo(() => {
    const buckets: Array<'approved' | 'pending' | 'rejected' | 'unknown'> = ['approved', 'pending', 'rejected', 'unknown'];
    return buckets.map((bucket) => ({
      label: bucket,
      count: records.filter((record) => getApprovalBucket(record) === bucket).length,
    }));
  }, [records]);

  const districtBreakdown = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const record of records) {
      const district = getDistrictName(record);
      map.set(district, (map.get(district) ?? 0) + 1);
    }

    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .filter((item) => item.label !== '-')
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [records]);

  const topValue = React.useMemo(() => {
    const candidateValues = [
      ...roleBreakdown.map((item) => item.count),
      ...approvalBreakdown.map((item) => item.count),
      ...districtBreakdown.map((item) => item.count),
    ];

    return Math.max(...candidateValues, 1);
  }, [approvalBreakdown, districtBreakdown, roleBreakdown]);

  const totalUsers = records.length;
  const approvedUsers = approvalBreakdown.find((item) => item.label === 'approved')?.count ?? 0;
  const pendingUsers = approvalBreakdown.find((item) => item.label === 'pending')?.count ?? 0;
  const rejectedUsers = approvalBreakdown.find((item) => item.label === 'rejected')?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalUsers / USERS_PER_PAGE));
  const paginatedUsers = React.useMemo(() => {
    const startIndex = (currentPage - 1) * USERS_PER_PAGE;
    return records.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [currentPage, records]);
  const pageStart = totalUsers === 0 ? 0 : (currentPage - 1) * USERS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * USERS_PER_PAGE, totalUsers);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [records]);

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const openEditModal = React.useCallback((record: StaffAnalyticsRecord) => {
    setEditingRecord(record);
    setEditForm(createEditForm(record));
    setSaveError('');
  }, []);

  const closeEditModal = React.useCallback(() => {
    setEditingRecord(null);
    setEditForm(null);
    setSaveError('');
    setSaving(false);
  }, []);

  const handleEditFieldChange = React.useCallback((field: keyof UserEditForm, value: string) => {
    setEditForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  }, []);

  const handleSaveUser = React.useCallback(async () => {
    if (!editingRecord || !editForm) {
      return;
    }

    try {
      setSaving(true);
      setSaveError('');
      const payload = buildUpdatePayload(editingRecord, editForm);
      await staffService.updateUser(payload);

      setRecords((prev) => prev.map((record) =>
        (getStaffId(record) ?? '') === (getStaffId(editingRecord) ?? '')
          ? { ...record, ...payload }
          : record,
      ));
      closeEditModal();
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? 'Unable to update this user right now.');
    } finally {
      setSaving(false);
    }
  }, [closeEditModal, editForm, editingRecord]);

  if (loading && records.length === 0) {
    return <Loader />;
  }

  return (
    <div className="staff-page staff-page--analytics">
      <section className="staff-hero">
        <div className="staff-hero__copy">
          <p className="staff-kicker">User Analytics</p>
          <h1>All users, visualized for faster review</h1>
          <p className="staff-subtitle">
            This page loads directly from the live all-users API and turns the user base into role, approval,
            and district graphs so you can scan the system quickly.
          </p>
          <div className="staff-hero__status">
            {error && <span className="staff-status-badge staff-status-badge--warn">Live API error</span>}
          </div>
        </div>

        <div className="staff-hero__metric">
          <span>Total visible users</span>
          <strong>{formatCount(totalUsers)}</strong>
          <p>
            Approved {formatCount(approvedUsers)} · Pending {formatCount(pendingUsers)} · Rejected {formatCount(rejectedUsers)}
          </p>
        </div>
      </section>

      {error && <div className="staff-alert staff-alert--analytics">{error}</div>}

      <section className="staff-analytics-grid">
        <article className="staff-panel staff-panel--wide">
          <div className="staff-panel-head">
            <div>
              <h2>Role distribution graph</h2>
              <p>Compare how users are split across role categories.</p>
            </div>
          </div>

          <div className="staff-bar-chart">
            {roleBreakdown.map((item) => {
              const width = (item.count / topValue) * 100;
              const color = ROLE_COLORS[item.label] ?? ROLE_COLORS.USER;

              return (
                <div className="staff-bar-chart__row" key={item.label}>
                  <div className="staff-bar-chart__meta">
                    <span>{item.label}</span>
                    <strong>{formatCount(item.count)}</strong>
                  </div>
                  <div className="staff-bar-chart__track">
                    <div
                      className="staff-bar-chart__fill"
                      style={{
                        width: `${Math.max(width, 7)}%`,
                        background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.9))`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="staff-panel">
          <div className="staff-panel-head">
            <div>
              <h2>Approval rings</h2>
              <p>Status mix across the current users dataset.</p>
            </div>
          </div>

          <div className="staff-ring-grid">
            {approvalBreakdown.map((item) => {
              const share = totalUsers > 0 ? (item.count / totalUsers) * 100 : 0;
              const color = APPROVAL_COLORS[item.label] ?? APPROVAL_COLORS.unknown;

              return (
                <div className="staff-ring-card" key={item.label}>
                  <div
                    className="staff-ring-chart"
                    style={{
                      background: `conic-gradient(${color} ${share}%, rgba(18, 50, 74, 0.12) ${share}% 100%)`,
                    }}
                  >
                    <div className="staff-ring-chart__inner">
                      <strong>{share.toFixed(0)}%</strong>
                    </div>
                  </div>
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="staff-panel">
          <div className="staff-panel-head">
            <div>
              <h2>District heat view</h2>
              <p>Top districts by user presence in the current dataset.</p>
            </div>
          </div>

          <div className="staff-heat-grid">
            {districtBreakdown.map((item) => {
              const intensity = Math.round((item.count / topValue) * 100);
              return (
                <div
                  className="staff-heat-card"
                  key={item.label}
                  style={{
                    background: `linear-gradient(145deg, rgba(255,255,255,0.96), color-mix(in srgb, #1f78b4 ${Math.max(intensity, 20)}%, white))`,
                  }}
                >
                  <span>{item.label}</span>
                  <strong>{formatCount(item.count)}</strong>
                </div>
              );
            })}
            {districtBreakdown.length === 0 && (
              <div className="staff-empty">No district distribution available.</div>
            )}
          </div>
        </article>

        <article className="staff-panel staff-panel--wide">
          <div className="staff-panel-head">
            <div>
              <h2>All users list</h2>
              <p>Browse the complete live dataset with pagination.</p>
            </div>
          </div>

          {paginatedUsers.length === 0 ? (
            <div className="staff-empty">No users found.</div>
          ) : (
            <>
              <div className="staff-mini-table">
                <div className="staff-mini-table__head">
                  <span>Name</span>
                  <span>Role</span>
                  <span>Location</span>
                  <span>Joined</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>
                {paginatedUsers.map((record, index) => (
                  <div className="staff-mini-table__row" key={getStaffId(record) ?? `${currentPage}-${index}`}>
                    <div className="staff-mini-table__identity">
                      <span className="staff-mini-table__avatar">{getInitials(getDisplayName(record))}</span>
                      <span className="staff-mini-table__name-wrap">
                        <strong>{getDisplayName(record)}</strong>
                        <small>{getFieldValue(record, ['designation'])}</small>
                      </span>
                    </div>
                    <span className="staff-mini-table__role-pill">{getStaffRoleLabel(record)}</span>
                    <span className="staff-mini-table__location">
                      <strong>{getFieldValue(record, ['districtName', 'district', 'DistrictName'])}</strong>
                      <small>
                        {getFieldValue(record, ['blockName', 'block', 'BlockName']) !== '-'
                          ? getFieldValue(record, ['blockName', 'block', 'BlockName'])
                          : 'District level'}
                      </small>
                    </span>
                    <span className="staff-mini-table__joined">
                      <strong>{formatCreatedDate(record.createdDate ?? record.CreatedDate)}</strong>
                      <small>ID {getFieldValue(record, ['livelihoodTrackerId'])}</small>
                    </span>
                    <span className={`staff-mini-table__status staff-mini-table__status--${getApprovalBucket(record)}`}>
                      {getApprovalBucket(record)}
                    </span>
                    <button
                      type="button"
                      className="staff-mini-table__edit-btn"
                      onClick={() => openEditModal(record)}
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
              <div className="staff-pagination">
                <p className="staff-pagination__summary">
                  Showing {formatCount(pageStart)}-{formatCount(pageEnd)} of {formatCount(totalUsers)} users
                </p>
                <div className="staff-pagination__actions">
                  <button
                    type="button"
                    className="staff-pagination__btn"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span className="staff-pagination__page">
                    Page {formatCount(currentPage)} of {formatCount(totalPages)}
                  </span>
                  <button
                    type="button"
                    className="staff-pagination__btn"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </article>
      </section>

      {editingRecord && editForm && (
        <div className="staff-modal-backdrop" role="dialog" aria-modal="true" aria-label="Update user">
          <div className="staff-modal">
            <div className="staff-modal__head">
              <div>
                <p className="staff-kicker">Update User</p>
                <h2>Edit {getDisplayName(editingRecord)}</h2>
              </div>
              <button type="button" className="staff-modal__close" onClick={closeEditModal}>Close</button>
            </div>

            <div className="staff-modal__grid">
              <label className="staff-modal__field">
                <span>Name</span>
                <input
                  value={editForm.officialName}
                  onChange={(event) => handleEditFieldChange('officialName', event.target.value)}
                />
              </label>
              <label className="staff-modal__field">
                <span>Email</span>
                <input
                  value={editForm.officialEmail}
                  onChange={(event) => handleEditFieldChange('officialEmail', event.target.value)}
                />
              </label>
              <label className="staff-modal__field">
                <span>Mobile</span>
                <input
                  value={editForm.contactNumber}
                  onChange={(event) => handleEditFieldChange('contactNumber', event.target.value)}
                />
              </label>
              <label className="staff-modal__field">
                <span>Designation</span>
                <input
                  value={editForm.designation}
                  onChange={(event) => handleEditFieldChange('designation', event.target.value)}
                />
              </label>
              <label className="staff-modal__field">
                <span>District</span>
                <input
                  value={editForm.districtName}
                  onChange={(event) => handleEditFieldChange('districtName', event.target.value)}
                />
              </label>
              <label className="staff-modal__field">
                <span>Block</span>
                <input
                  value={editForm.blockName}
                  onChange={(event) => handleEditFieldChange('blockName', event.target.value)}
                />
              </label>
              <label className="staff-modal__field staff-modal__field--wide">
                <span>Tracker ID</span>
                <input
                  value={editForm.livelihoodTrackerId}
                  onChange={(event) => handleEditFieldChange('livelihoodTrackerId', event.target.value)}
                />
              </label>
            </div>

            {saveError && <div className="staff-alert staff-alert--analytics">{saveError}</div>}

            <div className="staff-modal__actions">
              <button type="button" className="staff-pagination__btn" onClick={closeEditModal} disabled={saving}>
                Cancel
              </button>
              <button type="button" className="staff-pagination__btn" onClick={handleSaveUser} disabled={saving}>
                {saving ? 'Saving...' : 'Save User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllUsers;
