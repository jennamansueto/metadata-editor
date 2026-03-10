import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
} from '@mui/material';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../store/useProjectStore';
import apiClient from '../api/client';
import type { ProjectEditStats, ProjectDiskUsage } from '../types';

/**
 * Home/Summary page - port of vue-summary-component.js (355 lines)
 * Shows project info, template info, validation status, etc.
 */
const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const projectId = useProjectStore((s) => s.project_id);
  const idno = useProjectStore((s) => s.idno);
  const projectType = useProjectStore((s) => s.project_type);
  const versionInfo = useProjectStore((s) => s.project_version_info);
  const formTemplate = useProjectStore((s) => s.formTemplate);

  const [editStats, setEditStats] = useState<ProjectEditStats>({});
  const [diskUsage, setDiskUsage] = useState<ProjectDiskUsage>({});

  useEffect(() => {
    if (!projectId) return;

    // Load edit stats
    apiClient
      .get(`/api/editor/edit_stats/${projectId}`)
      .then((response) => {
        if (response.data?.info) {
          setEditStats(response.data.info);
        }
      })
      .catch((error) => console.error('edit_stats_failed', error));

    // Load disk usage
    apiClient
      .get(`/api/files/size/${projectId}`)
      .then((response) => {
        if (response.data?.result) {
          setDiskUsage(response.data.result);
        }
      })
      .catch((error) => console.error('disk_usage_stats_failed', error));
  }, [projectId]);

  const momentDate = (date: string | undefined): string => {
    if (!date) return '';
    return moment.utc(date).local().format('YYYY-MM-DD HH:mm:ss');
  };

  return (
    <Box className="summary-component" sx={{ mt: 2, px: 2 }}>
      <Grid container spacing={3}>
        {/* Main project info card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Grid container spacing={2}>
                {/* Thumbnail */}
                <Grid item xs={3}>
                  <Box
                    sx={{
                      width: '100%',
                      height: 200,
                      backgroundColor: 'grey.100',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" color="textSecondary">
                      Project Thumbnail
                    </Typography>
                  </Box>
                </Grid>

                {/* Project info */}
                <Grid item xs={9}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {t('Project owner')}:
                        </Typography>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {editStats.username_cr || '-'}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {t('Last changed by')}:
                        </Typography>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {editStats.username || '-'}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {t('Project IDNO')}:
                        </Typography>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {idno || '-'}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {t('Created on')}:
                        </Typography>
                        <Typography variant="body2">
                          {momentDate(editStats.created as string)}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {t('Changed on')}:
                        </Typography>
                        <Typography variant="body2">
                          {momentDate(editStats.changed as string)}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {t('version')}:
                        </Typography>
                        <Typography variant="body2">
                          {versionInfo?.version_number || t('latest')}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Template info */}
        <Grid item xs={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('Template')}
              </Typography>
              <Typography variant="body2">
                <strong>UID:</strong> {formTemplate?.uid || '-'}
              </Typography>
              {formTemplate?.name && (
                <Typography variant="body2">
                  <strong>Name:</strong> {formTemplate.name}
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('Validation')}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Validation report — coming in next phase
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Right column */}
        <Grid item xs={6}>
          {/* Sharing stats placeholder */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('Sharing')}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Sharing stats — coming in next phase
              </Typography>
            </CardContent>
          </Card>

          {/* Collections placeholder */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('Collections')}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Collections — coming in next phase
              </Typography>
            </CardContent>
          </Card>

          {/* Tags placeholder */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('Tags')}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Tags — coming in next phase
              </Typography>
            </CardContent>
          </Card>

          {/* Data and documentation */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6">
                  {t('Data and Documentation')}
                </Typography>
                {diskUsage.size_formatted && (
                  <Chip
                    label={`${t('Disk usage')}: ${diskUsage.size_formatted}`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
              <Typography variant="body2" color="textSecondary">
                Files list — coming in next phase
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HomePage;
