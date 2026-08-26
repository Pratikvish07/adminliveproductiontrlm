import React from 'react';
import type { StaffRecord } from './staffUtils';
import { formatStaffValue, getStaffId } from './staffUtils';

type StaffTableProps = {
  title: string;
  description: string;
  records: StaffRecord[];
  loading?: boolean;
  error?: string;
  emptyMessage: string;
  onApprove?: (staffId: string) => Promise<void>;
  onReject?: (staffId: string) => Promise<void>;
  approvingId?: string;
  rejectingId?: string;
};

const StaffTable: React.FC<StaffTableProps> = ({
  title,
  description,
  records,
  loading = false,
  error,
  emptyMessage,
  onApprove,
  onReject,
  approvingId,
  rejectingId,
}) => {
  const columns = React.useMemo(() => {
    const first = records[0];
    return first ? Object.keys(first) : [];
  }, [records]);

  const formatColumnName = React.useCallback((column: string) => {
    return column
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim();
  }, []);

  return (
    <section className="staff-panel">
      <div className="staff-panel-head">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className="staff-count">{records.length}</span>
      </div>

      {error && <div className="staff-alert">{error}</div>}

      <div className="staff-table-shell">
        {loading ? (
          <div className="staff-empty">Loading data...</div>
        ) : records.length === 0 || columns.length === 0 ? (
          <div className="staff-empty">{emptyMessage}</div>
        ) : (
          <table className="staff-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{formatColumnName(column)}</th>
                ))}
                {(onApprove || onReject) && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => {
                const staffId = getStaffId(record);
                return (
                  <tr key={staffId ?? index}>
                    {columns.map((column) => (
                      <td key={`${staffId ?? index}-${column}`}>{formatStaffValue(record[column])}</td>
                    ))}
                    {(onApprove || onReject) && (
                      <td>
                        <div className="staff-actions">
                          {onApprove && (
                            <button
                              type="button"
                              className="staff-approve-btn"
                              disabled={!staffId || approvingId === staffId || rejectingId === staffId}
                              onClick={() => {
                                if (staffId) {
                                  void onApprove(staffId);
                                }
                              }}
                            >
                              {approvingId === staffId ? 'Approving...' : 'Approve'}
                            </button>
                          )}
                          {onReject && (
                            <button
                              type="button"
                              className="staff-reject-btn"
                              disabled={!staffId || rejectingId === staffId || approvingId === staffId}
                              onClick={() => {
                                if (staffId) {
                                  void onReject(staffId);
                                }
                              }}
                            >
                              {rejectingId === staffId ? 'Rejecting...' : 'Reject'}
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

export default StaffTable;
