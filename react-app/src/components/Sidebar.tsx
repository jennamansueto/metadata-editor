import React, { useState } from 'react';
import { Box, TextField, Button, LinearProgress, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContrastIcon from '@mui/icons-material/Contrast';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import TreeNavigation from './TreeNavigation';
import type { TreeItem } from '../types';
import { useProjectStore } from '../store/useProjectStore';

interface SidebarProps {
  items: TreeItem[];
}

/**
 * Left sidebar - port of layout.php lines 11-121
 * Contains filter buttons, search field, and tree navigation
 */
const Sidebar: React.FC<SidebarProps> = ({ items }) => {
  const [treeSearch, setTreeSearch] = useState('');
  const [showRequired, setShowRequired] = useState(false);
  const [showRecommended, setShowRecommended] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const projectIsLoading = useProjectStore((s) => s.project_isloading);

  const toggleFields = (field: 'mandatory' | 'recommended' | 'empty') => {
    switch (field) {
      case 'mandatory':
        setShowRequired(!showRequired);
        break;
      case 'recommended':
        setShowRecommended(!showRecommended);
        break;
      case 'empty':
        setShowEmpty(!showEmpty);
        break;
    }
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        pt: 1,
        pb: 2,
      }}
    >
      {/* Filter buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1, px: 2 }}>
        <Box sx={{ textAlign: 'center', px: 1 }}>
          <Button
            variant={showRequired ? 'contained' : 'outlined'}
            size="small"
            onClick={() => toggleFields('mandatory')}
            title="Show mandatory fields"
            sx={{ minWidth: 'auto', p: 0.5 }}
          >
            <CheckCircleIcon fontSize="small" />
          </Button>
          <Box sx={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>Required</Box>
        </Box>

        <Box sx={{ textAlign: 'center', px: 1 }}>
          <Button
            variant={showRecommended ? 'contained' : 'outlined'}
            size="small"
            onClick={() => toggleFields('recommended')}
            title="Show recommended fields"
            sx={{ minWidth: 'auto', p: 0.5 }}
          >
            <ContrastIcon fontSize="small" />
          </Button>
          <Box sx={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>Recommended</Box>
        </Box>

        <Box sx={{ textAlign: 'center', px: 1 }}>
          <Button
            variant={showEmpty ? 'contained' : 'outlined'}
            size="small"
            onClick={() => toggleFields('empty')}
            title="Show empty fields"
            sx={{ minWidth: 'auto', p: 0.5 }}
          >
            <RadioButtonUncheckedIcon fontSize="small" />
          </Button>
          <Box sx={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>Empty</Box>
        </Box>
      </Box>

      {/* Search field */}
      <Box sx={{ px: 2, mb: 1 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search..."
          value={treeSearch}
          onChange={(e) => setTreeSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Loading indicator */}
      {projectIsLoading && (
        <Box sx={{ px: 3 }}>
          <LinearProgress color="primary" sx={{ height: 4 }} />
        </Box>
      )}

      {/* Tree navigation */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', ml: 1, pr: 2 }}>
        <TreeNavigation
          items={items}
          searchFilter={treeSearch}
          showRequired={showRequired}
          showRecommended={showRecommended}
          showEmpty={showEmpty}
        />
      </Box>
    </Box>
  );
};

export default Sidebar;
