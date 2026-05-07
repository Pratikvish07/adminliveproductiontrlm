import React from 'react';
import { Plus, Search, Trash2, X, Shield, Pencil, Calendar } from 'lucide-react';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
} from '../../services/masterService';
import type { Role as RoleItem } from '../../types/master.types';
import { getUserRoleId, ROLE_IDS, isStateAdmin } from '../../utils/roleAccess';
import './MasterData.css';
import './Role.css';

const RolePage: React.FC = () => {
  const { user } = useAuth();
  const roleId = getUserRoleId(user);
  const canManage = roleId === ROLE_IDS.STATE_ADMIN || isStateAdmin(user);

  const [items, setItems] = React.useState<RoleItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');

  const [search, setSearch] = React.useState('');

  const [showModal, setShowModal] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<'create' | 'edit'>('create');
  const [formRoleId, setFormRoleId] = React.useState<number | null>(null);
  const [formName, setFormName] = React.useState('');
  const [formError, setFormError] = React.useState('');

  const [deleteTarget, setDeleteTarget] = React.useState<RoleItem | null>(null);

  const flashSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRoles();
      setItems(data);
    } catch {
      setError('Failed to load roles. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = React.useMemo(() => {
    return items.filter((item) =>
      item.roleName.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const openCreateModal = () => {
    setModalMode('create');
    setFormRoleId(null);
    setFormName('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (item: RoleItem) => {
    setModalMode('edit');
    setFormRoleId(item.roleId);
    setFormName(item.roleName);
    setFormError('');
    setShowModal(true);
  };

  const handleCreate = async () => {
    const name = formName.trim();
    if (!name) { setFormError('Role name is required.'); return; }
    try {
      setActionLoading(true);
      setFormError('');
      await createRole({ roleName: name });
      await load(); // Refresh list to get real ID and dates
      setShowModal(false);
      flashSuccess(`Role "${name}" created successfully.`);
    } catch {
      setFormError('Failed to create role. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async () => {
    const name = formName.trim();
    if (!name) { setFormError('Role name is required.'); return; }
    if (!formRoleId) return;
    try {
      setActionLoading(true);
      setFormError('');
      await updateRole(formRoleId, { roleName: name });
      setItems((prev) =>
        prev.map((i) =>
          i.roleId === formRoleId ? { ...i, roleName: name } : i
        )
      );
      setShowModal(false);
      flashSuccess(`Role "${name}" updated successfully.`);
    } catch {
      setFormError('Failed to update role. Please try again.');
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
      await deleteRole(deleteTarget.roleId);
      setItems((prev) => prev.filter((i) => i.roleId !== deleteTarget.roleId));
      flashSuccess(`Role "${deleteTarget.roleName}" deleted.`);
      setDeleteTarget(null);
    } catch {
      setError('Failed to delete role.');
      setDeleteTarget(null);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="master-page role-page">
      <div className="master-header role-header-row">
        <div>
          <p className="master-kicker">Master Data</p>
          <h1 className="master-title">Roles</h1>
          <p className="master-subtitle">Manage application user roles and access levels.</p>
        </div>
        {canManage && (
          <button
            className="role-btn-primary"
            type="button"
            onClick={openCreateModal}
          >
            <Plus size={17} />
            Add Role
          </button>
        )}
      </div>

      {error && (
        <div className="master-alert">
          {error}
          <button className="role-alert-close" onClick={() => setError('')} type="button">
            <X size={14} />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="role-success-banner">
          {successMsg}
        </div>
      )}

      <div className="role-controls-row">
        <div className="role-stat-pill">
          <Shield size={15} />
          <span>{items.length} total roles</span>
        </div>
        <div className="role-search-wrap">
          <Search size={15} className="role-search-icon" />
          <input
            type="text"
            placeholder="Search roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="role-search-input"
          />
        </div>
      </div>

      <div className="master-table-shell">
        <table className="master-table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>ID</th>
              <th>Role Name</th>
              <th>Created Date</th>
              {canManage && <th style={{ width: 110 }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 4 : 3} className="master-empty">
                  No roles found matching your search.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.roleId}>
                  <td>{item.roleId}</td>
                  <td>
                    <span className="role-name-tag">{item.roleName}</span>
                  </td>
                  <td>
                    <div className="role-date">
                      <Calendar size={13} />
                      {item.createdDate ? new Date(item.createdDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  {canManage && (
                    <td>
                      <div className="role-action-btns">
                        <button
                          className="role-btn-edit"
                          title="Edit"
                          onClick={() => openEditModal(item)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="role-btn-delete"
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
        <div className="role-modal-backdrop">
          <div className="role-modal">
            <div className="role-modal-header">
              <h2>{modalMode === 'create' ? 'Add New Role' : 'Edit Role'}</h2>
              <button onClick={() => setShowModal(false)} className="role-modal-close">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="role-modal-body">
              <div className="role-form-group">
                <label>Role Name</label>
                <input
                  type="text"
                  placeholder="e.g. SUPER_ADMIN"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="role-input"
                  autoFocus
                />
              </div>
              {formError && <p className="role-form-error">{formError}</p>}
              <div className="role-modal-actions">
                <button
                  type="button"
                  className="role-btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="role-btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Processing...' : modalMode === 'create' ? 'Create Role' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="role-modal-backdrop">
          <div className="role-modal role-modal--sm">
            <div className="role-modal-header">
              <h2>Delete Role</h2>
              <button onClick={() => setDeleteTarget(null)} className="role-modal-close">
                <X size={18} />
              </button>
            </div>
            <div className="role-modal-body">
              <p>Are you sure you want to delete role <strong>"{deleteTarget.roleName}"</strong>?</p>
              <div className="role-modal-actions">
                <button
                  type="button"
                  className="role-btn-secondary"
                  onClick={() => setDeleteTarget(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="role-btn-danger"
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

export default RolePage;
