import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/design-system/components/buttons';
import { AppText } from '@/design-system/components/app-text';
import { Surface } from '@/design-system/components/surfaces';
import { spacing } from '@/design-system/tokens';
import { useAppTheme } from '@/theme/theme-provider';
import { useLocalization } from '@/localization/use-localization';

export function LoadingState({ label }: { label?: string }) {
  const { colors } = useAppTheme();
  const { copy } = useLocalization();
  return <View accessibilityRole="progressbar" accessibilityLabel={label ?? copy.loading} accessibilityState={{ busy: true }} style={styles.center}><ActivityIndicator color={colors.accentFamily} /><AppText tone="secondary">{label ?? copy.loading}</AppText></View>;
}

export function SkeletonBlock({ width = '100%', height = 16, radius = 12 }: { width?: number | `${number}%`; height?: number; radius?: number }) {
  const { colors } = useAppTheme();
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width, height, borderRadius: radius, backgroundColor: colors.surfaceMuted }} />;
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: { label: string; onPress: () => void } }) {
  const { colors } = useAppTheme();
  return <Surface inset style={styles.state}><AppText variant="sectionTitle">{title}</AppText><AppText tone="secondary" style={styles.centerText}>{message}</AppText>{action ? <PrimaryButton title={action.label} onPress={action.onPress} compact /> : null}<View style={{ backgroundColor: colors.divider, height: 1, width: 44 }} /></Surface>;
}

export function ErrorState({ title, message, retry }: { title: string; message: string; retry?: () => void }) {
  const { copy } = useLocalization();
  return <Surface inset style={styles.state}><View accessibilityRole="alert" accessibilityLiveRegion="polite"><AppText variant="sectionTitle" tone="error">{title}</AppText><AppText tone="secondary" style={styles.centerText}>{message}</AppText></View>{retry ? <PrimaryButton title={copy.retry} onPress={retry} compact /> : null}</Surface>;
}

export function InlineError({ message }: { message: string }) {
  return <AppText accessibilityRole="alert" accessibilityLiveRegion="polite" variant="caption" tone="error">{message}</AppText>;
}

export function OfflineState({ message }: { message?: string }) {
  const { colors } = useAppTheme();
  const { copy } = useLocalization();
  return <View accessibilityLiveRegion="polite" style={[styles.offline, { backgroundColor: colors.surfaceMuted }]}><AppText variant="caption" tone="secondary">{message ?? copy.offline}</AppText></View>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  state: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  centerText: { textAlign: 'center' },
  offline: { padding: spacing.sm, borderRadius: 14 },
});
