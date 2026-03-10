import React from 'react';
import { Box, Typography } from '@mui/material';
import { get as _get } from 'lodash-es';
import { useProjectStore } from '../../store/useProjectStore';
import FormRenderer from './FormRenderer';
import FormInput from './FormInput';
import FormSection from './FormSection';
import { fieldDisplayType } from '../../utils/helpers';
import type { TemplateItem } from '../../types';

/**
 * Main form component - port of vue-form-main-component.js
 * Reads the active template node from the store and renders the appropriate form
 */
const FormMain: React.FC = () => {
  const activeSection = useProjectStore((s) => s.treeActiveNode);
  const formData = useProjectStore((s) => s.formData);
  const setFormField = useProjectStore((s) => s.setFormField);

  if (!activeSection) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="textSecondary">
          Select a section from the navigation tree to edit metadata.
        </Typography>
      </Box>
    );
  }

  const displayType = fieldDisplayType(activeSection);
  const localValue = (key: string) => _get(formData, key);
  const update = (key: string, value: unknown) => {
    setFormField(key, value);
  };

  return (
    <Box className="metadata-form" sx={{ p: 3, pt: 4, mb: 2 }}>
      {/* Section container - renders children via FormRenderer */}
      {displayType === 'section_container' && (
        <Box className="form-section" sx={{ m: 2 }}>
          <FormRenderer
            items={activeSection.items || []}
            title={activeSection.title}
            path={activeSection.key}
            field={activeSection}
            depth={0}
          />
        </Box>
      )}

      {/* Section - renders children with section headers */}
      {displayType === 'section' && (
        <Box className="form-section">
          <Typography variant="h6" sx={{ mt: 2 }}>
            {activeSection.title}
          </Typography>
          {(activeSection.items || []).map((column: TemplateItem) => (
            <Box key={column.key}>
              {column.type === 'section' ? (
                <FormSection
                  columns={column.items || []}
                  title={column.title}
                  path={column.key}
                  field={column}
                  onSectionUpdate={(key: string, value: unknown) => update(key, value)}
                />
              ) : (
                <FormInput
                  value={localValue(column.key)}
                  field={column}
                  onChange={(value) => update(column.key, value)}
                />
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Direct field rendering for non-section types */}
      {displayType !== 'section_container' && displayType !== 'section' && (
        <Box sx={{ mt: 1, mb: 2 }}>
          <FormInput
            value={localValue(activeSection.key)}
            field={activeSection}
            onChange={(value) => update(activeSection.key, value)}
          />
        </Box>
      )}
    </Box>
  );
};

export default FormMain;
