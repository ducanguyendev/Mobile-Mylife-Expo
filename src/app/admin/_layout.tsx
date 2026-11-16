import { NativeTabs } from 'expo-router/native-tabs';
import { useAppTheme } from '@/theme/theme-provider';
import { useLocalization } from '@/localization/use-localization';
import { m8Strings } from '@/features/profile/m8-strings';
export default function AdminLayout() {
  const { colors } = useAppTheme(); const { language } = useLocalization(); const copy = m8Strings[language];
  return <NativeTabs backgroundColor={colors.surface} tintColor={colors.accentFamily} backBehavior="initialRoute">
    <NativeTabs.Trigger name="index"><NativeTabs.Trigger.Label>{copy.dashboard}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon md="dashboard" sf="chart.bar" /></NativeTabs.Trigger>
    <NativeTabs.Trigger name="users"><NativeTabs.Trigger.Label>{copy.users}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon md="manage_accounts" sf="person.2" /></NativeTabs.Trigger>
    <NativeTabs.Trigger name="logs"><NativeTabs.Trigger.Label>{copy.logs}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon md="history" sf="clock" /></NativeTabs.Trigger>
    <NativeTabs.Trigger name="profile"><NativeTabs.Trigger.Label>{copy.profile}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon md="account_circle" sf="person.crop.circle" /></NativeTabs.Trigger>
  </NativeTabs>;
}
