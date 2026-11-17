import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText } from '@/design-system/components/app-text';
import { SecondaryButton } from '@/design-system/components/buttons';
import type { MediaPool } from './library-media';
export const PrivatePhoto = memo(function PrivatePhoto({ photoId, pool, label, failure, retry, full = false, scale = 1 }: { photoId: number; pool: MediaPool; label: string; failure: string; retry: string; full?: boolean; scale?: number }) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ pool: MediaPool; photoId: number; attempt: number; uri?: string; failed?: boolean }>();
  const current = result?.pool === pool && result.photoId === photoId && result.attempt === attempt ? result : undefined;
  const source = useMemo(() => current?.uri ? { uri: current.uri } : undefined, [current?.uri]); const failed = current?.failed;
  const onError = useCallback(() => { pool.evict(photoId); setResult({ pool, photoId, attempt, failed: true }); }, [pool, photoId, attempt]);
  useEffect(() => {
    let alive = true; const lease = pool.acquire(photoId);
    void lease.promise.then(uri => { if (alive) setResult({ pool, photoId, attempt, uri }); }).catch(() => { if (alive) setResult({ pool, photoId, attempt, failed: true }); });
    return () => { alive = false; lease.release(); };
  }, [pool, photoId, attempt]);
  return <View style={[styles.frame, full && { height: 340 * scale }]}>
    {source && !failed ? <Image source={source} cachePolicy="none" allowDownscaling recyclingKey={`${photoId}:${attempt}`} transition={0} contentFit={full ? 'contain' : 'cover'} accessibilityLabel={label} style={styles.image} onError={onError} />
      : failed ? <><AppText accessibilityRole="alert">{failure}</AppText>{attempt < 1 ? <SecondaryButton title={retry} onPress={() => setAttempt(a => a + 1)} /> : null}</> : <ActivityIndicator accessibilityLabel={label} />}
  </View>;
});
const styles = StyleSheet.create({ frame: { height: 150, width: '100%', justifyContent: 'center', overflow: 'hidden' }, image: { width: '100%', height: '100%' } });
