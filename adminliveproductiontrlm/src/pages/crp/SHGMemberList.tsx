import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import { crpService, type SHGMemberRecord } from '../../services/crpService';
import './CRPList.css';
import '../reports/Reports.css';

const PAGE_SIZE = 10;

const SHGMemberList: React.FC = () => {
  const navigate = useNavigate();
  const { crpId = '' } = useParams<{ crpId: string }>();
  const [searchParams] = useSearchParams();
  const villageId = searchParams.get('villageId')?.trim() ?? '';

  const [members, setMembers] = React.useState<SHGMemberRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    let isMounted = true;

    const loadMembers = async () => {
      if (!villageId) {
        if (isMounted) {
          setError('Village ID is missing. Open this page from the CRP list to view SHG members.');
          setLoading(false);
        }
        return;
      }

      try {
        setError('');
        setLoading(true);
        const response = await crpService.getSHGMembersByVillage(villageId);
        if (isMounted) {
          setMembers(response);
        }
      } catch (err) {
        console.error('[SHGMemberList] Failed to load SHG members', err);
        if (isMounted) {
          setError('Unable to load SHG members for this village right now.');
          setMembers([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadMembers();

    return () => {
      isMounted = false;
    };
  }, [villageId]);

  const totalMembers = members.length;
  const totalPages = Math.max(1, Math.ceil(totalMembers / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedMembers = members.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  React.useEffect(() => {
    setPage(1);
  }, [members]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="crp-page">
      <section className="crp-hero shg-hero">
        <div className="crp-hero__copy">
          <p className="crp-kicker">SHG Member Directory</p>
          <h1 className="crp-title">Village SHG members for CRP {crpId || '-'}</h1>
          <p className="crp-subtitle">
            Members registered under village {villageId || '-'}, from the master SHG member API.
          </p>
          <div className="crp-hero__status">
            <span>CRP ID: {crpId || '-'}</span>
            <span>Village ID: {villageId || '-'}</span>
          </div>
        </div>

        <div className="crp-hero__metric">
          <span>Total Members</span>
          <strong>{totalMembers}</strong>
          <p>Live SHG member records returned for the selected village.</p>
        </div>
      </section>

      <section className="crp-grid">
        <article className="crp-panel">
          <div className="crp-panel__head">
            <div>
              <span className="crp-panel__eyebrow">Navigation</span>
              <h2>Return to Report</h2>
              <p>Use the back button below to jump to the CRP report.</p>
            </div>
          </div>

          <button
            type="button"
            className="crp-link-button crp-link-button--back"
            onClick={() => navigate('/master/shg-livelihood')}
          >
            Back to Report
          </button>
        </article>

        <article className="crp-panel">
          <div className="crp-panel__head">
            <div>
              <span className="crp-panel__eyebrow">Snapshot</span>
              <h2>Member preview</h2>
              <p>Quick scan of the first few records returned by the API.</p>
            </div>
          </div>

          <div className="crp-pair-list">
            {members.slice(0, 4).map((member) => (
              <div className="crp-pair-list__item" key={member.MemberId}>
                <span>{member.MemberName}</span>
                <strong>{member.SHGName}</strong>
              </div>
            ))}
            {members.length === 0 && <div className="crp-empty">No SHG members found for this village.</div>}
          </div>
        </article>

        <article className="crp-panel crp-panel--wide">
          <div className="crp-panel__head">
            <div>
              <span className="crp-panel__eyebrow">Members</span>
              <h2>SHG member records</h2>
              <p>Member, SHG code/name and mobile number for this village.</p>
            </div>
          </div>

          {error ? (
            <div className="crp-alert">{error}</div>
          ) : members.length === 0 ? (
            <div className="crp-empty">No SHG members found for village {villageId || '-'}.</div>
          ) : (
            <div className="table-container">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Member ID</th>
                    <th>Member Name</th>
                    <th>SHG Code</th>
                    <th>SHG Name</th>
                    <th>Mobile No</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedMembers.map((member) => (
                    <tr key={member.MemberId}>
                      <td>{member.MemberId}</td>
                      <td>{member.MemberName}</td>
                      <td>{member.SHGCode}</td>
                      <td>{member.SHGName}</td>
                      <td>{member.MobileNo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!error && totalMembers > 0 && (
            <div className="report-pagination">
              <span className="report-pagination__info">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalMembers)} of {totalMembers}
              </span>
              <div className="report-pagination__controls">
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  Prev
                </button>
                <span className="report-pagination__page">Page {currentPage} of {totalPages}</span>
                <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  Next
                </button>
              </div>
            </div>
          )}
        </article>
      </section>
    </div>
  );
};

export default SHGMemberList;
