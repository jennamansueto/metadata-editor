import React from 'react';
import { Box, TextField, IconButton, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useProjectStore } from '../../store/useProjectStore';
import type { TemplateItem } from '../../types';

interface SimpleArrayProps {
  value?: string[];
  path: string;
  field: TemplateItem;
  onChange: (value: unknown) => void;
}

/**
 * Simple array component - port of vue-simple-array-component.js
 * For simple list/array fields (array of strings)
 */
const SimpleArray: React.FC<SimpleArrayProps> = ({
  value,
  path,
  field,
  onChange,
}) => {
  const userHasEditAccess = useProjectStore((s) => s.user_has_edit_access);
  const items = Array.isArray(value) ? value : [];

  const addItem = () => {
    onChange([...items, '']);
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    onChange(newItems);
  };

  const updateItem = (index: number, newValue: string) => {
    const newItems = [...items];
    newItems[index] = newValue;
    onChange(newItems);
  };

  return (
    <Box>
      {items.map((item, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <TextField
            size="small"
            fullWidth
            variant="outlined"
            value={item ?? ''}
            onChange={(e) => updateItem(index, e.target.value)}
            disabled={!userHasEditAccess}
          />
          {userHasEditAccess && (
            <IconButton size="small" color="error" onClick={() => removeItem(index)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      ))}
      {userHasEditAccess && (
        <Button size="small" startIcon={<AddIcon />} onClick={addItem}>
          Add Item
        </Button>
      )}
    </Box>
  );
};

export default SimpleArray;
