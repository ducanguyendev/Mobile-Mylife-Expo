import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { createFamilyQuery } from '../data/family-query';
import { familyMapApi } from './map-api';
import { nextMapPoll } from './map-data';

export function useMapQuery(accountId: number) {
  const query = useMemo(() => {
    if (!Number.isSafeInteger(accountId) || accountId <= 0) throw new Error('FAMILY_MAP_ACCOUNT_REQUIRED');
    return createFamilyQuery(familyMapApi.get);
  }, [accountId]);
  const state = useSyncExternalStore(query.subscribe, query.getSnapshot, query.getSnapshot);
  const refresh = useRef<() => Promise<void>>(async () => {});
  useFocusEffect(useCallback(() => {
    let active = AppState.currentState === 'active'; let disposed = false; let attempts = 0; let timer: ReturnType<typeof setTimeout> | undefined;
    const clear = () => { clearTimeout(timer); timer = undefined; };
    const load = async () => {
      if (!active || disposed) return;
      clear(); await query.load();
      const snapshot = query.getSnapshot(); const delay = snapshot.status === 'ready' ? nextMapPoll(snapshot.data?.pendingGeocodingMembers ?? 0, attempts++) : null;
      if (active && !disposed && delay !== null) timer = setTimeout(() => void load(), delay);
    };
    refresh.current = () => { attempts = 0; return load(); };
    void load();
    const sub = AppState.addEventListener('change', next => { active = next === 'active'; clear(); if (active) { attempts = 0; void load(); } else query.cancel(); });
    return () => { disposed = true; refresh.current = async () => {}; clear(); sub.remove(); query.cancel(); };
  }, [query]));
  return { ...state, reload: () => refresh.current() };
}
