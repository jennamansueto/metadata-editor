import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Button,
  TextField,
  Grid,
  Divider,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAppContext } from '../../context/AppContext';
import { useTranslation } from '../../i18n/TranslationContext';
import { useAlert } from '../../hooks/useAlert';
import { useConfirm } from '../../hooks/useConfirm';
import { extractErrorMessage } from '../../utils/api';

interface MetadataOptions {
  core_fields: {
    idno: string[];
    title: string[];
    country: string[];
    year_start: string[];
    year_end: string[];
    attributes: Record<string, string>;
  };
}

interface SchemaFormData {
  uid: string;
  title: string;
  description: string;
  metadata_options: MetadataOptions;
}

interface StagedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  lastModified: number;
}

interface FileManifestEntry {
  filename: string;
  size?: number;
  download_url?: string;
  is_main?: boolean;
}

interface FileRow {
  key: string;
  type: 'existing' | 'staged';
  name: string;
  size?: number | null;
  download_url?: string | null;
  manifest?: FileManifestEntry | null;
  staged?: StagedFile;
}

interface SchemaDetail {
  uid?: string;
  title?: string;
  description?: string;
  filename?: string;
  is_core?: boolean;
  metadata_options?: MetadataOptions;
}

function createDefaultForm(): SchemaFormData {
  return {
    uid: '',
    title: '',
    description: '',
    metadata_options: {
      core_fields: {
        idno: [],
        title: [],
        country: [],
        year_start: [],
        year_end: [],
        attributes: {},
      },
    },
  };
}

function normalizeMetadataOptions(options: Partial<MetadataOptions> | null | undefined): MetadataOptions {
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
    normalized.core_fields = { ...defaults.core_fields };
  } else {
    normalized.core_fields = { ...defaults.core_fields, ...normalized.core_fields };
    const arrayFields = ['idno', 'title', 'country', 'year_start', 'year_end'] as const;
    arrayFields.forEach((field) => {
      const value = normalized.core_fields[field];
      if (Array.isArray(value)) {
        normalized.core_fields[field] = value.filter((v: string) => v && v !== '');
      } else if (value && typeof value === 'string' && value !== '') {
        normalized.core_fields[field] = [value];
      } else {
        normalized.core_fields[field] = [];
      }
    });

    if (
      normalized.core_fields.attributes &&
      typeof normalized.core_fields.attributes === 'object' &&
      !Array.isArray(normalized.core_fields.attributes)
    ) {
      const attrs: Record<string, string> = {};
      Object.entries(normalized.core_fields.attributes).forEach(([key, val]) => {
        if (key && key !== '' && val && typeof val === 'string' && val !== '') {
          attrs[key] = val;
        }
      });
      normalized.core_fields.attributes = attrs;
    } else {
      normalized.core_fields.attributes = {};
    }
  }
  return normalized;
}

