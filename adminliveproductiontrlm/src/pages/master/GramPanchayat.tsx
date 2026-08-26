import React from "react";
import Loader from "../../components/common/Loader";
import { useAuth } from "../../context/AuthContext";
import {
  getDistricts,
  getBlocks,
  getGramPanchayats,
} from "../../services/masterService";
import type {
  District,
  GramPanchayat as GramPanchayatItem,
} from "../../types/master.types";
import { getUserRoleId, ROLE_IDS } from "../../utils/roleAccess";
import "./MasterData.css";

type BlockOption = {
  blockId: number | string;
  blockName: string;
};

const GramPanchayat: React.FC = () => {
  const { user } = useAuth();
  const roleId = getUserRoleId(user);
  const isDistrictStaff = roleId === ROLE_IDS.DISTRICT_STAFF;
  const isBlockStaff = roleId === ROLE_IDS.BLOCK_STAFF;
  const [districts, setDistricts] = React.useState<District[]>([]);
  const [blocks, setBlocks] = React.useState<BlockOption[]>([]);
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

  React.useEffect(() => {
    if (isDistrictStaff || isBlockStaff) {
      setSelectedDistrictId(user?.districtId ? String(user.districtId) : "");
    }

    if (isBlockStaff) {
      setSelectedBlockId(user?.blockId ? String(user.blockId) : "");
    }
  }, [isBlockStaff, isDistrictStaff, user?.blockId, user?.districtId]);

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
        {!isBlockStaff && (
          <select
            value={selectedDistrictId}
            onChange={(e) => setSelectedDistrictId(e.target.value)}
            disabled={isDistrictStaff}
          >
            <option value="">{isDistrictStaff ? "Assigned District" : "Select District"}</option>
            {districts
              .filter((district) => roleId === ROLE_IDS.STATE_ADMIN || String(district.districtId) === String(user?.districtId))
              .map((d) => (
              <option key={d.districtId} value={d.districtId}>
                {d.districtName}
              </option>
            ))}
          </select>
        )}

        <select
          value={selectedBlockId}
          disabled={!selectedDistrictId || blockLoading || isBlockStaff}
          onChange={(e) => setSelectedBlockId(e.target.value)}
        >
          <option value="">
            {isBlockStaff ? "Assigned Block" : selectedDistrictId ? "Select Block" : "Select District First"}
          </option>
          {blocks
            .filter((block) => !isBlockStaff || String(block.blockId) === String(user?.blockId))
            .map((b) => (
            <option key={b.blockId} value={b.blockId}>
              {b.blockName}
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
