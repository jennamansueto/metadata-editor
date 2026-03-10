import React from 'react';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  IconButton,
  Button,
  Box,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useProjectStore } from '../../store/useProjectStore';
import type { TemplateItem } from '../../types';

interface GridComponentProps {
  value?: Record<string, unknown>[];
  columns: TemplateItem[];
  path: string;
  field: TemplateItem;
  onChange: (value: unknown) => void;
}

/**
 * Grid/table component for array fields - port of vue-grid-component.js
 * Renders a tabular editor for array-type metadata fields
 */
const GridComponent: React.FC<GridComponentProps> = ({
  value,
  columns,
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
    onChange([...rows, newRow]);
  };

  const removeRow = (index: number) => {
    const newRows = [...rows];
    newRows.splice(index, 1);
    onChange(newRows);
  };

  const updateCell = (rowIndex: number, colKey: string, cellValue: string) => {
    const newRows = rows.map((row, i) => {
      if (i === rowIndex) {
        return { ...row, [colKey]: cellValue };
      }
      return row;
    });
    onChange(newRows);
  };

  return (
    <Paper variant="outlined" sx={{ overflow: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.key} sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                {col.title}
                {(col.required || col.is_required) && (
                  <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box>
                )}
              </TableCell>
            ))}
            {userHasEditAccess && <TableCell sx={{ width: 50 }}>Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((col) => (
                <TableCell key={col.key}>
                  <TextField
                    size="small"
                    variant="outlined"
                    fullWidth
                    value={(row[col.key] as string) ?? ''}
                    onChange={(e) => updateCell(rowIndex, col.key, e.target.value)}
                    disabled={!userHasEditAccess}
                    sx={{ '& .MuiInputBase-input': { py: 0.5 } }}
                  />
                </TableCell>
              ))}
              {userHasEditAccess && (
                <TableCell>
                  <IconButton size="small" color="error" onClick={() => removeRow(rowIndex)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length + 1} sx={{ textAlign: 'center', color: 'text.secondary' }}>
                No data. Click "Add Row" to add an entry.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {userHasEditAccess && (
        <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button size="small" startIcon={<AddIcon />} onClick={addRow}>
            Add Row
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default GridComponent;