function formatFileSize(size: number | null | undefined): string {
  if (size === null || size === undefined) return '\u2014';
  if (size === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.floor(Math.log(size) / Math.log(1024));
  const value = size / Math.pow(1024, index);
  return `${value.toFixed(1)} ${units[index]}`;
}

interface SchemaFormProps {
  mode: 'create' | 'edit';
}

export default function SchemaForm({ mode }: SchemaFormProps) {
  const ci = useAppContext();
  const { t } = useTranslation();
  const showAlert = useAlert();
  const showConfirm = useConfirm();
  const navigate = useNavigate();
  const params = useParams<{ uid: string }>();
  const schemaUid = params.uid || '';

  const isCreate = mode !== 'edit';
  const baseApiUrl = ci.site_url.replace(/\/?$/, '/') + 'api/schemas';

  const [form, setForm] = useState<SchemaFormData>(createDefaultForm());
  const [uploading, setUploading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [currentSchema, setCurrentSchema] = useState<SchemaDetail | null>(null);
  const [mainFile, setMainFile] = useState<StagedFile | null>(null);
  const [associatedFiles, setAssociatedFiles] = useState<StagedFile[]>([]);
  const [fileManifest, setFileManifest] = useState<FileManifestEntry[]>([]);
  const [fileManifestLoading, setFileManifestLoading] = useState(false);
  const [deletingFiles, setDeletingFiles] = useState<Record<string, boolean>>({});
  const [pendingUploadLoading, setPendingUploadLoading] = useState(false);
  const [formErrorMessage, setFormErrorMessage] = useState('');
  const [uploadErrorMessage, setUploadErrorMessage] = useState('');
  const [uidError, setUidError] = useState('');
  const [titleError, setTitleError] = useState('');

  // Computed values
  const formTitle = isCreate ? t('create_schema') : t('edit_schema');

  const isSaveDisabled = useMemo(() => {
    if (initializing || uploading || pendingUploadLoading) return true;
    if (isCreate) return !mainFile;
    return false;
  }, [initializing, uploading, pendingUploadLoading, isCreate, mainFile]);

  const existingMainFile = useMemo((): FileRow | null => {
    if (!currentSchema?.filename) return null;
    const mainFilename = currentSchema.filename;
    let entry: FileManifestEntry | undefined;

    if (Array.isArray(fileManifest) && fileManifest.length) {
      entry = fileManifest.find((f) => f?.filename === mainFilename);
    }

    const uid = currentSchema.uid || schemaUid || form.uid;
    const downloadUrl =
      entry?.download_url ||
      (uid
        ? ci.site_url.replace(/\/?$/, '/') +
          'api/schemas/file/' +
          encodeURIComponent(uid) +
          '/' +
          encodeURIComponent(mainFilename)
        : null);

    return {
      key: 'existing-' + mainFilename,
      type: 'existing',
      name: mainFilename,
      size: entry?.size ?? null,
      download_url: downloadUrl,
      manifest: entry || null,
    };
  }, [currentSchema, fileManifest, schemaUid, form.uid, ci.site_url]);

  const mainFileRows = useMemo((): FileRow[] => {
    const rows: FileRow[] = [];
    if (existingMainFile) {
      rows.push(existingMainFile);
    }
    if (mainFile) {
      rows.push({
        key: 'staged-' + mainFile.id,
        type: 'staged',
        name: mainFile.name,
        size: mainFile.size,
      });
    }
    return rows;
  }, [existingMainFile, mainFile]);

  const existingAssociatedFiles = useMemo((): FileRow[] => {
    if (!Array.isArray(fileManifest) || !fileManifest.length) return [];
    return fileManifest
      .filter((f) => f && !f.is_main)
      .map((f) => ({
        key: 'existing-associated-' + f.filename,
        type: 'existing' as const,
        name: f.filename,
        size: f.size,
        download_url: f.download_url || null,
        manifest: f,
      }));
  }, [fileManifest]);

  const associatedFileRows = useMemo((): FileRow[] => {
    const rows: FileRow[] = [];
    existingAssociatedFiles.forEach((item) => rows.push(item));
    associatedFiles.forEach((file) => {
      rows.push({
        key: 'staged-associated-' + file.id,
        type: 'staged',
        name: file.name,
        size: file.size,
        staged: file,
      });
    });
    return rows;
  }, [existingAssociatedFiles, associatedFiles]);

  // Load schema for edit mode
  const loadFiles = useCallback(
    async (uid: string, schema: SchemaDetail | null) => {
      if (isCreate || !uid) {
        setFileManifest([]);
        return;
      }
      setFileManifestLoading(true);
      try {
        const response = await axios.get(
          baseApiUrl + '/files/' + encodeURIComponent(uid)
        );
        let manifest: FileManifestEntry[] =
          response.data?.files || [];
        const schemaFromFiles = response.data?.schema || null;
        let mergedSchema = schema;

        if (schemaFromFiles) {
          mergedSchema = { ...(schema || {}), ...schemaFromFiles };
          if (
            mergedSchema &&
            (!mergedSchema.filename || mergedSchema.filename === '') &&
            schema?.filename
          ) {
            mergedSchema.filename = schema.filename;
          }
          setCurrentSchema(mergedSchema);
        }

        if (mergedSchema?.filename) {
          manifest = manifest.map((file) => {
            if (file?.filename === mergedSchema!.filename) {
              return { ...file, is_main: true };
            }
            return file;
          });
        }

        setFileManifest(manifest);
      } catch (error) {
        const message = extractErrorMessage(
          error,
          t('failed_to_load_schema_files')
        );
        showAlert(message, { color: 'error' });
      } finally {
        setFileManifestLoading(false);
      }
    },
    [isCreate, baseApiUrl, t, showAlert]
  );

  const initializeForm = useCallback(() => {
    setFormErrorMessage('');
    setUploadErrorMessage('');
    setMainFile(null);
    setAssociatedFiles([]);
    setFileManifest([]);
    setFileManifestLoading(false);
    setDeletingFiles({});
    setPendingUploadLoading(false);
    setUidError('');
    setTitleError('');

    if (isCreate) {
      setForm(createDefaultForm());
      setInitializing(false);
      setCurrentSchema(null);
      return;
    }

    if (!schemaUid) {
      navigate('/');
      return;
    }

    setInitializing(true);

    axios
      .get(baseApiUrl + '/detail/' + encodeURIComponent(schemaUid))
      .then((response) => {
        if (!response.data?.schema) {
          throw new Error('Schema not found');
        }

        const schema: SchemaDetail = response.data.schema;

        if (schema.is_core) {
          showAlert(t('core_schema_edit_forbidden'), { color: 'error' });
          navigate('/');
          return;
        }

        setCurrentSchema(schema);
        setForm({
          uid: schema.uid || '',
          title: schema.title || '',
          description: schema.description || '',
          metadata_options: normalizeMetadataOptions(schema.metadata_options),
        });
        loadFiles(schemaUid, schema);
      })
      .catch((error) => {
        const message = extractErrorMessage(error, 'Failed to load schema');
        showAlert(message, { color: 'error' });
        navigate('/');
      })
      .finally(() => {
        setInitializing(false);
      });
  }, [isCreate, schemaUid, baseApiUrl, navigate, showAlert, t, loadFiles]);

  useEffect(() => {
    initializeForm();
  }, [initializeForm]);

  // Sanitize UID in create mode
  function handleUidChange(value: string) {
    if (!isCreate) return;
    const sanitized = value.trim().replace(/[^a-zA-Z0-9_-]/g, '');
    setForm((prev) => ({ ...prev, uid: sanitized }));
  }

  function handleMainFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setMainFile({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
    });
    event.target.value = '';
  }

  function handleAssociatedFilesSelection(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (!files.length) return;
    const additions: StagedFile[] = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
    }));
    setAssociatedFiles((prev) => [...prev, ...additions]);
    event.target.value = '';
  }

  function removeMainFile() {
    setMainFile(null);
  }

  function removeAssociatedFile(item: StagedFile) {
    setAssociatedFiles((prev) => prev.filter((f) => f.id !== item.id));
  }

  async function deleteSchemaFile(file: FileManifestEntry) {
    if (!file?.filename) return;
    const confirmed = await showConfirm(
      t('delete_schema_file_confirm', { filename: file.filename })
    );
    if (!confirmed) return;

    setDeletingFiles((prev) => ({ ...prev, [file.filename]: true }));
    try {
      const response = await axios.delete(
        baseApiUrl + '/files/' + encodeURIComponent(schemaUid),
        { params: { filename: file.filename } }
      );
      if (response.data?.schema) {
        setCurrentSchema(response.data.schema);
      }
      if (response.data?.files) {
        setFileManifest(response.data.files);
      }
      const message = response.data?.message || t('schema_file_deleted');
      showAlert(message, { color: 'success' });
    } catch (error) {
      const message = extractErrorMessage(
        error,
        t('schema_file_update_failed')
      );
      showAlert(message, { color: 'error' });
    } finally {
      setDeletingFiles((prev) => ({ ...prev, [file.filename]: false }));
    }
  }

  function validate(): boolean {
    let valid = true;
    setUidError('');
    setTitleError('');

    if (isCreate) {
      if (!form.uid) {
        setUidError(t('required'));
        valid = false;
      } else if (!/^[a-zA-Z0-9_-]{3,64}$/.test(form.uid)) {
        setUidError(t('invalid_uid'));
        valid = false;
      }
    }

    if (!form.title) {
      setTitleError(t('required'));
      valid = false;
    }

    return valid;
  }

  async function handleSubmit() {
    if (initializing) return;
    setFormErrorMessage('');

    if (!validate()) return;

    if (isCreate) {
      if (!mainFile) {
        const msg = t('main_schema_required');
        setFormErrorMessage(msg);
        showAlert(msg, { color: 'error' });
        return;
      }
      await createSchema();
    } else {
      await updateSchema();
    }
  }

  async function createSchema() {
    if (!mainFile) {
      const msg = t('main_schema_required');
      setFormErrorMessage(msg);
      showAlert(msg, { color: 'error' });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('uid', form.uid);
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append(
      'metadata_options',
      JSON.stringify(form.metadata_options || {})
    );
    formData.append('main_schema', mainFile.file);

    associatedFiles.forEach((item, index) => {
      formData.append(`schema_files[${index}]`, item.file);
    });

    try {
      await axios.post(baseApiUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMainFile(null);
      setAssociatedFiles([]);
      navigate('/');
      showAlert(t('schema_created'), { color: 'success' });
      setFormErrorMessage('');
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to create schema');
      setFormErrorMessage(message);
      showAlert(message, { color: 'error' });
    } finally {
      setUploading(false);
    }
  }

  async function updateSchema() {
    setUploading(true);
    const targetUid = schemaUid || form.uid;

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append(
        'metadata_options',
        JSON.stringify(form.metadata_options || {})
      );

      await axios.post(
        baseApiUrl + '/update/' + encodeURIComponent(targetUid),
        formData
      );

      const hasMain = !!mainFile;
      const hasAssociated = associatedFiles.length > 0;

      if (hasMain || hasAssociated) {
        if (hasMain) {
          const replaceForm = new FormData();
          replaceForm.append('mode', 'replace_main');
          replaceForm.append('main_schema', mainFile!.file);
          const response = await axios.post(
            baseApiUrl + '/files/' + encodeURIComponent(targetUid),
            replaceForm,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          );
          if (response.data?.schema) {
            setCurrentSchema((prev) => ({ ...prev, ...response.data.schema }));
          }
          if (response.data?.files) {
            setFileManifest(response.data.files);
          }
        }

        if (hasAssociated) {
          const relatedForm = new FormData();
          relatedForm.append('mode', 'add_related');
          associatedFiles.forEach((item, index) => {
            relatedForm.append(`schema_files[${index}]`, item.file);
          });
          const response = await axios.post(
            baseApiUrl + '/files/' + encodeURIComponent(targetUid),
            relatedForm,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          );
          if (response.data?.schema) {
            setCurrentSchema((prev) => ({ ...prev, ...response.data.schema }));
          }
          if (response.data?.files) {
            setFileManifest(response.data.files);
          }
        }

        setMainFile(null);
        setAssociatedFiles([]);
        await loadFiles(targetUid, currentSchema);
      }

      navigate('/');
      showAlert(t('schema_updated'), { color: 'success' });
      setFormErrorMessage('');
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to update schema');
      setFormErrorMessage(message);
      showAlert(message, { color: 'error' });
    } finally {
      setUploading(false);
    }
  }

  function cancel() {
    navigate('/');
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Card>
        <CardHeader
          title={<Typography variant="h6">{formTitle}</Typography>}
        />
        <CardContent>
          {initializing && <LinearProgress />}

          {!initializing && (
            <>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2" fontWeight={500} mb={0.5}>
                    {t('schema_uid')}
                  </Typography>
                  <TextField
                    value={form.uid}
                    onChange={(e) => handleUidChange(e.target.value)}
                    disabled={!isCreate}
                    size="small"
                    fullWidth
                    helperText={uidError || t('uid_hint')}
                    error={!!uidError}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Typography variant="body2" fontWeight={500} mb={0.5}>
                    {t('title')}
                  </Typography>
                  <TextField
                    value={form.title}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, title: e.target.value }));
                      setTitleError('');
                    }}
                    size="small"
                    fullWidth
                    error={!!titleError}
                    helperText={titleError}
                  />
                </Grid>
              </Grid>

              <Box mt={2}>
                <Typography variant="body2" fontWeight={500} mb={0.5}>
                  {t('description')}
                </Typography>
                <TextField
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  multiline
                  rows={3}
                  size="small"
                  fullWidth
                />
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Main Schema File */}
              <Card variant="outlined" sx={{ mt: 2 }}>
                <CardHeader
                  title={
                    <Typography variant="subtitle1" fontWeight={500}>
                      {t('main_schema_file')}
                    </Typography>
                  }
                  sx={{ py: 1.5 }}
                />
                <Divider />
                <CardContent>
                  <input
                    type="file"
                    accept="application/json"
                    onChange={handleMainFileSelection}
                    style={{ display: 'block', width: '100%' }}
                  />
                  <Typography variant="caption" color="text.secondary" mt={1}>
                    {isCreate
                      ? t('main_schema_hint')
                      : t('replace_main_schema')}
                  </Typography>

                  {mainFileRows.length > 0 && (
                    <TableContainer sx={{ mt: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>{t('file_name')}</TableCell>
                            <TableCell align="right">{t('size')}</TableCell>
                            <TableCell align="right">{t('actions')}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {mainFileRows.map((row) => (
                            <TableRow key={row.key}>
                              <TableCell>
                                <Typography fontWeight={500}>
                                  {row.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {row.type === 'staged'
                                    ? t('pending_main_indicator')
                                    : t('current_main_indicator')}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                {formatFileSize(row.size)}
                              </TableCell>
                              <TableCell align="right">
                                {row.type === 'staged' ? (
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={removeMainFile}
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                ) : row.download_url ? (
                                  <Button
                                    size="small"
                                    color="primary"
                                    href={row.download_url}
                                    target="_blank"
                                  >
                                    {t('download')}
                                  </Button>
                                ) : null}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  {mainFileRows.length === 0 && !fileManifestLoading && (
                    <Typography variant="caption" color="text.secondary" mt={1.5}>
                      {t('no_schema_files_found')}
                    </Typography>
                  )}

                  {fileManifestLoading && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      {t('schema_files_loading')}
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Related Schema Files */}
              <Card variant="outlined" sx={{ mt: 3 }}>
                <CardHeader
                  title={
                    <Typography variant="subtitle1" fontWeight={500}>
                      {t('related_schema_files')}
                    </Typography>
                  }
                  sx={{ py: 1.5 }}
                />
                <Divider />
                <CardContent>
                  <input
                    type="file"
                    accept="application/json"
                    multiple
                    onChange={handleAssociatedFilesSelection}
                    style={{ display: 'block', width: '100%' }}
                  />
                  <Typography variant="caption" color="text.secondary" mt={1}>
                    {t('related_schema_hint')}
                  </Typography>

                  {associatedFileRows.length > 0 && (
                    <TableContainer sx={{ mt: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>{t('file_name')}</TableCell>
                            <TableCell align="right">{t('size')}</TableCell>
                            <TableCell align="right">{t('actions')}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {associatedFileRows.map((row) => (
                            <TableRow key={row.key}>
                              <TableCell>
                                <Typography fontWeight={500}>
                                  {row.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {row.type === 'staged'
                                    ? t('pending_related_indicator')
                                    : t('current_related_indicator')}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                {formatFileSize(row.size)}
                              </TableCell>
                              <TableCell align="right">
                                {row.type === 'staged' && row.staged ? (
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() =>
                                      removeAssociatedFile(row.staged!)
                                    }
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                ) : (
                                  <>
                                    {row.download_url && (
                                      <Button
                                        size="small"
                                        color="primary"
                                        href={row.download_url}
                                        target="_blank"
                                      >
                                        {t('download')}
                                      </Button>
                                    )}
                                    {row.manifest && (
                                      <Button
                                        size="small"
                                        color="error"
                                        disabled={
                                          !!deletingFiles[
                                            row.manifest.filename
                                          ]
                                        }
                                        onClick={() =>
                                          deleteSchemaFile(row.manifest!)
                                        }
                                      >
                                        {t('delete')}
                                      </Button>
                                    )}
                                  </>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  {associatedFileRows.length === 0 && !fileManifestLoading && (
                    <Typography variant="caption" color="text.secondary" mt={1.5}>
                      {t('no_schema_files_found')}
                    </Typography>
                  )}

                  {fileManifestLoading && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      {t('schema_files_loading')}
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Divider sx={{ my: 3 }} />

              {formErrorMessage && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formErrorMessage}
                </Alert>
              )}

              {uploadErrorMessage && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {uploadErrorMessage}
                </Alert>
              )}
            </>
          )}
        </CardContent>

        <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
          <Button color="primary" onClick={cancel}>
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={isSaveDisabled}
            onClick={handleSubmit}
          >
            {uploading ? t('saving') || 'Saving...' : t('save')}
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
}
