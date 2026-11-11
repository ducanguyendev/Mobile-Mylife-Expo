// Existing M1 loader is unchanged; this adapter additionally supplies multipart globals.
const { createLoader, hookRuntime } = require('./load-foundation.cjs');
function createM3Runtime(base, fetchImpl = fetch) {
  const values = new Map(); const remembered = new Map(); const h = hookRuntime();
  const load = createLoader({
    'react-native': { Platform: { OS: 'android' } },
    'expo-secure-store': { getItemAsync: async key => values.get(key) ?? null, setItemAsync: async (key, value) => { values.set(key, value); }, deleteItemAsync: async key => { values.delete(key); } },
    '@react-native-async-storage/async-storage': { getItem: async key => remembered.get(key) ?? null, setItem: async (key, value) => { remembered.set(key, value); }, removeItem: async key => { remembered.delete(key); } },
    '@/config/env': { appEnv: { apiBaseUrl: base } }, react: h.hooks, 'react/jsx-runtime': { jsx: h.jsx, jsxs: h.jsx },
  }, { fetch: fetchImpl, FormData, Blob, URL });
  const { AuthProvider } = load('src/features/auth/context/auth-provider.tsx');
  return { load, storage: load('src/features/auth/storage/authTokenStorage.ts').authTokenStorage,
    api: load('src/api/apiClient.ts'), auth: load('src/features/auth/api/authApi.ts'),
    family: load('src/features/family/api/familyApi.ts').familyApi,
    data: load('src/features/family/api/familyDataApi.ts').familyDataApi,
    context: () => h.render(AuthProvider).props.value };
}
function member(id, patch = {}) {
  return { id, fullName: `Member ${id}`, generation: 1, gender: 'male', dateOfBirth: null, lifeStatus: 'LIVING', deathDate: null, role: null,
    address: null, latitude: null, longitude: null, locationDisplayName: null, locationSource: null, locationStatus: 'NO_ADDRESS', phoneNumber: null,
    facebookUrl: null, instagramUrl: null, avatarUrl: null, hasManagedAvatar: false, biography: null, fatherId: null, fatherName: null, motherId: null, motherName: null,
    spouseId: null, spouseName: null, childIds: [], childNames: [], horizontalRelations: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', ...patch };
}
module.exports = { createM3Runtime, member };
