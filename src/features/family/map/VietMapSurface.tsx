import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Camera, MapView, PointAnnotation, Logger, type CameraRef } from '@vietmap/vietmap-gl-react-native';
import { AppText } from '@/design-system/components/app-text';
import { TextButton } from '@/design-system/components/buttons';
import { useAppTheme } from '@/theme/theme-provider';
import { mapViewport, validPoint, type Point } from './map-data';
import type { NativeMapProps } from './FamilyNativeMap';

// SDK error messages can contain authenticated style URLs. Consume without logging.
Logger.setLogCallback(() => true);
export function VietMapSurface({ locations, selectedKey, onSelect, onPick, saved, pending, copy, tileKey }: NativeMapProps & { tileKey: string }) {
  const { colors, resolvedMode, reducedMotion } = useAppTheme(); const camera = useRef<CameraRef>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading'); const initialFit = useRef(false); const zoom = useRef(4);
  const points = useRef<Point[]>([]);
  useEffect(() => { points.current = onPick ? [saved, pending].filter((p): p is Point => !!p) : locations; }, [onPick, saved, pending, locations]);
  const duration = reducedMotion ? 0 : 250;
  const fit = useCallback(() => { const v = mapViewport(points.current); if ('center' in v) camera.current?.setCamera({ centerCoordinate: v.center, zoomLevel: v.zoom, animationDuration: duration }); else camera.current?.fitBounds(v.ne, v.sw, 40, duration); }, [duration]);
  useEffect(() => { const timer = setTimeout(() => setStatus(s => s === 'loading' ? 'error' : s), 20000); return () => clearTimeout(timer); }, []);
  useEffect(() => { if (status === 'ready' && !initialFit.current && (locations.length > 0 || saved || onPick)) { initialFit.current = true; fit(); } }, [status, locations.length, saved, onPick, fit]);
  const selected = locations.find(l => l.key === selectedKey); const lat = selected?.latitude; const lon = selected?.longitude;
  useEffect(() => { if (lat !== undefined && lon !== undefined) camera.current?.setCamera({ centerCoordinate: [lon, lat], zoomLevel: 12, animationDuration: duration }); }, [selectedKey, lat, lon, duration]);
  const marker = (id: string, point: Point, title: string, active: boolean, select?: () => void, label = title) => <PointAnnotation key={id} id={id} coordinate={[point.longitude, point.latitude]} onSelected={select} title={label}>
    <View accessible accessibilityLabel={label} style={{ minWidth: 48, minHeight: 48, padding: 8, borderRadius: 24, borderWidth: active ? 4 : 2, borderColor: colors.textPrimary, backgroundColor: active ? colors.accentFamily : colors.surfaceElevated, justifyContent: 'center', alignItems: 'center' }}><AppText style={{ color: active ? colors.onAccent : colors.textPrimary }}>{title}</AppText></View>
  </PointAnnotation>;
  return <View style={{ gap: 8 }}>
    <View style={{ height: 300, overflow: 'hidden', borderRadius: 16 }}>
      <MapView style={{ flex: 1 }} mapStyle={`https://maps.vietmap.vn/maps/styles/${resolvedMode === 'dark' ? 'dm' : 'lm'}/style.json?apikey=${encodeURIComponent(tileKey)}`} attributionEnabled logoEnabled
        onDidFinishRenderingMapFully={() => setStatus(previous => previous === 'error' ? 'error' : 'ready')} onDidFailLoadingMap={() => setStatus('error')}
        onRegionDidChange={e => { zoom.current = e.properties.zoomLevel; }}
        onPress={feature => { if (feature.geometry.type !== 'Point' || !onPick) return; const [longitude, latitude] = feature.geometry.coordinates; const point = { latitude, longitude }; if (validPoint(point)) onPick(point); }}>
        <Camera ref={camera} defaultSettings={{ centerCoordinate: [106, 16], zoomLevel: 4 }} />
        {locations.map(l => marker(l.key, l, `${l.memberCount}`, l.key === selectedKey, () => onSelect?.(l.key), `${l.displayName} · ${l.memberCount} ${copy.people}`))}
        {saved ? marker('saved-point', saved, copy.saved, false) : null}
        {pending ? marker('pending-point', pending, copy.pending, true) : null}
      </MapView>
    </View>
    {status !== 'ready' ? <AppText accessibilityLiveRegion="polite" tone={status === 'error' ? 'error' : 'secondary'}>{status === 'loading' ? copy.loadingMap : copy.unavailable}</AppText> : null}
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignContent: 'flex-start', gap: 8 }}>
      <TextButton compact style={{ flexBasis: 120, flexGrow: 1 }} title={copy.zoomIn} onPress={() => camera.current?.zoomTo(Math.min(20, zoom.current + 1), duration)} />
      <TextButton compact style={{ flexBasis: 120, flexGrow: 1 }} title={copy.zoomOut} onPress={() => camera.current?.zoomTo(Math.max(1, zoom.current - 1), duration)} />
      <TextButton compact style={{ flexBasis: 120, flexGrow: 1 }} title={copy.fit} onPress={fit} />
    </View>
  </View>;
}
