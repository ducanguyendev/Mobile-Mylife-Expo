import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/design-system/components/avatar';
import { AppText } from '@/design-system/components/app-text';
import { SecondaryButton } from '@/design-system/components/buttons';
import { AppIcon } from '@/design-system/components/app-icon';
import { AppCard, Surface } from '@/design-system/components/surfaces';
import { AppScrollScreen, LargeTitleHeader, SectionHeader } from '@/components/layout/app-screen';
import { MemoryPreviewCard, PlaceholderPhoto } from '@/features/common/memory-preview-card';
import { radius, spacing } from '@/design-system/tokens';
import { useAppTheme } from '@/theme/theme-provider';

export default function HomeScreen() {
  const { colors } = useAppTheme();
  return (
    <AppScrollScreen contentContainerStyle={styles.page}>
      <LargeTitleHeader eyebrow="THỨ HAI, 18 THÁNG 5" title="Chào buổi sáng, Minh" subtitle="Một ngày đẹp để giữ lại điều gì đó." />

      <Surface style={[styles.hero, { backgroundColor: colors.accentFamily }]}>
        <View style={styles.heroCopy}>
          <AppText variant="caption" style={{ color: colors.onAccentMuted }}>GIA ĐÌNH LÀ NHỮNG ĐIỀU BÌNH DỊ</AppText>
          <AppText variant="display" style={{ color: colors.onAccent, maxWidth: 280 }}>Câu chuyện của chúng ta, từng ngày một.</AppText>
          <AppText style={{ color: colors.onAccentMuted }}>Những người thân yêu luôn ở gần đây.</AppText>
        </View>
        <View style={[styles.heroStamp, { backgroundColor: colors.heroStamp }]}><AppText variant="sectionTitle" style={{ color: colors.accentFamily }}>M</AppText><AppText variant="caption" style={{ color: colors.accentFamily }}>MYLIFE</AppText></View>
        <View style={[styles.heroOrb, { borderColor: colors.accentDecoration }]} />
      </Surface>

      <SectionHeader title="Hôm nay" />
      <AppCard style={styles.eventCard}>
        <View style={[styles.eventDate, { backgroundColor: `${colors.accentAnniversary}20` }]}>
          <AppText variant="caption" style={{ color: colors.accentAnniversary }}>THÁNG 5</AppText>
          <AppText variant="sectionTitle" style={{ color: colors.accentAnniversary }}>20</AppText>
        </View>
        <View style={styles.eventCopy}>
          <AppText variant="cardTitle">Ngày của Bà ngoại</AppText>
          <AppText tone="secondary">Còn 2 ngày · Một dịp để gọi về</AppText>
        </View>
        <AppIcon name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={19} />
      </AppCard>

      <SectionHeader title="Gia đình mình" action={<AppText variant="label" tone="accent">12 thành viên</AppText>} />
      <AppCard style={styles.familyCard}>
        <View style={styles.avatarStack}>
          <Avatar name="Mai Anh" size={42} accent={colors.surface} />
          <Avatar name="Tuấn Minh" size={42} accent={colors.surface} />
          <Avatar name="Bảo An" size={42} accent={colors.surface} />
          <View style={[styles.moreAvatar, { backgroundColor: colors.surfaceMuted, borderColor: colors.surface }]}><AppText variant="caption" tone="secondary">+9</AppText></View>
        </View>
        <View style={styles.familyCopy}><AppText variant="cardTitle">Ba thế hệ, chung một mái nhà</AppText><AppText tone="secondary">Lần cập nhật gần nhất: hôm qua</AppText></View>
      </AppCard>

      <SectionHeader title="Mới trong album" action={<SecondaryButton title="Xem tất cả" compact onPress={() => router.push('/(tabs)/memories')} />} />
      <MemoryPreviewCard compact />

      <View style={styles.bottomNote}>
        <PlaceholderPhoto size="small" />
        <View style={{ flex: 1, gap: spacing.xs }}><AppText variant="caption" tone="secondary">MỘT LƯU Ý NHỎ</AppText><AppText variant="bodyMedium">Ký ức đẹp nhất thường bắt đầu từ những điều bình thường.</AppText></View>
      </View>
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  page: { gap: spacing.md, paddingBottom: spacing.xxxl },
  hero: { minHeight: 245, borderRadius: radius.hero, padding: spacing.xl, justifyContent: 'space-between', overflow: 'hidden' },
  heroCopy: { gap: spacing.sm, zIndex: 1 },
  heroStamp: { alignSelf: 'flex-end', alignItems: 'center', justifyContent: 'center', width: 58, height: 58, borderRadius: 29, zIndex: 1 },
  heroOrb: { position: 'absolute', width: 260, height: 260, right: -120, top: -72, borderWidth: 1, borderRadius: 160 },
  eventCard: { padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  eventDate: { width: 62, height: 66, alignItems: 'center', justifyContent: 'center', borderRadius: radius.small },
  eventCopy: { flex: 1, gap: spacing.xxs },
  familyCard: { padding: spacing.lg, gap: spacing.md },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  moreAvatar: { width: 42, height: 42, borderRadius: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginLeft: -9 },
  familyCopy: { gap: spacing.xxs },
  bottomNote: { marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xs },
});
