import React from 'react';
import { Plus, Search, Trash2, X, Tag, Pencil } from 'lucide-react';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import {
  getSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  getActivities,
} from '../../services/masterService';
import type { SubCategory as SubCategoryItem, LivelihoodActivity } from '../../types/master.types';
import { getUserRoleId, ROLE_IDS, isStateAdmin } from '../../utils/roleAccess';
import './MasterData.css';
import './SubCategory.css';

type ModalMode = 'create' | 'edit';

const SubCategory: React.FC = () => {
  const { user } = useAuth();
  const roleId = getUserRoleId(user);
  const canManage = roleId === ROLE_IDS.STATE_ADMIN || isStateAdmin(user);

  const [items, setItems] = React.useState<SubCategoryItem[]>([]);
  const [activities, setActivities] = React.useState<LivelihoodActivity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');

  // Filters
  const [search, setSearch] = React.useState('');
  const [selectedActivity, setSelectedActivity] = React.useState('');

  // Create / Edit modal
  const [modalMode, setModalMode] = React.useState<ModalMode>('create');
  const [showModal, setShowModal] = React.useState(false);
  const [formSubCategoryId, setFormSubCategoryId] = React.useState<number | null>(null);
  const [formActivityId, setFormActivityId] = React.useState('1');
  const [formName, setFormName] = React.useState('');
  const [formError, setFormError] = React.useState('');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = React.useState<SubCategoryItem | null>(null);

  const flashSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // Load
  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [subData, actData] = await Promise.all([
          getSubCategories(),
          getActivities(),
        ]);
        setItems(subData);
        setActivities(actData);
      } catch {
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activityMap = React.useMemo(() => {
    const map: Record<number, string> = {};
    activities.forEach((a) => {
      map[a.ActivityId] = a.ActivityName;
    });
    return map;
  }, [activities]);

  // Filtered list
  const filtered = React.useMemo(() => {
    return items.filter((item) => {
      const actName = (activityMap[item.ActivityId] || '').toLowerCase();
      const matchSearch =
        !search ||
        item.SubCategoryName.toLowerCase().includes(search.toLowerCase()) ||
        actName.includes(search.toLowerCase());
      const matchActivity =
        !selectedActivity || String(item.ActivityId) === selectedActivity;
      return matchSearch && matchActivity;
    });
  }, [items, search, selectedActivity, activityMap]);

  // Grouped for display
  const grouped = React.useMemo(() => {
    const map: Record<number, SubCategoryItem[]> = {};
    filtered.forEach((item) => {
      if (!map[item.ActivityId]) map[item.ActivityId] = [];
      map[item.ActivityId].push(item);
    });
    return Object.entries(map)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([actId, list]) => ({ activityId: Number(actId), list }));
  }, [filtered]);

  const activityIds = React.useMemo(() => {
    const ids = [...new Set(items.map((i) => i.ActivityId))].sort((a, b) => a - b);
    return ids;
  }, [items]);

  const openCreateModal = () => {
    setModalMode('create');
    setFormSubCategoryId(null);
    setFormActivityId('1');
    setFormName('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (item: SubCategoryItem) => {
    setModalMode('edit');
    setFormSubCategoryId(item.SubCategoryId);
    setFormActivityId(String(item.ActivityId));
    setFormName(item.SubCategoryName);
    setFormError('');
    setShowModal(true);
  };

  // Create
  const handleCreate = async () => {
    const name = formName.trim();
    if (!name) { setFormError('Sub-category name is required.'); return; }
    try {
      setActionLoading(true);
      setFormError('');
      const created = await createSubCategory({
        ActivityId: Number(formActivityId),
        SubCategoryName: name,
      });
      setItems((prev) => [...prev, created]);
      setShowModal(false);
      flashSuccess(`"${name}" created successfully.`);
    } catch {
      setFormError('Failed to create sub-category. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Update
  const handleUpdate = async () => {
    const name = formName.trim();
    if (!name) { setFormError('Sub-category name is required.'); return; }
    if (!formSubCategoryId) return;
    try {
      setActionLoading(true);
      setFormError('');
      await updateSubCategory({
        SubCategoryId: formSubCategoryId,
        ActivityId: Number(formActivityId),
        SubCategoryName: name,
      });
      setItems((prev) =>
        prev.map((i) =>
          i.SubCategoryId === formSubCategoryId
            ? { ...i, ActivityId: Number(formActivityId), SubCategoryName: name }
            : i
        )
      );
      setShowModal(false);
      flashSuccess(`"${name}" updated successfully.`);
    } catch {
      setFormError('Failed to update sub-category. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'create') handleCreate();
    else handleUpdate();
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setActionLoading(true);
      await deleteSubCategory(deleteTarget.SubCategoryId);
      setItems((prev) =>
        prev.filter((i) => i.SubCategoryId !== deleteTarget.SubCategoryId)
      );
      flashSuccess(`"${deleteTarget.SubCategoryName}" deleted.`);
      setDeleteTarget(null);
    } catch {
      setError('Failed to delete sub-category.');
      setDeleteTarget(null);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="master-page sc-page">
      {/* Header */}
      <div className="master-header sc-header-row">
        <div>
          <p className="master-kicker">Master Data</p>
          <h1 className="master-title">Sub Categories</h1>
          <p className="master-subtitle">
            Manage livelihood sub-categories grouped by activity type.
          </p>
        </div>
        {canManage && (
          <button
            className="sc-btn-primary"
            type="button"
            id="btn-add-subcategory"
            onClick={openCreateModal}
          >
            <Plus size={17} />
            Add Sub Category
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="master-alert" id="sc-error-banner">
          {error}
          <button className="sc-alert-close" onClick={() => setError('')} type="button">
            <X size={14} />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="sc-success-banner" id="sc-success-banner">
          {successMsg}
        </div>
      )}

      {/* Summary + Filters */}
      <div className="sc-controls-row">
        <div className="sc-stat-pill">
          <Tag size={15} />
          <span>{items.length} total</span>
          <span className="sc-stat-sep">·</span>
          <span>{filtered.length} shown</span>
        </div>
        <div className="sc-filter-group">
          <div className="sc-search-wrap">
            <Search size={15} className="sc-search-icon" />
            <input
              id="sc-search"
              type="text"
              placeholder="Search sub-categories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sc-search-input"
            />
          </div>
          <select
            id="sc-activity-filter"
            className="sc-select"
            value={selectedActivity}
            onChange={(e) => setSelectedActivity(e.target.value)}
          >
            <option value="">All Activities</option>
            {activities.map((act) => (
              <option key={act.ActivityId} value={act.ActivityId}>
                {act.ActivityName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table grouped by activity */}
      {grouped.length === 0 ? (
        <div className="master-table-shell">
          <div className="master-empty">
            {search || selectedActivity
              ? 'No sub-categories match your filters.'
              : 'No sub-categories found.'}
          </div>
        </div>
      ) : (
        grouped.map(({ activityId, list }) => (
          <div key={activityId} className="sc-group">
            <div className="sc-group-header">
              <span className="sc-group-badge">{activityId}</span>
              <h2 className="sc-group-title">
                {activityMap[activityId] ?? `Activity ${activityId}`}
              </h2>
              <span className="sc-group-count">{list.length} items</span>
            </div>
            <div className="master-table-shell">
              <table className="master-table">
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>ID</th>
                    <th>Sub Category Name</th>
                    {canManage && <th style={{ width: 110 }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {list.map((item) => (
                    <tr key={item.SubCategoryId}>
                      <td>{item.SubCategoryId}</td>
                      <td>{item.SubCategoryName}</td>
                      {canManage && (
                        <td>
                          <div className="sc-action-btns">
                            <button
                              className="sc-btn-edit"
                              type="button"
                              id={`btn-edit-${item.SubCategoryId}`}
                              title="Edit"
                              onClick={() => openEditModal(item)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              className="sc-btn-delete"
                              type="button"
                              id={`btn-delete-${item.SubCategoryId}`}
                              title="Delete"
                              onClick={() => setDeleteTarget(item)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="sc-modal-backdrop" id="sc-modal-form">
          <div className="sc-modal">
            <div className="sc-modal-header">
              <h2>{modalMode === 'create' ? 'Add Sub Category' : 'Edit Sub Category'}</h2>
              <button
                type="button"
                className="sc-modal-close"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="sc-modal-body">
              {modalMode === 'edit' && formSubCategoryId && (
                <div className="sc-form-group">
                  <label>Sub Category ID</label>
                  <input
                    type="text"
                    value={formSubCategoryId}
                    disabled
                    className="sc-input sc-input--disabled"
                  />
                </div>
              )}
              <div className="sc-form-group">
                <label htmlFor="sc-form-activity">Activity Type</label>
                <select
                  id="sc-form-activity"
                  value={formActivityId}
                  onChange={(e) => setFormActivityId(e.target.value)}
                  className="sc-select"
                >
                  {activities.map((act) => (
                    <option key={act.ActivityId} value={act.ActivityId}>
                      {act.ActivityId} — {act.ActivityName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sc-form-group">
                <label htmlFor="sc-form-name">Sub Category Name</label>
                <input
                  id="sc-form-name"
                  type="text"
                  placeholder="e.g. Tomato"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="sc-input"
                  autoFocus
                />
              </div>
              {formError && <p className="sc-form-error">{formError}</p>}
              <div className="sc-modal-actions">
                <button
                  type="button"
                  className="sc-btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sc-btn-primary"
                  id="btn-submit-subcategory"
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? modalMode === 'create' ? 'Creating…' : 'Saving…'
                    : modalMode === 'create' ? 'Create' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div className="sc-modal-backdrop" id="sc-modal-delete">
          <div className="sc-modal sc-modal--sm">
            <div className="sc-modal-header">
              <h2>Delete Sub Category</h2>
              <button
                type="button"
                className="sc-modal-close"
                onClick={() => setDeleteTarget(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="sc-modal-body">
              <p className="sc-delete-msg">
                Are you sure you want to delete{' '}
                <strong>"{deleteTarget.SubCategoryName}"</strong>? This action
                cannot be undone.
              </p>
              <div className="sc-modal-actions">
                <button
                  type="button"
                  className="sc-btn-secondary"
                  onClick={() => setDeleteTarget(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="sc-btn-danger"
                  id="btn-confirm-delete"
                  onClick={handleDelete}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubCategory;
