import { useEffect, useState } from 'react';
import { NativeModules, Platform, View } from 'react-native';
import Constants from 'expo-constants';
import { AppText } from '@/design-system/components/app-text';
import { SecondaryButton } from '@/design-system/components/buttons';
import type { MapLocation, Point } from './map-data';
import type { MapCopy } from './map-strings';

export type NativeMapProps = { locations: MapLocation[]; selectedKey?: string; onSelect?: (key: string) => void; onPick?: (point: Point) => void; saved?: Point | null; pending?: Point | null; copy: MapCopy };
/** Do not evaluate a Fabric module in Expo Go or on web. No substitute tile provider. */
export function FamilyNativeMap(props: NativeMapProps) {
  const [attempt, setAttempt] = useState(0);
  const [Surface, setSurface] = useState<typeof import('./VietMapSurface').VietMapSurface | null>(null);
  const [failed, setFailed] = useState(false);
  const key = process.env.EXPO_PUBLIC_VIETMAP_TILE_KEY?.trim();
  const available = !!key && Platform.OS !== 'web' && Constants.executionEnvironment !== 'storeClient' && !!NativeModules.MLRNModule;
  useEffect(() => {
    if (!available) return;
    let cancelled = false;
    void import('./VietMapSurface').then(module => { if (!cancelled) setSurface(() => module.VietMapSurface); }).catch((error: unknown) => {
      if (__DEV__) {
        const raw = error instanceof Error ? error.message : 'Native module load failed';
        const message = raw.replace(/https?:\/\/\S+/g, '[redacted URL]');
        console.warn('[FamilyMap] native module unavailable', (key ? message.split(key).join('[redacted]') : message).slice(0, 250));
      }
      if (!cancelled) setFailed(true);
    });
    return () => { cancelled = true; };
  }, [available, key]);
  if (!available || failed) return <View style={{ padding: 16, gap: 8 }}><AppText tone="secondary">{props.copy.unavailable}</AppText></View>;
  if (!Surface) return <AppText>{props.copy.loadingMap}</AppText>;
  return <View style={{ gap: 8 }}><Surface key={attempt} {...props} tileKey={key!} /><SecondaryButton title={props.copy.retryMap} onPress={() => setAttempt(a => a + 1)} /></View>;
}
