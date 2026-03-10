import { useEffect } from 'react';
import { eventBus } from '../utils/eventBus';

/**
 * Hook that subscribes to an event bus event and auto-cleans up on unmount.
 */
export function useEventBus(event: string, handler: (...args: unknown[]) => void): void {
  useEffect(() => {
    const cleanup = eventBus.on(event, handler);
    return cleanup;
  }, [event, handler]);
}
