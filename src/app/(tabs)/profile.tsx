import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/design-system/components/avatar';
import { AppIcon } from '@/design-system/components/app-icon';
import { AppText } from '@/design-system/components/app-text';
import { Badge, SegmentedTabs } from '@/design-system/components/controls';
import { ActionRow, AppCard } from '@/design-system/components/surfaces';
import { AppScrollScreen, LargeTitleHeader, SectionHeader } from '@/components/layout/app-screen';
import { radius, spacing } from '@/design-system/tokens';
import { useAppTheme, type ThemeMode } from '@/theme/theme-provider';
import type { AndroidSymbol, SFSymbol } from 'expo-symbols';
import { useAuth } from '@/features/auth/context/auth-provider';
import { getAuthStrings } from '@/features/auth/i18n/authStrings';
import { useToast } from '@/components/feedback/toast-provider';

const themeOptions = [
  { value: 'system', label: 'Hệ thống' },
  { value: 'light', label: 'Sáng' },
  { value: 'dark', label: 'Tối' },
] as const;

export default function ProfileScreen() {
  const { colors, mode, setMode } = useAppTheme();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const copy = getAuthStrings();
  const name = user?.displayName?.trim() || user?.fullName?.trim() || user?.email.split('@')[0] || '';
  const roleLabel = user?.role === 'ADMIN' ? copy.roleAdmin : copy.roleUser;
  const providerLabel = user?.loginProviders?.google && user.loginProviders.local ? 'Google · Email' : user?.loginProviders?.google ? 'Google' : 'Email';

  const handleLogout = async () => {
    const serverLogoutSucceeded = await logout();
    if (!serverLogoutSucceeded) showToast(copy.logoutWarning, 'warning');
  };
  return (
    <AppScrollScreen contentContainerStyle={styles.page}>
      <LargeTitleHeader eyebrow="KHÔNG GIAN CỦA BẠN" title="Tôi" />
      <AppCard style={styles.profileCard}>
        <Avatar uri={user?.avatarUrl ?? undefined} name={name} size={74} accent={colors.accentFamily} />
        <View style={{ flex: 1, gap: spacing.xxs }}>
          <AppText variant="sectionTitle">{name}</AppText>
          <AppText tone="secondary">{user?.email}</AppText>
          <View style={styles.badges}><Badge label={roleLabel} tone="accent" /><AppText variant="caption" tone="tertiary">{providerLabel}</AppText></View>
          <AppText variant="caption" tone="tertiary">{copy.profileJoined}</AppText>
        </View>
      </AppCard>

      <SectionHeader title="Tùy chỉnh giao diện" />
      <View style={styles.themeBlock}>
        <AppText tone="secondary">Chọn cách MyLife hiển thị trên thiết bị này.</AppText>
        <SegmentedTabs<ThemeMode> options={[...themeOptions]} value={mode} onChange={setMode} />
      </View>

      <SectionHeader title="Tài khoản & ứng dụng" />
      <AppCard style={styles.settingsCard}>
        <ActionRow title="Hồ sơ" detail="Tên, email và thông tin cá nhân" leading={<SettingsIcon name="person.crop.circle" android="account_circle" />} trailing={<Chevron />} />
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        <ActionRow title="Giao diện" detail="Sáng, tối hoặc theo thiết bị" leading={<SettingsIcon name="circle.lefthalf.filled" android="contrast" />} trailing={<Chevron />} />
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        <ActionRow title="Ngôn ngữ" detail="Tiếng Việt" leading={<SettingsIcon name="character.bubble" android="translate" />} trailing={<Chevron />} />
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        <ActionRow title="Bảo mật" detail="Mật khẩu và quyền riêng tư" leading={<SettingsIcon name="lock.shield" android="shield_lock" />} trailing={<Chevron />} />
      </AppCard>

      {__DEV__ ? <><SectionHeader title="Dành cho phát triển" /><AppCard style={styles.settingsCard}><ActionRow title="Design System" detail="Xem trước các thành phần giao diện" leading={<SettingsIcon name="square.grid.2x2" android="grid_view" />} trailing={<Chevron />} onPress={() => router.push('/dev/design-system')} /></AppCard></> : null}

      <AppCard style={styles.logoutCard}>
        <ActionRow title={copy.logout} detail="Kết thúc phiên trên thiết bị này" destructive leading={<SettingsIcon name="rectangle.portrait.and.arrow.right" android="logout" />} onPress={() => void handleLogout()} />
      </AppCard>
      <AppText variant="caption" tone="tertiary" style={styles.version}>MYLIFE MOBILE · V3 FOUNDATION</AppText>
    </AppScrollScreen>
  );
}

function SettingsIcon({ name, android }: { name: SFSymbol; android: AndroidSymbol }) {
  const { colors } = useAppTheme();
  return <View style={[styles.iconWrap, { backgroundColor: colors.surfaceMuted }]}><AppIcon name={{ ios: name, android, web: android }} color={colors.accentFamily} size={20} /></View>;
}

function Chevron() {
  const { colors } = useAppTheme();
  return <AppIcon name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} color={colors.textTertiary} size={18} />;
}

const styles = StyleSheet.create({
  page: { gap: spacing.md, paddingBottom: spacing.xxxl },
  profileCard: { padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.largeCard },
  badges: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  themeBlock: { gap: spacing.md },
  settingsCard: { paddingHorizontal: spacing.lg },
  divider: { height: 1, marginLeft: 60 },
  iconWrap: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  logoutCard: { marginTop: spacing.xs, paddingHorizontal: spacing.lg },
  version: { textAlign: 'center', marginVertical: spacing.sm },
});
