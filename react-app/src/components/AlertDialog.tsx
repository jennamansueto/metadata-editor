import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';

export type AlertColor = 'error' | 'success' | 'warning' | 'info';

interface AlertDialogProps {
  open: boolean;
  message: string;
  color: AlertColor;
  title?: string;
  onClose: () => void;
}

const iconMap: Record<AlertColor, React.ReactNode> = {
  error: <ErrorIcon sx={{ color: '#f44336', mr: 1 }} />,
  success: <CheckCircleIcon sx={{ color: '#4caf50', mr: 1 }} />,
  warning: <WarningIcon sx={{ color: '#ff9800', mr: 1 }} />,
  info: <InfoIcon sx={{ color: '#2196f3', mr: 1 }} />,
};

const defaultTitles: Record<AlertColor, string> = {
  error: 'Error',
  success: 'Success',
  warning: 'Warning',
  info: 'Information',
};

export default function AlertDialog({
  open,
  message,
  color,
  title,
  onClose,
}: AlertDialogProps) {
  const displayTitle = title || defaultTitles[color] || 'Alert';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          {iconMap[color]}
          <Typography
            variant="h6"
            component="span"
            color={color === 'error' ? 'error' : 'inherit'}
          >
            {displayTitle}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 16, px: 2 }}>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color={color === 'error' ? 'error' : 'primary'}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}
