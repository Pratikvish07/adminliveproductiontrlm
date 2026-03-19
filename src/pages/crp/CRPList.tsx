import React from 'react';
import Loader from '../../components/common/Loader';
import { crpService } from '../../services/crpService';
import CRPTable from './CRPTable';
import { toCRPRecords } from './crpUtils';
import { useAuth } from '../../context/AuthContext';
import './CRPList.css';

const CRPList: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const loadCRPData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await crpService.getCRPList();
      setRecords(toCRPRecords(response));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadCRPData().catch((err) => {
      console.error('Failed to load CRP list', err);
      setError('Unable to load CRP list right now.');
    });
  }, [loadCRPData]);

  if (loading) return <Loader />;

  return (
    <div className="crp-page">
      <div className="page-header">
        <span className="page-kicker">CRP Management</span>
        <h1 className="page-title">CRP List</h1>
        <p className="page-subtitle">Monitor all CRP status</p>
      </div>

      {error && <div className="gov-alert gov-alert-error">{error}</div>}

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
