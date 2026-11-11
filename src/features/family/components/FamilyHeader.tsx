import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/design-system/components/app-text';
import { AppIcon } from '@/design-system/components/app-icon';
import { IconButton } from '@/design-system/components/buttons';
import { spacing } from '@/design-system/tokens';
import { useFamilyStrings } from '../i18n/use-family-strings';
export function backToFamily() { if (router.canGoBack()) router.back(); else router.replace('/(tabs)/family'); }
export function openMember(id: number) { if (Number.isSafeInteger(id) && id > 0) router.navigate({ pathname: '/family/[id]', params: { id: String(id) } }); }
export function FamilyHeader({ title }: { title: string }) {
  const { copy } = useFamilyStrings();
  return <View style={styles.header}><IconButton label={copy.back} onPress={backToFamily} icon={<AppIcon name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} />} /><AppText variant="sectionTitle" accessibilityRole="header" style={{ flex: 1 }}>{title}</AppText></View>;
}
const styles = StyleSheet.create({ header: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm } });
