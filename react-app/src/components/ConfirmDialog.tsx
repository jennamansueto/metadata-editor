import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';

interface ConfirmDialogProps {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Confirmation</Typography>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6">{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button color="success" onClick={onConfirm}>
          Confirm
        </Button>
        <Button color="error" onClick={onCancel}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
