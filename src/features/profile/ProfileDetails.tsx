import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { AppText } from '@/design-system/components/app-text';
import { AppCard } from '@/design-system/components/surfaces';
import { SecondaryButton, TextButton } from '@/design-system/components/buttons';
import { useAuth } from '@/features/auth/context/auth-provider';
import { useLocalization } from '@/localization/use-localization';
import { spacing } from '@/design-system/tokens';
import { profileInput } from './profile-data';
import { m8Strings } from './m8-strings';

export function ProfileDetails() {
  const { user, refreshSession } = useAuth();
  const { language, locale } = useLocalization();
  const copy = m8Strings[language];
  const active = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const refresh = useCallback(async () => {
    setLoading(true); setError(false);
    try { await refreshSession(); }
    catch { if (active.current) setError(true); }
    finally { if (active.current) setLoading(false); }
  }, [refreshSession]);
  useFocusEffect(useCallback(() => { active.current = true; void refresh(); return () => { active.current = false; }; }, [refresh]));
  if (!user) return null;
  const values = { id: user.id, fullName: user.fullName, displayName: user.displayName, phoneNumber: user.phoneNumber, gender: user.gender, dateOfBirth: profileInput(user).dateOfBirth };
  return <View style={{ gap: spacing.md }}>
    {loading ? <AppText accessibilityLiveRegion="polite">{language === 'vi' ? 'Đang tải…' : 'Loading…'}</AppText> : null}
    {error ? <View><AppText accessibilityRole="alert" tone="error">{copy.error}</AppText><TextButton title={copy.retry} onPress={() => void refresh()} /></View> : null}
    <AppCard style={{ padding: spacing.lg, gap: spacing.sm }}>
      {Object.entries(values).map(([key, value]) => <View key={key}><AppText variant="caption" tone="secondary">{copy[key as keyof typeof values]}</AppText><AppText selectable>{value || '—'}</AppText></View>)}
      <AppText variant="caption" tone="secondary">{copy.readonly}</AppText>
      <AppText variant="caption" tone="secondary">{copy.accountStatus}</AppText><AppText>{user.isActive ? copy.active : copy.locked}</AppText>
      {([['created', user.createdAt], ['updated', user.updatedAt], ['verified', user.verifiedAt]] as const).map(([key, value]) => <View key={key}><AppText variant="caption" tone="secondary">{copy[key]}</AppText><AppText>{value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'}</AppText></View>)}
    </AppCard>
    <SecondaryButton title={copy.edit} onPress={() => router.push('/account/edit')} />
    <SecondaryButton title={copy.avatar} onPress={() => router.push('/account/avatar')} />
    <SecondaryButton title={copy.security} onPress={() => router.push('/account/security')} />
  </View>;
}
