import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  Box,
  Avatar,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import axios from 'axios';
import { useAppContext } from '../../context/AppContext';
import { useTranslation } from '../../i18n/TranslationContext';
import { useAlert } from '../../hooks/useAlert';
import { useConfirm } from '../../hooks/useConfirm';
import { extractErrorMessage } from '../../utils/api';

dayjs.extend(utc);

interface Schema {
  uid: string;
  title?: string;
  display_name?: string;
  alias?: string;
  status?: string;
  is_core?: boolean;
  updated?: string | number;
  icon_url?: string;
  icon_full_url?: string;
  storage_path?: string;
}

function iconSrc(item: Schema, baseUrl: string, siteUrl: string): string | null {
  if (!item) return null;

  const normalizeBaseUrl = (value: string): string => {
    if (!value) return '';
    return value.endsWith('/') ? value : value + '/';
  };

  const isAbsoluteUrl = (value: string): boolean =>
    /^https?:\/\//i.test(value) || /^\/\//.test(value);

  const base = normalizeBaseUrl(baseUrl || siteUrl.replace(/\/?$/, '/'));

  if (item.icon_full_url && typeof item.icon_full_url === 'string') {
    const trimmedFull = item.icon_full_url.trim();
    if (trimmedFull && !trimmedFull.endsWith('/')) {
      return trimmedFull;
    }
  }

  if (item.icon_url) {
    if (isAbsoluteUrl(item.icon_url)) {
      return item.icon_url;
    }
    const cleanedIcon = item.icon_url.replace(/^\/+/, '');
    if (cleanedIcon) {
      return base + cleanedIcon;
    }
  }

  return null;
}

function formatDate(value: string | number | undefined): string {
  if (!value) return '';

  let d: dayjs.Dayjs;
  if (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))) {
    d = dayjs.unix(typeof value === 'string' ? parseInt(value, 10) : value);
  } else {
    d = dayjs(value);
  }

  if (!d.isValid()) return String(value);
  return d.utc().format('YYYY-MM-DD HH:mm');
}

