import React from 'react';
import PageShell from '../../components/common/PageShell';
import './CRP.css';

const metricCards = [
  {
    title: 'Geo Location Changes',
    value: '18',
    description: 'Movement points updated according to SHG member assignments.',
    bars: [40, 68, 55, 78, 62, 84, 72],
  },
  {
    title: 'Total Visit Placed in the Last 30 Days',
    value: '30',
    description: 'Static tracking graph for recent field placement visits.',
    bars: [26, 44, 48, 36, 62, 74, 58],
  },
  {
    title: 'Honorarium Received',
    value: '12',
    description: 'Static payout trend card for the current monitoring cycle.',
    bars: [18, 34, 52, 46, 66, 60, 80],
  },
];

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

      <section className="crp-profile-layout">
        <article className="crp-profile-card">
          <div className="crp-profile-head">
            <img src="/assets/logo.jpg" alt="CRP profile" className="crp-profile-image" />
            <div>
              <span className="crp-profile-kicker">CRP Tracking</span>
              <h2>Field Mobility & SHG Assignment Monitor</h2>
              <p>Static visual tracking cards for geo movement, visits, and honorarium review.</p>
            </div>
          </div>
          <div className="crp-detail-grid">
            <div className="crp-detail-item"><span>District</span><strong>Dhalai</strong></div>
            <div className="crp-detail-item"><span>Block</span><strong>Ambassa</strong></div>
            <div className="crp-detail-item"><span>Gram Panchayat</span><strong>Jagannathpur VC</strong></div>
            <div className="crp-detail-item"><span>Village</span><strong>Surendra Para North Part</strong></div>
            <div className="crp-detail-item"><span>No. of SHG Assigned</span><strong>14</strong></div>
            <div className="crp-detail-item"><span>Live Geo Location</span><strong>23.8356, 91.2868</strong></div>
          </div>
        </article>
      </section>

      <section className="crp-chart-grid">
        {metricCards.map((card) => (
          <article className="crp-chart-card" key={card.title}>
            <span className="crp-chart-kicker">Graph</span>
            <h3>{card.title}</h3>
            <strong>{card.value}</strong>
            <div className="crp-mini-chart" aria-hidden="true">
              {card.bars.map((bar, index) => (
                <span key={`${card.title}-${index}`} style={{ height: `${bar}%` }} />
              ))}
            </div>
            <p>{card.description}</p>
          </article>
        ))}
      </section>
    </PageShell>
  );
};

export default CRPTracking;

