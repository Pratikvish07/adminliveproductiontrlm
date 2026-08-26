import React from 'react';
import { Plus, Search, Trash2, X, Activity as ActivityIcon, Pencil } from 'lucide-react';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
} from '../../services/masterService';
import type { LivelihoodActivity } from '../../types/master.types';
import { getUserRoleId, ROLE_IDS, isStateAdmin } from '../../utils/roleAccess';
import './MasterData.css';
import './Activity.css';

const ActivityPage: React.FC = () => {
  const { user } = useAuth();
  const roleId = getUserRoleId(user);
  const canManage = roleId === ROLE_IDS.STATE_ADMIN || isStateAdmin(user);

  const [items, setItems] = React.useState<LivelihoodActivity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');

  const [search, setSearch] = React.useState('');

  const [showModal, setShowModal] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<'create' | 'edit'>('create');
  const [formActivityId, setFormActivityId] = React.useState<number | null>(null);
  const [formName, setFormName] = React.useState('');
  const [formError, setFormError] = React.useState('');

  const [deleteTarget, setDeleteTarget] = React.useState<LivelihoodActivity | null>(null);

  const flashSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await getActivities();
      setItems(data);
    } catch {
      setError('Failed to load activities. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = React.useMemo(() => {
    return items.filter((item) =>
      item.ActivityName.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const openCreateModal = () => {
    setModalMode('create');
    setFormActivityId(null);
    setFormName('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (item: LivelihoodActivity) => {
    setModalMode('edit');
    setFormActivityId(item.ActivityId);
    setFormName(item.ActivityName);
    setFormError('');
    setShowModal(true);
  };

  const handleCreate = async () => {
    const name = formName.trim();
    if (!name) { setFormError('Activity name is required.'); return; }
    try {
      setActionLoading(true);
      setFormError('');
      await createActivity(name);
      await load();
      setShowModal(false);
      flashSuccess(`Activity "${name}" created successfully.`);
    } catch {
      setFormError('Failed to create activity. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async () => {
    const name = formName.trim();
    if (!name) { setFormError('Activity name is required.'); return; }
    if (formActivityId === null) return;
    try {
      setActionLoading(true);
      setFormError('');
      await updateActivity(formActivityId, name);
      setItems((prev) =>
        prev.map((i) =>
          i.ActivityId === formActivityId ? { ...i, ActivityName: name } : i
        )
      );
      setShowModal(false);
      flashSuccess(`Activity "${name}" updated successfully.`);
    } catch {
      setFormError('Failed to update activity. Please try again.');
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
      await deleteActivity(deleteTarget.ActivityId);
      setItems((prev) => prev.filter((i) => i.ActivityId !== deleteTarget.ActivityId));
      flashSuccess(`Activity "${deleteTarget.ActivityName}" deleted.`);
      setDeleteTarget(null);
    } catch {
      setError('Failed to delete activity.');
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
          <h1 className="master-title">Livelihood Activities</h1>
          <p className="master-subtitle">Manage primary livelihood activity types.</p>
        </div>
        {canManage && (
          <button
            className="act-btn-primary"
            type="button"
            onClick={openCreateModal}
          >
            <Plus size={17} />
            Add Activity
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
          <ActivityIcon size={15} />
          <span>{items.length} total activities</span>
        </div>
        <div className="act-search-wrap">
          <Search size={15} className="act-search-icon" />
          <input
            type="text"
            placeholder="Search activities..."
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
              <th>Activity Name</th>
              {canManage && <th style={{ width: 110 }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 3 : 2} className="master-empty">
                  No activities found matching your search.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.ActivityId}>
                  <td>{item.ActivityId}</td>
                  <td>
                    <span className="act-name-tag">{item.ActivityName}</span>
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
              <h2>{modalMode === 'create' ? 'Add New Activity' : 'Edit Activity'}</h2>
              <button onClick={() => setShowModal(false)} className="act-modal-close">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="act-modal-body">
              <div className="act-form-group">
                <label>Activity Name</label>
                <input
                  type="text"
                  placeholder="e.g. Agriculture"
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
                  {actionLoading ? 'Processing...' : modalMode === 'create' ? 'Create Activity' : 'Save Changes'}
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
              <h2>Delete Activity</h2>
              <button onClick={() => setDeleteTarget(null)} className="act-modal-close">
                <X size={18} />
              </button>
            </div>
            <div className="act-modal-body">
              <p>Are you sure you want to delete activity <strong>"{deleteTarget.ActivityName}"</strong>?</p>
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

export default ActivityPage;
