import React from 'react';
import Loader from '../../components/common/Loader';
import { masterService } from '../../services/masterService';
import type { Block, District, GramPanchayat, Village as VillageItem } from '../../types/master.types';
import './MasterData.css';

const Village: React.FC = () => {
  const [districts, setDistricts] = React.useState<District[]>([]);
  const [blocks, setBlocks] = React.useState<Block[]>([]);
  const [gramPanchayats, setGramPanchayats] = React.useState<GramPanchayat[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = React.useState('');
  const [selectedBlockId, setSelectedBlockId] = React.useState('');
  const [selectedGpId, setSelectedGpId] = React.useState('');
  const [villages, setVillages] = React.useState<VillageItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [lookupLoading, setLookupLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const loadDistricts = async () => {
      try {
        setLoading(true);
        const response = await masterService.getDistricts();
        setDistricts(response);
      } catch (err) {
        console.error('Failed to load village lookups', err);
        setError('Unable to load village master data right now.');
      } finally {
        setLoading(false);
      }
    };

    loadDistricts();
  }, []);

  React.useEffect(() => {
    const loadBlocks = async () => {
      if (!selectedDistrictId) {
        setBlocks([]);
        setGramPanchayats([]);
        setSelectedBlockId('');
        setSelectedGpId('');
        setVillages([]);
        return;
      }

      try {
        setLookupLoading(true);
        const response = await masterService.getBlocks(selectedDistrictId);
        setBlocks(response);
        setGramPanchayats([]);
        setSelectedBlockId('');
        setSelectedGpId('');
        setVillages([]);
      } catch (err) {
        console.error('Failed to load blocks for villages', err);
        setError('Unable to load blocks for the selected district.');
      } finally {
        setLookupLoading(false);
      }
    };

    loadBlocks();
  }, [selectedDistrictId]);

  React.useEffect(() => {
    const loadGramPanchayats = async () => {
      if (!selectedBlockId) {
        setGramPanchayats([]);
        setSelectedGpId('');
        setVillages([]);
        return;
      }

      try {
        setLookupLoading(true);
        const response = await masterService.getGramPanchayats(selectedBlockId);
        setGramPanchayats(response);
        setSelectedGpId('');
        setVillages([]);
      } catch (err) {
        console.error('Failed to load gram panchayats for villages', err);
        setError('Unable to load gram panchayats for the selected block.');
      } finally {
        setLookupLoading(false);
      }
    };

    loadGramPanchayats();
  }, [selectedBlockId]);

  React.useEffect(() => {
    const loadVillages = async () => {
      if (!selectedGpId) {
        setVillages([]);
        return;
      }

      try {
        setLookupLoading(true);
        const response = await masterService.getVillages(selectedGpId);
        setVillages(response);
      } catch (err) {
        console.error('Failed to load villages', err);
        setError('Unable to load villages for the selected gram panchayat.');
      } finally {
        setLookupLoading(false);
      }
    };

    loadVillages();
  }, [selectedGpId]);

  if (loading) return <Loader />;

  return (
    <div className="master-page">
      <div className="master-header">
        <p className="master-kicker">Master Data</p>
        <h1 className="master-title">Villages</h1>
        <p className="master-subtitle">Select district, block, and gram panchayat to load villages from `api/master/village/{`{gpId}`}`.</p>
      </div>

      {error && <div className="master-alert">{error}</div>}

      <div className="master-filter-row master-filter-row-three">
        <div className="master-filter-group">
          <label htmlFor="village-district">District</label>
          <select
            id="village-district"
            value={selectedDistrictId}
            onChange={(e) => {
              setError('');
              setSelectedDistrictId(e.target.value);
            }}
          >
            <option value="">Select district</option>
            {districts.map((district) => (
              <option key={district.districtId} value={district.districtId}>
                {district.districtName}
              </option>
            ))}
          </select>
        </div>
        <div className="master-filter-group">
          <label htmlFor="village-block">Block</label>
          <select
            id="village-block"
            value={selectedBlockId}
            onChange={(e) => {
              setError('');
              setSelectedBlockId(e.target.value);
            }}
            disabled={!selectedDistrictId || lookupLoading}
          >
            <option value="">{selectedDistrictId ? 'Select block' : 'Select district first'}</option>
            {blocks.map((block) => (
              <option key={block.BlockId} value={block.BlockId}>
                {block.BlockName}
              </option>
            ))}
          </select>
        </div>
        <div className="master-filter-group">
          <label htmlFor="village-gp">Gram Panchayat</label>
          <select
            id="village-gp"
            value={selectedGpId}
            onChange={(e) => {
              setError('');
              setSelectedGpId(e.target.value);
            }}
            disabled={!selectedBlockId || lookupLoading}
          >
            <option value="">{selectedBlockId ? 'Select gram panchayat' : 'Select block first'}</option>
            {gramPanchayats.map((gp) => (
              <option key={gp.GPId} value={gp.GPId}>
                {gp.GPName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="master-summary-card">
        <h2>Total Villages</h2>
        <span>{villages.length}</span>
      </div>

      <div className="master-table-shell">
        {lookupLoading ? (
          <div className="master-empty">Loading villages...</div>
        ) : villages.length > 0 ? (
          <table className="master-table">
            <thead>
              <tr>
                <th>Village ID</th>
                <th>Village Name</th>
              </tr>
            </thead>
            <tbody>
              {villages.map((village) => (
                <tr key={village.VillageId}>
                  <td>{village.VillageId}</td>
                  <td>{village.VillageName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="master-empty">
            {selectedGpId ? 'No village records found.' : 'Select district, block, and gram panchayat to view villages.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default Village;

