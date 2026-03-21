import React from 'react';
import CRPTable from './CRPTable';
import './CRPList.css';

const staticRecords = [
  {
    id: '5',
    name: 'Ravi Mathur',
    district: 'Dhalai',
    block: 'Ambassa',
    status: 'Approved',
    crpRegistrationId: '5',
    crpId: 'CRP-0001',
    fullName: 'Ravi Mathur',
    aadhaarNo: '676866069696',
  },
  {
    id: '6',
    name: 'Anita Reang',
    district: 'Gomati',
    block: 'Amarpur',
    status: 'Pending',
    crpRegistrationId: '6',
    crpId: 'CRP-0002',
    fullName: 'Anita Reang',
    aadhaarNo: '547812349876',
  },
];

const CRPList: React.FC = () => {
  const featuredCRP = {
    image: '/assets/logo.jpg',
    name: 'Ravi Mathur',
    district: 'Dhalai',
    block: 'Ambassa',
    gramPanchayat: 'Jagannathpur VC',
    village: 'Surendra Para North Part',
    shgAssigned: '14',
    lokosId: 'CRP-0001',
    aadhaarNo: '676866069696',
    mobileNumber: '9109220580',
    latitude: '23.8356',
    longitude: '91.2868',
  };

  return (
    <div className="crp-page">
      <div className="page-header">
        <span className="page-kicker">CRP Management</span>
        <h1 className="page-title">CRP List</h1>
        <p className="page-subtitle">Static CRP management overview for profile monitoring and review.</p>
      </div>

      <div className="crp-summary-grid">
        <div className="crp-overview-card crp-overview-card--primary">
          <span className="crp-overview-label">Community Resource Persons</span>
          <strong>{staticRecords.length}</strong>
          <p>Static management records prepared for the current portal preview.</p>
        </div>
        <div className="crp-overview-card">
          <span className="crp-overview-label">Management Mode</span>
          <strong>Static</strong>
          <p>CRP Management is intentionally using fixed demo content for now.</p>
        </div>
      </div>

      <section className="crp-profile-layout">
        <article className="crp-profile-card">
          <div className="crp-profile-head">
            <img src={featuredCRP.image} alt={featuredCRP.name} className="crp-profile-image" />
            <div>
              <span className="crp-profile-kicker">CRP Management</span>
              <h2>{featuredCRP.name}</h2>
              <p>Profile card for management monitoring and document verification.</p>
            </div>
          </div>
          <div className="crp-detail-grid">
            <div className="crp-detail-item"><span>District</span><strong>{featuredCRP.district}</strong></div>
            <div className="crp-detail-item"><span>Block</span><strong>{featuredCRP.block}</strong></div>
            <div className="crp-detail-item"><span>Gram Panchayat</span><strong>{featuredCRP.gramPanchayat}</strong></div>
            <div className="crp-detail-item"><span>Village</span><strong>{featuredCRP.village}</strong></div>
            <div className="crp-detail-item"><span>No. of SHG Assigned</span><strong>{featuredCRP.shgAssigned}</strong></div>
            <div className="crp-detail-item"><span>LokOS ID</span><strong>{featuredCRP.lokosId}</strong></div>
            <div className="crp-detail-item"><span>Aadhaar Card</span><strong>{featuredCRP.aadhaarNo}</strong></div>
            <div className="crp-detail-item"><span>Mobile Number</span><strong>{featuredCRP.mobileNumber}</strong></div>
            <div className="crp-detail-item"><span>Latitude</span><strong>{featuredCRP.latitude}</strong></div>
            <div className="crp-detail-item"><span>Longitude</span><strong>{featuredCRP.longitude}</strong></div>
          </div>
        </article>
      </section>

      <CRPTable
        title="CRP Records"
        description="Static Community Resource Person records"
        records={staticRecords}
        emptyMessage="No CRP records found."
        canApprove={false}
        approvingId=""
        rejectingId=""
      />
    </div>
  );
};

export default CRPList;
