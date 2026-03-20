import React from 'react';
import PageShell from '../../components/common/PageShell';

const Reports: React.FC = () => {
  return (
    <PageShell
      kicker="Reports"
      title="Reports"
      subtitle="Role-based reports access is enabled from the sidebar. Connect report datasets here as needed."
    >
      <div className="page-card">
        <h2>Reports Workspace</h2>
        <p>Use this page for district, block, and CRP reporting workflows.</p>
      </div>
    </PageShell>
  );
};

export default Reports;
