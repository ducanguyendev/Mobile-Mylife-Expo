import { Text, type TextProps, type TextStyle } from 'react-native';

import { typography } from '@/design-system/tokens';
import { useAppTheme } from '@/theme/theme-provider';

export type TextVariant = keyof typeof typography;
type Tone = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'error' | 'success' | 'warning';

const tones = {
  primary: 'textPrimary',
  secondary: 'textSecondary',
  tertiary: 'textTertiary',
  accent: 'accentFamily',
  error: 'error',
  success: 'success',
  warning: 'warning',
} as const;

export type AppTextProps = TextProps & { variant?: TextVariant; tone?: Tone };

export function AppText({ variant = 'body', tone = 'primary', style, ...props }: AppTextProps) {
  const { colors } = useAppTheme();
  const textStyle: TextStyle = { color: colors[tones[tone]], ...typography[variant] };
  return <Text allowFontScaling style={[textStyle, style]} {...props} />;
}
