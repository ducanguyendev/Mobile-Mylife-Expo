import type { HomeData, Section } from './home-data';
export type SectionState<T> = { status: 'idle' | 'loading' | 'ready' | 'error'; data?: T };
type Snapshot = { [K in Section]: SectionState<HomeData[K]> };
export type HomeLoaders = { [K in Section]: (signal: AbortSignal) => Promise<HomeData[K]> };
const sections: Section[] = ['family', 'anniversaries', 'albums'];
/** One instance per account, never a module-level personal-data cache. */
export function createHomeResource(loaders: HomeLoaders) {
  let state: Snapshot = { family: { status: 'idle' }, anniversaries: { status: 'idle' }, albums: { status: 'idle' } };
  const listeners = new Set<() => void>();
  const pending = new Map<Section, { controller: AbortController; promise: Promise<void> }>();
  let disposed = false;
  const publish = <K extends Section>(section: K, value: SectionState<HomeData[K]>) => {
    state = { ...state, [section]: value };
    listeners.forEach((listener) => listener());
  };
  function load<K extends Section>(section: K): Promise<void> {
    if (disposed) return Promise.resolve();
    const existing = pending.get(section);
    if (existing) return existing.promise;
    const controller = new AbortController();
    const operation = { controller, promise: Promise.resolve() };
    pending.set(section, operation);
    operation.promise = Promise.resolve().then(() => loaders[section](controller.signal)).then((data) => {
      if (!disposed && !controller.signal.aborted) publish(section, { status: 'ready', data });
    }).catch(() => {
      if (!disposed && !controller.signal.aborted) publish(section, { status: 'error' });
    }).finally(() => { if (pending.get(section) === operation) pending.delete(section); });
    publish(section, { ...state[section], status: 'loading' });
    return operation.promise;
  }
  const cancel = () => {
    pending.forEach(({ controller }, section) => {
      controller.abort();
      publish(section, state[section].data ? { status: 'ready', data: state[section].data } : { status: 'idle' });
    });
    pending.clear();
  };
  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    refresh: () => Promise.all(sections.map(load)).then(() => undefined), retry: load, cancel,
    dispose: () => { disposed = true; cancel(); listeners.clear(); },
  };
}
