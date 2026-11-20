import { StyleSheet, View } from 'react-native';

import { AppText } from '@/design-system/components/app-text';
import { SegmentedTabs } from '@/design-system/components/controls';
import { spacing } from '@/design-system/tokens';
import { useLocalization } from '@/localization/use-localization';
import { useAppTheme, type ThemeMode } from '@/theme/theme-provider';

export function AuthThemeSelector() {
  const { mode, setMode } = useAppTheme();
  const { copy } = useLocalization();

  return (
    <View style={styles.group}>
      <AppText variant="label" accessibilityRole="header">{copy.appearance}</AppText>
      <SegmentedTabs<ThemeMode>
        accessibilityLabel={copy.appearance}
        value={mode}
        onChange={setMode}
        options={[
          { value: 'system', label: copy.system },
          { value: 'light', label: copy.light },
          { value: 'dark', label: copy.dark },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.xs, marginVertical: spacing.md },
});
