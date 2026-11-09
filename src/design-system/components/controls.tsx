import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/design-system/components/app-text';
import { radius, spacing } from '@/design-system/tokens';
import { useAppTheme } from '@/theme/theme-provider';

export type SegmentedOption<T extends string> = { value: T; label: string };

export function SegmentedTabs<T extends string>({ options, value, onChange }: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View accessibilityRole="tablist" style={[styles.segmented, { backgroundColor: colors.surfaceMuted }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [styles.segment, selected && { backgroundColor: colors.surfaceElevated }, { opacity: pressed ? 0.75 : 1 }]}>
            <AppText variant="label" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82} tone={selected ? 'primary' : 'secondary'}>{option.label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function FilterChip({ label, selected = false, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.chip, { backgroundColor: selected ? colors.accentFamily : colors.surfaceMuted, borderColor: selected ? colors.accentFamily : colors.border, opacity: pressed ? 0.8 : 1 }]}>
      <AppText variant="label" tone={selected ? 'primary' : 'secondary'} style={selected ? { color: colors.onAccent } : undefined}>{label}</AppText>
    </Pressable>
  );
}

export function ChoiceChip(props: { label: string; selected?: boolean; onPress?: () => void }) {
  return <FilterChip {...props} />;
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>{children}</ScrollView>;
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'error' }) {
  const { colors } = useAppTheme();
  const toneColors = { neutral: colors.surfaceMuted, accent: colors.accentFamily, success: colors.success, warning: colors.warning, error: colors.error };
  const color = toneColors[tone];
  return <View style={[styles.badge, { backgroundColor: tone === 'neutral' ? color : `${color}20` }]}><AppText variant="caption" style={{ color: tone === 'neutral' ? colors.textSecondary : color }}>{label}</AppText></View>;
}

export function StatusPill(props: { label: string; tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'error' }) {
  return <Badge {...props} />;
}

const styles = StyleSheet.create({
  segmented: { flexDirection: 'row', gap: 3, padding: 4, borderRadius: radius.input, width: '100%' },
  segment: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xs, borderRadius: radius.small },
  chip: { minHeight: 40, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center' },
  chipRow: { gap: spacing.xs, paddingVertical: spacing.xxs },
  badge: { minHeight: 25, alignSelf: 'flex-start', paddingHorizontal: spacing.sm, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
