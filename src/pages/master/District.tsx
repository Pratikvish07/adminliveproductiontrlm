import React, { useState, useEffect } from 'react';
import { masterService } from '../../services/masterService';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import type { District } from '../../types/master.types';
import PageShell from '../../components/common/PageShell';
import { getUserRoleId, ROLE_IDS } from '../../utils/roleAccess';

const DistrictPage: React.FC = () => {
  const { user } = useAuth();
  const roleId = getUserRoleId(user);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const response = await masterService.getDistricts();
        setDistricts(
          roleId === ROLE_IDS.STATE_ADMIN
            ? response
            : response.filter((district) => String(district.districtId) === String(user?.districtId)),
        );
      } catch (error) {
        console.error('Error fetching districts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDistricts();
  }, [roleId, user?.districtId]);

  if (loading) return <Loader />;

  return (
    <PageShell
      kicker="Master Data"
      title="Districts"
      subtitle="Review district master records and keep edit actions inside a consistent table surface."
    >
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {districts.map((district) => (
              <tr key={district.districtId}>
                <td>{district.districtId}</td>
                <td>{district.districtName}</td>
                <td>
                  <button>Edit</button>
                  <button>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
};

export default DistrictPage;

