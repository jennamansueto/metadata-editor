import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box } from '@mui/material';
import FormMain from '../components/forms/FormMain';
import { useProjectStore } from '../store/useProjectStore';

/**
 * Study page - port from index_vuetify_main_app.php line 274
 * Uses the element_id route param to set the active template section and render FormMain
 */
const StudyPage: React.FC = () => {
  const { elementId } = useParams<{ elementId: string }>();
  const setTreeActiveNodeByPath = useProjectStore((s) => s.setTreeActiveNodeByPath);

  useEffect(() => {
    if (elementId) {
      setTreeActiveNodeByPath(elementId);
    }
  }, [elementId, setTreeActiveNodeByPath]);

  return (
    <Box>
      <FormMain />
    </Box>
  );
};

export default StudyPage;
