import React from 'react';
import { useParams } from 'react-router-dom';
import PlaceholderPage from './PlaceholderPage';

const VariablesPage: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  return (
    <PlaceholderPage
      title={`Variables: ${fileId || ''}`}
      description="Variable management will be available in a future migration phase."
    />
  );
};

export default VariablesPage;
