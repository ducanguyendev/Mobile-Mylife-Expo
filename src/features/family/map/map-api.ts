import { apiRequest } from '@/api/apiClient';
import { familyDataApi, requireMember } from '../api/familyDataApi';
import type { FamilyMember } from '../types/family';
import { assertLocationUnchanged, requireFamilyMap, requireLocationInput, requireMapId, requireRetry, type LocationInput } from './map-data';

async function data(path: string, options: RequestInit) {
  const response = await apiRequest<{ success: boolean; data: unknown }>(path, options);
  if (!response || response.success !== true || !Object.hasOwn(response, 'data')) throw new Error('FAMILY_MAP_INVALID_RESPONSE');
  return response.data;
}
export const familyMapApi = {
  get: async (signal?: AbortSignal) => requireFamilyMap(await data('/api/family-tree/map', { signal })),
  retry: async (signal?: AbortSignal) => requireRetry(await data('/api/family-tree/map/retry-geocoding', { method: 'POST', signal })),
  update: async (id: number, input: LocationInput, signal?: AbortSignal) => requireMember(await data(`/api/family-tree/${requireMapId(id)}/location`, { method: 'PUT', body: JSON.stringify(requireLocationInput(input)), signal })),
};
/** Fresh own-account GET + conflict check + dedicated PUT. Not transactional. */
export async function saveManualLocation(original: FamilyMember, input: LocationInput, signal: AbortSignal, stillCurrent: () => boolean) {
  requireLocationInput(input);
  const latest = await familyDataApi.get(requireMapId(original.id), signal);
  if (signal.aborted || !stillCurrent()) throw new Error('FAMILY_MAP_ACCOUNT_CHANGED');
  assertLocationUnchanged(original, latest);
  await familyMapApi.update(original.id, input, signal);
  if (signal.aborted || !stillCurrent()) throw new Error('FAMILY_MAP_ACCOUNT_CHANGED');
  const member = await familyDataApi.get(original.id, signal);
  const map = await familyMapApi.get(signal);
  return { member, map };
}
