import React from 'react';
import { useParams } from 'react-router-dom';
import PlaceholderPage from './PlaceholderPage';

const ExternalResourceEditPage: React.FC = () => {
  const { resourceId } = useParams<{ resourceId: string }>();
  return (
    <PlaceholderPage
      title={`External Resource: ${resourceId || ''}`}
      description="External resource editing will be available in a future migration phase."
    />
  );
};

export default ExternalResourceEditPage;
