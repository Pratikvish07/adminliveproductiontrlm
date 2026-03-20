import React from 'react';
import PageShell from '../../components/common/PageShell';

const Settings: React.FC = () => {
  return (
    <PageShell
      kicker="Settings"
      title="Settings"
      subtitle="State-level settings are available only where the role access rules permit them."
    >
      <div className="page-card">
        <h2>System Settings</h2>
        <p>Use this page for administrative configuration and portal setup.</p>
      </div>
    </PageShell>
  );
};

export default Settings;
