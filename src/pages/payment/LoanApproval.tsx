import React from 'react';
import PageShell from '../../components/common/PageShell';

const LoanApproval: React.FC = () => {
  return (
    <PageShell
      kicker="Finance"
      title="Loan Approval"
      subtitle="Review pending loan applications and keep approval decisions in one clean workspace."
    >
      <div className="page-card">
        <h2>Approval Board</h2>
        <p>
          Pending approvals, reviewer notes, and sanction actions can sit here without breaking the overall project
          alignment.
        </p>
      </div>
    </PageShell>
  );
};

export default LoanApproval;

