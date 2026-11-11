import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { createFamilyQuery } from './family-query';
export function useFamilyQuery<T>(accountId: number, queryKey: string, loader: (signal: AbortSignal) => Promise<T>, refreshOnForeground = true) {
  const query = useMemo(() => {
    if (!Number.isSafeInteger(accountId) || accountId <= 0 || !queryKey) throw new Error('Family query requires account and resource');
    return createFamilyQuery(loader);
  }, [accountId, queryKey, loader]);
  const state = useSyncExternalStore(query.subscribe, query.getSnapshot, query.getSnapshot);
  useFocusEffect(useCallback(() => {
    void query.load();
    const subscription = refreshOnForeground ? AppState.addEventListener('change', next => {
      if (next === 'active') void query.load(); else query.cancel();
    }) : undefined;
    return () => { subscription?.remove(); query.cancel(); };
  }, [query, refreshOnForeground]));
  return { ...state, reload: query.load };
}
