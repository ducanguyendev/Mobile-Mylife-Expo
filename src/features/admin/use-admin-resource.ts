import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/features/auth/context/auth-provider';
import { getSessionVersion } from '@/api/apiClient';

export function useAdminResource<T>(loader: (signal: AbortSignal) => Promise<T>) {
  const { refreshSession } = useAuth();
  const [state, setState] = useState<{ data?: T; loading: boolean; error?: unknown }>({ loading: true });
  const controller = useRef<AbortController | null>(null);
  const active = useRef(false);
  const sequence = useRef(0);
  const cancel = useCallback((clear = true) => {
    sequence.current++; controller.current?.abort();
    setState(previous => ({ data: clear ? undefined : previous.data, loading: true }));
  }, []);
  const reload = useCallback(async () => {
    if (!active.current) return;
    cancel(false);
    const request = new AbortController(); controller.current = request;
    const current = sequence.current; const version = getSessionVersion();
    try {
      const data = await loader(request.signal);
      await refreshSession();
      if (active.current && !request.signal.aborted && current === sequence.current && version === getSessionVersion()) setState({ data, loading: false });
      return data;
    } catch (error) {
      if (active.current && !request.signal.aborted && current === sequence.current && version === getSessionVersion()) {
        setState({ loading: false, error });
        void refreshSession().catch(() => undefined);
      }
      throw error;
    }
  }, [cancel, loader, refreshSession]);
  useFocusEffect(useCallback(() => {
    active.current = true; void reload().catch(() => undefined);
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'active') { active.current = true; void reload().catch(() => undefined); }
      else { active.current = false; cancel(); }
    });
    const timer = setInterval(() => { if (active.current) void reload().catch(() => undefined); }, 30_000);
    return () => { active.current = false; clearInterval(timer); subscription.remove(); cancel(); };
  }, [cancel, reload]));
  return { ...state, reload, cancel };
}
