import { PanResponder } from 'react-native';
import { touchDistance, zoomViewport, type Viewport } from './family-graph';
/** Imperative native responder state; React receives immutable viewport snapshots. */
export function createGraphGestures(initial: Viewport, onChange: (next: Viewport) => void) {
  let view = initial; let origin = { x: 0, y: 0 };
  let gesture = { x: 0, y: 0, distance: 0, fingers: 0 };
  const commit = (next: Viewport) => { view = next; onChange(next); };
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: event => event.nativeEvent.touches.length > 1,
    onMoveShouldSetPanResponder: (event, state) => event.nativeEvent.touches.length > 1 || Math.abs(state.dx) + Math.abs(state.dy) > 6,
    onPanResponderGrant: event => {
      const touches = event.nativeEvent.touches;
      gesture = { x: touches[0]?.pageX ?? 0, y: touches[0]?.pageY ?? 0, distance: touches.length > 1 ? touchDistance(touches[0], touches[1]) : 0, fingers: touches.length };
    },
    onPanResponderMove: event => {
      const touches = event.nativeEvent.touches; if (!touches.length) return;
      const first = touches[0];
      if (touches.length > 1) {
        const distance = touchDistance(first, touches[1]);
        const x = (first.pageX + touches[1].pageX) / 2 - origin.x; const y = (first.pageY + touches[1].pageY) / 2 - origin.y;
        if (gesture.fingers > 1 && gesture.distance > 0) commit(zoomViewport(view, distance / gesture.distance, x, y));
        gesture = { x: first.pageX, y: first.pageY, distance, fingers: touches.length };
      } else {
        if (gesture.fingers === 1) commit({ ...view, x: view.x + first.pageX - gesture.x, y: view.y + first.pageY - gesture.y });
        gesture = { x: first.pageX, y: first.pageY, distance: 0, fingers: 1 };
      }
    },
    onPanResponderTerminationRequest: () => false,
    onPanResponderRelease: () => { gesture.fingers = 0; },
    onPanResponderTerminate: () => { gesture.fingers = 0; },
  });
  return { panHandlers: responder.panHandlers, setViewport: commit, getViewport: () => view,
    setOrigin: (x: number, y: number) => { origin = { x, y }; },
    zoom: (factor: number, x: number, y: number) => commit(zoomViewport(view, factor, x, y)),
  };
}
