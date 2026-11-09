import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/design-system/components/app-text';
import { SegmentedTabs } from '@/design-system/components/controls';
import { AppCard } from '@/design-system/components/surfaces';
import { AppScrollScreen, LargeTitleHeader, SectionHeader } from '@/components/layout/app-screen';
import { MemoryPreviewCard, PlaceholderPhoto } from '@/features/common/memory-preview-card';
import { radius, spacing } from '@/design-system/tokens';
import { useAppTheme } from '@/theme/theme-provider';

const options = [
  { value: 'timeline', label: 'Dòng thời gian' },
  { value: 'calendar', label: 'Lịch' },
  { value: 'library', label: 'Thư viện' },
] as const;
type MemoryTab = (typeof options)[number]['value'];

export default function MemoriesScreen() {
  const [tab, setTab] = useState<MemoryTab>('timeline');
  const { colors } = useAppTheme();
  return (
    <AppScrollScreen contentContainerStyle={styles.page}>
      <LargeTitleHeader eyebrow="MỘT KHO LƯU GIỮ" title="Ký ức" subtitle="Những ngày tháng muốn nhớ thật lâu." />
      <SegmentedTabs options={[...options]} value={tab} onChange={setTab} />
      <View style={styles.featuredLabel}><AppText variant="caption" tone="secondary">GẦN ĐÂY · THÁNG 8, 2025</AppText><View style={[styles.tinyDot, { backgroundColor: colors.accentTimeline }]} /></View>
      {tab === 'timeline' ? <MemoryPreviewCard /> : tab === 'library' ? (
        <AppCard style={styles.albumCard}>
          <PlaceholderPhoto />
          <View style={styles.albumCopy}><AppText variant="caption" tone="secondary">ALBUM GIA ĐÌNH</AppText><AppText variant="cardTitle">Mùa hè ở Đà Lạt</AppText><AppText tone="secondary">18 khoảnh khắc · Cả nhà cùng lưu</AppText></View>
        </AppCard>
      ) : (
        <AppCard style={styles.calendarCard}>
          <View style={[styles.dateBadge, { backgroundColor: `${colors.accentAnniversary}20` }]}><AppText variant="caption" style={{ color: colors.accentAnniversary }}>THÁNG 8</AppText><AppText variant="screenTitle" style={{ color: colors.accentAnniversary }}>12</AppText></View>
          <View style={{ flex: 1, gap: spacing.xs }}><AppText variant="cardTitle">Một ngày ở Đà Lạt</AppText><AppText tone="secondary">2025 · Chuyến đi đầu tiên cả nhà đi đủ mặt.</AppText></View>
        </AppCard>
      )}
      <SectionHeader title="Cùng ngày này" />
      <AppCard style={styles.sameDay}>
        <View style={[styles.sameDayArt, { backgroundColor: colors.surfaceMuted }]}><PlaceholderPhoto size="small" /></View>
        <View style={styles.sameDayCopy}><AppText variant="caption" tone="secondary">4 NĂM TRƯỚC</AppText><AppText variant="bodyMedium">Bữa cơm đầu tiên ở căn nhà mới.</AppText></View>
      </AppCard>
      <AppText variant="caption" tone="tertiary">NỘI DUNG MINH HỌA · CHƯA KẾT NỐI DỮ LIỆU</AppText>
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  page: { gap: spacing.md, paddingBottom: spacing.xxxl },
  featuredLabel: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', marginTop: spacing.sm },
  tinyDot: { width: 6, height: 6, borderRadius: 5 },
  albumCard: { overflow: 'hidden' },
  albumCopy: { padding: spacing.lg, gap: spacing.xs },
  calendarCard: { padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  dateBadge: { width: 78, height: 82, borderRadius: radius.small, alignItems: 'center', justifyContent: 'center' },
  sameDay: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, alignItems: 'center' },
  sameDayArt: { width: 98, height: 86, borderRadius: radius.small, overflow: 'hidden' },
  sameDayCopy: { flex: 1, gap: spacing.xs },
});
