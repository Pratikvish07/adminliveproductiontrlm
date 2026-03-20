import React from 'react';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import { crpService } from '../../services/crpService';
import CRPTable from './CRPTable';
import { toCRPRecords } from './crpUtils';
import { filterByDistrictAndBlock, getUserRoleId, ROLE_IDS } from '../../utils/roleAccess';
import { useResolvedScope } from '../../utils/useResolvedScope';
import './CRPList.css';

const CRPList: React.FC = () => {
  const { user } = useAuth();
  const { scopedUser } = useResolvedScope(user);
  const roleId = getUserRoleId(scopedUser);
  const scopeKey = React.useMemo(
    () => [
      scopedUser?.roleId ?? scopedUser?.role ?? '',
      scopedUser?.districtId ?? '',
      scopedUser?.districtName ?? '',
      scopedUser?.blockId ?? '',
      scopedUser?.blockName ?? '',
    ].join('|'),
    [scopedUser],
  );
  const [records, setRecords] = React.useState<any[]>([]);
  const [totalCRPCount, setTotalCRPCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const loadCRPData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response =
        roleId === ROLE_IDS.DISTRICT_STAFF && scopedUser?.districtId
          ? await crpService.getCRPByDistrict(String(scopedUser.districtId))
          : roleId === ROLE_IDS.BLOCK_STAFF && scopedUser?.blockId
            ? await crpService.getCRPByBlock(String(scopedUser.blockId))
            : await crpService.getCRPList();
      const scopedRecords = filterByDistrictAndBlock(
        response,
        scopedUser,
        ['districtId', 'district', 'districtName', 'DistrictId', 'District', 'DistrictName'],
        ['blockId', 'block', 'blockName', 'BlockId', 'Block', 'BlockName'],
      );
      const processed = toCRPRecords(scopedRecords);
      setTotalCRPCount(Array.isArray(response) ? response.length : 0);
      setRecords(processed);
    } catch (err) {
      console.error('Failed to load CRP list', err);
      setError('Unable to load CRP list right now.');
      setRecords([]);
      setTotalCRPCount(0);
    } finally {
      setLoading(false);
    }
  }, [roleId, scopedUser]);

  React.useEffect(() => {
    void loadCRPData();
  }, [loadCRPData, scopeKey]);

  if (loading) return <Loader />;

  return (
    <div className="crp-page">
      <div className="page-header">
        <span className="page-kicker">CRP Management</span>
        <h1 className="page-title">CRP List</h1>
        <p className="page-subtitle">Monitor all CRP status, review field coverage, and keep records audit-ready.</p>
      </div>

      {error && <div className="gov-alert gov-alert-error">{error}</div>}

      <div className="crp-summary-grid">
        <div className="crp-overview-card crp-overview-card--primary">
          <span className="crp-overview-label">Community Resource Persons</span>
          <strong>{records.length}</strong>
          <p>Visible CRP records after role-based filtering.</p>
        </div>
        <div className="crp-overview-card">
          <span className="crp-overview-label">Total CRP API Count</span>
          <strong>{totalCRPCount}</strong>
          <p>Total records returned from the active CRP API before scope filtering.</p>
        </div>
      </div>

      <CRPTable
        title="CRP Records"
        description="All Community Resource Persons"
        records={records}
        error={error}
        emptyMessage="No CRP records found."
        canApprove={false}
        approvingId={''}
        rejectingId={''}
      />
    </div>
  );
};

export default CRPList;
