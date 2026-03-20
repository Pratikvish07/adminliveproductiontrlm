import React from 'react';
import PageShell from '../../components/common/PageShell';

const LoanTracking: React.FC = () => {
  return (
    <PageShell
      kicker="Finance"
      title="Loan Tracking"
      subtitle="Track loan movement, district-level progress, and follow-up milestones from one aligned view."
    >
      <div className="page-grid">
        <div className="page-stat">
          Active Loans
          <strong>128</strong>
        </div>
        <div className="page-stat">
          Due This Week
          <strong>16</strong>
        </div>
      </div>

      <div className="page-card">
        <h2>Tracking Summary</h2>
        <p>The table and charts for loan status can be added here using the same shell structure.</p>
      </div>
    </PageShell>
  );
};

export default LoanTracking;

