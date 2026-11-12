import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { createFamilyQuery } from '@/features/family/data/family-query';
import { familyDataApi } from '@/features/family/api/familyDataApi';
import { timelineApi } from './timeline-api';
import { memberIdValid } from './timeline-data';
export function useTimelineQuery(accountId: number, memberId?: number) {
  const loader = useCallback(async (signal: AbortSignal) => { if (memberId !== undefined && !memberIdValid(memberId)) throw new Error('TIMELINE_INVALID_MEMBER'); const [events, members] = await Promise.all([timelineApi.list(memberId, signal), familyDataApi.list(signal)]); if (memberId !== undefined && (!members.some(m => m.id === memberId) || events.some(e => e.memberId !== memberId && e.relatedMemberId !== memberId))) throw new Error('TIMELINE_INVALID_MEMBER'); return { events, members }; }, [memberId]);
  const query = useMemo(() => { if (!memberIdValid(accountId)) throw new Error('TIMELINE_ACCOUNT_REQUIRED'); return createFamilyQuery(loader); }, [accountId, loader]);
  const state = useSyncExternalStore(query.subscribe, query.getSnapshot, query.getSnapshot);
  useFocusEffect(useCallback(() => { if (AppState.currentState === 'active') void query.load(); const sub = AppState.addEventListener('change', next => { if (next === 'active') void query.load(); else query.cancel(); }); return () => { sub.remove(); query.cancel(); }; }, [query]));
  return { ...state, reload: query.load };
}
