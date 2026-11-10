const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, createNativeRuntime, hookRuntime } = require('./helpers/load-foundation.cjs');
const load = createLoader();
const data = load('src/features/home/home-data.ts');
const { createHomeResource } = load('src/features/home/home-resource.ts');
const { createPreferenceStore, parsePreferences, resolveLanguage, preferenceKey } = load('src/preferences/preferences.ts');
const { getStrings } = load('src/localization/strings.ts');
const json = value => JSON.parse(JSON.stringify(value));
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const emptyLoaders = () => ({ family: async () => [], anniversaries: async () => [], albums: async () => [] });

test('Home counts actual records and distinct known generations without changing order', () => {
  const members = [{ id: 7, generation: 1 }, { id: 2, generation: 3 }, { id: 5, generation: 3 }, { id: 9, generation: null }];
  const summary = data.familySummary(members);
  assert.equal(summary.count, 4); assert.equal(summary.generations, 2);
  assert.deepEqual(json(summary.previews.map(member => member.id)), [7, 2, 5]);
  assert.deepEqual(json(data.familySummary([])), { count: 0, generations: 0, previews: [] });
});
test('Date-only display rejects invalid dates and never shifts with timezone', () => {
  for (const value of ['', null, '2026-02-30', '2026-13-01', '2026-01-01T00:00:00Z']) assert.equal(data.parseDateOnly(value), null);
  assert.equal(data.parseDateOnly('2024-02-29').toISOString(), '2024-02-29T12:00:00.000Z');
  assert.match(data.formatDateOnly('2026-01-01', 'en'), /January 1, 2026/);
  assert.match(data.formatDateOnly('2026-01-01', 'vi'), /2026/);
  assert.equal(data.formatDateOnly('invalid', 'en'), null);
});
test('Anniversaries use authoritative next solar date and Vietnam day boundary, not lunar arithmetic', () => {
  const events = [{ id: 1, nextSolarDate: '2026-11-10', daysUntil: 0 }, { id: 2, nextSolarDate: '2026-11-11', daysUntil: 1 }, { id: 3, nextSolarDate: 'bad' }];
  const now = new Date('2026-11-10T17:01:00Z');
  assert.equal(data.vietnamDateKey(now), '2026-11-11');
  assert.deepEqual(json(data.upcomingAnniversaries(events, now).map(event => event.id)), [2]);
  assert.equal(events.length, 3);
});
test('Greeting follows device local hour including noon and evening boundaries', () => {
  assert.equal(data.greetingPeriod(new Date(2026, 0, 1, 11)), 'morning');
  assert.equal(data.greetingPeriod(new Date(2026, 0, 1, 12)), 'afternoon');
  assert.equal(data.greetingPeriod(new Date(2026, 0, 1, 18)), 'evening');
});
test('Recent albums keep real zero photo counts and safely order missing timestamps', () => {
  const albums = [{ id: 1, updatedAt: 'bad', photoCount: 0 }, { id: 2, updatedAt: '2026-11-10T00:00:00Z', photoCount: 3 }];
  assert.deepEqual(json(data.recentAlbums(albums).map(album => album.id)), [2, 1]);
  assert.equal(data.recentAlbums(albums)[1].photoCount, 0); assert.deepEqual(json(data.recentAlbums([])), []);
});
test('One focus/refresh burst sends exactly one request per section', async () => {
  const held = deferred(); const counts = { family: 0, anniversaries: 0, albums: 0 };
  const loaders = Object.fromEntries(Object.keys(counts).map(key => [key, async () => { counts[key]++; await held.promise; return []; }]));
  const resource = createHomeResource(loaders);
  const tasks = [resource.refresh(), resource.refresh(), resource.retry('family')];
  await Promise.resolve(); assert.deepEqual(counts, { family: 1, anniversaries: 1, albums: 1 });
  held.resolve(); await Promise.all(tasks);
  assert.equal(resource.getSnapshot().family.status, 'ready');
});
test('Partial failure leaves independent sections ready and retry reloads only the failed section', async () => {
  let fails = true; let attempts = 0; let familyCalls = 0;
  const resource = createHomeResource({ ...emptyLoaders(), family: async () => { familyCalls++; return [{ id: 1 }]; }, albums: async () => { attempts++; if (fails) throw Error('private server detail'); return []; } });
  await resource.refresh();
  assert.equal(resource.getSnapshot().family.status, 'ready'); assert.equal(resource.getSnapshot().albums.status, 'error');
  assert.equal(JSON.stringify(resource.getSnapshot()).includes('private server detail'), false);
  fails = false; await resource.retry('albums'); assert.equal(attempts, 2); assert.equal(familyCalls, 1);
});
test('Cancellation aborts all sections and ignores late success from obsolete requests', async () => {
  const held = deferred(); const signals = [];
  const resource = createHomeResource(Object.fromEntries(['family', 'anniversaries', 'albums'].map(key => [key, async signal => { signals.push(signal); return held.promise; }])));
  const task = resource.refresh(); await Promise.resolve(); resource.cancel();
  assert.ok(signals.every(signal => signal.aborted)); held.resolve([{ id: 17 }]); await task;
  assert.equal(resource.getSnapshot().family.status, 'idle'); assert.equal(resource.getSnapshot().family.data, undefined);
  resource.dispose(); await resource.refresh(); assert.equal(signals.length, 3);
});
test('Separate accounts never share data and an old request cannot overwrite the new account', async () => {
  const held = deferred();
  const one = createHomeResource({ ...emptyLoaders(), family: () => held.promise });
  const old = one.refresh(); await Promise.resolve(); one.cancel();
  const two = createHomeResource({ ...emptyLoaders(), family: async () => [{ id: 202 }] });
  assert.equal(two.getSnapshot().family.data, undefined); await two.refresh();
  held.resolve([{ id: 101 }]); await old;
  assert.deepEqual(json(two.getSnapshot().family.data), [{ id: 202 }]); assert.equal(one.getSnapshot().family.data, undefined);
});
test('Cancel then refocus allows new requests while old ones are unresolved', async () => {
  const held = deferred(); let count = 0;
  const resource = createHomeResource({ ...emptyLoaders(), family: async () => ++count === 1 ? held.promise : [{ id: 2 }] });
  const old = resource.refresh(); await Promise.resolve(); resource.cancel(); await resource.refresh();
  held.resolve([{ id: 1 }]); await old; assert.equal(resource.getSnapshot().family.data[0].id, 2);
});
test('Preference parsing whitelists fields and tolerates absent or corrupt storage', () => {
  for (const value of [null, '', 'bad', 'null', '[]', '{"theme":"pink","language":"fr"}']) assert.deepEqual(json(parsePreferences(value)), { theme: 'system', language: 'system' });
  assert.deepEqual(json(parsePreferences('{"theme":"dark","language":"en","accessToken":"never"}')), { theme: 'dark', language: 'en' });
});
test('Preferences restore theme/language across fresh instances and contain no session fields', async () => {
  const values = new Map(); const storage = { getItem: async key => values.get(key) ?? null, setItem: async (key, value) => { values.set(key, value); } };
  const one = createPreferenceStore(storage); await one.hydrate(); await one.set({ theme: 'dark', language: 'en' });
  const two = createPreferenceStore(storage); await two.hydrate();
  assert.equal(two.getSnapshot().theme, 'dark'); assert.equal(two.getSnapshot().language, 'en');
  assert.deepEqual(Object.keys(JSON.parse(values.get(preferenceKey))).sort(), ['language', 'theme']);
});
test('Preference read/write failures leave usable defaults/current choice and retry can recover', async () => {
  let broken = true;
  const store = createPreferenceStore({ getItem: async () => { throw Error('unavailable'); }, setItem: async () => { if (broken) throw Error('unavailable'); } });
  await store.hydrate(); assert.equal(store.getSnapshot().hydrated, true); assert.equal(store.getSnapshot().storageError, true);
  await store.set({ theme: 'light' }); assert.equal(store.getSnapshot().theme, 'light'); assert.equal(store.getSnapshot().storageError, true);
  broken = false; await store.retry(); assert.equal(store.getSnapshot().storageError, false);
});
test('Late hydration never overwrites user selection; queued writes preserve latest choice', async () => {
  const held = deferred(); let value;
  const store = createPreferenceStore({ getItem: () => held.promise, setItem: async (_, next) => { value = next; } });
  const hydration = store.hydrate();
  const first = store.set({ theme: 'light' }); const second = store.set({ theme: 'dark', language: 'en' });
  held.resolve('{"theme":"light","language":"vi"}'); await Promise.all([hydration, first, second]);
  assert.deepEqual(JSON.parse(value), { theme: 'dark', language: 'en' }); assert.equal(store.getSnapshot().theme, 'dark');
});
test('Explicit language wins; System supports EN tags and safely falls back to Vietnamese', () => {
  assert.equal(resolveLanguage('en', 'vi'), 'en'); assert.equal(resolveLanguage('vi', 'en'), 'vi');
  for (const tag of ['en', 'en-GB', 'EN_us']) assert.equal(resolveLanguage('system', tag), 'en');
  for (const tag of [null, 'vi', 'fr', '']) assert.equal(resolveLanguage('system', tag), 'vi');
  assert.deepEqual(Object.keys(getStrings('en')).sort(), Object.keys(getStrings('vi')).sort());
  assert.equal(getStrings('en').photos(0), 'No photos in this album');
});
test('A stalled preference read releases startup and a late read cannot repaint the app', async () => {
  const held = deferred(); let timeout;
  const preferenceLoad = createLoader({}, { setTimeout: callback => { timeout = callback; return 1; }, clearTimeout() {} });
  const store = preferenceLoad('src/preferences/preferences.ts').createPreferenceStore({ getItem: () => held.promise, setItem: async () => {} });
  const task = store.hydrate(); timeout(); await task;
  assert.equal(store.getSnapshot().hydrated, true); assert.equal(store.getSnapshot().storageError, true);
  held.resolve('{"theme":"dark","language":"en"}'); await Promise.resolve();
  assert.equal(store.getSnapshot().theme, 'system');
});
test('Home loaders use real endpoint contracts with native auth headers and no photo fetch', async () => {
  const requests = [];
  const runtime = createNativeRuntime('https://test.invalid', async (url, init) => {
    requests.push(new URL(url).pathname); assert.equal(init.credentials, 'omit');
    assert.equal(init.headers.get('Authorization'), 'Bearer access'); assert.equal(init.headers.get('X-Client-Platform'), 'mobile');
    return Response.json(url.endsWith('/albums') ? [] : { success: true, data: [] });
  });
  await runtime.storage.write({ accessToken: 'access', refreshToken: 'refresh', accessTokenExpiresIn: 60, refreshTokenExpiresIn: 600 });
  const loaders = runtime.load('src/features/home/home-api.ts').homeLoaders;
  await createHomeResource(loaders).refresh();
  assert.deepEqual(requests.sort(), ['/api/family-tree', '/api/family-tree/anniversaries', '/api/library/albums']);
});
test('Malformed Home responses become errors rather than fabricated empty data', async () => {
  const runtime = createNativeRuntime('https://test.invalid', async () => Response.json({ success: true, data: null }));
  const resource = createHomeResource(runtime.load('src/features/home/home-api.ts').homeLoaders);
  await resource.refresh(); assert.ok(Object.values(resource.getSnapshot()).every(section => section.status === 'error'));
});
test('API client propagates caller cancellation through its own timeout controller', async () => {
  let signal; const started = deferred();
  const runtime = createNativeRuntime('https://test.invalid', async (_, init) => {
    signal = init.signal; started.resolve(); return new Promise((_, reject) => signal.addEventListener('abort', () => reject(Error('aborted'))));
  });
  const controller = new AbortController();
  const task = runtime.api.apiRequest('/api/family-tree', { signal: controller.signal }).catch(() => undefined);
  await started.promise; controller.abort(); await task; assert.equal(signal.aborted, true);
});

