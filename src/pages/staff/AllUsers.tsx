import React from 'react';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import { staffService } from '../../services/staffService';
import StaffTable from './StaffTable';
import { toStaffRecords } from './staffUtils';
import { filterByDistrictAndBlock } from '../../utils/roleAccess';
import { useResolvedScope } from '../../utils/useResolvedScope';
import './Staff.css';

const AllUsers: React.FC = () => {
  const { user } = useAuth();
  const { scopedUser } = useResolvedScope(user);
  const hasLoadedRef = React.useRef(false);
  const [records, setRecords] = React.useState<ReturnType<typeof toStaffRecords>>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const loadUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await staffService.getAllUsers();
      setRecords(
        filterByDistrictAndBlock(
          toStaffRecords(response),
          scopedUser,
          ['districtId', 'district', 'districtName'],
          ['blockId', 'block', 'blockName'],
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [scopedUser]);

  React.useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }

    hasLoadedRef.current = true;

    void loadUsers().catch((err) => {
      console.error('Failed to load all users', {
        status: err?.response?.status,
        data: err?.response?.data,
      });
      setError('Unable to load users right now.');
    });
  }, [loadUsers]);

  if (loading) return <Loader />;

  return (
    <div className="staff-page">
      <div className="staff-header">
        <p className="staff-kicker">User Management</p>
        <h1>All Users</h1>
        <p className="staff-subtitle">Review all registered users from the admin users API.</p>
      </div>

      <div className="staff-layout">
        <section className="staff-summary-strip">
          <div className="staff-summary-tile">
            <span className="staff-summary-label">Registered Users</span>
            <strong>{records.length}</strong>
            <p>Total records returned from the admin users endpoint.</p>
          </div>
          <div className="staff-summary-tile">
            <span className="staff-summary-label">Portal Mode</span>
            <strong>Admin Review</strong>
            <p>Use this space to inspect role, district, and onboarding metadata.</p>
          </div>
          <div className="staff-summary-tile">
            <span className="staff-summary-label">Table Status</span>
            <strong>{error ? 'Attention' : 'Ready'}</strong>
            <p>{error ? 'Some records failed to load.' : 'Data table is aligned and ready for review.'}</p>
          </div>
        </section>

        <section className="staff-panel">
          <div className="staff-panel-head">
            <div>
              <h2>User Summary</h2>
              <p>Live data loaded from the all-users endpoint.</p>
            </div>
          </div>
          <div className="staff-summary-grid">
            <div className="staff-summary-card">
              <h3>Total Users</h3>
              <span>{records.length}</span>
            </div>
          </div>
        </section>

        <StaffTable
          title="All Users"
          description="Showing every user returned by the admin users API in a structured admin table."
          records={records}
          error={error}
          emptyMessage="No users found."
        />
      </div>
    </div>
  );
};

export default AllUsers;
