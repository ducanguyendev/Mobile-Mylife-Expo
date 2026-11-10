import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar } from '@/design-system/components/avatar';
import { AppText } from '@/design-system/components/app-text';
import { Badge, SegmentedTabs } from '@/design-system/components/controls';
import { ActionRow, AppCard } from '@/design-system/components/surfaces';
import { PrimaryButton } from '@/design-system/components/buttons';
import { AppScrollScreen, LargeTitleHeader, SectionHeader } from '@/components/layout/app-screen';
import { spacing } from '@/design-system/tokens';
import { useAppTheme, type ThemeMode } from '@/theme/theme-provider';
import type { LanguageMode } from '@/preferences/preferences';
import { useAuth } from '@/features/auth/context/auth-provider';
import { getAuthStrings } from '@/features/auth/i18n/authStrings';
import { useToast } from '@/components/feedback/toast-provider';
import { useLocalization } from '@/localization/use-localization';

export default function ProfileScreen() {
  const { mode, setMode, languageMode, setLanguageMode, storageError, retryPreferences } = useAppTheme();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const { copy, language } = useLocalization();
  const auth = getAuthStrings(language);
  const [busy, setBusy] = useState(false);
  const name = user?.displayName?.trim() || user?.fullName?.trim() || user?.name?.trim() || copy.unnamed;
  const roleLabel = user?.role === 'ADMIN' ? auth.roleAdmin : auth.roleUser;
  const providers = user?.loginProviders;
  const providerLabel = providers?.google && providers.local ? 'Google · Email' : providers?.google ? 'Google' : providers?.local ? 'Email' : user?.authProviderName?.trim() || copy.unknownProvider;
  const handleLogout = async () => {
    if (busy) return;
    setBusy(true);
    try { if (!await logout()) showToast(auth.logoutWarning, 'warning'); }
    finally { setBusy(false); }
  };
  return <AppScrollScreen>
    <LargeTitleHeader eyebrow={copy.yourSpace} title={copy.profile} />
    <View style={styles.page}>
      <AppCard style={styles.card}>
        <Avatar uri={user?.avatarUrl ?? undefined} name={name} size={64} />
        <AppText variant="sectionTitle">{name}</AppText><AppText tone="secondary" selectable>{user?.email}</AppText>
        <Badge label={roleLabel} tone="accent" /><AppText variant="caption" tone="tertiary">{providerLabel}</AppText>
      </AppCard>
      <SectionHeader title={copy.appearance} />
      <AppText tone="secondary">{copy.appearanceHint}</AppText>
      <SegmentedTabs<ThemeMode> value={mode} onChange={setMode} options={[{ value: 'system', label: copy.system }, { value: 'light', label: copy.light }, { value: 'dark', label: copy.dark }]} />
      <SectionHeader title={copy.language} />
      <AppText tone="secondary">{copy.languageHint}</AppText>
      <SegmentedTabs<LanguageMode> value={languageMode} onChange={setLanguageMode} options={[{ value: 'system', label: copy.system }, { value: 'vi', label: copy.vietnamese }, { value: 'en', label: copy.english }]} />
      {storageError ? <AppCard style={styles.card}><AppText accessibilityRole="alert" accessibilityLiveRegion="polite" tone="error">{copy.preferenceError}</AppText><PrimaryButton title={copy.retry} onPress={retryPreferences} /></AppCard> : null}
      <SectionHeader title={copy.account} />
      <AppCard style={styles.card}>
        <ActionRow title={copy.editProfile} detail={copy.comingSoon} disabled accessibilityState={{ disabled: true }} />
        <ActionRow title={copy.security} detail={copy.comingSoon} disabled accessibilityState={{ disabled: true }} />
      </AppCard>
      {__DEV__ ? <AppCard style={styles.card}><ActionRow title={copy.designSystem} detail={copy.designSystemHint} onPress={() => router.push('/dev/design-system')} /></AppCard> : null}
      <AppText tone="secondary">{copy.logoutHint}</AppText>
      <PrimaryButton title={auth.logout} loading={busy} onPress={() => void handleLogout()} />
    </View>
  </AppScrollScreen>;
}
const styles = StyleSheet.create({ page: { gap: spacing.md, paddingBottom: spacing.xl }, card: { padding: spacing.lg, gap: spacing.sm } });
