import { useLocalSearchParams } from 'expo-router';
import { LibraryScreen } from '@/features/library/LibraryScreen';
import { AppScreen } from '@/components/layout/app-screen';
import { AppText } from '@/design-system/components/app-text';
import { useAppTheme } from '@/theme/theme-provider';
import { libraryStrings } from '@/features/library/library-strings';
export default function AlbumRoute() {
  const { albumId } = useLocalSearchParams<{ albumId: string }>(); const { language } = useAppTheme();
  const value = Number(albumId);
  if (!/^\d+$/.test(albumId ?? '') || !Number.isSafeInteger(value) || value <= 0) return <AppScreen><AppText>{libraryStrings[language].notFound}</AppText></AppScreen>;
  return <LibraryScreen albumId={value} />;
}
