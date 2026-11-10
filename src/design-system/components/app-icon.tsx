import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { useAppTheme } from '@/theme/theme-provider';

type AppIconProps = Omit<SymbolViewProps, 'name' | 'tintColor'> & {
  name: SymbolViewProps['name'];
  color?: string;
};

export function AppIcon({ name, color, size = 20, ...props }: AppIconProps) {
  const { colors } = useAppTheme();
  return <SymbolView accessible={false} importantForAccessibility="no-hide-descendants" name={name} size={size} tintColor={color ?? colors.textSecondary} {...props} />;
}
