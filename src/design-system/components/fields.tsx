import { useState, type Ref } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputInstance,
  type TextInputProps,
} from 'react-native';

import { AppIcon } from '@/design-system/components/app-icon';
import { AppText } from '@/design-system/components/app-text';
import { radius, spacing } from '@/design-system/tokens';
import { useAppTheme } from '@/theme/theme-provider';

type FieldBaseProps = {
  label?: string;
  error?: string;
  helperText?: string;
  leadingIcon?: React.ReactNode;
  trailingAction?: React.ReactNode;
  inputRef?: Ref<TextInputInstance>;
  disabled?: boolean;
  readOnly?: boolean;
  containerStyle?: object;
};

type TextFieldProps = FieldBaseProps & Omit<TextInputProps, 'editable'> & { keyboardType?: KeyboardTypeOptions };

export function MyLifeTextField({
  label,
  error,
  helperText,
  leadingIcon,
  trailingAction,
  inputRef,
  disabled = false,
  readOnly = false,
  containerStyle,
  style,
  ...inputProps
}: TextFieldProps) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const editable = !disabled && !readOnly;
  return (
    <View style={[styles.field, containerStyle]}>
      {label ? <AppText variant="label">{label}</AppText> : null}
      <View
        style={[
          styles.inputShell,
          { backgroundColor: colors.surfaceElevated, borderColor: error ? colors.error : focused ? colors.accentFamily : colors.border },
          disabled && { backgroundColor: colors.surfaceMuted, opacity: 0.68 },
        ]}>
        {leadingIcon}
        <TextInput
          ref={inputRef}
          {...inputProps}
          editable={editable}
          onFocus={(event) => { setFocused(true); inputProps.onFocus?.(event); }}
          onBlur={(event) => { setFocused(false); inputProps.onBlur?.(event); }}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.accentFamily}
          accessibilityLabel={inputProps.accessibilityLabel ?? label}
          style={[styles.input, { color: colors.textPrimary }, style]}
        />
        {trailingAction}
      </View>
      {error ? <AppText variant="caption" tone="error">{error}</AppText> : helperText ? <AppText variant="caption" tone="secondary">{helperText}</AppText> : null}
    </View>
  );
}

export function MyLifePasswordField({ showPasswordLabel = 'Show password', hidePasswordLabel = 'Hide password', ...props }: TextFieldProps & {
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
}) {
  const { colors } = useAppTheme();
  const [visible, setVisible] = useState(false);
  return (
    <MyLifeTextField
      {...props}
      secureTextEntry={!visible}
      trailingAction={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? hidePasswordLabel : showPasswordLabel}
          onPress={() => setVisible((value) => !value)}
          hitSlop={8}
          style={styles.trailingButton}>
          <AppIcon name={{ ios: visible ? 'eye.slash' : 'eye', android: visible ? 'visibility_off' : 'visibility', web: visible ? 'visibility_off' : 'visibility' }} color={colors.textSecondary} size={19} />
        </Pressable>
      }
    />
  );
}

export function MyLifeTextArea({ numberOfLines = 4, style, ...props }: TextFieldProps & { numberOfLines?: number }) {
  return (
    <MyLifeTextField
      {...props}
      multiline
      numberOfLines={numberOfLines}
      textAlignVertical="top"
      style={[styles.textArea, style]}
    />
  );
}

export function MyLifeSearchField({ value, onChangeText, placeholder = 'Tìm kiếm', ...props }: TextFieldProps) {
  const { colors } = useAppTheme();
  return (
    <MyLifeTextField
      {...props}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      returnKeyType={props.returnKeyType ?? 'search'}
      leadingIcon={<AppIcon name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} color={colors.textTertiary} size={19} />}
      trailingAction={value ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Xóa nội dung" onPress={() => onChangeText?.('')} hitSlop={8} style={styles.trailingButton}>
          <AppIcon name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }} color={colors.textTertiary} size={18} />
        </Pressable>
      ) : undefined}
    />
  );
}

export function MyLifeSelectField({ label, value, placeholder = 'Chọn một mục', onPress, error, helperText, disabled }: FieldBaseProps & {
  value?: string;
  placeholder?: string;
  onPress?: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.field}>
      {label ? <AppText variant="label">{label}</AppText> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled, expanded: false }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [styles.inputShell, { backgroundColor: colors.surfaceElevated, borderColor: error ? colors.error : colors.border, opacity: disabled ? 0.6 : pressed ? 0.78 : 1 }]}>
        <AppText tone={value ? 'primary' : 'tertiary'} style={styles.value}>{value ?? placeholder}</AppText>
        <AppIcon name={{ ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }} size={18} color={colors.textSecondary} />
      </Pressable>
      {error ? <AppText variant="caption" tone="error">{error}</AppText> : helperText ? <AppText variant="caption" tone="secondary">{helperText}</AppText> : null}
    </View>
  );
}

export function MyLifeDateField({ label, value, placeholder = 'Chọn ngày', onPress, error, disabled }: FieldBaseProps & {
  value?: string;
  placeholder?: string;
  onPress?: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.field}>
      {label ? <AppText variant="label">{label}</AppText> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.inputShell, { backgroundColor: colors.surfaceElevated, borderColor: error ? colors.error : colors.border, opacity: disabled ? 0.6 : pressed ? 0.78 : 1 }]}>
        <AppIcon name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }} size={19} color={colors.textSecondary} />
        <AppText tone={value ? 'primary' : 'tertiary'} style={styles.value}>{value ?? placeholder}</AppText>
      </Pressable>
      {error ? <AppText variant="caption" tone="error">{error}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs, width: '100%' },
  inputShell: { minHeight: 50, borderWidth: 1, borderRadius: radius.input, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: { flex: 1, minHeight: 48, paddingVertical: spacing.sm, fontSize: 15 },
  textArea: { minHeight: 106, paddingTop: spacing.md },
  value: { flex: 1 },
  trailingButton: { minWidth: 30, height: 40, alignItems: 'center', justifyContent: 'center' },
});
