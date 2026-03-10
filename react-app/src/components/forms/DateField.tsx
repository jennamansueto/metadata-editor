import React from 'react';
import { TextField } from '@mui/material';
import type { TemplateItem } from '../../types';

interface DateFieldProps {
  value?: string;
  field: TemplateItem;
  onChange: (value: unknown) => void;
}

/**
 * Date field component - port of vue-field-date.js
 * Renders a text input for date values (flexible format: YYYY, YYYY-MM, YYYY-MM-DD)
 */
const DateField: React.FC<DateFieldProps> = ({ value, field, onChange }) => {
  return (
    <TextField
      size="small"
      fullWidth
      variant="outlined"
      placeholder="YYYY-MM-DD"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      helperText="Accepted formats: YYYY, YYYY-MM, or YYYY-MM-DD"
    />
  );
};

export default DateField;
