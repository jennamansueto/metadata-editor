import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import AlertDialog, { type AlertColor } from '../components/AlertDialog';

interface AlertOptions {
  color?: AlertColor;
  title?: string;
}

type ShowAlertFn = (message: string, options?: AlertOptions) => Promise<void>;

const AlertContext = createContext<ShowAlertFn>(() => Promise.resolve());

interface AlertState {
  open: boolean;
  message: string;
  color: AlertColor;
  title: string;
  resolve: (() => void) | null;
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AlertState>({
    open: false,
    message: '',
    color: 'info',
    title: '',
    resolve: null,
  });

  const showAlert: ShowAlertFn = useCallback((message, options = {}) => {
    return new Promise<void>((resolve) => {
      setState({
        open: true,
        message,
        color: options.color || 'info',
        title: options.title || '',
        resolve,
      });
    });
  }, []);

  const handleClose = useCallback(() => {
    setState((prev) => {
      if (prev.resolve) prev.resolve();
      return { ...prev, open: false, resolve: null };
    });
  }, []);

  return (
    <AlertContext.Provider value={showAlert}>
      {children}
      <AlertDialog
        open={state.open}
        message={state.message}
        color={state.color}
        title={state.title}
        onClose={handleClose}
      />
    </AlertContext.Provider>
  );
}

export function useAlert(): ShowAlertFn {
  return useContext(AlertContext);
}
