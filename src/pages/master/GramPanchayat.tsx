import React from "react";
import Loader from "../../components/common/Loader";
import {
  getDistricts,
  getBlocks,
  getGramPanchayats,
} from "../../services/masterService";
import type {
  Block,
  District,
  GramPanchayat as GramPanchayatItem,
} from "../../types/master.types";
import "./MasterData.css";

const GramPanchayat: React.FC = () => {
  const [districts, setDistricts] = React.useState<District[]>([]);
  const [blocks, setBlocks] = React.useState<Block[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = React.useState("");
  const [selectedBlockId, setSelectedBlockId] = React.useState("");
  const [gramPanchayats, setGramPanchayats] = React.useState<GramPanchayatItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [blockLoading, setBlockLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // 🔹 Load districts
  React.useEffect(() => {
    getDistricts()
      .then((res) => setDistricts(res || []))
      .catch(() => setError("Failed to load districts ❌"))
      .finally(() => setLoading(false));
  }, []);

  // 🔹 Load blocks
  React.useEffect(() => {
    if (!selectedDistrictId) {
      setBlocks([]);
      setSelectedBlockId("");
      setGramPanchayats([]);
      return;
    }

    setError("");
    setBlockLoading(true);

    getBlocks(selectedDistrictId)
      .then((res) => setBlocks(res || []))
      .catch(() => setError("Failed to load blocks ❌"))
      .finally(() => setBlockLoading(false));
  }, [selectedDistrictId]);

  // 🔹 Load Gram Panchayats
  React.useEffect(() => {
    if (!selectedBlockId) {
      setGramPanchayats([]);
      return;
    }

    setError("");
    setBlockLoading(true);

    getGramPanchayats(selectedBlockId)
      .then((res: GramPanchayatItem[]) => setGramPanchayats(res || []))
      .catch(() => setError("Failed to load Gram Panchayats ❌"))
      .finally(() => setBlockLoading(false));
  }, [selectedBlockId]);

  // 🔹 Global loader
  if (loading) return <Loader />;

  return (
    <div className="master-page">
      <h1>Gram Panchayats</h1>

      {error && <div className="master-alert">{error}</div>}

      {/* 🔹 Filters */}
      <div className="master-filter-row">
        <select
          value={selectedDistrictId}
          onChange={(e) => setSelectedDistrictId(e.target.value)}
        >
          <option value="">Select District</option>
          {districts.map((d) => (
            <option key={d.districtId} value={d.districtId}>
              {d.districtName}
            </option>
          ))}
        </select>

        <select
          value={selectedBlockId}
          disabled={!selectedDistrictId || blockLoading}
          onChange={(e) => setSelectedBlockId(e.target.value)}
        >
          <option value="">
            {selectedDistrictId ? "Select Block" : "Select District First"}
          </option>
          {blocks.map((b) => (
            <option key={b.BlockId} value={b.BlockId}>
              {b.BlockName}
            </option>
          ))}
        </select>
      </div>

      {/* 🔹 Summary */}
      <div className="master-summary-card">
        <h3>Total Gram Panchayats</h3>
        <span>{gramPanchayats.length}</span>
      </div>

      {/* 🔹 Data Section */}
      <div className="master-table-shell">
        {blockLoading ? (
          <div className="master-empty">Loading...</div>
        ) : gramPanchayats.length > 0 ? (
          <table className="master-table">
            <thead>
              <tr>
                <th>GP ID</th>
                <th>GP Name</th>
              </tr>
            </thead>
            <tbody>
              {gramPanchayats.map((gp) => (
                <tr key={gp.GPId}>
                  <td>{gp.GPId}</td>
                  <td>{gp.GPName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="master-empty">
            {selectedBlockId
              ? "No Gram Panchayats found"
              : "Select district and block"}
          </div>
        )}
      </div>
    </div>
  );
};

export default GramPanchayat;