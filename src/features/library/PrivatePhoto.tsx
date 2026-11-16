import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { ActivityIndicator, View } from 'react-native';
import { AppText } from '@/design-system/components/app-text';
import { SecondaryButton } from '@/design-system/components/buttons';
import type { MediaPool } from './library-media';
export function PrivatePhoto({ photoId, pool, label, failure, retry, full = false, scale = 1 }: { photoId: number; pool: MediaPool; label: string; failure: string; retry: string; full?: boolean; scale?: number }) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ pool: MediaPool; photoId: number; attempt: number; uri?: string; failed?: boolean }>();
  const current = result?.pool === pool && result.photoId === photoId && result.attempt === attempt ? result : undefined;
  const source = current?.uri; const failed = current?.failed;
  useEffect(() => { let alive = true; void pool.read(photoId).then(uri => { if (alive) setResult({ pool, photoId, attempt, uri }); }).catch(() => { if (alive) setResult({ pool, photoId, attempt, failed: true }); }); return () => { alive = false; }; }, [pool, photoId, attempt]);
  return <View style={{ height: full ? 340 * scale : 150, width: '100%', justifyContent: 'center', overflow: 'hidden' }}>
    {source && !failed ? <Image source={{ uri: source }} cachePolicy="none" recyclingKey={`${photoId}:${attempt}`} transition={0} contentFit={full ? 'contain' : 'cover'} accessibilityLabel={label} style={{ width: '100%', height: '100%' }} onError={() => setResult({ pool, photoId, attempt, failed: true })} />
      : failed ? <><AppText accessibilityRole="alert">{failure}</AppText>{attempt < 1 ? <SecondaryButton title={retry} onPress={() => setAttempt(a => a + 1)} /> : null}</> : <ActivityIndicator accessibilityLabel={label} />}
  </View>;
}
