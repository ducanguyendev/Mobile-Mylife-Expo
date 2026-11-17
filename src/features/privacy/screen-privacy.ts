export type ScreenPrivacyAdapter = {
  prevent: (key: string) => Promise<void>;
  allow: (key: string) => Promise<void>;
  enableOverlay?: () => Promise<void>;
  disableOverlay?: () => Promise<void>;
};

// One owner spans authenticated routes. Serialize native calls so an old logout
// cannot clear a newer login's protection. A fresh tag reasserts a recreated window.
export function createScreenPrivacy(adapter: ScreenPrivacyAdapter) {
  let queue: Promise<unknown> = Promise.resolve();
  let key: string | undefined;
  let nextKey = 0;
  let overlay = false;
  function enqueue(operation: () => Promise<void>) {
    const result = queue.catch(() => undefined).then(operation);
    queue = result;
    return result;
  }
  return {
    protect: () => enqueue(async () => {
      const previous = key;
      const current = `mylife-private-${++nextKey}`;
      await adapter.prevent(current);
      key = current;
      if (previous) await adapter.allow(previous);
      if (adapter.enableOverlay && !overlay) {
        await adapter.enableOverlay();
        overlay = true;
      }
    }),
    release: () => enqueue(async () => {
      if (overlay && adapter.disableOverlay) {
        await adapter.disableOverlay();
        overlay = false;
      }
      // Also clear the native startup FLAG_SECURE when no JS tag exists yet.
      await adapter.allow(key ?? 'mylife-startup');
      key = undefined;
    }),
  };
}
