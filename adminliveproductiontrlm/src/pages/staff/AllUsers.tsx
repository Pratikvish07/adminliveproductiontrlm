import React from 'react';
import { ChevronLeft, ChevronRight, Pencil, RefreshCw, Search, Users } from 'lucide-react';
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
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
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

  const approvalBreakdown = React.useMemo(() => {
    const buckets: Array<'approved' | 'pending' | 'rejected' | 'unknown'> = ['approved', 'pending', 'rejected', 'unknown'];
    return buckets.map((bucket) => ({
      label: bucket,
      count: records.filter((record) => getApprovalBucket(record) === bucket).length,
    }));
  }, [records]);

  const totalUsers = records.length;
  const approvedUsers = approvalBreakdown.find((item) => item.label === 'approved')?.count ?? 0;
  const pendingUsers = approvalBreakdown.find((item) => item.label === 'pending')?.count ?? 0;
  const rejectedUsers = approvalBreakdown.find((item) => item.label === 'rejected')?.count ?? 0;
  const roles = React.useMemo(() => Array.from(new Set(records.map(getStaffRoleLabel))).sort(), [records]);
  const filteredUsers = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return records.filter((record) => {
      const matchesSearch = !term || [
        getDisplayName(record), getStaffRoleLabel(record), record.officialEmail, record.email,
        record.contactNumber, record.mobile, record.designation, getDistrictName(record),
        record.blockName, record.block, record.livelihoodTrackerId,
      ].some((value) => String(value ?? '').toLowerCase().includes(term));
      return matchesSearch
        && (roleFilter === 'all' || getStaffRoleLabel(record) === roleFilter)
        && (statusFilter === 'all' || getApprovalBucket(record) === statusFilter);
    });
  }, [records, roleFilter, search, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const paginatedUsers = React.useMemo(() => {
    const startIndex = (currentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [currentPage, filteredUsers]);
  const pageStart = filteredUsers.length === 0 ? 0 : (currentPage - 1) * USERS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * USERS_PER_PAGE, filteredUsers.length);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [records, roleFilter, search, statusFilter]);

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
      <main className="users-directory">
        <header className="users-directory__heading">
          <div>
            <p className="staff-kicker">Administration</p>
            <h2>All users</h2>
            <p>Review account access, contact details, and approval status.</p>
          </div>
          <button className="users-directory__refresh" type="button" onClick={() => void loadUsers()} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'is-spinning' : ''} />
            Refresh
          </button>
        </header>

        {error && <div className="staff-alert staff-alert--analytics">{error}</div>}

        <section className="users-directory__summary" aria-label="User totals">
          <div><span>Total users</span><strong>{formatCount(totalUsers)}</strong><small>Visible in your area</small></div>
          <div><span>Approved</span><strong>{formatCount(approvedUsers)}</strong><small>Active accounts</small></div>
          <div><span>Pending</span><strong>{formatCount(pendingUsers)}</strong><small>Awaiting review</small></div>
          <div><span>Rejected</span><strong>{formatCount(rejectedUsers)}</strong><small>Not approved</small></div>
        </section>

        <section className="users-directory__table-section">
          <div className="users-directory__toolbar">
            <div className="users-directory__table-title">
              <Users size={18} />
              <strong>User directory</strong>
              <span>{formatCount(filteredUsers.length)}</span>
            </div>
            <div className="users-directory__filters">
              <label className="users-directory__search">
                <Search size={16} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, ID..." />
              </label>
              <select aria-label="Filter by role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                <option value="all">All roles</option>
                {roles.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
              <select aria-label="Filter by approval status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>

          <div className="users-directory__table-scroll">
            <table className="users-directory__table">
              <thead><tr><th>User</th><th>Role</th><th>Contact</th><th>Location</th><th>Joined</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {paginatedUsers.map((record, index) => (
                  <tr key={getStaffId(record) ?? `${currentPage}-${index}`}>
                    <td><div className="users-directory__identity"><span className="users-directory__avatar">{getInitials(getDisplayName(record))}</span><span><strong>{getDisplayName(record)}</strong><small>{getFieldValue(record, ['designation'])} · ID {getFieldValue(record, ['livelihoodTrackerId'])}</small></span></div></td>
                    <td><span className="users-directory__role">{getStaffRoleLabel(record)}</span></td>
                    <td><span className="users-directory__contact">{getFieldValue(record, ['officialEmail', 'email'])}</span><small>{getFieldValue(record, ['contactNumber', 'mobile'])}</small></td>
                    <td><strong>{getFieldValue(record, ['districtName', 'district', 'DistrictName'])}</strong><small>{getFieldValue(record, ['blockName', 'block', 'BlockName'])}</small></td>
                    <td>{formatCreatedDate(record.createdDate ?? record.CreatedDate)}</td>
                    <td><span className={`users-directory__status users-directory__status--${getApprovalBucket(record)}`}>{getApprovalBucket(record)}</span></td>
                    <td><button className="users-directory__edit" type="button" onClick={() => openEditModal(record)} aria-label={`Edit ${getDisplayName(record)}`} title="Edit user"><Pencil size={15} /></button></td>
                  </tr>
                ))}
                {paginatedUsers.length === 0 && <tr><td colSpan={7} className="users-directory__empty">{error ? 'Users could not be loaded.' : 'No users match these filters.'}</td></tr>}
              </tbody>
            </table>
          </div>

          <footer className="users-directory__pagination">
            <span>Showing {formatCount(pageStart)}–{formatCount(pageEnd)} of {formatCount(filteredUsers.length)}</span>
            <div><button type="button" aria-label="Previous page" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}><ChevronLeft size={17} /></button><span>{formatCount(currentPage)} / {formatCount(totalPages)}</span><button type="button" aria-label="Next page" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}><ChevronRight size={17} /></button></div>
          </footer>
        </section>
      </main>

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
