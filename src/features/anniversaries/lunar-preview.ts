import { anniversaryApi } from './anniversary-api';
import { lunarPartsValid, lunarYearValid, type Conversion, type LunarInput, type Occurrence } from './anniversary-data';

export type PreviewInput = Omit<LunarInput, 'year'> & { year: number | null };
export type LunarPreviewState = {
  key: string;
  status: 'idle' | 'loading' | 'ready' | 'error';
  conversion?: Conversion;
  occurrence?: Occurrence;
  error?: unknown;
};
export function previewKey(input: PreviewInput | null): string {
  return input ? `${input.day}/${input.month}/${input.year}/${input.isLeapMonth}` : '';
}
/** Each draft identity immediately clears prior output, including before debounce. */
export function createLunarPreview(api = anniversaryApi, delay = 350) {
  let state: LunarPreviewState = { key: '', status: 'idle' };
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;
  const listeners = new Set<() => void>();
  const publish = (next: LunarPreviewState) => { state = next; listeners.forEach(listener => listener()); };
  const cancel = () => {
    clearTimeout(timer);
    controller?.abort();
    controller = undefined;
  };
  return {
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => state,
    update: (input: PreviewInput | null) => {
      cancel();
      const key = previewKey(input);
      if (!input || !lunarPartsValid(input.day, input.month)) {
        publish({ key, status: 'idle' });
        return;
      }
      const request = new AbortController();
      controller = request;
      publish({ key, status: 'loading' });
      timer = setTimeout(() => {
        void (async () => {
          try {
            const [occurrence, conversion] = await Promise.all([
              api.occurrence(input, request.signal),
              lunarYearValid(input.year) ? api.convert({ ...input, year: input.year }, request.signal) : Promise.resolve(undefined),
            ]);
            if (!request.signal.aborted) publish({ key, status: 'ready', occurrence, conversion });
          } catch (error) {
            if (!request.signal.aborted) publish({ key, status: 'error', error });
          }
        })();
      }, delay);
    },
    cancel: () => { cancel(); publish({ key: '', status: 'idle' }); },
  };
}
