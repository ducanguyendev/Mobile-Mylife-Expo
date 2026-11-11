import { useLocalization } from '@/localization/use-localization';
import { getFamilyStrings } from './familyStrings';
export function useFamilyStrings() {
  const locale = useLocalization();
  return { ...locale, copy: getFamilyStrings(locale.language) };
}
