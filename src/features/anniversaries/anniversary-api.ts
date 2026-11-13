import { apiRequest } from '@/api/apiClient';
import { positiveId } from '@/features/timeline/timeline-data';
import {
  anniversaryWrite, assertAnniversaryUnchanged, lunarPartsValid, lunarYearValid,
  requireAnniversaries, requireAnniversary, requireAnniversaryWrite, requireConversion, requireOccurrence,
  type Anniversary, type AnniversaryWrite, type LunarInput,
} from './anniversary-data';

const route = '/api/family-tree/anniversaries';
async function data(path: string, options: RequestInit = {}): Promise<unknown> {
  const envelope = await apiRequest<{ success: boolean; data: unknown }>(path, options);
  if (!envelope || envelope.success !== true || !Object.hasOwn(envelope, 'data')) throw new Error('ANNIVERSARY_INVALID_DATA');
  return envelope.data;
}
function recordPath(id: number): string {
  if (!positiveId(id)) throw new Error('ANNIVERSARY_INVALID_ID');
  return `${route}/${id}`;
}
function lunarQuery(input: Pick<LunarInput, 'day' | 'month' | 'isLeapMonth'>, year?: number): string {
  if (!lunarPartsValid(input.day, input.month) || typeof input.isLeapMonth !== 'boolean'
    || year !== undefined && !lunarYearValid(year)) throw new Error('FAMILY_ANNIVERSARY_INVALID_LUNAR_DATE');
  const query = `day=${input.day}&month=${input.month}&isLeapMonth=${input.isLeapMonth}`;
  return year === undefined ? query : `${query}&year=${year}`;
}
export const anniversaryApi = {
  list: async (signal?: AbortSignal) => requireAnniversaries(await data(route, { signal })),
  get: async (id: number, signal?: AbortSignal) => {
    const item = requireAnniversary(await data(recordPath(id), { signal }));
    if (item.id !== id) throw new Error('ANNIVERSARY_INVALID_DATA');
    return item;
  },
  create: async (input: AnniversaryWrite, signal?: AbortSignal) => requireAnniversary(await data(route, {
    method: 'POST', body: JSON.stringify(requireAnniversaryWrite(input)), signal,
  })),
  update: async (id: number, input: AnniversaryWrite, signal?: AbortSignal) => {
    const item = requireAnniversary(await data(recordPath(id), {
      method: 'PUT', body: JSON.stringify(requireAnniversaryWrite(input)), signal,
    }));
    if (item.id !== id) throw new Error('ANNIVERSARY_INVALID_DATA');
    return item;
  },
  remove: async (id: number, signal?: AbortSignal) => { await apiRequest<void>(recordPath(id), { method: 'DELETE', signal }); },
  convert: async (input: LunarInput, signal?: AbortSignal) => {
    if (!lunarYearValid(input.year)) throw new Error('FAMILY_ANNIVERSARY_INVALID_LUNAR_DATE');
    return requireConversion(await data(`${route}/lunar-to-solar?${lunarQuery(input, input.year)}`, { signal }), input);
  },
  occurrence: async (input: Pick<LunarInput, 'day' | 'month' | 'isLeapMonth'>, signal?: AbortSignal) => requireOccurrence(
    await data(`${route}/next-occurrence?${lunarQuery(input)}`, { signal }), input,
  ),
};

export function createAnniversaryMutations(api = anniversaryApi) {
  let active = false;
  let state = { busy: false, needsReconcile: false };
  const listeners = new Set<() => void>();
  const publish = (patch: Partial<typeof state>) => {
    state = { ...state, ...patch };
    listeners.forEach(listener => listener());
  };
  const check = (signal: AbortSignal) => {
    if (!active || signal.aborted) throw new Error('ANNIVERSARY_ACCOUNT_CHANGED');
  };
  const run = async (original: Anniversary | null, input: AnniversaryWrite | null, signal: AbortSignal) => {
    check(signal);
    if (state.busy || state.needsReconcile) throw new Error('ANNIVERSARY_RECONCILE');
    if (!input && !original) throw new Error('ANNIVERSARY_INVALID_ID');
    const values = input ? requireAnniversaryWrite(input) : null;
    let dispatched = false;
    let acknowledged = false;
    publish({ busy: true });
    try {
      if (original) {
        let latest: Anniversary;
        try { latest = await api.get(original.id, signal); }
        catch (error) {
          if (!input && (error as { status?: number }).status === 404) {
            const rows = await api.list(signal);
            check(signal);
            if (rows.some(row => row.id === original.id)) throw new Error('ANNIVERSARY_STALE');
            return rows;
          }
          throw error;
        }
        check(signal);
        assertAnniversaryUnchanged(original, latest);
      }
      if (values?.eventType === 'DEATH_ANNIVERSARY') {
        const converted = await api.convert({ day: values.lunarDay!, month: values.lunarMonth!, year: values.lunarYear!, isLeapMonth: values.isLeapMonth }, signal);
        check(signal);
        if (converted.solarDate !== values.originalSolarDate) throw new Error('FAMILY_ANNIVERSARY_DATE_MISMATCH');
      }
      check(signal);
      dispatched = true;
      let savedId: number | undefined;
      if (values) {
        const saved = original ? await api.update(original.id, values, signal) : await api.create(values, signal);
        savedId = saved.id;
      } else {
        try { await api.remove(original!.id, signal); }
        catch (error) { if ((error as { status?: number }).status !== 404) throw error; }
      }
      acknowledged = true;
      check(signal);
      const rows = await api.list(signal);
      check(signal);
      if (values) {
        const saved = rows.find(row => row.id === savedId);
        if (!saved || JSON.stringify(anniversaryWrite(saved)) !== JSON.stringify(values)) throw new Error('ANNIVERSARY_RECONCILE');
      } else if (rows.some(row => row.id === original!.id)) throw new Error('ANNIVERSARY_RECONCILE');
      return rows;
    } catch (error) {
      const status = (error as { status?: number })?.status;
      const rejectedBeforeAcknowledgement = !acknowledged && typeof status === 'number'
        && [400, 401, 403, 404, 409, 422, 429].includes(status);
      if (dispatched && !rejectedBeforeAcknowledgement) publish({ needsReconcile: true });
      throw error;
    } finally { publish({ busy: false }); }
  };
  return {
    setActive: (value: boolean) => { active = value; },
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => state,
    save: (original: Anniversary | null, input: AnniversaryWrite, signal: AbortSignal) => run(original, input, signal),
    remove: (original: Anniversary, signal: AbortSignal) => run(original, null, signal),
    reconcile: async (signal: AbortSignal) => {
      check(signal);
      if (state.busy) throw new Error('ANNIVERSARY_RECONCILE');
      publish({ busy: true });
      try {
        const rows = await api.list(signal);
        check(signal);
        publish({ needsReconcile: false });
        return rows;
      } finally { publish({ busy: false }); }
    },
  };
}
