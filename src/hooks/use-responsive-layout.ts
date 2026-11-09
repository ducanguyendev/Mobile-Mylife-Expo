import { useWindowDimensions } from 'react-native';

import { layout } from '@/design-system/tokens';

export function useResponsiveLayout() {
  const { width, height, fontScale } = useWindowDimensions();
  return {
    width,
    height,
    fontScale,
    isCompact: width < 360,
    isMedium: width >= 360 && width < 600,
    isWide: width >= 600,
    contentWidth: Math.min(width, layout.contentMaxWidth),
    horizontalGutter: width < 360 ? 16 : layout.screenGutter,
  };
}
