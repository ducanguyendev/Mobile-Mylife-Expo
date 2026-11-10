import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { homeLoaders } from './home-api';
import { createHomeResource } from './home-resource';
export function useHome(accountId: number) {
  // A new account gets an empty resource synchronously, before any effect.
  const resource = useMemo(() => {
    if (!Number.isSafeInteger(accountId) || accountId <= 0) throw new Error('Home requires an authenticated account');
    return createHomeResource(homeLoaders);
  }, [accountId]);
  const state = useSyncExternalStore(resource.subscribe, resource.getSnapshot, resource.getSnapshot);
  useFocusEffect(useCallback(() => {
    void resource.refresh();
    const subscription = AppState.addEventListener('change', (next) => { if (next === 'active') void resource.refresh(); else resource.cancel(); });
    return () => { subscription.remove(); resource.cancel(); };
  }, [resource]));
  return { state, refresh: resource.refresh, retry: resource.retry };
}
export function useDeviceClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const update = () => setNow(new Date());
    const timer = setInterval(update, 60_000);
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') update(); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);
  return now;
}
