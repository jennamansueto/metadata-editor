import React from 'react';
import { useParams } from 'react-router-dom';
import PlaceholderPage from './PlaceholderPage';

const VariableDataPage: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  return (
    <PlaceholderPage
      title={`Variable Data: ${fileId || ''}`}
      description="Variable data view will be available in a future migration phase."
    />
  );
};

export default VariableDataPage;
