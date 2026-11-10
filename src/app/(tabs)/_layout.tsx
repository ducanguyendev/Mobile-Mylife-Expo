import { useLocalization } from '@/localization/use-localization';
import { NativeTabs } from 'expo-router/native-tabs';

import { useAppTheme } from '@/theme/theme-provider';

export default function MainTabsLayout() {
  const { colors } = useAppTheme();
  const { copy } = useLocalization();
  return (
    <NativeTabs
      backBehavior="initialRoute"
      backgroundColor={colors.surface}
      indicatorColor={`${colors.accentFamily}24`}
      iconColor={{ default: colors.textTertiary, selected: colors.accentFamily }}
      labelStyle={{ default: { color: colors.textSecondary, fontSize: 11 }, selected: { color: colors.accentFamily, fontSize: 11, fontWeight: '600' } }}
      labelVisibilityMode="labeled"
      rippleColor={`${colors.accentFamily}24`}>
      <NativeTabs.Trigger name="index" accessibilityLabel={copy.home}>
        <NativeTabs.Trigger.Label>{copy.home}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md={{ default: 'home', selected: 'home' }} sf={{ default: 'house', selected: 'house.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="family" accessibilityLabel={copy.family}>
        <NativeTabs.Trigger.Label>{copy.family}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md={{ default: 'family_restroom', selected: 'family_restroom' }} sf={{ default: 'person.2', selected: 'person.2.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="memories" accessibilityLabel={copy.memories}>
        <NativeTabs.Trigger.Label>{copy.memories}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md={{ default: 'auto_stories', selected: 'auto_stories' }} sf={{ default: 'book.closed', selected: 'book.closed.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile" accessibilityLabel={copy.profile}>
        <NativeTabs.Trigger.Label>{copy.profile}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md={{ default: 'account_circle', selected: 'account_circle' }} sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
