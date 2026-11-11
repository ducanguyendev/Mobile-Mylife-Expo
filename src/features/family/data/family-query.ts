export type FamilyQueryState<T> = { status: 'idle' | 'loading' | 'ready' | 'error'; data?: T; error?: unknown };
/** Mounted/account-local request, coalesced and guarded against late completions. */
export function createFamilyQuery<T>(loader: (signal: AbortSignal) => Promise<T>) {
  let state: FamilyQueryState<T> = { status: 'idle' };
  const listeners = new Set<() => void>();
  let active: { controller: AbortController; promise: Promise<void> } | undefined;
  const publish = (next: FamilyQueryState<T>) => { state = next; listeners.forEach(listener => listener()); };
  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    load: () => {
      if (active) return active.promise;
      const operation = { controller: new AbortController(), promise: Promise.resolve() };
      active = operation;
      operation.promise = Promise.resolve().then(() => loader(operation.controller.signal)).then(data => {
        if (!operation.controller.signal.aborted) publish({ status: 'ready', data });
      }).catch((error: unknown) => { if (!operation.controller.signal.aborted) publish({ status: 'error', error }); })
        .finally(() => { if (active === operation) active = undefined; });
      publish({ status: 'loading', data: state.data });
      return operation.promise;
    },
    cancel: () => { active?.controller.abort(); active = undefined; publish(state.data !== undefined ? { status: 'ready', data: state.data } : { status: 'idle' }); },
  };
}
