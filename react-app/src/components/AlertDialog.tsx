import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { useEventBus } from '../hooks/useEventBus';

/**
 * Alert dialog component - port of vue-alert-dialog-component.js
 */
const AlertDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [onConfirm, setOnConfirm] = useState<(() => void) | null>(null);

  const showAlert = useCallback((...args: unknown[]) => {
    const data = args[0] as { title?: string; message?: string; onConfirm?: () => void } | undefined;
    setTitle(data?.title || 'Alert');
    setMessage(data?.message || '');
    setOnConfirm(() => data?.onConfirm || null);
    setOpen(true);
  }, []);

  useEventBus('show-alert-dialog', showAlert);

  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" color="primary">
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AlertDialog;
