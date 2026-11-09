import { apiRequest } from '@/api/apiClient';
import type { FamilyMember, FamilyMemberInput, Generation } from '../types/family';

type Envelope<T> = { success: boolean; data: T };

async function getData<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await apiRequest<Envelope<T>>(path, options);
  if (!response || response.success !== true || !('data' in response)) throw new Error('FAMILY_INVALID_RESPONSE');
  return response.data;
}

export const familyApi = {
  list: () => getData<FamilyMember[]>('/api/family-tree'),
  generations: () => getData<Generation[]>('/api/family-tree/generations'),
  get: (id: number) => getData<FamilyMember>(`/api/family-tree/${id}`),
  create: (input: FamilyMemberInput) => getData<FamilyMember>('/api/family-tree', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: number, input: FamilyMemberInput) => getData<FamilyMember>(`/api/family-tree/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  delete: (id: number) => apiRequest<void>(`/api/family-tree/${id}`, { method: 'DELETE' }),
};
