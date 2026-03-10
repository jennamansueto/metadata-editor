import React from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { get as _get } from 'lodash-es';
import { useProjectStore } from '../../store/useProjectStore';
import FormInput from './FormInput';
import GridComponent from './GridComponent';
import SimpleArray from './SimpleArray';
import NestedArray from './NestedArray';
import DateField from './DateField';
import { fieldDisplayType, normalizeClassID } from '../../utils/helpers';
import type { TemplateItem } from '../../types';

interface FormRendererProps {
  items: TemplateItem[];
  title?: string;
  path?: string;
  field?: TemplateItem;
  depth: number;
  cssClass?: string;
}

/**
 * Recursive form renderer - port of vue-form-component.js (v-form component)
 * Renders form fields based on template item types
 */
const FormRenderer: React.FC<FormRendererProps> = ({
  items,
  title,
  path,
  field,
  depth,
  cssClass,
}) => {
  const formData = useProjectStore((s) => s.formData);
  const setFormField = useProjectStore((s) => s.setFormField);

  const getFieldValue = (key: string) => _get(formData, key);
  const updateField = (key: string, value: unknown) => setFormField(key, value);

  return (
    <Box className={`v-form ${cssClass || ''}`}>
      {items.map((item) => {
        const displayType = fieldDisplayType(item);

        switch (displayType) {
          case 'section_container':
            return (
              <Box key={item.key} className="form-section-container" sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: 18, mb: 1 }}>
                  {item.title}
                </Typography>
                <FormRenderer
                  items={item.items || []}
                  title={item.title}
                  depth={depth + 1}
                  path={item.key}
                  field={item}
                  cssClass={`lvl-${depth}`}
                />
              </Box>
            );

          case 'section':
            return (
              <Box key={item.key} className="form-section" sx={{ mb: 2 }}>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{item.title}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <FormRenderer
                      items={item.items || []}
                      title={item.title}
                      depth={depth + 1}
                      path={item.key}
                      field={item}
                      cssClass={`lvl-${depth}`}
                    />
                  </AccordionDetails>
                </Accordion>
              </Box>
            );

          case 'textarea':
            return (
              <Box key={item.key} className="form-group form-field" sx={{ mb: 2 }}>
                <FieldLabel item={item} />
                <FormInput
                  value={getFieldValue(item.key)}
                  field={{ ...item, type: 'textarea', display_type: 'textarea' }}
                  onChange={(value) => updateField(item.key, value)}
                />
                <HelpText item={item} />
              </Box>
            );

          case 'date':
            return (
              <Box key={item.key} className="form-group form-field" sx={{ mb: 2 }}>
                <FieldLabel item={item} />
                <DateField
                  value={getFieldValue(item.key) as string}
                  field={item}
                  onChange={(value) => updateField(item.key, value)}
                />
                <HelpText item={item} />
              </Box>
            );

          case 'text':
            return (
              <Box key={item.key} className="form-group form-field" sx={{ mb: 2 }}>
                <FieldLabel item={item} />
                <FormInput
                  value={getFieldValue(item.key)}
                  field={item}
                  onChange={(value) => updateField(item.key, value)}
                />
                <HelpText item={item} />
              </Box>
            );

          case 'array':
            return (
              <Box key={item.key} className="form-group form-field form-field-table" sx={{ mb: 2 }}>
                <FieldLabel item={item} />
                <HelpText item={item} />
                <GridComponent
                  value={getFieldValue(item.key) as Record<string, unknown>[] | undefined}
                  columns={item.props || []}
                  path={item.key}
                  field={item}
                  onChange={(value) => updateField(item.key, value)}
                />
              </Box>
            );

          case 'simple_array':
            return (
              <Box key={item.key} className="form-group form-field form-field-table" sx={{ mb: 2 }}>
                <FieldLabel item={item} />
                <SimpleArray
                  value={getFieldValue(item.key) as string[] | undefined}
                  path={item.key}
                  field={item}
                  onChange={(value) => updateField(item.key, value)}
                />
                <HelpText item={item} />
              </Box>
            );

          case 'nested_array':
            return (
              <Box key={item.key} sx={{ mt: 1, mb: 2 }}>
                <FieldLabel item={item} />
                <NestedArray
                  value={getFieldValue(item.key) as Record<string, unknown>[] | undefined}
                  columns={item.props || []}
                  title={item.title}
                  path={item.key}
                  field={item}
                  onChange={(value) => updateField(item.key, value)}
                />
              </Box>
            );

          case 'dropdown':
          case 'dropdown-custom':
            return (
              <Box key={item.key} className="form-group form-field" sx={{ mb: 2 }}>
                <FieldLabel item={item} />
                <FormInput
                  value={getFieldValue(item.key)}
                  field={item}
                  onChange={(value) => updateField(item.key, value)}
                />
                <HelpText item={item} />
              </Box>
            );

          default:
            // For unknown types, render as text input
            if (!item.items) {
              return (
                <Box key={item.key} className="form-group form-field" sx={{ mb: 2 }}>
                  <FormInput
                    value={getFieldValue(item.key)}
                    field={item}
                    onChange={(value) => updateField(item.key, value)}
                  />
                </Box>
              );
            }
            return null;
        }
      })}
    </Box>
  );
};

/** Label for a form field */
const FieldLabel: React.FC<{ item: TemplateItem }> = ({ item }) => (
  <Box component="label" htmlFor={`field-${normalizeClassID(item.key)}`} sx={{ display: 'block', mb: 0.5, fontWeight: 500 }}>
    {item.title}
    {item.help_text && (
      <HelpOutlineIcon sx={{ fontSize: 14, ml: 0.5, cursor: 'pointer', color: 'text.secondary' }} />
    )}
    {(item.required || item.is_required) && (
      <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box>
    )}
  </Box>
);

/** Help text shown below a field */
const HelpText: React.FC<{ item: TemplateItem }> = ({ item }) => {
  if (!item.help_text) return null;
  return (
    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
      {item.help_text}
    </Typography>
  );
};

export default FormRenderer;
