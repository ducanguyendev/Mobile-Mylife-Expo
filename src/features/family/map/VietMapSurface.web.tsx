import { AppText } from '@/design-system/components/app-text';
import type { NativeMapProps } from './FamilyNativeMap';

// Embedded Android release bundling also builds Router's web server manifest.
// Keep native codegen specs outside that graph; the real coordinate list remains
// available in FamilyMapScreen without inventing a browser tile provider.
export function VietMapSurface({ copy }: NativeMapProps & { tileKey: string }) {
  return <AppText tone="secondary">{copy.unavailable}</AppText>;
}