const h = hookRuntime();
const palettes = load('src/design-system/tokens.ts').palettes;
const uiLoad = createLoader({ react: h.hooks, 'react/jsx-runtime': { jsx: h.jsx, jsxs: h.jsx },
  'react-native': { View: 'View', Text: 'Text', Pressable: 'Pressable', ActivityIndicator: 'Spinner', ScrollView: 'ScrollView', StyleSheet: { create: value => value } },
  '@/theme/theme-provider': { useAppTheme: () => ({ colors: palettes.light }) },
  '@/localization/use-localization': { useLocalization: () => ({ copy: getStrings('en'), language: 'en' }) },
});
test('Shared feedback announces busy/errors and offers localized actionable retry', () => {
  const ui = uiLoad('src/components/feedback/states.tsx');
  assert.equal(ui.LoadingState({}).props.accessibilityState.busy, true);
  assert.equal(ui.LoadingState({}).props.accessibilityLabel, 'Loading…');
  const error = ui.ErrorState({ title: 'Error', message: 'Offline', retry: () => {} });
  assert.equal(error.props.children[0].props.accessibilityLiveRegion, 'polite');
  assert.equal(error.props.children[1].props.title, 'Try again');
  assert.equal(ui.SkeletonBlock({}).props.importantForAccessibility, 'no-hide-descendants');
  assert.equal(ui.OfflineState({}).props.children.props.children.includes('saved'), false);
});
test('Shared button and segmented controls preserve 48dp targets, disabled/busy state and wrapping', () => {
  const buttons = uiLoad('src/design-system/components/buttons.tsx');
  const element = buttons.PrimaryButton({ title: 'Save', loading: true, compact: true });
  const button = element.type(element.props);
  assert.equal(button.props.disabled, true); assert.equal(button.props.accessibilityState.busy, true);
  assert.ok(button.props.style({ pressed: false }).filter(Boolean).every(style => !style.minHeight || style.minHeight >= 48));
  const controls = uiLoad('src/design-system/components/controls.tsx');
  const segment = controls.SegmentedTabs({ options: [{ value: 'en', label: 'English' }], value: 'en', onChange: () => {} }).props.children[0];
  assert.equal(segment.props.accessibilityState.selected, true); assert.equal(segment.props.children.props.numberOfLines, undefined);
  assert.ok(segment.props.style({ pressed: false })[0].minHeight >= 48);
});
test('Avatar safely falls back after image error and retries only when its URI changes', () => {
  const runtime = hookRuntime();
  const avatarLoad = createLoader({ react: runtime.hooks, 'react/jsx-runtime': { jsx: runtime.jsx, jsxs: runtime.jsx },
    'expo-image': { Image: 'Image' }, 'react-native': { View: 'View', StyleSheet: { create: value => value } },
    '@/theme/theme-provider': { useAppTheme: () => ({ colors: palettes.light }) },
    '@/localization/use-localization': { useLocalization: () => ({ copy: getStrings('en') }) },
  });
  const { Avatar } = avatarLoad('src/design-system/components/avatar.tsx');
  let tree = runtime.render(Avatar, { name: 'Test Person', uri: 'https://private.invalid/avatar' });
  assert.equal(tree.props.children[0].type, 'Image'); tree.props.children[0].props.onError();
  tree = runtime.render(Avatar, { name: 'Test Person', uri: 'https://private.invalid/avatar' });
  assert.equal(tree.props.children[0].type, 'View');
  tree = runtime.render(Avatar, { name: 'Test Person', uri: 'https://new.invalid/avatar' }); assert.equal(tree.props.children[0].type, 'Image');
  tree = runtime.render(Avatar, { name: '', uri: 'javascript:invalid' }); assert.equal(tree.props.children[0].type, 'View');
  assert.equal(tree.props.children[0].props.children.props.children, '?');
});
