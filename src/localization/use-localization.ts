import { useAppTheme } from '@/theme/theme-provider';
import { getStrings } from './strings';

export function useLocalization() {
  const { language } = useAppTheme();
  return { copy: getStrings(language), language, locale: language === 'en' ? 'en-US' : 'vi-VN' };
}
