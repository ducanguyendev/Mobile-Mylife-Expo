import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type PropsWithChildren } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocales } from 'expo-localization';
import * as SplashScreen from 'expo-splash-screen';

import { palettes, type AppColors } from '@/design-system/tokens';

import { createPreferenceStore, resolveLanguage, type ThemeMode, type LanguageMode, type Language } from '@/preferences/preferences';
export type { ThemeMode } from '@/preferences/preferences';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);
const preferences = createPreferenceStore(AsyncStorage);

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  colors: AppColors;
  setMode: (mode: ThemeMode) => void;
  language: Language;
  languageMode: LanguageMode;
  setLanguageMode: (mode: LanguageMode) => void;
  storageError: boolean;
  retryPreferences: () => void;
  reducedMotion: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const locales = useLocales();
  const state = useSyncExternalStore(preferences.subscribe, preferences.getSnapshot, preferences.getSnapshot);
  const mode = state.theme;
  const language = resolveLanguage(state.language, locales[0]?.languageCode);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    void preferences.hydrate();
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => { if (active) setReducedMotion(enabled); }).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => { active = false; subscription.remove(); };
  }, []);
  useEffect(() => { if (state.hydrated) SplashScreen.hide(); }, [state.hydrated]);
  const resolvedMode = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const value = useMemo(
    () => ({ mode, resolvedMode, colors: palettes[resolvedMode],
      setMode: (theme: ThemeMode) => { void preferences.set({ theme }); },
      language, languageMode: state.language,
      setLanguageMode: (next: LanguageMode) => { void preferences.set({ language: next }); },
      storageError: state.storageError, retryPreferences: () => { void preferences.retry(); }, reducedMotion }),
    [mode, resolvedMode, language, state.language, state.storageError, reducedMotion],
  );

  return state.hydrated ? <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider> : null;
}

export function useAppTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useAppTheme must be used inside AppThemeProvider.');
  return value;
}
