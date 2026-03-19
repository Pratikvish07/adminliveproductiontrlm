import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const MasterFilter: React.FC = () => {
  const [filters, setFilters] = useState({
    district: '',
    block: '',
    village: '',
  });
  const navigate = useNavigate();

  const handleDistrictSearch = () => {
    navigate('/master/district');
  };

  const handleBlockSearch = () => {
    navigate('/master/block');
  };

  return (
    <div className="page">
      <h1>Master Data Filter</h1>
      <div className="filter-panel">
        <Input
          label="District Name"
          value={filters.district}
          onChange={(e) => setFilters({...filters, district: e.target.value})}
        />
        <Button onClick={handleDistrictSearch}>Search Districts</Button>
        
        <Input
          label="Block Name"
          value={filters.block}
          onChange={(e) => setFilters({...filters, block: e.target.value})}
        />
        <Button onClick={handleBlockSearch}>Search Blocks</Button>
      </div>
    </div>
  );
};

export default MasterFilter;

