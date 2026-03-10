import React from 'react';
import { useParams } from 'react-router-dom';
import PlaceholderPage from './PlaceholderPage';

const DatafileEditPage: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  return (
    <PlaceholderPage
      title={`Data File: ${fileId || ''}`}
      description="Data file editing will be available in a future migration phase."
    />
  );
};

export default DatafileEditPage;
