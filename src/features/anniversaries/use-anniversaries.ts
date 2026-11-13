import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { createFamilyQuery } from '@/features/family/data/family-query';
import { familyDataApi } from '@/features/family/api/familyDataApi';
import { dateParts, memberIdValid } from '@/features/timeline/timeline-data';
import { anniversaryApi } from './anniversary-api';

export function useAnniversaries(accountId: number, vietnamToday: string, memberId?: number) {
  const loader = useCallback(async (signal: AbortSignal) => {
    if (!dateParts(vietnamToday)) throw new Error('ANNIVERSARY_INVALID_DATE');
    const [items, members] = await Promise.all([anniversaryApi.list(signal), familyDataApi.list(signal)]);
    if (memberId !== undefined && (!memberIdValid(memberId) || !members.some(m => m.id === memberId))) throw new Error('ANNIVERSARY_MEMBER_MISSING');
    return { items, members };
  }, [memberId, vietnamToday]);
  const query = useMemo(() => {
    if (!memberIdValid(accountId)) throw new Error('ANNIVERSARY_ACCOUNT_CHANGED');
    return createFamilyQuery(loader);
  }, [accountId, loader]);
  const state = useSyncExternalStore(query.subscribe, query.getSnapshot, query.getSnapshot);
  useFocusEffect(useCallback(() => {
    if (AppState.currentState === 'active') void query.load();
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'active') void query.load();
      else query.cancel();
    });
    return () => { subscription.remove(); query.cancel(); };
  }, [query]));
  return { ...state, reload: query.load };
}
