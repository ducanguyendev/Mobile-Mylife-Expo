import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import type { Viewport } from './family-graph';

// Continuous transforms stay on the UI thread. React only updates an overscanned
// mount window (128 screen points / ~9% scale) and the final toolbar readout.
export function useGraphViewport(initial: Viewport) {
  const x = useSharedValue(initial.x), y = useSharedValue(initial.y), scale = useSharedValue(initial.scale);
  const pinching = useSharedValue(false), previousPinch = useSharedValue(1), panPointers = useSharedValue(0);
  const [viewport, setViewport] = useState(initial);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const publish = useCallback((nextX: number, nextY: number, nextScale: number) => {
    if (alive.current) setViewport(previous => previous.x === nextX && previous.y === nextY && previous.scale === nextScale ? previous : { x: nextX, y: nextY, scale: nextScale });
  }, []);
  useAnimatedReaction(
    () => ({ column: Math.floor(x.value / 128), row: Math.floor(y.value / 128), zoom: Math.floor(Math.log2(scale.value) * 8) }),
    (next, previous) => {
      if (!previous || next.column !== previous.column || next.row !== previous.row || next.zoom !== previous.zoom) runOnJS(publish)(x.value, y.value, scale.value);
    }, [publish],
  );
  const gesture = useMemo(() => {
    const pan = Gesture.Pan().minDistance(6).averageTouches(true)
      .onStart(event => { 'worklet'; panPointers.value = event.numberOfPointers; })
      .onChange(event => {
        'worklet';
        if (!pinching.value && event.numberOfPointers === 1 && panPointers.value === 1) { x.value += event.changeX; y.value += event.changeY; }
        panPointers.value = event.numberOfPointers;
      })
      .onFinalize(() => { 'worklet'; panPointers.value = 0; runOnJS(publish)(x.value, y.value, scale.value); });
    const pinch = Gesture.Pinch()
      .onStart(() => { 'worklet'; pinching.value = true; previousPinch.value = 1; })
      .onUpdate(event => {
        'worklet';
        if (!Number.isFinite(event.scale) || event.scale <= 0 || !Number.isFinite(event.focalX) || !Number.isFinite(event.focalY)) return;
        const next = Math.max(.001, Math.min(3, scale.value * event.scale / previousPinch.value));
        x.value = event.focalX - (event.focalX - x.value) / scale.value * next;
        y.value = event.focalY - (event.focalY - y.value) / scale.value * next;
        scale.value = next; previousPinch.value = event.scale;
      })
      .onFinalize(() => { 'worklet'; pinching.value = false; panPointers.value = 0; runOnJS(publish)(x.value, y.value, scale.value); });
    return Gesture.Simultaneous(pan, pinch);
  }, [panPointers, pinching, previousPinch, publish, scale, x, y]);
  const setViewport = useCallback((next: Viewport) => { x.value = next.x; y.value = next.y; scale.value = next.scale; publish(next.x, next.y, next.scale); }, [publish, scale, x, y]);
  const stop = useCallback(() => { pinching.value = false; panPointers.value = 0; publish(x.value, y.value, scale.value); }, [panPointers, pinching, publish, scale, x, y]);
  const zoom = useCallback((factor: number, focalX: number, focalY: number) => {
    const previous = scale.value, next = Math.max(.001, Math.min(3, previous * factor));
    setViewport({ scale: next, x: focalX - (focalX - x.value) / previous * next, y: focalY - (focalY - y.value) / previous * next });
  }, [scale, setViewport, x, y]);
  return { x, y, scale, viewport, gesture, setViewport, zoom, stop };
}
