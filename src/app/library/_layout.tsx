import { Stack } from 'expo-router';
import { useAppTheme } from '@/theme/theme-provider';
export default function LibraryLayout() {
  const { reducedMotion } = useAppTheme();
  return <Stack screenOptions={{ headerShown: false, animation: reducedMotion ? 'none' : 'default' }} />;
}
