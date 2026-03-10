// Replaces Vue's window.bus = new Vue() event bus pattern
// Lightweight EventEmitter for cross-component communication

type Handler = (...args: unknown[]) => void;
const handlers = new Map<string, Set<Handler>>();

export const eventBus = {
  on(event: string, handler: Handler): () => void {
    if (!handlers.has(event)) handlers.set(event, new Set());
    handlers.get(event)!.add(handler);
    // Return cleanup function
    return () => {
      handlers.get(event)?.delete(handler);
    };
  },
  off(event: string, handler: Handler): void {
    handlers.get(event)?.delete(handler);
  },
  emit(event: string, ...args: unknown[]): void {
    handlers.get(event)?.forEach((h) => h(...args));
  },
};
