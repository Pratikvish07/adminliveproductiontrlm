import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import PageShell from '../../components/common/PageShell';

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
    <PageShell
      kicker="Master Data"
      title="Master Data Filter"
      subtitle="Jump into district and block master views from one structured search panel."
    >
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
    </PageShell>
  );
};

export default MasterFilter;

