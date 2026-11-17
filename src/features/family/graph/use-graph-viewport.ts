import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import type { Viewport } from './family-graph';

// Continuous transforms stay on the UI thread. React only updates an overscanned
// mount window (128 screen points / ~9% scale) and the final toolbar readout.
export function useGraphViewport(initial: Viewport) {
  // SharedValue.get/set are the React Compiler-compatible accessors.
  const x = useSharedValue(initial.x), y = useSharedValue(initial.y), scale = useSharedValue(initial.scale);
  const pinching = useSharedValue(false), previousPinch = useSharedValue(1), panPointers = useSharedValue(0);
  const [viewport, setViewportState] = useState(initial);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const publish = useCallback((nextX: number, nextY: number, nextScale: number) => {
    if (alive.current) setViewportState(previous => previous.x === nextX && previous.y === nextY && previous.scale === nextScale ? previous : { x: nextX, y: nextY, scale: nextScale });
  }, []);
  useAnimatedReaction(
    () => ({ column: Math.floor(x.get() / 128), row: Math.floor(y.get() / 128), zoom: Math.floor(Math.log2(scale.get()) * 8) }),
    (next, previous) => {
      if (!previous || next.column !== previous.column || next.row !== previous.row || next.zoom !== previous.zoom) runOnJS(publish)(x.get(), y.get(), scale.get());
    }, [publish],
  );
  const gesture = useMemo(() => {
    const pan = Gesture.Pan().minDistance(6).averageTouches(true)
      .onStart(event => { 'worklet'; panPointers.set(event.numberOfPointers); })
      .onChange(event => {
        'worklet';
        if (!pinching.get() && event.numberOfPointers === 1 && panPointers.get() === 1) { x.set(x.get() + event.changeX); y.set(y.get() + event.changeY); }
        panPointers.set(event.numberOfPointers);
      })
      // eslint-disable-next-line react-hooks/refs -- RNGH stores this worklet; runOnJS reads publish's alive ref after finalization, never during render.
      .onFinalize(() => { 'worklet'; panPointers.set(0); runOnJS(publish)(x.get(), y.get(), scale.get()); });
    const pinch = Gesture.Pinch()
      .onStart(() => { 'worklet'; pinching.set(true); previousPinch.set(1); })
      .onUpdate(event => {
        'worklet';
        if (!Number.isFinite(event.scale) || event.scale <= 0 || !Number.isFinite(event.focalX) || !Number.isFinite(event.focalY)) return;
        const next = Math.max(.001, Math.min(3, scale.get() * event.scale / previousPinch.get()));
        x.set(event.focalX - (event.focalX - x.get()) / scale.get() * next);
        y.set(event.focalY - (event.focalY - y.get()) / scale.get() * next);
        scale.set(next); previousPinch.set(event.scale);
      })
      // eslint-disable-next-line react-hooks/refs -- RNGH stores this worklet; runOnJS reads publish's alive ref after finalization, never during render.
      .onFinalize(() => { 'worklet'; pinching.set(false); panPointers.set(0); runOnJS(publish)(x.get(), y.get(), scale.get()); });
    return Gesture.Simultaneous(pan, pinch);
  }, [panPointers, pinching, previousPinch, publish, scale, x, y]);
  const setViewport = useCallback((next: Viewport) => { x.set(next.x); y.set(next.y); scale.set(next.scale); publish(next.x, next.y, next.scale); }, [publish, scale, x, y]);
  const stop = useCallback(() => { pinching.set(false); panPointers.set(0); publish(x.get(), y.get(), scale.get()); }, [panPointers, pinching, publish, scale, x, y]);
  const zoom = useCallback((factor: number, focalX: number, focalY: number) => {
    const previous = scale.get(), next = Math.max(.001, Math.min(3, previous * factor));
    setViewport({ scale: next, x: focalX - (focalX - x.get()) / previous * next, y: focalY - (focalY - y.get()) / previous * next });
  }, [scale, setViewport, x, y]);
  return { x, y, scale, viewport, gesture, setViewport, zoom, stop };
}
