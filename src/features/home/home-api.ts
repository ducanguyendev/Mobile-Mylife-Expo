import { apiRequest } from '@/api/apiClient';
import type { HomeData } from './home-data';
function rows<T>(value: unknown): T[] {
  if (!Array.isArray(value) || value.some((row) => !row || !Number.isSafeInteger(row.id) || row.id <= 0)) throw new Error('HOME_INVALID_RESPONSE');
  return value as T[];
}
async function envelope<T>(path: string, signal: AbortSignal): Promise<T[]> {
  const value = await apiRequest<{ success: boolean; data: unknown }>(path, { signal });
  if (value?.success !== true) throw new Error('HOME_INVALID_RESPONSE');
  return rows<T>(value.data);
}
export const homeLoaders = {
  family: (signal: AbortSignal) => envelope<HomeData['family'][number]>('/api/family-tree', signal),
  anniversaries: (signal: AbortSignal) => envelope<HomeData['anniversaries'][number]>('/api/family-tree/anniversaries', signal),
  albums: async (signal: AbortSignal) => {
    const value = rows<HomeData['albums'][number]>(await apiRequest<unknown>('/api/library/albums', { signal }));
    if (value.some((album) => typeof album.name !== 'string' || !Number.isInteger(album.photoCount) || album.photoCount < 0)) throw new Error('HOME_INVALID_RESPONSE');
    return value;
  },
};
