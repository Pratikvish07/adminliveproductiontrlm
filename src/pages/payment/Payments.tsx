import React from 'react';
import PageShell from '../../components/common/PageShell';

const Payments: React.FC = () => {
  return (
    <PageShell
      kicker="Finance"
      title="Payments"
      subtitle="Use this workspace to review payment status, reconciliation progress, and upcoming finance actions."
    >
      <div className="page-grid">
        <div className="page-stat">
          Payment Queue
          <strong>24</strong>
        </div>
        <div className="page-stat">
          Reconciliation
          <strong>91%</strong>
        </div>
      </div>

      <div className="page-card">
        <h2>Payments Workspace</h2>
        <p>
          This section is ready for the payments table and summary widgets. The layout now stays aligned with the
          sidebar and header instead of rendering as loose text on the page.
        </p>
      </div>
    </PageShell>
  );
};

export default Payments;

