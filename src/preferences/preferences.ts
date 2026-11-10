export type ThemeMode = 'system' | 'light' | 'dark';
export type LanguageMode = 'system' | 'vi' | 'en';
export type Language = 'vi' | 'en';
export type Preferences = { theme: ThemeMode; language: LanguageMode };
export const preferenceKey = 'mylife.preferences.v1';
export const defaults: Preferences = { theme: 'system', language: 'system' };

export function parsePreferences(raw: string | null): Preferences {
  try {
    const value = JSON.parse(raw ?? '{}');
    return {
      theme: ['system', 'light', 'dark'].includes(value?.theme) ? value.theme : 'system',
      language: ['system', 'vi', 'en'].includes(value?.language) ? value.language : 'system',
    };
  } catch { return { ...defaults }; }
}

export function resolveLanguage(mode: LanguageMode, deviceLanguage?: string | null): Language {
  return mode === 'system' ? (deviceLanguage?.toLowerCase().split(/[-_]/)[0] === 'en' ? 'en' : 'vi') : mode;
}

type Storage = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<unknown> };
type Snapshot = Preferences & { hydrated: boolean; storageError: boolean };

/** Only whitelisted, non-sensitive preferences. Auth never enters this store. */
export function createPreferenceStore(storage: Storage) {
  let state: Snapshot = { ...defaults, hydrated: false, storageError: false };
  const listeners = new Set<() => void>();
  let revision = 0;
  let hydration: Promise<void> | undefined;
  let writes = Promise.resolve();
  const publish = (patch: Partial<Snapshot>) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  };
  const persist = () => {
    const version = revision;
    const value = JSON.stringify({ theme: state.theme, language: state.language });
    writes = writes.then(async () => {
      try {
        await storage.setItem(preferenceKey, value);
        if (version === revision) publish({ storageError: false });
      } catch { if (version === revision) publish({ storageError: true }); }
    });
    return writes;
  };
  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    hydrate: () => hydration ??= (async () => {
      const version = revision;
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        // A broken storage bridge must not leave the native splash on screen forever.
        const raw = await Promise.race([
          storage.getItem(preferenceKey),
          new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('PREFERENCE_TIMEOUT')), 3000); }),
        ]);
        if (version === revision) publish(parsePreferences(raw));
      } catch { if (version === revision) publish({ storageError: true }); }
      finally { clearTimeout(timer); publish({ hydrated: true }); }
    })(),
    set: (patch: Partial<Preferences>) => {
      revision++;
      publish(parsePreferences(JSON.stringify({ theme: state.theme, language: state.language, ...patch })));
      return persist();
    },
    retry: persist,
  };
}
