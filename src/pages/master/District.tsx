import React, { useState, useEffect } from 'react';
import { masterService } from '../../services/masterService';
import Loader from '../../components/common/Loader';
import type { District } from '../../types/master.types';

const DistrictPage: React.FC = () => {
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const response = await masterService.getDistricts();
        setDistricts(response);
      } catch (error) {
        console.error('Error fetching districts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDistricts();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="page">
      <h1>Districts</h1>
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
    </div>
  );
};

export default DistrictPage;

