import React from 'react';
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { get as _get } from 'lodash-es';
import FormInput from './FormInput';
import { useProjectStore } from '../../store/useProjectStore';
import type { TemplateItem } from '../../types';

interface FormSectionProps {
  columns: TemplateItem[];
  title: string;
  path: string;
  field: TemplateItem;
  onSectionUpdate: (key: string, value: unknown) => void;
}

/**
 * Form section component - port of vue-form-section-component.js
 * Renders a collapsible section with child form fields
 */
const FormSection: React.FC<FormSectionProps> = ({
  columns,
  title,
  path,
  field,
  onSectionUpdate,
}) => {
  const formData = useProjectStore((s) => s.formData);
  const localValue = (key: string) => _get(formData, key);

  return (
    <Box sx={{ mb: 2 }}>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            {title}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {columns.map((column) => (
            <Box key={column.key}>
              {column.type === 'section' ? (
                <FormSection
                  columns={column.items || []}
                  title={column.title}
                  path={column.key}
                  field={column}
                  onSectionUpdate={onSectionUpdate}
                />
              ) : (
                <FormInput
                  value={localValue(column.key)}
                  field={column}
                  onChange={(value) => onSectionUpdate(column.key, value)}
                />
              )}
            </Box>
          ))}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default FormSection;
