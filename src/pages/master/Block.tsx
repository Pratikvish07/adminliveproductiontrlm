import React from 'react';
import Loader from '../../components/common/Loader';

const Block: React.FC = () => {
  return (
    <div className="page">
      <h1>Blocks</h1>
      <Loader />
      {/* TODO: Implement blocks list with district filter */}
      <div>Blocks page placeholder - implement table with masterService.getBlocks()</div>
    </div>
  );
};

export default Block;

