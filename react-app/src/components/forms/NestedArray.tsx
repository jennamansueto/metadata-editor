import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  TextField,
  Paper,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useProjectStore } from '../../store/useProjectStore';
import type { TemplateItem } from '../../types';

interface NestedArrayProps {
  value?: Record<string, unknown>[];
  columns: TemplateItem[];
  title: string;
  path: string;
  field: TemplateItem;
  onChange: (value: unknown) => void;
}

/**
 * Nested array component - port of vue-nested-array-component.js
 * Handles complex nested repeating structures with both props (columns) and items (sub-sections)
 */
const NestedArray: React.FC<NestedArrayProps> = ({
  value,
  columns,
  title,
  path,
  field,
  onChange,
}) => {
  const userHasEditAccess = useProjectStore((s) => s.user_has_edit_access);
  const rows = Array.isArray(value) ? value : [];

  const addRow = () => {
    const newRow: Record<string, unknown> = {};
    columns.forEach((col) => {
      newRow[col.key] = '';
    });
    // Also init sub-items if they exist
    if (field.items) {
      field.items.forEach((item) => {
        newRow[item.key] = item.type === 'array' || item.type === 'nested_array' ? [] : '';
      });
    }
    onChange([...rows, newRow]);
  };

  const removeRow = (index: number) => {
    const newRows = [...rows];
    newRows.splice(index, 1);
    onChange(newRows);
  };

  const updateRowField = (rowIndex: number, fieldKey: string, fieldValue: unknown) => {
    const newRows = rows.map((row, i) => {
      if (i === rowIndex) {
        return { ...row, [fieldKey]: fieldValue };
      }
      return row;
    });
    onChange(newRows);
  };

  // Get display title for a row
  const getRowTitle = (row: Record<string, unknown>, index: number): string => {
    // Try to find a meaningful title from the first column value
    if (columns.length > 0) {
      const firstCol = columns[0];
      const val = row[firstCol.key];
      if (val && typeof val === 'string' && val.trim()) {
        return val;
      }
    }
    return `${title} #${index + 1}`;
  };

  return (
    <Paper variant="outlined" sx={{ p: 1 }}>
      {rows.map((row, rowIndex) => (
        <Accordion key={rowIndex} defaultExpanded={rows.length <= 3}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ '& .MuiAccordionSummary-content': { alignItems: 'center' } }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500, flexGrow: 1 }}>
              {getRowTitle(row, rowIndex)}
            </Typography>
            {userHasEditAccess && (
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  removeRow(rowIndex);
                }}
                sx={{ ml: 1 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </AccordionSummary>
          <AccordionDetails>
            {/* Render prop columns as form fields */}
            {columns.map((col) => (
              <Box key={col.key} sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 500, display: 'block', mb: 0.5 }}>
                  {col.title}
                  {(col.required || col.is_required) && (
                    <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box>
                  )}
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  variant="outlined"
                  multiline={col.type === 'textarea'}
                  minRows={col.type === 'textarea' ? 2 : undefined}
                  value={(row[col.key] as string) ?? ''}
                  onChange={(e) => updateRowField(rowIndex, col.key, e.target.value)}
                  disabled={!userHasEditAccess}
                />
              </Box>
            ))}

            {/* Render sub-items if they exist */}
            {field.items &&
              field.items.map((subItem) => (
                <Box key={subItem.key} sx={{ mt: 2, pl: 2, borderLeft: '2px solid', borderColor: 'primary.light' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {subItem.title}
                  </Typography>
                  {subItem.type === 'array' && subItem.props ? (
                    <Typography variant="caption" color="textSecondary">
                      Sub-array editing - available in future update
                    </Typography>
                  ) : (
                    <TextField
                      size="small"
                      fullWidth
                      variant="outlined"
                      value={(row[subItem.key] as string) ?? ''}
                      onChange={(e) => updateRowField(rowIndex, subItem.key, e.target.value)}
                      disabled={!userHasEditAccess}
                    />
                  )}
                </Box>
              ))}
          </AccordionDetails>
        </Accordion>
      ))}

      {userHasEditAccess && (
        <Box sx={{ mt: 1 }}>
          <Button size="small" startIcon={<AddIcon />} onClick={addRow}>
            Add {title}
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default NestedArray;
