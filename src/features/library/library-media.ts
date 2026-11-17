import { apiRequest, getSessionVersion } from '@/api/apiClient';
import { onSessionBoundary } from '@/api/session-resources';
import { appEnv } from '@/config/env';
import { id, maxPhotoBytes, mimeExtensions } from './library-data';

export function privateImagePath(photoId: number) { return `/api/library/photos/${id(photoId)}/image`; }
export function trustedImageUrl(base: string | null, photoId: number) {
  if (!base) throw Error('LIBRARY_MEDIA_UNAVAILABLE');
  const url = new URL(base);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw Error('LIBRARY_MEDIA_UNAVAILABLE');
  return url.origin + privateImagePath(photoId);
}
// Only ephemeral data URIs enter expo-image. Bearer is handled by apiRequest,
// including refresh/logout guards. Redirects cannot forward it to storage.
export async function readPrivatePhoto(photoId: number, signal: AbortSignal): Promise<string> {
  trustedImageUrl(appEnv.apiBaseUrl, photoId);
  const blob = await apiRequest<Blob>(privateImagePath(photoId), { signal, responseType: 'blob', redirect: 'error', headers: { Accept: 'image/jpeg,image/png,image/webp,image/gif' }, cache: 'no-store' });
  if (signal.aborted || blob.size <= 0 || blob.size > maxPhotoBytes || !Object.hasOwn(mimeExtensions, blob.type.toLowerCase())) throw Error('LIBRARY_MEDIA_UNAVAILABLE');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const abort = () => { reader.abort(); cleanup(); reject(Error('LIBRARY_MEDIA_CANCELED')); };
    const cleanup = () => { signal.removeEventListener('abort', abort); reader.onload = null; reader.onerror = null; reader.onabort = null; };
    reader.onload = () => { cleanup(); if (signal.aborted || typeof reader.result !== 'string') reject(Error('LIBRARY_MEDIA_CANCELED')); else resolve(reader.result); };
    reader.onerror = () => { cleanup(); reject(Error('LIBRARY_MEDIA_UNAVAILABLE')); };
    reader.onabort = cleanup;
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort(); else reader.readAsDataURL(blob);
  });
}
/** Ref-counted in-flight bytes and a small, session-only LRU. Never writes disk. */
export function createMediaPool(loader = readPrivatePhoto, concurrency = 3, isCurrent = () => true) {
  type Job = { id: number; version: number; controller: AbortController; promise: Promise<string>; resolve: (value: string) => void; reject: (reason: unknown) => void; consumers: number; started: boolean; settled: boolean };
  let active = 0, generation = 0, cachedBytes = 0;
  const jobs = new Map<number, Job>(), waiting: Job[] = [];
  const cache = new Map<number, string>();
  const canceled = () => Error('LIBRARY_MEDIA_CANCELED');
  const remember = (photoId: number, uri: string) => {
    // Conservative UTF-16 cost; a single large original is intentionally not
    // retained after its visible consumer releases it.
    const bytes = uri.length * 2;
    if (bytes > 8 * 1024 * 1024) return;
    const previous = cache.get(photoId); if (previous) cachedBytes -= previous.length * 2;
    cache.delete(photoId); cache.set(photoId, uri); cachedBytes += bytes;
    while (cache.size > 3 || cachedBytes > 8 * 1024 * 1024) {
      const oldest = cache.keys().next().value!; cachedBytes -= cache.get(oldest)!.length * 2; cache.delete(oldest);
    }
  };
  const drain = () => {
    while (active < Math.max(1, concurrency) && waiting.length) {
      const job = waiting.shift()!;
      if (job.settled || job.controller.signal.aborted) continue;
      job.started = true; active++;
      void (async () => {
        try {
          const uri = await loader(job.id, job.controller.signal);
          if (job.controller.signal.aborted || job.version !== generation || !isCurrent()) throw canceled();
          remember(job.id, uri); job.settled = true; job.resolve(uri);
        } catch (error) { job.settled = true; job.reject(error); }
        finally { active--; if (jobs.get(job.id) === job) jobs.delete(job.id); drain(); }
      })();
    }
  };
  const acquire = (photoId: number) => {
    id(photoId);
    if (!isCurrent()) return { promise: Promise.reject<string>(canceled()), release() {} };
    const cached = cache.get(photoId);
    if (cached) {
      cache.delete(photoId); cache.set(photoId, cached); const version = generation;
      return { promise: Promise.resolve().then(() => { if (version !== generation || !isCurrent()) throw canceled(); return cached; }), release() {} };
    }
    let job = jobs.get(photoId);
    if (!job || job.controller.signal.aborted) {
      let resolve!: Job['resolve'], reject!: Job['reject'];
      const promise = new Promise<string>((yes, no) => { resolve = yes; reject = no; });
      job = { id: photoId, version: generation, controller: new AbortController(), promise, resolve, reject, consumers: 0, started: false, settled: false };
      jobs.set(photoId, job); waiting.push(job);
    }
    const current = job; current.consumers++; drain(); let released = false;
    return { promise: current.promise.then(uri => { if (current.version !== generation || !isCurrent()) throw canceled(); return uri; }), release() {
      if (released) return; released = true;
      if (--current.consumers === 0 && !current.settled) {
        current.controller.abort();
        if (jobs.get(photoId) === current) jobs.delete(photoId);
        if (!current.started) { current.settled = true; const index = waiting.indexOf(current); if (index >= 0) waiting.splice(index, 1); current.reject(canceled()); }
      }
    } };
  };
  return {
    acquire,
    evict(photoId: number) { const uri = cache.get(photoId); if (uri) cachedBytes -= uri.length * 2; cache.delete(photoId); },
    read(photoId: number) { const lease = acquire(photoId); return lease.promise.finally(lease.release); },
    clear() {
      generation++;
      jobs.forEach(job => { job.controller.abort(); if (!job.started && !job.settled) { job.settled = true; job.reject(canceled()); } });
      waiting.length = 0; jobs.clear(); cache.clear(); cachedBytes = 0;
    },
  };
}
export type MediaPool = ReturnType<typeof createMediaPool>;
let scoped: { accountId: number; version: number; pool: MediaPool } | undefined;
let observing = false;
export function mediaPoolForAccount(accountId: number): MediaPool {
  id(accountId);
  if (!observing) { observing = true; onSessionBoundary(() => { scoped?.pool.clear(); scoped = undefined; }); }
  const version = getSessionVersion();
  if (!scoped || scoped.accountId !== accountId || scoped.version !== version) {
    scoped?.pool.clear();
    scoped = { accountId, version, pool: createMediaPool(readPrivatePhoto, 3, () => getSessionVersion() === version && scoped?.accountId === accountId) };
  }
  return scoped.pool;
}
