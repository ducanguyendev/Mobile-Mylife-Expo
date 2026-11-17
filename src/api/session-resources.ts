// Resource invalidation only; tokens and authentication decisions stay in apiClient.
const sessionListeners = new Set<() => void>();
const writeListeners = new Set<() => void>();
export function onSessionBoundary(listener: () => void) { sessionListeners.add(listener); return () => { sessionListeners.delete(listener); }; }
export function onWriteBoundary(listener: () => void) { writeListeners.add(listener); return () => { writeListeners.delete(listener); }; }
export function invalidateReads() { writeListeners.forEach(listener => listener()); }
export function releaseSessionResources() { sessionListeners.forEach(listener => listener()); invalidateReads(); }
