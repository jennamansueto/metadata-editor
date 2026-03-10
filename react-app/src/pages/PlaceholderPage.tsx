import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

/**
 * Placeholder page for routes not yet fully implemented in Phase 1
 */
const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  description = 'This page is being migrated from Vue to React. Full functionality coming in a future phase.',
}) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 500 }}>
        <ConstructionIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1" color="textSecondary">
          {description}
        </Typography>
      </Paper>
    </Box>
  );
};

export default PlaceholderPage;
