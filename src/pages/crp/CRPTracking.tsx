import React from 'react';
import PageShell from '../../components/common/PageShell';

const CRPTracking: React.FC = () => {
  return (
    <PageShell
      kicker="CRP Management"
      title="CRP Tracking"
      subtitle="Keep CRP status, field movement, and exception follow-up aligned in a single structured page."
    >
      <div className="page-chip-row">
        <span className="page-chip">Assigned</span>
        <span className="page-chip">In Review</span>
        <span className="page-chip">Completed</span>
      </div>

      <div className="page-card">
        <h2>Tracking Workspace</h2>
        <p>Timeline widgets, district filters, and progress tables can be added here cleanly.</p>
      </div>
    </PageShell>
  );
};

export default CRPTracking;

