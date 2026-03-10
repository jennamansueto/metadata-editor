import React, { useState, useCallback } from 'react';
import { Snackbar, Alert, Button } from '@mui/material';
import { useEventBus } from '../hooks/useEventBus';

/**
 * Toast notification component - port of vue-toast-component.js
 * Uses MUI Snackbar + Alert to replace Vue toast
 */
const Toast: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'success' | 'error'>('success');

  const handleSuccess = useCallback((...args: unknown[]) => {
    setMessage(String(args[0] || ''));
    setSeverity('success');
    setOpen(true);
  }, []);

  const handleFail = useCallback((...args: unknown[]) => {
    setMessage(String(args[0] || ''));
    setSeverity('error');
    setOpen(true);
  }, []);

  useEventBus('onSuccess', handleSuccess);
  useEventBus('onFail', handleFail);

  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={() => setOpen(false)}
        severity={severity}
        variant="filled"
        sx={{ width: '100%' }}
        action={
          <Button color="inherit" size="small" onClick={() => setOpen(false)}>
            Close
          </Button>
        }
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Toast;
