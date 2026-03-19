import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="loader">
      <div className="spinner"></div>
      <span>Loading...</span>
    </div>
  );
};

export default Loader;

