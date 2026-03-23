import React from 'react';
import type { CRPRecordProcessed } from './crpUtils-clean';
import { formatCRPValue, getCRPid } from './crpUtils-clean';
import './CRP.css';

type CRPTableProps = {
  title: string;
  description: string;
  records: CRPRecordProcessed[];
  error?: string;
  emptyMessage: string;
  canApprove: boolean;
  onApprove?: (crpId: string) => Promise<void>;
  onReject?: (crpId: string) => Promise<void>;
  approvingId?: string;
  rejectingId?: string;
};

const CRPTable: React.FC<CRPTableProps> = ({
  title,
  description,
  records,
  error,
  emptyMessage,
  canApprove,
  onApprove,
  onReject,
  approvingId,
  rejectingId,
}) => {
  const columns = React.useMemo(() => {
    const first = records[0];
    return first ? Object.keys(first) : [];
  }, [records]);

  return (
    <section className="gov-card">
      <div className="gov-card-header">
        <div>
          <h2 className="gov-card-title">{title}</h2>
          <p className="gov-card-subtitle">{description}</p>
        </div>
        <span className="gov-badge">{records.length}</span>
      </div>

      {error && <div className="gov-alert gov-alert-error">{error}</div>}

      <div className="table-container">
        {records.length === 0 || columns.length === 0 ? (
          <div className="table-empty">
            <div className="empty-icon">📋</div>
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <table className="gov-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column.replace(/([A-Z])/g, ' $1').trim()}</th>
                ))}
                {(canApprove || onReject) && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => {
                const crpId = getCRPid(record);
                return (
                  <tr key={crpId ?? index}>
                    {columns.map((column) => (
                      <td key={`${crpId ?? index}-${column}`}>
                        {formatCRPValue(record[column])}
                      </td>
                    ))}
                    {(canApprove || onReject) && (
                      <td>
                        <div className="table-actions">
                          {onApprove && (
                            <button
                              className="gov-btn gov-btn-primary"
                              disabled={!crpId || approvingId === crpId || rejectingId === crpId}
                              onClick={() => crpId && onApprove(crpId)}
                            >
                              {approvingId === crpId ? 'Approving...' : 'Approve'}
                            </button>
                          )}
                          {onReject && (
                            <button
                              className="gov-btn gov-btn-danger"
                              disabled={!crpId || rejectingId === crpId || approvingId === crpId}
                              onClick={() => crpId && onReject(crpId)}
                            >
                              {rejectingId === crpId ? 'Rejecting...' : 'Reject'}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};

export default CRPTable;

