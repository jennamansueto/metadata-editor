import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Alert,
  IconButton,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { useEventBus } from '../hooks/useEventBus';
import apiClient from '../api/client';

/**
 * Login dialog - port of vue-login-component.js
 * Appears when a 401 is received
 */
const LoginDialog: React.FC = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const showDialog = useCallback(() => {
    setOpen(true);
  }, []);

  useEventBus('show-login-dialog', showDialog);

  const checkLoggedIn = useCallback(() => {
    if (isLoading) return;
    setIsLoading(true);
    apiClient
      .get('/api/editor/is_connected')
      .then(() => {
        setIsLoggedIn(true);
        setIsLoading(false);
        if (open) {
          setOpen(false);
        }
      })
      .catch(() => {
        setIsLoggedIn(false);
        setIsLoading(false);
      });
  }, [isLoading, open]);

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        checkLoggedIn();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [checkLoggedIn]);

  const loginRedirect = () => {
    const url = (window.CI?.site_url || '') + '/auth/login?mode=popup';
    const w = 500;
    const h = 600;
    const left = (screen.width - w) / 2;
    const top = (screen.height - h) / 2;
    window.open(
      url,
      'loginPopup',
      `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {t('login')}
        <IconButton onClick={() => setOpen(false)} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {isLoggedIn ? (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              {t('you_are_logged_in')}
            </Alert>
            <Button fullWidth variant="contained" color="primary" onClick={() => setOpen(false)}>
              {t('close')}
            </Button>
          </Box>
        ) : (
          <Box>
            <Alert severity="warning" sx={{ mb: 2 }}>
              {t('session_expired_warning')}
            </Alert>
            <Button fullWidth variant="contained" color="primary" onClick={loginRedirect}>
              {t('login_opens_new_tab')}
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
