import React from 'react';
import Loader from '../../components/common/Loader';
import { crpService } from '../../services/crpService';
import { useAuth } from '../../context/AuthContext';
import { toCRPRecords } from './crpUtils';
import CRPTable from './CRPTable';
import { isLikelyScopeId } from '../../utils/helpers';
import { filterByDistrictAndBlock, getUserRoleId, ROLE_IDS } from '../../utils/roleAccess';
import { useResolvedScope } from '../../utils/useResolvedScope';
import './CRP.css';

type StatusFilter = 'pending' | 'approved' | 'rejected';

const resolveApproverId = (user: ReturnType<typeof useAuth>['user']): string | undefined => {
  const candidates = [user?.staffId, user?.id];

  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) {
      continue;
    }

    const normalized = String(candidate).trim();
    if (/^\d+$/.test(normalized)) {
      return normalized;
    }
  }

  return undefined;
};

const getBackendErrorMessage = (err: any): string => {
  return (
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    (typeof err?.response?.data === 'string' ? err.response.data : '') ||
    ''
  );
};

const CRPApproval: React.FC = () => {
  const { user } = useAuth();
  const { scopedUser } = useResolvedScope(user);
  const roleId = getUserRoleId(scopedUser ?? user);
  const isBlockRole = roleId === ROLE_IDS.BLOCK_STAFF;
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
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [approvingId, setApprovingId] = React.useState('');
  const [rejectingId, setRejectingId] = React.useState('');
  const [statusMessage, setStatusMessage] = React.useState('');
  const [activeStatus, setActiveStatus] = React.useState<StatusFilter>('pending');

  const loadCRPData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      let response: any[] = [];
      const resolvedDistrictId = isLikelyScopeId(scopedUser?.districtId)
        ? String(scopedUser?.districtId)
        : isLikelyScopeId(user?.districtId)
          ? String(user?.districtId)
          : '';

      if (roleId === ROLE_IDS.DISTRICT_STAFF) {
        if (!resolvedDistrictId) {
          setError('District scope is missing for this user.');
          setRecords([]);
          return;
        }
        response = await crpService.getCRPByDistrict(resolvedDistrictId);
      } else if (roleId === ROLE_IDS.BLOCK_STAFF) {
        response = await crpService.getCRPList();
      } else {
        response = await crpService.getCRPList();
      }

      const scopedRecords = roleId === ROLE_IDS.STATE_ADMIN
        ? filterByDistrictAndBlock(
            response,
            scopedUser,
            ['districtId', 'district', 'districtName', 'DistrictId', 'District', 'DistrictName'],
            ['blockId', 'block', 'blockName', 'BlockId', 'Block', 'BlockName'],
          )
        : response;
      const processed = toCRPRecords(scopedRecords);
      setRecords(processed);
    } catch (err: any) {
      console.error('Failed to load CRP records', err);
      if (err?.response?.status === 401) {
        setError('Your session is not authorized for this CRP approval data. Please sign in again.');
      } else {
        setError('Unable to load CRP approval records right now.');
      }
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [roleId, scopedUser, user?.blockId, user?.districtId]);

  React.useEffect(() => {
    void loadCRPData();
  }, [loadCRPData, scopeKey]);

  const handleApprove = async (crpId: string) => {
    try {
      setApprovingId(crpId);
      setStatusMessage('');
      const approvedBy = resolveApproverId(user);
      await crpService.approveCRP(crpId, approvedBy);
      await loadCRPData();
      setStatusMessage('CRP approved successfully.');
    } catch (err: any) {
      const backendMessage = getBackendErrorMessage(err);
      console.error('Failed to approve CRP', {
        crpId,
        approvedBy: resolveApproverId(user),
        status: err?.response?.status,
        data: err?.response?.data,
        url: err?.config?.url,
        params: err?.config?.params,
      });

      if (backendMessage.toLowerCase().includes('already approved')) {
        await loadCRPData();
        setStatusMessage('This CRP is already approved.');
        setError('');
        return;
      }

      setError(backendMessage || 'Unable to approve this CRP record right now.');
    } finally {
      setApprovingId('');
    }
  };

  const handleReject = async (crpId: string) => {
    try {
      setRejectingId(crpId);
      setStatusMessage('');
      const approvedBy = resolveApproverId(user);
      await crpService.rejectCRP(crpId, approvedBy);
      await loadCRPData();
      setStatusMessage('CRP rejected successfully.');
    } catch (err: any) {
      const backendMessage = getBackendErrorMessage(err);
      console.error('Failed to reject CRP', {
        crpId,
        approvedBy: resolveApproverId(user),
        status: err?.response?.status,
        data: err?.response?.data,
        url: err?.config?.url,
        params: err?.config?.params,
      });

      if (backendMessage.toLowerCase().includes('already rejected')) {
        await loadCRPData();
        setStatusMessage('This CRP is already rejected.');
        setError('');
        return;
      }

      setError(backendMessage || 'Unable to reject this CRP record right now.');
    } finally {
      setRejectingId('');
    }
  };

  const filteredRecords = React.useMemo(() => {
    const matchedRecords = records.filter((record) => {
      const status = String(record.status || '').toLowerCase();
      if (activeStatus === 'approved') {
        return status === 'approved';
      }
      if (activeStatus === 'rejected') {
        return status === 'rejected';
      }
      return status === 'pending' || status.includes('pending') || status === '';
    });

    if (activeStatus === 'pending' && matchedRecords.length === 0 && records.length > 0) {
      return records;
    }

    return matchedRecords;
  }, [activeStatus, records]);

  if (loading) return <Loader />;

  return (
    <div className="crp-page">
      <div className="page-header">
        <span className="page-kicker">CRP Management</span>
        <h1 className="page-title">CRP Approval</h1>
        <p className="page-subtitle">
          {isBlockRole
            ? 'Approve or reject CRP registrations for your assigned block.'
            : 'Review CRP registrations within your permitted scope.'}
        </p>
      </div>

      <div className="staff-layout">
        <section className="staff-panel">
          <div className="staff-panel-head">
            <div>
              <h2>CRP Summary</h2>
              <p>Role-based view of CRP registrations by status.</p>
            </div>
          </div>
          <div className="staff-summary-grid">
            <div className="staff-summary-card">
              <h3>Total Visible CRP</h3>
              <span>{records.length}</span>
            </div>
          </div>
        </section>
      </div>

      <div className="page-chip-row">
        <button type="button" className="gov-btn" onClick={() => setActiveStatus('pending')}>Pending</button>
        <button type="button" className="gov-btn" onClick={() => setActiveStatus('approved')}>Approved</button>
        <button type="button" className="gov-btn" onClick={() => setActiveStatus('rejected')}>Rejected</button>
      </div>

      {statusMessage && <div className="gov-alert gov-alert-success">{statusMessage}</div>}
      {error && <div className="gov-alert gov-alert-error">{error}</div>}

      <CRPTable
        title="CRP Requests"
        description={`Community Resource Persons with ${activeStatus} status`}
        records={filteredRecords}
        error={error}
        emptyMessage={`No ${activeStatus} CRP records found.`}
        canApprove={isBlockRole}
        onApprove={isBlockRole && activeStatus === 'pending' ? handleApprove : undefined}
        onReject={isBlockRole && activeStatus === 'pending' ? handleReject : undefined}
        approvingId={approvingId}
        rejectingId={rejectingId}
      />
    </div>
  );
};

export default CRPApproval;
