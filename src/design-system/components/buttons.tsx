import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { AppText } from '@/design-system/components/app-text';
import { radius, spacing } from '@/design-system/tokens';
import { useAppTheme } from '@/theme/theme-provider';

type ButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  compact?: boolean;
  loading?: boolean;
};

function AppButton({ title, icon, fullWidth, compact, loading, style, disabled, ...props }: ButtonProps & { kind: 'primary' | 'secondary' | 'tertiary' | 'destructive' }) {
  const { colors } = useAppTheme();
  const { kind, ...pressableProps } = props;
  const bg = kind === 'primary' ? colors.accentFamily : kind === 'destructive' ? colors.error : 'transparent';
  const fg = kind === 'primary' || kind === 'destructive' ? colors.onAccent : kind === 'secondary' ? colors.accentFamily : colors.textSecondary;
  const borderColor = kind === 'secondary' ? colors.controlBorder : 'transparent';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      style={(state) => [
        styles.button,
        compact && styles.compact,
        fullWidth && styles.fullWidth,
        { backgroundColor: bg, borderColor, opacity: disabled ? 0.45 : state.pressed ? 0.82 : 1 },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...pressableProps}>
      {loading ? <ActivityIndicator size="small" color={fg} /> : icon}
      <AppText variant="button" style={{ color: fg, flexGrow: 1, flexShrink: 1, textAlign: 'center' }}>{title}</AppText>
    </Pressable>
  );
}

export function PrimaryButton(props: ButtonProps) { return <AppButton {...props} kind="primary" />; }
export function SecondaryButton(props: ButtonProps) { return <AppButton {...props} kind="secondary" />; }
export function TextButton(props: ButtonProps) { return <AppButton {...props} kind="tertiary" />; }
export function TertiaryButton(props: ButtonProps) { return <TextButton {...props} />; }
export function DestructiveButton(props: ButtonProps) { return <AppButton {...props} kind="destructive" />; }

export function IconButton({ icon, label, onPress, disabled = false }: { icon: React.ReactNode; label: string; onPress?: () => void; disabled?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.surfaceMuted, opacity: pressed ? 0.72 : 1 }]}>
      <View>{icon}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 48, borderWidth: 1, borderRadius: radius.input, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  compact: { minHeight: 48, paddingHorizontal: spacing.md },
  fullWidth: { alignSelf: 'stretch' },
  iconButton: { width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
