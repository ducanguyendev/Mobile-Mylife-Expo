import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { onSessionExpired } from '@/features/auth/context/authEvents';
import { AuthProvider, useAuth } from '@/features/auth/context/auth-provider';
import { ToastProvider, useToast } from '@/components/feedback/toast-provider';
import { LoadingState } from '@/components/feedback/states';
import { AppScreen } from '@/components/layout/app-screen';
import { AppText } from '@/design-system/components/app-text';
import { getAuthStrings } from '@/features/auth/i18n/authStrings';
import { AppThemeProvider, useAppTheme } from '@/theme/theme-provider';

function AppNavigation() {
  const { resolvedMode, colors } = useAppTheme();
  const { status } = useAuth();
  const navigationTheme = useMemo(() => {
    const base = resolvedMode === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.accentFamily,
        background: colors.background,
        card: colors.surface,
        text: colors.textPrimary,
        border: colors.border,
        notification: colors.accentAnniversary,
      },
    };
  }, [colors, resolvedMode]);

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
      <ToastProvider>
        <SessionExpiryFeedback />
        <View style={styles.navigator}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
            <Stack.Protected guard={status === 'authenticated'} redirectTo="/(auth)/login">
              <Stack.Screen name="(tabs)" />
            </Stack.Protected>
            <Stack.Protected guard={status !== 'authenticated'} redirectTo="/(tabs)">
              <Stack.Screen name="(auth)" />
            </Stack.Protected>
            <Stack.Protected guard={__DEV__}>
              <Stack.Screen name="dev/design-system" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            </Stack.Protected>
          </Stack>
          {status === 'checking' ? (
            <View style={[StyleSheet.absoluteFill, styles.bootstrap]}><AppScreen padded centered><LoadingState label={getAuthStrings().welcome} /><AppText tone="tertiary">MYLIFE</AppText></AppScreen></View>
          ) : null}
        </View>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return <AppThemeProvider><AuthProvider><AppNavigation /></AuthProvider></AppThemeProvider>;
}

function SessionExpiryFeedback() {
  const { showToast } = useToast();
  useEffect(() => onSessionExpired(() => { showToast(getAuthStrings().sessionExpired, 'warning'); }), [showToast]);
  return null;
}

const styles = StyleSheet.create({ navigator: { flex: 1 }, bootstrap: { zIndex: 2 } });