export default function SchemaList() {
  const ci = useAppContext();
  const { t } = useTranslation();
  const showAlert = useAlert();
  const showConfirm = useConfirm();
  const navigate = useNavigate();

  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<Schema | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const baseApiUrl = ci.site_url.replace(/\/?$/, '/') + 'api/schemas';

  const loadSchemas = useCallback(() => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    axios
      .get(baseApiUrl, { signal: controller.signal })
      .then((response) => {
        if (cancelled) return;
        if (response.data?.schemas) {
          setSchemas(response.data.schemas);
        } else {
          setSchemas([]);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        const message = extractErrorMessage(error, 'Failed to load schemas');
        showAlert(message, { color: 'error' });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [baseApiUrl, showAlert, refreshKey]);

  function handleMenuOpen(event: React.MouseEvent<HTMLElement>, item: Schema) {
    setMenuAnchor(event.currentTarget);
    setMenuItem(item);
  }

  function handleMenuClose() {
    setMenuAnchor(null);
    setMenuItem(null);
  }

  function handleTitleClick(item: Schema) {
    if (!item || item.is_core) return;
    navigate('/edit/' + encodeURIComponent(item.uid));
  }

  function previewSchema(item: Schema) {
    if (!item?.uid) return;
    const previewUrl =
      ci.site_url.replace(/\/?$/, '/') +
      'schemas/preview/' +
      encodeURIComponent(item.uid);
    window.open(previewUrl, '_blank', 'noopener');
    handleMenuClose();
  }

  function editSchemaMappings(item: Schema) {
    if (!item) return;
    navigate('/mappings/' + encodeURIComponent(item.uid));
    handleMenuClose();
  }

  async function regenerateTemplate(item: Schema) {
    if (!item || item.is_core) return;
    handleMenuClose();

    const confirmed = await showConfirm(t('regenerate_template_confirm'));
    if (!confirmed) return;

    try {
      await axios.post(
        baseApiUrl + '/regenerate_template/' + encodeURIComponent(item.uid)
      );
      showAlert(t('schema_template_regenerated'), { color: 'success' });
      loadSchemas();
    } catch (error) {
      const message = extractErrorMessage(error, t('regenerate_template_failed'));
      showAlert(message, { color: 'error' });
    }
  }

  function editSchema(item: Schema) {
    if (!item || item.is_core) return;
    navigate('/edit/' + encodeURIComponent(item.uid));
    handleMenuClose();
  }

  async function deleteSchema(item: Schema) {
    if (!item || item.is_core) return;
    handleMenuClose();

    const confirmed = await showConfirm(t('delete_schema_confirm'));
    if (!confirmed) return;

    try {
      await axios.delete(
        baseApiUrl + '/' + encodeURIComponent(item.uid)
      );
      showAlert(t('schema_deleted'), { color: 'success' });
      loadSchemas();
    } catch (error) {
      const message = extractErrorMessage(error, 'Failed to delete schema');
      showAlert(message, { color: 'error' });
    }
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Card>
        <CardHeader
          title={
            <Typography variant="h6">{t('schemas')}</Typography>
          }
          action={
            <Button
              variant="outlined"
              size="small"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/create')}
            >
              {t('create_schema')}
            </Button>
          }
        />
        <CardContent sx={{ pt: 0 }}>
          {loading && <LinearProgress />}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="center" width={32}>
                    {t('schema_icon')}
                  </TableCell>
                  <TableCell>{t('title')}</TableCell>
                  <TableCell>{t('schema')}</TableCell>
                  <TableCell>{t('alias')}</TableCell>
                  <TableCell>{t('status')}</TableCell>
                  <TableCell>{t('type')}</TableCell>
                  <TableCell>{t('updated')}</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {schemas.map((item) => {
                  const icon = iconSrc(item, ci.base_url, ci.site_url);
                  return (
                    <TableRow key={item.uid} sx={{ height: 56 }}>
                      <TableCell align="center">
                        <Avatar
                          variant="rounded"
                          sx={{
                            width: 28,
                            height: 28,
                            bgcolor: 'transparent',
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'rgba(0,0,0,0.54)',
                          }}
                          src={icon || undefined}
                        >
                          {!icon &&
                            (
                              item.display_name ||
                              item.title ||
                              item.uid ||
                              '?'
                            )
                              .charAt(0)
                              .toUpperCase()}
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <Typography
                          component="span"
                          sx={{
                            color: item.is_core
                              ? 'rgba(0,0,0,0.38)'
                              : '#526bc7',
                            cursor: item.is_core ? 'default' : 'pointer',
                            fontWeight: 500,
                            '&:hover': item.is_core
                              ? {}
                              : { textDecoration: 'underline' },
                          }}
                          onClick={() => handleTitleClick(item)}
                        >
                          {item.title || item.uid}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <span>{item.uid}</span>
                          {item.storage_path && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              {item.storage_path}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {item.alias ? (
                          item.alias
                        ) : (
                          <Typography color="text.disabled">
                            &mdash;
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{item.status}</TableCell>
                      <TableCell>
                        {item.is_core ? t('core') : t('custom')}
                      </TableCell>
                      <TableCell>{formatDate(item.updated)}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, item)}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Actions Menu */}
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
          >
            <MenuItem
              onClick={() => menuItem && previewSchema(menuItem)}
            >
              <ListItemIcon>
                <VisibilityIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('preview_schema')}</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => menuItem && editSchemaMappings(menuItem)}
              disabled={menuItem?.is_core}
            >
              <ListItemIcon>
                <CallSplitIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('edit_core_mappings')}</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => menuItem && regenerateTemplate(menuItem)}
              disabled={menuItem?.is_core}
            >
              <ListItemIcon>
                <RefreshIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('regenerate_template')}</ListItemText>
            </MenuItem>
            {!menuItem?.is_core && <Divider />}
            <MenuItem
              onClick={() => menuItem && editSchema(menuItem)}
              disabled={menuItem?.is_core}
            >
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('edit')}</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => menuItem && deleteSchema(menuItem)}
              disabled={menuItem?.is_core}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('delete')}</ListItemText>
            </MenuItem>
          </Menu>
        </CardContent>
      </Card>
    </Box>
  );
}
