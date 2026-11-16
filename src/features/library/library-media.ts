import { apiRequest } from '@/api/apiClient';
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
    const abort = () => { reader.abort(); reject(Error('LIBRARY_MEDIA_CANCELED')); };
    const cleanup = () => signal.removeEventListener('abort', abort);
    reader.onload = () => { cleanup(); if (signal.aborted || typeof reader.result !== 'string') reject(Error('LIBRARY_MEDIA_CANCELED')); else resolve(reader.result); };
    reader.onerror = () => { cleanup(); reject(Error('LIBRARY_MEDIA_UNAVAILABLE')); };
    reader.onabort = cleanup;
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort(); else reader.readAsDataURL(blob);
  });
}
/** Per-mounted-account scheduler: bounded concurrency, coalescing, no disk cache. */
export function createMediaPool(loader = readPrivatePhoto, concurrency = 3) {
  let active = 0; let generation = 0;
  const jobs = new Map<number, { promise: Promise<string>; controller: AbortController }>();
  const waiting: (() => void)[] = [];
  const controllers = new Set<AbortController>();
  return {
    read(photoId: number) {
      id(photoId); const previous = jobs.get(photoId); if (previous) return previous.promise;
      const version = generation; const controller = new AbortController(); controllers.add(controller);
      const promise = (async () => {
        if (active >= concurrency) await new Promise<void>(resolve => waiting.push(resolve));
        if (controller.signal.aborted || version !== generation) throw Error('LIBRARY_MEDIA_CANCELED');
        active++;
        try { const data = await loader(photoId, controller.signal); if (controller.signal.aborted || version !== generation) throw Error('LIBRARY_MEDIA_CANCELED'); return data; }
        finally { active--; waiting.shift()?.(); }
      })().finally(() => { controllers.delete(controller); if (jobs.get(photoId)?.controller === controller) jobs.delete(photoId); });
      jobs.set(photoId, { promise, controller }); return promise;
    },
    clear() { generation++; controllers.forEach(c => c.abort()); controllers.clear(); jobs.clear(); waiting.splice(0).forEach(resolve => resolve()); },
  };
}
export type MediaPool = ReturnType<typeof createMediaPool>;
