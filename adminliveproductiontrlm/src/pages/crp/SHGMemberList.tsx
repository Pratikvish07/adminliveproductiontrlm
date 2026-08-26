import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import { crpService, type SHGMemberRecord } from '../../services/crpService';
import './CRPList.css';

const PREFERRED_MEMBER_COLUMNS = [
  'name',
  'memberName',
  'shgName',
  'mobile',
  'mobileNo',
  'phone',
  'village',
  'villageName',
  'status',
];

const toTitleCase = (value: string): string =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};

const getCaseInsensitiveValue = (record: SHGMemberRecord, key: string): unknown => {
  const normalizedKey = key.toLowerCase();
  const match = Object.keys(record).find((candidate) => candidate.toLowerCase() === normalizedKey);
  return match ? record[match] : undefined;
};

const buildColumns = (records: SHGMemberRecord[]): string[] => {
  const keys = Array.from(
    new Set(
      records.flatMap((record) => Object.keys(record)),
    ),
  );

  const prioritized = PREFERRED_MEMBER_COLUMNS.filter((column) =>
    keys.some((key) => key.toLowerCase() === column.toLowerCase()),
  );

  const remaining = keys.filter(
    (key) => !prioritized.some((column) => column.toLowerCase() === key.toLowerCase()),
  );

  return [...prioritized, ...remaining];
};

const getPrimaryMemberText = (record: SHGMemberRecord): string =>
  normalizeValue(
    getCaseInsensitiveValue(record, 'name')
    ?? getCaseInsensitiveValue(record, 'memberName')
    ?? getCaseInsensitiveValue(record, 'MemberName')
    ?? getCaseInsensitiveValue(record, 'shgMemberName'),
  );

const getSecondaryMemberText = (record: SHGMemberRecord): string =>
  normalizeValue(
    getCaseInsensitiveValue(record, 'shgName')
    ?? getCaseInsensitiveValue(record, 'groupName')
    ?? getCaseInsensitiveValue(record, 'villageName')
    ?? getCaseInsensitiveValue(record, 'village'),
  );

const SHGMemberList: React.FC = () => {
  const navigate = useNavigate();
  const { crpId = '' } = useParams<{ crpId: string }>();
  const [searchParams] = useSearchParams();
  const villageId = searchParams.get('villageId')?.trim() ?? '';

  const [members, setMembers] = React.useState<SHGMemberRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

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

  const columns = React.useMemo(() => buildColumns(members), [members]);
  const totalMembers = members.length;

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
            Reviewing member records linked to village {villageId || '-'} using the authenticated SHG upload API.
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
              <h2>Return to CRP list</h2>
              <p>Use the back button below to jump to the CRP overview.</p>
            </div>
          </div>

          <button
            type="button"
            className="crp-link-button crp-link-button--back"
            onClick={() => navigate('/crp/list')}
          >
            Back to CRP list
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
            {members.slice(0, 4).map((member, index) => (
              <div className="crp-pair-list__item" key={`${getPrimaryMemberText(member)}-${index}`}>
                <span>{getPrimaryMemberText(member)}</span>
                <strong>{getSecondaryMemberText(member)}</strong>
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
              <p>The table adapts to whichever fields the API returns.</p>
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
                    {columns.map((column) => (
                      <th key={column}>{toTitleCase(column)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member, index) => (
                    <tr key={`${getPrimaryMemberText(member)}-${index}`}>
                      {columns.map((column) => (
                        <td key={`${index}-${column}`}>
                          {normalizeValue(getCaseInsensitiveValue(member, column))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </div>
  );
};

export default SHGMemberList;
