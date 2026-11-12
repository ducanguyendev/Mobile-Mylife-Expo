import { apiRequest } from '@/api/apiClient';
import { assertUnchanged, eventKey, eventWrite, memberIdValid, positiveId, requireEvent, requireEvents, requireWrite, writable, type TimelineEvent, type TimelineWrite } from './timeline-data';
async function data(path: string, options: RequestInit = {}) { const result = await apiRequest<{ success: boolean; data: unknown }>(path, options); if (!result || result.success !== true || !Object.hasOwn(result, 'data')) throw new Error('TIMELINE_INVALID_RESPONSE'); return result.data; }
export const timelineApi = {
  list: async (memberId?: number, signal?: AbortSignal) => { if (memberId !== undefined && !memberIdValid(memberId)) throw new Error('TIMELINE_INVALID_MEMBER'); return requireEvents(await data(memberId === undefined ? '/api/family-tree/timeline' : `/api/family-tree/${memberId}/timeline`, { signal })); },
  create: async (input: TimelineWrite, signal?: AbortSignal) => requireEvent(await data('/api/family-tree/timeline', { method: 'POST', body: JSON.stringify(requireWrite(input)), signal })),
  update: async (original: TimelineEvent, input: TimelineWrite, signal?: AbortSignal) => { if (!writable(original)) throw new Error('TIMELINE_READ_ONLY'); return requireEvent(await data(`/api/family-tree/timeline/${original.id}`, { method: 'PUT', body: JSON.stringify(requireWrite(input, original)), signal })); },
  remove: async (event: TimelineEvent, signal?: AbortSignal) => { if (!writable(event) || !positiveId(event.id)) throw new Error('TIMELINE_READ_ONLY'); await apiRequest<void>(`/api/family-tree/timeline/${event.id}`, { method: 'DELETE', signal }); },
};
/** Serial account-local mutations; fresh comparison mitigates, but cannot close, GET/PUT races. */
export function createTimelineMutations(current?: () => boolean, api = timelineApi) {
  let active = false;
  let state = { busy: false, needsReconcile: false }; const listeners = new Set<() => void>();
  const publish = (patch: Partial<typeof state>) => { state = { ...state, ...patch }; listeners.forEach(fn => fn()); };
  const check = (signal: AbortSignal) => { if (signal.aborted || !(current ? current() : active)) throw new Error('TIMELINE_ACCOUNT_CHANGED'); };
  const run = async (kind: 'save' | 'delete', original: TimelineEvent | null, input: TimelineWrite | null, signal: AbortSignal) => {
    if (state.busy || state.needsReconcile) throw new Error('TIMELINE_RECONCILE');
    check(signal); if (original && !writable(original)) throw new Error('TIMELINE_READ_ONLY'); if (kind === 'delete' && !original) throw new Error('TIMELINE_READ_ONLY');
    const values = kind === 'save' ? requireWrite(input!, original ?? undefined) : null;
    let dispatched = false; let savedKey: string | undefined; publish({ busy: true });
    try {
      if (original) { const latest = await api.list(undefined, signal); check(signal); const found = latest.find(e => eventKey(e) === eventKey(original)); if (kind === 'delete' && !found) return latest; assertUnchanged(original, found); }
      check(signal); dispatched = true;
      if (kind === 'delete') { try { await api.remove(original!, signal); } catch (error) { if ((error as { status?: number }).status !== 404) throw error; } }
      else {
        const changed = original ? await api.update(original, values!, signal) : await api.create(values!, signal);
        if (!writable(changed) || original && changed.id !== original.id) throw new Error('TIMELINE_INVALID_RESPONSE');
        savedKey = eventKey(changed);
      }
      check(signal); const events = await api.list(undefined, signal); check(signal);
      if (kind === 'delete' && events.some(e => eventKey(e) === eventKey(original!))) throw new Error('TIMELINE_RECONCILE');
      if (kind === 'save') { const saved = events.find(e => eventKey(e) === savedKey); if (!saved || JSON.stringify(eventWrite(saved)) !== JSON.stringify(values)) throw new Error('TIMELINE_RECONCILE'); }
      return events;
    } catch (error) { if (dispatched) publish({ needsReconcile: true }); throw error; }
    finally { publish({ busy: false }); }
  };
  return { setActive: (next: boolean) => { active = next; }, subscribe: (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; }, getSnapshot: () => state,
    save: (original: TimelineEvent | null, values: TimelineWrite, signal: AbortSignal) => run('save', original, values, signal),
    remove: (original: TimelineEvent, signal: AbortSignal) => run('delete', original, null, signal),
    reconcile: async (signal: AbortSignal) => { if (state.busy) throw new Error('TIMELINE_RECONCILE'); publish({ busy: true }); try { const rows = await api.list(undefined, signal); check(signal); publish({ needsReconcile: false }); return rows; } finally { publish({ busy: false }); } },
  };
}
