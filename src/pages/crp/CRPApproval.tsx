import React from 'react';
import Loader from '../../components/common/Loader';
import { crpService } from '../../services/crpService';
import { useAuth } from '../../context/AuthContext';
import { toCRPRecords } from './crpUtils';
import CRPTable from './CRPTable';
import './CRP.css';

const CRPApproval: React.FC = () => {
  const { user } = useAuth();
  const isRole3 = user?.role === '3';
  
  const [records, setRecords] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [approvingId, setApprovingId] = React.useState('');
  const [rejectingId, setRejectingId] = React.useState('');
  const [statusMessage, setStatusMessage] = React.useState('');

  const loadCRPData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await crpService.getCRPList(); // Fallback to all + filter pending
      const processed = toCRPRecords(response).filter(r => {
        const status = String(r.status || '').toLowerCase();
        return status === 'pending' || status.includes('pending');
      });
      setRecords(processed);
    } catch (err) {
      console.error('Failed to load CRP records', err);
      setError('Unable to load CRP approval records right now. Using empty list.');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCRPData();
  }, [loadCRPData]);

  const handleApprove = async (crpId: string) => {
    try {
      setApprovingId(crpId);
      setStatusMessage('');
      const approvedBy = user?.id || '001';
      await crpService.approveCRP(crpId, approvedBy);
      await loadCRPData();
      setStatusMessage('CRP approved successfully.');
    } catch (err) {
      console.error('Failed to approve CRP', err);
      setError('Unable to approve this CRP record right now.');
    } finally {
      setApprovingId('');
    }
  };

  const handleReject = async (crpId: string) => {
    try {
      setRejectingId(crpId);
      setStatusMessage('');
      await crpService.rejectCRP(crpId);
      await loadCRPData();
      setStatusMessage('CRP rejected successfully.');
    } catch (err) {
      console.error('Failed to reject CRP', err);
      setError('Unable to reject this CRP record right now.');
    } finally {
      setRejectingId('');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="crp-page">
      <div className="page-header">
        <span className="page-kicker">CRP Management</span>
        <h1 className="page-title">CRP Approval</h1>
        <p className="page-subtitle">
          {isRole3 
            ? 'Review and approve/reject CRP requests (client-filtered pending)' 
            : 'Monitor CRP approval status (view only)'
          }
        </p>
      </div>

      <div className="staff-layout">
        <section className="staff-panel">
          <div className="staff-panel-head">
            <div>
              <h2>Pending Summary</h2>
              <p>Live data loaded from CRP list (filtered pending).</p>
            </div>
          </div>
          <div className="staff-summary-grid">
            <div className="staff-summary-card">
              <h3>Total Pending CRP</h3>
              <span>{records.length}</span>
            </div>
          </div>
        </section>
      </div>

      {statusMessage && <div className="gov-alert gov-alert-success">{statusMessage}</div>}
      {error && <div className="gov-alert gov-alert-error">{error}</div>}

      <CRPTable
        title="Pending CRP Requests"
        description="Community Resource Persons pending approval"
        records={records}
        error={error}
        emptyMessage="No pending CRP records found."
        canApprove={isRole3}
        onApprove={isRole3 ? handleApprove : undefined}
        onReject={isRole3 ? handleReject : undefined}
        approvingId={approvingId}
        rejectingId={rejectingId}
      />
    </div>
  );
};

export default CRPApproval;
