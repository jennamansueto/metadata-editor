import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
  Autocomplete,
  Chip,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAppContext } from '../../context/AppContext';
import { useTranslation } from '../../i18n/TranslationContext';
import { useAlert } from '../../hooks/useAlert';
import { extractErrorMessage } from '../../utils/api';

interface AttributeEntry {
  id: string;
  key: string;
  value: string;
}

interface ApiCoreFields {
  idno: string[];
  title: string[];
  country: string[];
  year_start: string[];
  year_end: string[];
  attributes: Record<string, string>;
}

interface CoreFieldsState {
  idno: string[];
  title: string[];
  country: string[];
  year_start: string[];
  year_end: string[];
  attributes: AttributeEntry[];
}

interface MetadataOptions {
  core_fields?: Partial<ApiCoreFields>;
  [key: string]: unknown;
}

interface SchemaDetail {
  uid?: string;
  title?: string;
  description?: string;
  metadata_options?: MetadataOptions;
}

function normalizeMetadataOptions(options: MetadataOptions | null | undefined): MetadataOptions {
  const defaults: MetadataOptions = {
    core_fields: {
      idno: [],
      title: [],
      country: [],
      year_start: [],
      year_end: [],
      attributes: {},
    },
  };

  if (!options || typeof options !== 'object') {
    return JSON.parse(JSON.stringify(defaults));
  }

  const normalized = { ...defaults, ...options };
  if (!normalized.core_fields || typeof normalized.core_fields !== 'object') {
    normalized.core_fields = { ...(defaults.core_fields as ApiCoreFields) };
  } else {
    normalized.core_fields = { ...(defaults.core_fields as ApiCoreFields), ...normalized.core_fields };
    const arrayFields = ['idno', 'title', 'country', 'year_start', 'year_end'] as const;
    arrayFields.forEach((field) => {
      const value = normalized.core_fields![field];
      if (Array.isArray(value)) {
        (normalized.core_fields as ApiCoreFields)[field] = value.filter(
          (v: string) => v && v !== ''
        );
      } else if (value && typeof value === 'string' && value !== '') {
        (normalized.core_fields as ApiCoreFields)[field] = [value];
      } else {
        (normalized.core_fields as ApiCoreFields)[field] = [];
      }
    });
  }

  return normalized;
}

