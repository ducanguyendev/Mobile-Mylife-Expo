import { Pressable, StyleSheet, View, type ViewProps, type PressableProps } from 'react-native';

import { radius, shadows, spacing } from '@/design-system/tokens';
import { AppText } from '@/design-system/components/app-text';
import { useAppTheme } from '@/theme/theme-provider';

type SurfaceProps = ViewProps & { elevated?: boolean; muted?: boolean; inset?: boolean };

export function Surface({ children, elevated = false, muted = false, inset = false, style, ...props }: SurfaceProps) {
  const { colors } = useAppTheme();
  const backgroundColor = muted ? colors.surfaceMuted : elevated ? colors.surfaceElevated : colors.surface;
  return (
    <View
      style={[
        styles.surface,
        inset && styles.inset,
        elevated && shadows.card,
        { backgroundColor },
        style,
      ]}
      {...props}>
      {children}
    </View>
  );
}

export function AppCard(props: SurfaceProps) {
  return <Surface {...props} style={[styles.card, props.style]} />;
}

export function EditorialCard(props: SurfaceProps) {
  return <Surface {...props} style={[styles.editorial, props.style]} />;
}

export function InfoCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  const { colors } = useAppTheme();
  return (
    <Surface inset style={styles.infoCard}>
      <View style={[styles.infoAccent, { backgroundColor: accent ?? colors.accentFamily }]} />
      <AppText variant="caption" tone="secondary">{label}</AppText>
      <AppText variant="cardTitle">{value}</AppText>
    </Surface>
  );
}

export function ActionRow({ title, detail, leading, trailing, onPress, destructive = false, ...props }: PressableProps & {
  title: string;
  detail?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  destructive?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={({ pressed }) => [styles.actionRow, { opacity: pressed && onPress ? 0.72 : 1 }]}
      {...props}>
      {leading}
      <View style={styles.actionCopy}>
        <AppText variant="bodyMedium" style={destructive ? { color: colors.error } : undefined}>{title}</AppText>
        {detail ? <AppText variant="caption" tone="secondary">{detail}</AppText> : null}
      </View>
      {trailing}
    </Pressable>
  );
}

export function SettingsRow(props: Parameters<typeof ActionRow>[0]) {
  return <ActionRow {...props} />;
}

const styles = StyleSheet.create({
  surface: { borderRadius: radius.card, overflow: 'hidden' },
  inset: { padding: spacing.lg },
  card: { borderRadius: radius.card },
  editorial: { borderRadius: radius.hero },
  infoCard: { flex: 1, gap: spacing.xs, minHeight: 104, justifyContent: 'center' },
  infoAccent: { position: 'absolute', top: 0, left: 0, width: 3, height: '100%' },
  actionRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  actionCopy: { flex: 1, gap: 2 },
});
