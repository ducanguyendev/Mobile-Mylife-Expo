import { apiRequest } from '@/api/apiClient';
import type { FamilyMember, FamilyMemberInput, FamilyMemberWriteInput, Generation } from '../types/family';
import type { FamilyMemberProfile } from '../types/profile';

type Envelope<T> = { success: boolean; data: T };

async function getData<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await apiRequest<Envelope<T>>(path, options);
  if (!response || response.success !== true || !('data' in response)) throw new Error('FAMILY_INVALID_RESPONSE');
  return response.data;
}

export const familyApi = {
  list: (signal?: AbortSignal) => getData<FamilyMember[]>('/api/family-tree', { signal }),
  generations: (signal?: AbortSignal) => getData<Generation[]>('/api/family-tree/generations', { signal }),
  get: (id: number, signal?: AbortSignal) => getData<FamilyMember>(`/api/family-tree/${id}`, { signal }),
  profile: (id: number, signal?: AbortSignal) => getData<FamilyMemberProfile>(`/api/family-tree/${id}/profile`, { signal }),
  create: (input: FamilyMemberInput) => getData<FamilyMember>('/api/family-tree', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: number, input: FamilyMemberWriteInput) => getData<FamilyMember>(`/api/family-tree/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  delete: (id: number) => apiRequest<void>(`/api/family-tree/${id}`, { method: 'DELETE' }),
  uploadAvatar: (id: number, body: FormData) => getData<FamilyMember>(`/api/family-tree/${id}/avatar`, { method: 'POST', body }),
  deleteAvatar: (id: number) => getData<FamilyMember>(`/api/family-tree/${id}/avatar`, { method: 'DELETE' }),
};