export default function SchemaMappings() {
  const ci = useAppContext();
  const { t } = useTranslation();
  const showAlert = useAlert();
  const navigate = useNavigate();
  const params = useParams<{ uid: string }>();
  const schemaUid = params.uid || '';

  const baseApiUrl = ci.site_url.replace(/\/?$/, '/') + 'api/schemas';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const submittingRef = useRef(false);
  const [formErrorMessage, setFormErrorMessage] = useState('');
  const [currentSchema, setCurrentSchema] = useState<SchemaDetail | null>(null);
  const [metadataOptions, setMetadataOptions] = useState<MetadataOptions>({});
  const [schemaTitle, setSchemaTitle] = useState('');
  const [fieldOptions, setFieldOptions] = useState<string[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);

  const attrIdCounter = useRef(0);

  function nextAttrId(): string {
    attrIdCounter.current += 1;
    return 'attr-' + attrIdCounter.current;
  }

  function recordToEntries(record: Record<string, string>): AttributeEntry[] {
    return Object.entries(record).map(([key, value]) => ({
      id: nextAttrId(),
      key,
      value,
    }));
  }

  function entriesToRecord(entries: AttributeEntry[]): Record<string, string> {
    const result: Record<string, string> = {};
    entries.forEach((entry) => {
      if (entry.key && entry.key !== '') {
        result[entry.key] = entry.value;
      }
    });
    return result;
  }

  const [coreFields, setCoreFields] = useState<CoreFieldsState>({
    idno: [],
    title: [],
    country: [],
    year_start: [],
    year_end: [],
    attributes: [],
  });

  const fetchSchema = useCallback(async () => {
    if (!schemaUid) {
      navigate('/');
      return;
    }

    const response = await axios.get(
      baseApiUrl + '/detail/' + encodeURIComponent(schemaUid)
    );

    if (!response.data?.schema) {
      throw new Error('Schema not found');
    }

    const schema: SchemaDetail = response.data.schema;
    setCurrentSchema(schema);
    setSchemaTitle(schema.title || schema.uid || '');
    setMetadataOptions(schema.metadata_options || {});

    const normalized = normalizeMetadataOptions(schema.metadata_options || null);
    const cf = normalized.core_fields as ApiCoreFields;
    setCoreFields({
      idno: cf.idno || [],
      title: cf.title || [],
      country: cf.country || [],
      year_start: cf.year_start || [],
      year_end: cf.year_end || [],
      attributes: recordToEntries(cf.attributes || {}),
    });
  }, [schemaUid, baseApiUrl, navigate]);

  const fetchFields = useCallback(async () => {
    if (!schemaUid) {
      setFieldOptions([]);
      return;
    }

    setFieldsLoading(true);
    try {
      const response = await axios.get(
        baseApiUrl + '/fields/' + encodeURIComponent(schemaUid),
        { params: { format: 'default' } }
      );

      const fields = Array.isArray(response.data?.fields)
        ? response.data.fields
        : [];

      const primitiveTypes = ['string', 'number', 'integer', 'boolean', 'null'];

      const primitiveFields = fields.filter(
        (field: { path?: string; type?: string | string[] }) => {
          if (!field?.path) return false;
          const fieldType = field.type;
          if (!fieldType || fieldType === '') return false;

          if (typeof fieldType === 'string') {
            return primitiveTypes.includes(fieldType);
          }

          if (Array.isArray(fieldType)) {
            const hasObject = fieldType.includes('object');
            const hasArray = fieldType.includes('array');
            if (hasObject || hasArray) return false;
            return fieldType.some((ftype: string) => primitiveTypes.includes(ftype));
          }

          return false;
        }
      );

      const options = primitiveFields
        .map((field: { path?: string }) => field?.path || '')
        .filter(Boolean)
        .filter(
          (value: string, index: number, self: string[]) =>
            self.indexOf(value) === index
        )
        .sort() as string[];

      setFieldOptions(options);
    } catch (error) {
      const message = extractErrorMessage(
        error,
        t('schema_mappings_update_failed')
      );
      setFormErrorMessage(message);
    } finally {
      setFieldsLoading(false);
    }
  }, [schemaUid, baseApiUrl, t]);

  const initialize = useCallback(async () => {
    setLoading(true);
    setSaving(false);
    setFormErrorMessage('');
    setFieldOptions([]);
    setFieldsLoading(false);

    try {
      await fetchSchema();
      await fetchFields();
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to load schema');
      showAlert(message, { color: 'error' });
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [fetchSchema, fetchFields, showAlert, navigate]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  function updateCoreField(field: keyof Omit<CoreFieldsState, 'attributes'>, value: string[]) {
    setCoreFields((prev) => ({ ...prev, [field]: value }));
  }

  function addAttribute() {
    const existingKeys = new Set(coreFields.attributes.map((a) => a.key));
    let counter = coreFields.attributes.length + 1;
    let newKey = 'attribute_' + counter;
    while (existingKeys.has(newKey)) {
      counter++;
      newKey = 'attribute_' + counter;
    }
    const id = nextAttrId();
    setCoreFields((prev) => ({
      ...prev,
      attributes: [...prev.attributes, { id, key: newKey, value: '' }],
    }));
  }

  function removeAttribute(id: string) {
    setCoreFields((prev) => ({
      ...prev,
      attributes: prev.attributes.filter((a) => a.id !== id),
    }));
  }

  function updateAttributeKey(id: string, newKey: string) {
    setCoreFields((prev) => ({
      ...prev,
      attributes: prev.attributes.map((a) =>
        a.id === id ? { ...a, key: newKey } : a
      ),
    }));
  }

  function updateAttributeValue(id: string, value: string | string[] | null) {
    const fieldValue = Array.isArray(value)
      ? value.length > 0
        ? value[0]
        : ''
      : value || '';
    setCoreFields((prev) => ({
      ...prev,
      attributes: prev.attributes.map((a) =>
        a.id === id ? { ...a, value: fieldValue } : a
      ),
    }));
  }

  async function handleSubmit() {
    if (submittingRef.current || loading || saving) return;
    submittingRef.current = true;
    try {
      setFormErrorMessage('');
      setSaving(true);

      const existingTitle = currentSchema?.title || '';
      const existingDescription =
        typeof currentSchema?.description === 'string'
          ? currentSchema.description
          : '';

      if (!existingTitle) {
        setFormErrorMessage(t('schema_title_required'));
        setSaving(false);
        return;
      }

      const updatedMetadataOptions: MetadataOptions = JSON.parse(
        JSON.stringify(metadataOptions || {})
      );
      if (
        !updatedMetadataOptions.core_fields ||
        typeof updatedMetadataOptions.core_fields !== 'object'
      ) {
        updatedMetadataOptions.core_fields = {};
      }

      const normalizeField = (field: string[]): string[] => {
        return field.filter((v) => v && v !== '');
      };

      updatedMetadataOptions.core_fields.idno = normalizeField(coreFields.idno);
      updatedMetadataOptions.core_fields.title = normalizeField(coreFields.title);
      updatedMetadataOptions.core_fields.country = normalizeField(coreFields.country);
      updatedMetadataOptions.core_fields.year_start = normalizeField(coreFields.year_start);
      updatedMetadataOptions.core_fields.year_end = normalizeField(coreFields.year_end);

      // Validate required fields
      const idnoVal = updatedMetadataOptions.core_fields.idno;
      if (!idnoVal || (Array.isArray(idnoVal) && idnoVal.length === 0)) {
        setFormErrorMessage(t('idno_required'));
        setSaving(false);
        return;
      }

      const titleVal = updatedMetadataOptions.core_fields.title;
      if (!titleVal || (Array.isArray(titleVal) && titleVal.length === 0)) {
        setFormErrorMessage(t('title_required'));
        setSaving(false);
        return;
      }

      // Normalize attributes
      const attrsRecord = entriesToRecord(coreFields.attributes);
      const cleanAttrs: Record<string, string> = {};
      Object.entries(attrsRecord).forEach(([key, val]) => {
        if (key && key !== '' && val && typeof val === 'string' && val !== '') {
          cleanAttrs[key] = val;
        }
      });
      updatedMetadataOptions.core_fields.attributes =
        Object.keys(cleanAttrs).length > 0 ? cleanAttrs : {};

      const formData = new FormData();
      formData.append('title', existingTitle);
      formData.append('description', existingDescription);
      formData.append(
        'metadata_options',
        JSON.stringify(updatedMetadataOptions)
      );

      try {
        await axios.post(
          baseApiUrl + '/update/' + encodeURIComponent(schemaUid),
          formData
        );
        showAlert(t('schema_mappings_updated'), { color: 'success' });
        navigate(-1);
      } catch (error) {
        const message = extractErrorMessage(
          error,
          t('schema_mappings_update_failed')
        );
        setFormErrorMessage(message);
      } finally {
        setSaving(false);
      }
    } finally {
      submittingRef.current = false;
    }
  }

  const mappingFields: {
    label: string;
    key: keyof Omit<CoreFieldsState, 'attributes'>;
    required: boolean;
  }[] = [
    { label: 'IDNO', key: 'idno', required: true },
    { label: 'Title', key: 'title', required: true },
    { label: 'Country', key: 'country', required: false },
    { label: 'Year Start', key: 'year_start', required: false },
    { label: 'Year End', key: 'year_end', required: false },
  ];

  return (
    <Box sx={{ mt: 4 }}>
      <Card>
        <CardHeader
          title={
            <Typography variant="h6">
              {t('core_field_mappings')} - {schemaTitle}
            </Typography>
          }
          action={
            <Button
              size="small"
              color="primary"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
            >
              {t('back_to_schemas')}
            </Button>
          }
        />
        <Box sx={{ px: 2, pb: 1 }}>
          <Typography variant="subtitle1" color="text.secondary">
            {t('core_field_mappings_hint')}
          </Typography>
        </Box>

        <CardContent>
          {loading && <LinearProgress />}

          {!loading && (
            <>
              <Table size="small" sx={{ '& td': { py: 1.75 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 200 }}>
                      {t('core_field')}
                    </TableCell>
                    <TableCell>{t('mapped_field')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mappingFields.map(({ label, key, required }) => (
                    <TableRow key={key}>
                      <TableCell>
                        <Typography fontWeight={500}>
                          {label}{' '}
                          {required && (
                            <Typography
                              component="span"
                              color="error"
                            >
                              *
                            </Typography>
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Autocomplete
                          multiple
                          freeSolo
                          options={fieldOptions}
                          value={coreFields[key]}
                          onChange={(_, newValue) =>
                            updateCoreField(key, newValue as string[])
                          }
                          loading={fieldsLoading}
                          disabled={fieldsLoading && !fieldOptions.length}
                          renderTags={(value, getTagProps) =>
                            value.map((option, index) => {
                              const tagProps = getTagProps({ index });
                              return (
                                <Chip
                                  variant="outlined"
                                  label={option}
                                  size="small"
                                  {...tagProps}
                                  key={tagProps.key}
                                />
                              );
                            })
                          }
                          renderInput={(inputParams) => (
                            <TextField
                              {...inputParams}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Attributes */}
                  <TableRow>
                    <TableCell>
                      <Typography fontWeight={500}>Attributes</Typography>
                    </TableCell>
                    <TableCell>
                      {coreFields.attributes.length > 0 && (
                        <Table size="small" sx={{ mb: 1 }}>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ width: 200 }}>
                                {t('attribute_key')}
                              </TableCell>
                              <TableCell>{t('mapped_field')}</TableCell>
                              <TableCell align="right" sx={{ width: 60 }}>
                                {t('actions')}
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {coreFields.attributes.map((attr) => (
                                <TableRow key={attr.id}>
                                  <TableCell>
                                    <TextField
                                      value={attr.key}
                                      onChange={(e) =>
                                        updateAttributeKey(
                                          attr.id,
                                          e.target.value
                                        )
                                      }
                                      size="small"
                                      variant="outlined"
                                      fullWidth
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Autocomplete
                                      freeSolo
                                      options={fieldOptions}
                                      value={attr.value || ''}
                                      onChange={(_, newVal) =>
                                        updateAttributeValue(
                                          attr.id,
                                          newVal
                                        )
                                      }
                                      onInputChange={(_, newInputValue, reason) => {
                                        if (reason === 'input') {
                                          updateAttributeValue(attr.id, newInputValue);
                                        }
                                      }}
                                      loading={fieldsLoading}
                                      disabled={
                                        fieldsLoading &&
                                        !fieldOptions.length
                                      }
                                      renderInput={(inputParams) => (
                                        <TextField
                                          {...inputParams}
                                          size="small"
                                          variant="outlined"
                                        />
                                      )}
                                      size="small"
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() =>
                                        removeAttribute(attr.id)
                                      }
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={addAttribute}
                        sx={{ mt: 1 }}
                      >
                        {t('add_attribute')}
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {formErrorMessage && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {formErrorMessage}
                </Alert>
              )}
            </>
          )}
        </CardContent>

        <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
          <Button
            color="primary"
            onClick={() => navigate(-1)}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={saving}
            onClick={handleSubmit}
          >
            {saving ? t('saving') || 'Saving...' : t('save_mappings')}
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
}
