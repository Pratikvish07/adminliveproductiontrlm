import React from 'react';
import Loader from '../../components/common/Loader';
import PageShell from '../../components/common/PageShell';
import { useAuth } from '../../context/AuthContext';
import { getDistricts, masterService } from '../../services/masterService';
import type { Block as BlockItem, District } from '../../types/master.types';
import { getUserRoleId, ROLE_IDS } from '../../utils/roleAccess';

const Block: React.FC = () => {
  const { user } = useAuth();
  const roleId = getUserRoleId(user);
  const [districts, setDistricts] = React.useState<District[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = React.useState('');
  const [blocks, setBlocks] = React.useState<BlockItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [blockLoading, setBlockLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const isDistrictStaff = roleId === ROLE_IDS.DISTRICT_STAFF;

  React.useEffect(() => {
    let cancelled = false;

    const loadDistricts = async () => {
      try {
        setLoading(true);
        const response = await getDistricts();
        if (cancelled) {
          return;
        }

        const scopedDistricts = roleId === ROLE_IDS.STATE_ADMIN
          ? response
          : response.filter((district) => String(district.districtId) === String(user?.districtId));

        setDistricts(scopedDistricts);
        setSelectedDistrictId(
          roleId === ROLE_IDS.STATE_ADMIN
            ? ''
            : (user?.districtId ? String(user.districtId) : ''),
        );
      } catch (err) {
        console.error('Failed to load districts for blocks', err);
        if (!cancelled) {
          setError('Unable to load districts right now.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDistricts();

    return () => {
      cancelled = true;
    };
  }, [roleId, user?.districtId]);

  React.useEffect(() => {
    if (!selectedDistrictId) {
      setBlocks([]);
      return;
    }

    let cancelled = false;

    const loadBlocks = async () => {
      try {
        setBlockLoading(true);
        setError('');
        const response = await masterService.getBlocks(selectedDistrictId);
        if (!cancelled) {
          setBlocks(response);
        }
      } catch (err) {
        console.error('Failed to load blocks', err);
        if (!cancelled) {
          setError('Unable to load blocks for the selected district.');
          setBlocks([]);
        }
      } finally {
        if (!cancelled) {
          setBlockLoading(false);
        }
      }
    };

    void loadBlocks();

    return () => {
      cancelled = true;
    };
  }, [selectedDistrictId]);

  if (loading) {
    return <Loader />;
  }

  return (
    <PageShell
      kicker="Master Data"
      title="Blocks"
      subtitle="Monitor block coverage within the permitted district scope."
    >
      {error && <div className="master-alert">{error}</div>}

      <div className="master-filter-row">
        <select
          value={selectedDistrictId}
          onChange={(event) => setSelectedDistrictId(event.target.value)}
          disabled={isDistrictStaff}
        >
          <option value="">{isDistrictStaff ? 'Assigned District' : 'Select District'}</option>
          {districts.map((district) => (
            <option key={district.districtId} value={district.districtId}>
              {district.districtName}
            </option>
          ))}
        </select>
      </div>

      <div className="master-summary-card">
        <h3>Total Blocks</h3>
        <span>{blocks.length}</span>
      </div>

      <div className="master-table-shell">
        {blockLoading ? (
          <div className="master-empty">Loading blocks...</div>
        ) : blocks.length > 0 ? (
          <table className="master-table">
            <thead>
              <tr>
                <th>Block ID</th>
                <th>Block Name</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((block) => (
                <tr key={block.BlockId}>
                  <td>{block.BlockId}</td>
                  <td>{block.BlockName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="master-empty">
            {selectedDistrictId ? 'No block records found.' : 'Select a district to monitor blocks.'}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default Block;

