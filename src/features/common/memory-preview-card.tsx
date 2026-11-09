import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/design-system/components/app-icon';
import { AppText } from '@/design-system/components/app-text';
import { AppCard } from '@/design-system/components/surfaces';
import { radius, spacing } from '@/design-system/tokens';
import { useAppTheme } from '@/theme/theme-provider';

export function MemoryPreviewCard({ compact = false }: { compact?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <AppCard style={styles.card}>
      <View style={[styles.art, compact && styles.compactArt, { backgroundColor: colors.surfaceMuted }]}>
        <View style={[styles.sun, { backgroundColor: colors.accentAnniversary }]} />
        <View style={[styles.hillBack, { backgroundColor: colors.accentTimeline }]} />
        <View style={[styles.hillFront, { backgroundColor: colors.accentFamily }]} />
        <View style={[styles.imageTag, { backgroundColor: colors.scrim }]}><AppIcon name={{ ios: 'photo', android: 'photo', web: 'photo' }} size={15} color={colors.onAccent} /><AppText variant="caption" style={{ color: colors.onAccent }}>Khoảnh khắc</AppText></View>
      </View>
      <View style={styles.copy}>
        <AppText variant="caption" tone="secondary">12 THÁNG 8, 2025 · ĐÀ LẠT</AppText>
        <AppText variant="cardTitle">Một buổi chiều thật chậm</AppText>
        {!compact ? <AppText tone="secondary">Cả nhà bên hiên gỗ, đợi cơn mưa ngang qua.</AppText> : null}
      </View>
    </AppCard>
  );
}

export function PlaceholderPhoto({ size = 'large' }: { size?: 'large' | 'small' }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.photo, size === 'small' && styles.smallPhoto, { backgroundColor: colors.surfaceMuted }]} accessibilityLabel="Ảnh minh họa">
      <View style={[styles.sun, styles.photoSun, { backgroundColor: colors.accentAnniversary }]} />
      <View style={[styles.hillBack, { backgroundColor: colors.accentTimeline }]} />
      <View style={[styles.hillFront, { backgroundColor: colors.accentFamily }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  art: { height: 188, overflow: 'hidden', position: 'relative', justifyContent: 'flex-end' },
  compactArt: { height: 130 },
  sun: { position: 'absolute', right: '17%', top: '14%', width: 56, height: 56, borderRadius: 56, opacity: 0.92 },
  hillBack: { position: 'absolute', left: '-12%', bottom: -38, width: '84%', height: 116, borderRadius: 100, transform: [{ rotate: '-12deg' }], opacity: 0.74 },
  hillFront: { position: 'absolute', right: '-20%', bottom: -64, width: '90%', height: 150, borderRadius: 120, transform: [{ rotate: '10deg' }], opacity: 0.86 },
  imageTag: { alignSelf: 'flex-start', margin: spacing.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  copy: { padding: spacing.lg, gap: spacing.xs },
  photo: { height: 210, borderRadius: radius.largeCard, overflow: 'hidden', justifyContent: 'flex-end' },
  smallPhoto: { height: 116 },
  photoSun: { width: 38, height: 38, top: '14%', right: '18%' },
});
