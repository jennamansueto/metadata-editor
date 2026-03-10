import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Box, Alert, Button, IconButton, Tooltip } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock';
import RestoreIcon from '@mui/icons-material/Restore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FileTreeIcon from '@mui/icons-material/AccountTree';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { useTranslation } from 'react-i18next';
import { get as _get } from 'lodash-es';
import SiteHeader from './SiteHeader';
import Sidebar from './Sidebar';
import Toast from './Toast';
import LoginDialog from './LoginDialog';
import { useTreeData } from '../hooks/useTreeData';
import { useProjectStore } from '../store/useProjectStore';
import apiClient from '../api/client';
import { eventBus } from '../utils/eventBus';
import { removeEmpty } from '../utils/helpers';

/**
 * Main editor layout - port of layout.php
 * Split-pane layout with sidebar tree and content area
 */
const EditorLayout: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const treeItems = useTreeData();

  const userHasEditAccess = useProjectStore((s) => s.user_has_edit_access);
  const projectIsLocked = useProjectStore((s) => s.project_is_locked);
  const projectVersionInfo = useProjectStore((s) => s.project_version_info);
  const isDirty = useProjectStore((s) => s.is_dirty);
  const setIsDirty = useProjectStore((s) => s.setIsDirty);
  const formData = useProjectStore((s) => s.formData);
  const projectId = useProjectStore((s) => s.project_id);
  const projectType = useProjectStore((s) => s.project_type);

  const canEdit = userHasEditAccess && !projectIsLocked;

  // Compute title from schema core fields (simplified)
  const title = (() => {
    const projectInfo = useProjectStore.getState().project_info;
    // Try common title paths
    const titlePaths = [
      'doc_desc.title',
      'study_desc.title_statement.title',
      'table_description.title_statement.table_number',
      'project_desc.title_statement.title',
      'description.title',
    ];
    for (const path of titlePaths) {
      const val = _get(formData, path);
      if (val && typeof val === 'string' && val.trim()) {
        return val;
      }
    }
    return projectInfo?.title || t('untitled') || 'Untitled';
  })();

  // Check if save button should be hidden on certain routes
  const hideProjectSaveOnRoute =
    location.pathname.startsWith('/datafile/') ||
    location.pathname.startsWith('/external-resources/');

  const saveProject = async () => {
    try {
      const url = `/api/editor/update/${projectType}/${projectId}`;
      // Deep-clone and strip empty values before posting (matches Vue version's removeEmpty)
      const cleanedData = JSON.parse(JSON.stringify(formData));
      removeEmpty(cleanedData);
      await apiClient.post(url, cleanedData);
      setIsDirty(false);
      eventBus.emit('onSuccess', t('Save') + ' - OK');
    } catch (error) {
      console.error('Error saving project:', error);
      eventBus.emit('onFail', 'Error saving project');
    }
  };

  const cancelProject = async () => {
    if (projectId) {
      try {
        await useProjectStore.getState().loadProject(projectId);
        setIsDirty(false);
      } catch (error) {
        console.error('Error reverting project:', error);
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Global header */}
      <SiteHeader />

      {/* Main content area with split panes */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <Allotment defaultSizes={[20, 80]}>
          {/* Left sidebar */}
          <Allotment.Pane minSize={200} maxSize={500}>
            <Sidebar items={treeItems} />
          </Allotment.Pane>

          {/* Right content */}
          <Allotment.Pane>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Header bar with title and save */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 2,
                  py: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'background.paper',
                  boxShadow: 1,
                  minHeight: 48,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden', mr: 4 }}>
                  <FileTreeIcon sx={{ fontSize: 'x-large' }} />
                  <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 20 }}>
                    {title}
                  </strong>
                </Box>

                {!hideProjectSaveOnRoute && (
                  <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                    {canEdit ? (
                      <>
                        <Button
                          variant="contained"
                          color={isDirty ? 'primary' : 'secondary'}
                          startIcon={<SaveIcon />}
                          onClick={saveProject}
                          size="small"
                        >
                          {t('Save')}
                        </Button>
                        {isDirty && (
                          <Tooltip title={t('Cancel changes') || 'Cancel changes'}>
                            <IconButton color="error" size="small" onClick={cancelProject}>
                              <RestoreIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </>
                    ) : (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<LockIcon />}
                        size="small"
                      >
                        {projectIsLocked ? t('locked') : t('read_only')}
                      </Button>
                    )}

                    <IconButton color="primary" size="small">
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>

              {/* Project lock warning */}
              {projectIsLocked && (
                <Alert
                  severity="warning"
                  icon={<LockIcon />}
                  sx={{ m: 2, borderLeft: '4px solid', borderColor: 'warning.main' }}
                >
                  <div>
                    <strong>{t('project_locked')}</strong>
                    <br />
                    {t('project_locked_message')}
                  </div>
                </Alert>
              )}

              {/* Router outlet */}
              <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                <Outlet />
              </Box>
            </Box>
          </Allotment.Pane>
        </Allotment>
      </Box>

      {/* Global components */}
      <Toast />
      <LoginDialog />
    </Box>
  );
};

export default EditorLayout;
