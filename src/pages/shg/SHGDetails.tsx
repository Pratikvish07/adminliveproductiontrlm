import React from 'react';

interface SHGDetailsProps {
  id?: string;
}

const SHGDetails: React.FC<SHGDetailsProps> = ({ id }) => {
  return (
    <div className="page">
      <h1>SHG Details {id}</h1>
      <div>SHG Details placeholder</div>
    </div>
  );
};

export default SHGDetails;

