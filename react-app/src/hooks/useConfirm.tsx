import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

type ShowConfirmFn = (message: string) => Promise<boolean>;

const ConfirmContext = createContext<ShowConfirmFn>(() => Promise.resolve(false));

interface ConfirmState {
  open: boolean;
  message: string;
  resolve: ((value: boolean) => void) | null;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState>({
    open: false,
    message: '',
    resolve: null,
  });

  const showConfirm: ShowConfirmFn = useCallback((message) => {
    return new Promise<boolean>((resolve) => {
      setState({ open: true, message, resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setState((prev) => {
      if (prev.resolve) prev.resolve(true);
      return { open: false, message: '', resolve: null };
    });
  }, []);

  const handleCancel = useCallback(() => {
    setState((prev) => {
      if (prev.resolve) prev.resolve(false);
      return { open: false, message: '', resolve: null };
    });
  }, []);

  return (
    <ConfirmContext.Provider value={showConfirm}>
      {children}
      <ConfirmDialog
        open={state.open}
        message={state.message}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ShowConfirmFn {
  return useContext(ConfirmContext);
}
