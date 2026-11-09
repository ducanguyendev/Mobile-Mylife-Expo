import AsyncStorage from '@react-native-async-storage/async-storage';

const key = 'mylife.remembered-email.v1';

export const rememberedEmailStorage = {
  async read(): Promise<{ rememberMe: boolean; email: string | null }> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return { rememberMe: false, email: null };
      const stored = JSON.parse(raw) as { rememberMe?: unknown; email?: unknown };
      return stored.rememberMe === true && typeof stored.email === 'string'
        ? { rememberMe: true, email: stored.email }
        : { rememberMe: false, email: null };
    } catch {
      return { rememberMe: false, email: null };
    }
  },
  async write(email: string) {
    await AsyncStorage.setItem(key, JSON.stringify({ rememberMe: true, email }));
  },
  async clear() {
    await AsyncStorage.removeItem(key);
  },
};
