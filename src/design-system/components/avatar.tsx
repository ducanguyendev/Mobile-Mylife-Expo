import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/design-system/components/app-text';
import { radius } from '@/design-system/tokens';
import { useAppTheme } from '@/theme/theme-provider';

export function Avatar({ uri, name, size = 48, status, accent }: {
  uri?: string;
  name: string;
  size?: number;
  status?: 'online' | 'offline';
  accent?: string;
}) {
  const { colors } = useAppTheme();
  const initials = name.trim().split(/\s+/).slice(-2).map((part) => part[0]?.toLocaleUpperCase()).join('');
  return (
    <View accessibilityLabel={`Ảnh đại diện ${name}`} style={{ width: size, height: size }}>
      {uri ? <Image source={{ uri }} contentFit="cover" style={[styles.avatar, { width: size, height: size, borderColor: accent ?? colors.border }]} /> : (
        <View style={[styles.avatar, styles.initials, { width: size, height: size, backgroundColor: colors.surfaceMuted, borderColor: accent ?? colors.border }]}>
          <AppText variant="label" style={{ fontSize: Math.max(12, size * 0.28), color: colors.accentFamily }}>{initials}</AppText>
        </View>
      )}
      {status ? <View style={[styles.status, { backgroundColor: status === 'online' ? colors.success : colors.textTertiary, borderColor: colors.surface, width: Math.max(10, size * 0.23), height: Math.max(10, size * 0.23) }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { borderWidth: 1.5, borderRadius: radius.pill },
  initials: { alignItems: 'center', justifyContent: 'center' },
  status: { position: 'absolute', right: 0, bottom: 0, borderWidth: 2, borderRadius: radius.pill },
});
