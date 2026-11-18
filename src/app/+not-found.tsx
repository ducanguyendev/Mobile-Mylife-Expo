import { router } from 'expo-router';
import { View } from 'react-native';
import { AppScreen } from '@/components/layout/app-screen';
import { AppText } from '@/design-system/components/app-text';
import { PrimaryButton } from '@/design-system/components/buttons';
import { spacing } from '@/design-system/tokens';
import { useLocalization } from '@/localization/use-localization';

export default function NotFoundScreen() {
  const { copy } = useLocalization();
  return (
    <AppScreen centered>
      <View style={{ alignItems: 'center', gap: spacing.md }}>
        <AppText variant="display">404</AppText>
        <AppText variant="sectionTitle">{copy.notFoundTitle}</AppText>
        <AppText tone="secondary" style={{ textAlign: 'center' }}>{copy.notFoundMessage}</AppText>
        <PrimaryButton title={copy.backHome} onPress={() => router.replace('/(tabs)')} />
      </View>
    </AppScreen>
  );
}
