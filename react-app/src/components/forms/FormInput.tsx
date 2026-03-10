import React from 'react';
import {
  TextField,
  Autocomplete,
  Select,
  MenuItem,
  FormControl,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useProjectStore } from '../../store/useProjectStore';
import { fieldDisplayType, normalizeClassID } from '../../utils/helpers';
import GridComponent from './GridComponent';
import SimpleArray from './SimpleArray';
import NestedArray from './NestedArray';
import DateField from './DateField';
import type { TemplateItem, EnumItem } from '../../types';

interface FormInputProps {
  value: unknown;
  field: TemplateItem;
  onChange: (value: unknown) => void;
}

/**
 * Individual form field rendering - port of vue-form-input-component.js (448 lines)
 * Handles all field types with appropriate MUI components
 */
const FormInput: React.FC<FormInputProps> = ({ value, field, onChange }) => {
  const userHasEditAccess = useProjectStore((s) => s.user_has_edit_access);
  const isReadOnly = !userHasEditAccess || field.is_readonly;
  const displayType = fieldDisplayType(field);

  // Helper to find enum item by code
  const findEnumByCode = (code: unknown): EnumItem | undefined => {
    if (!field.enum) return undefined;
    return field.enum.find((e) => e.code === code);
  };

  // Helper to extract code from "label [code]" format
  const getEnumCodeFromLabel = (label: unknown): string => {
    if (!label || typeof label !== 'string') return String(label || '');
    const match = label.match(/\[(.*?)\]/);
    if (match && match.length > 1) return match[1];
    return label;
  };

  // Render nested_array type
  if (field.type === 'nested_array') {
    return (
      <Box className="form-field form-field-table">
        <FieldLabel field={field} />
        <NestedArray
          value={value as Record<string, unknown>[] | undefined}
          columns={field.props || []}
          title={field.title}
          path={field.key}
          field={field}
          onChange={onChange}
        />
      </Box>
    );
  }

  // Render array type
  if (field.type === 'array') {
    return (
      <Box className="form-field form-field-table">
        <FieldLabel field={field} />
        <GridComponent
          value={value as Record<string, unknown>[] | undefined}
          columns={field.props || []}
          path={field.key}
          field={field}
          onChange={onChange}
        />
      </Box>
    );
  }

  // Render simple_array type
  if (field.type === 'simple_array') {
    if (displayType === 'dropdown' || displayType === 'dropdown-custom') {
      // Multiple select with enum
      const currentValues = Array.isArray(value) ? (value as string[]) : [];
      return (
        <Box>
          <FieldLabel field={field} />
          <Autocomplete
            multiple
            freeSolo
            size="small"
            options={field.enum || []}
            getOptionLabel={(option) => {
              if (typeof option === 'string') return option;
              return (option as EnumItem).label || '';
            }}
            value={currentValues}
            onChange={(_e, newValue) => {
              const result = newValue.map((v) => {
                if (typeof v === 'string') return v;
                const enumItem = v as EnumItem;
                return `${enumItem.label} [${enumItem.code}]`;
              });
              onChange(result);
            }}
            renderTags={(tagValue, getTagProps) =>
              tagValue.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={index}
                  label={typeof option === 'string' ? option : (option as EnumItem).label}
                  size="small"
                />
              ))
            }
            renderInput={(params) => <TextField {...params} variant="outlined" />}
            disabled={isReadOnly}
          />
        </Box>
      );
    }

    return (
      <Box>
        <FieldLabel field={field} />
        <SimpleArray
          value={value as string[] | undefined}
          path={field.key}
          field={field}
          onChange={onChange}
        />
      </Box>
    );
  }

  // Render text field
  if (displayType === 'text') {
    return (
      <Box className="form-field">
        <FieldLabel field={field} />
        <TextField
          id={`field-${normalizeClassID(field.key)}`}
          size="small"
          fullWidth
          variant="outlined"
          value={typeof value === 'string' || typeof value === 'number' ? value : (value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          disabled={isReadOnly}
        />
        <HelpText field={field} />
      </Box>
    );
  }

  // Render number field
  if (displayType === 'number') {
    return (
      <Box className="form-field">
        <FieldLabel field={field} />
        <TextField
          id={`field-${normalizeClassID(field.key)}`}
          size="small"
          fullWidth
          variant="outlined"
          type="number"
          value={value ?? ''}
          onChange={(e) => {
            const num = e.target.value === '' ? '' : Number(e.target.value);
            onChange(num);
          }}
          disabled={isReadOnly}
        />
        <HelpText field={field} />
      </Box>
    );
  }

  // Render textarea
  if (displayType === 'textarea') {
    return (
      <Box className="form-field-textarea">
        <FieldLabel field={field} />
        <TextField
          id={`field-${normalizeClassID(field.key)}`}
          size="small"
          fullWidth
          variant="outlined"
          multiline
          minRows={2}
          maxRows={8}
          value={typeof value === 'string' ? value : (value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          disabled={isReadOnly}
        />
        <HelpText field={field} />
      </Box>
    );
  }

  // Render dropdown-custom (combobox - allows custom values)
  if (displayType === 'dropdown-custom') {
    const currentValue = (() => {
      if (!value || typeof value !== 'string') return value;
      const code = getEnumCodeFromLabel(value);
      return findEnumByCode(code) || value;
    })();

    return (
      <Box className="form-field-dropdown-custom">
        <FieldLabel field={field} />
        <Autocomplete
          freeSolo
          size="small"
          options={field.enum || []}
          getOptionLabel={(option) => {
            if (typeof option === 'string') return option;
            return (option as EnumItem).label || '';
          }}
          value={currentValue ?? null}
          onChange={(_e, newValue) => {
            if (!newValue) {
              onChange('');
              return;
            }
            if (typeof newValue === 'string') {
              onChange(newValue);
              return;
            }
            const enumItem = newValue as EnumItem;
            const storeCol = field.enum_store_column || 'both';
            if (storeCol === 'code') {
              onChange(enumItem.code);
            } else if (storeCol === 'label') {
              onChange(enumItem.label);
            } else {
              onChange(`${enumItem.label} [${enumItem.code}]`);
            }
          }}
          onInputChange={(_e, inputValue, reason) => {
            if (reason === 'input') {
              onChange(inputValue);
            }
          }}
          renderInput={(params) => (
            <TextField {...params} variant="outlined" />
          )}
          disabled={isReadOnly}
        />
        <HelpText field={field} />
      </Box>
    );
  }

  // Render dropdown (select - only predefined values)
  if (displayType === 'dropdown') {
    const currentCode = (() => {
      if (!value || typeof value !== 'string') return value ?? '';
      return getEnumCodeFromLabel(value);
    })();

    return (
      <Box className="form-field-dropdown">
        <FieldLabel field={field} />
        <FormControl size="small" fullWidth>
          <Select
            value={currentCode}
            onChange={(e) => {
              const code = e.target.value as string;
              const enumItem = findEnumByCode(code);
              const storeCol = field.enum_store_column || 'both';
              if (enumItem) {
                if (storeCol === 'code') {
                  onChange(enumItem.code);
                } else if (storeCol === 'label') {
                  onChange(enumItem.label);
                } else {
                  onChange(`${enumItem.label} [${enumItem.code}]`);
                }
              } else {
                onChange(code);
              }
            }}
            displayEmpty
            variant="outlined"
            disabled={isReadOnly}
          >
            <MenuItem value="">
              <em>Select</em>
            </MenuItem>
            {(field.enum || []).map((opt) => (
              <MenuItem key={opt.code} value={opt.code}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <HelpText field={field} />
      </Box>
    );
  }

  // Render date field
  if (displayType === 'date') {
    return (
      <Box className="form-field-date">
        <FieldLabel field={field} />
        <DateField
          value={value as string}
          field={field}
          onChange={onChange}
        />
        <HelpText field={field} />
      </Box>
    );
  }

  // Fallback: render as text input
  return (
    <Box className="form-field">
      <FieldLabel field={field} />
      <TextField
        size="small"
        fullWidth
        variant="outlined"
        value={typeof value === 'string' || typeof value === 'number' ? value : (value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        disabled={isReadOnly}
      />
      <HelpText field={field} />
    </Box>
  );
};

/** Field label sub-component */
const FieldLabel: React.FC<{ field: TemplateItem }> = ({ field }) => (
  <Box
    component="label"
    htmlFor={`field-${normalizeClassID(field.key)}`}
    sx={{ display: 'block', mb: 0.5, fontWeight: 500, fontSize: '0.875rem' }}
  >
    {field.title}
    {field.help_text && (
      <HelpOutlineIcon sx={{ fontSize: 14, ml: 0.5, cursor: 'pointer', color: 'text.secondary' }} />
    )}
    {(field.required || field.is_required) && (
      <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box>
    )}
  </Box>
);

/** Help text sub-component */
const HelpText: React.FC<{ field: TemplateItem }> = ({ field }) => {
  if (!field.help_text) return null;
  return (
    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
      {field.help_text}
    </Typography>
  );
};

export default FormInput;
