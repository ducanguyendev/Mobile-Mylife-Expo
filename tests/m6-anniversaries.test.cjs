const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, hookRuntime } = require('./helpers/load-foundation.cjs');
const { member } = require('./helpers/load-m3.cjs');
const load = createLoader({ '@/api/apiClient': { apiRequest: async () => { throw Error('Unexpected network'); } } });
const data = load('src/features/anniversaries/anniversary-data.ts');
const draftData = load('src/features/anniversaries/anniversary-draft.ts');
const calendar = load('src/features/anniversaries/calendar-data.ts');
const strings = load('src/features/anniversaries/anniversary-strings.ts');
const { createAnniversaryMutations } = load('src/features/anniversaries/anniversary-api.ts');
const { createLunarPreview } = load('src/features/anniversaries/lunar-preview.ts');
const signal = () => new AbortController().signal;
const plain = value => JSON.parse(JSON.stringify(value));
function item(patch = {}) {
  return { id: 1, eventType: 'FAMILY_EVENT', title: 'Synthetic Nguyễn Đặng', relatedMemberId: null,
    relatedMemberName: null, relatedMemberGeneration: null, relatedMemberRole: null,
    lunarDay: null, lunarMonth: null, isLeapMonth: false, originalSolarDate: '2000-02-29',
    lunarYear: null, nextLunarYear: null, nextSolarDate: '2027-02-28', daysUntil: 108,
    place: null, host: null, notes: null, createdAt: '2026-11-12T10:00:00Z', updatedAt: '2026-11-12T10:00:00Z', ...patch };
}
function death(patch = {}) {
  return item({ eventType: 'DEATH_ANNIVERSARY', lunarDay: 1, lunarMonth: 1, lunarYear: 2024,
    originalSolarDate: '2024-02-10', nextLunarYear: 2027, nextSolarDate: '2027-02-06', ...patch });
}
test('actual20-field DTO accepts nullable nextLunarYear for solar family events', () => {
  assert.equal(Object.keys(item()).length, 20);
  assert.equal(data.requireAnniversary(item()).nextLunarYear, null);
});
for (const field of Object.keys(item())) test('missing read field rejected ' + field, () => {
  const value = item(); delete value[field];
  assert.throws(() => data.requireAnniversary(value));
});
for (const patch of [
  { id: -1 }, { id: 0 }, { id: Number.MAX_SAFE_INTEGER + 1 }, { eventType: 'CUSTOM' }, { title: '' },
  { daysUntil: -1 }, { daysUntil: 0.5 }, { nextSolarDate: null }, { nextSolarDate: '2025-02-29' },
  { originalSolarDate: '1995-01-01T00:00:00Z' }, { lunarDay: 1 }, { isLeapMonth: true },
  { nextLunarYear: 2027 }, { relatedMemberId: 2147483648 }, { relatedMemberName: 'orphan metadata' },
  { updatedAt: '2026-02-30T00:00:00' },
]) test('malformed anniversary rejected ' + JSON.stringify(patch), () => assert.throws(() => data.requireAnniversary(item(patch))));
test('legacy lunar-backed family and death rows retain null original dates', () => {
  assert.equal(data.requireAnniversary(item({ lunarDay: 1, lunarMonth: 1, originalSolarDate: null })).originalSolarDate, null);
  assert.equal(data.requireAnniversary(death({ originalSolarDate: null, lunarYear: null })).lunarYear, null);
  assert.throws(() => data.requireAnniversary(item({ originalSolarDate: null })));
});
test('duplicate IDs and non-list response rejected', () => {
  assert.throws(() => data.requireAnniversaries([item(), item()]));
  assert.throws(() => data.requireAnniversaries({ data: [] }));
});
test('death rows require lunar parts and authoritative next lunar year', () => {
  assert.equal(data.requireAnniversary(death()).lunarYear, 2024);
  assert.throws(() => data.requireAnniversary(death({ nextLunarYear: null })));
  assert.throws(() => data.requireAnniversary(death({ lunarDay: 31 })));
});
test('normal family writes clear irrelevant lunar fields and preserve optional values', () => {
  const value = data.requireAnniversaryWrite({ ...data.anniversaryWrite(death()), eventType: 'FAMILY_EVENT', place: ' Place ', host: ' Host ', notes: ' Notes ' });
  assert.equal(value.lunarDay, null); assert.equal(value.lunarYear, null); assert.equal(value.isLeapMonth, false);
  assert.equal(value.place, 'Place'); assert.equal(value.host, 'Host'); assert.equal(value.notes, 'Notes');
});
for (const patch of [{ title: 'x' }, { title: 'x'.repeat(201) }, { place: 'x'.repeat(501) }, { host: 'x'.repeat(301) }, { notes: 'x'.repeat(2001) }, { originalSolarDate: null }]) {
  test('write validation rejects ' + Object.keys(patch)[0] + JSON.stringify(patch).length, () => assert.throws(() => data.requireAnniversaryWrite({ ...data.anniversaryWrite(item()), ...patch })));
}
for (const year of [1800, 2200]) test('supported lunar year boundary ' + year, () => assert.equal(data.requireAnniversaryWrite({ ...data.anniversaryWrite(death()), lunarYear: year }).lunarYear, year));
for (const year of [1799, 2201, 2024.5]) test('unsupported lunar year ' + year, () => assert.throws(() => data.requireAnniversaryWrite({ ...data.anniversaryWrite(death()), lunarYear: year })));
test('Can Chi matches Web and requires explicit valid lunar year', () => {
  assert.equal(data.canChi(2024), '2024 – Giáp Thìn'); assert.equal(data.canChi(2023), '2023 – Quý Mão');
  assert.equal(data.canChi(0), null); assert.equal(data.canChi(1799), null); assert.equal(data.canChi(NaN), null);
});
test('member validation handles deceased match, living, missing death date and mismatch', () => {
  const input = { ...data.anniversaryWrite(death()), relatedMemberId: 1 };
  const deceased = member(1, { lifeStatus: 'DECEASED', deathDate: '2024-02-10' });
  assert.doesNotThrow(() => data.validateAnniversaryMember(input, [deceased]));
  assert.throws(() => data.validateAnniversaryMember(input, [member(1)]), /NOT_DECEASED/);
  assert.throws(() => data.validateAnniversaryMember(input, [member(1, { lifeStatus: 'DECEASED' })]), /DEATH_DATE_REQUIRED/);
  assert.throws(() => data.validateAnniversaryMember(input, [member(1, { lifeStatus: 'DECEASED', deathDate: '2024-02-11' })]), /DEATH_DATE_MISMATCH/);
  assert.throws(() => data.validateAnniversaryMember(input, []), /MEMBER_MISSING/);
});
test('eligible picker supports125 candidates and excludes deceased without valid dates', () => {
  const members = Array.from({ length: 125 }, (_, index) => member(index + 1, { lifeStatus: 'DECEASED', deathDate: '2024-02-10' }));
  members.push(member(126), member(127, { lifeStatus: 'DECEASED' }));
  assert.equal(data.eligibleAnniversaryMembers(members, 'DEATH_ANNIVERSARY').length, 125);
  assert.equal(data.eligibleAnniversaryMembers(members, 'FAMILY_EVENT').length, 127);
});
test('draft type switching clears lunar values and selecting member copies recorded death date', () => {
  const members = [member(1, { lifeStatus: 'DECEASED', deathDate: '2024-02-10' })];
  let draft = draftData.makeAnniversaryDraft(data.anniversaryWrite(death({ isLeapMonth: true })));
  draft = draftData.switchAnniversaryType(draft, 'FAMILY_EVENT', members);
  assert.equal(draft.day, ''); assert.equal(draft.year, ''); assert.equal(draft.values.isLeapMonth, false);
  draft = draftData.switchAnniversaryType(draft, 'DEATH_ANNIVERSARY', members);
  draft = draftData.selectAnniversaryMember(draft, 1, members);
  assert.equal(draft.values.originalSolarDate, members[0].deathDate);
  assert.equal(draftData.selectAnniversaryMember(draft, null, members).values.originalSolarDate, null);
});
test('Monday-first Gregorian grid includes leap day and accurate adjacent dates', () => {
  const cells = calendar.calendarGrid({ year: 2024, month: 2 });
  assert.equal(cells.length, 35); assert.equal(cells[0].date, '2024-01-29');
  assert.equal(cells.filter(cell => cell.inMonth).length, 29);
  assert.equal(cells.at(-1).date, '2024-03-03');
});
test('month navigation crosses year boundary and enforces supported browsing range', () => {
  assert.deepEqual(plain(calendar.moveCalendarMonth({ year: 2026, month: 12 }, 1)), { year: 2027, month: 1 });
  assert.equal(calendar.calendarMonthValid(calendar.moveCalendarMonth({ year: 1800, month: 1 }, -1)), false);
  assert.throws(() => calendar.calendarGrid({ year: 2201, month: 1 }));
});
test('calendar placement uses next occurrence only and retains multiple types on one day', () => {
  const grouped = calendar.eventsByNextDate([item(), death({ id: 2, nextSolarDate: item().nextSolarDate })]);
  assert.equal(grouped.has(item().originalSolarDate), false); assert.equal(grouped.get(item().nextSolarDate).length, 2);
});
test('large list has full normalized search and type/date counts without truncation', () => {
  const items = Array.from({ length: 650 }, (_, index) => item({ id: index + 1, title: 'Kỷ niệm Nguyễn Đặng', daysUntil: index % 3 }));
  assert.equal(data.selectAnniversaries(items, 'ALL', 'ky niem nguyen dang', null).length, 650);
  assert.equal(data.selectAnniversaries(items, 'DEATH_ANNIVERSARY', '', null).length, 0);
  assert.equal(data.selectAnniversaries(items, 'ALL', '', '2030-01-01').length, 0);
  assert.equal(data.selectAnniversaries(items, 'ALL', '', null)[0].id, 1);
});
test('today highlighting trusts daysUntil0 and does not calculate another recurrence', () => {
  assert.equal(strings.countdownLabel({ daysUntil: 0 }, 'en', strings.anniversaryStrings.en), 'Today');
  assert.equal(strings.countdownLabel({ daysUntil: 5 }, 'vi', strings.anniversaryStrings.vi), 'Còn 5 ngày');
});
test('Vietnam business day changes at17UTC and date-only display remains stable', () => {
  const { vietnamDateKey } = load('src/features/home/home-data.ts');
  assert.equal(vietnamDateKey(new Date('2026-12-31T16:59:59Z')), '2026-12-31');
  assert.equal(vietnamDateKey(new Date('2026-12-31T17:00:00Z')), '2027-01-01');
  assert.match(strings.solarDateLabel('2024-02-10', 'vi', strings.anniversaryStrings.vi), /10/);
});
test('preview response must echo its requested lunar identity', () => {
  const input = { day: 1, month: 1, year: 2024, isLeapMonth: false };
  const result = { lunarDay: 1, lunarMonth: 1, lunarYear: 2024, isLeapMonth: false, solarDate: '2024-02-10' };
  assert.equal(data.requireConversion(result, input).solarDate, result.solarDate);
  assert.throws(() => data.requireConversion({ ...result, isLeapMonth: true }, input));
  assert.throws(() => data.requireOccurrence({ lunarDay: 1, lunarMonth: 1, isLeapMonth: false, nextLunarYear: 2027, nextSolarDate: '2027-02-06', daysUntil: 10, solarYear: 2026, isCurrentYearPassed: false }, input));
});
const timerTick = () => new Promise(resolve => setTimeout(resolve, 5));
test('preview debounce clears old output immediately, cancels obsolete requests and denies late results', async () => {
  const calls = [];
  const api = { occurrence: (input, signal) => new Promise(resolve => calls.push({ input, signal, resolve })), convert: async input => ({ solarDate: input.year === 2024 ? '2024-02-10' : '2025-01-29' }) };
  const preview = createLunarPreview(api, 0);
  preview.update({ day: 1, month: 1, year: 2024, isLeapMonth: false }); await timerTick();
  preview.update({ day: 1, month: 1, year: 2025, isLeapMonth: false });
  assert.equal(preview.getSnapshot().conversion, undefined); assert.equal(calls[0].signal.aborted, true);
  await timerTick(); calls[0].resolve({ nextSolarDate: 'OLD' }); await timerTick();
  assert.equal(preview.getSnapshot().status, 'loading');
  calls[1].resolve({ nextSolarDate: '2027-02-06' }); await timerTick();
  assert.equal(preview.getSnapshot().conversion.solarDate, '2025-01-29');
  preview.cancel(); assert.equal(preview.getSnapshot().status, 'idle');
});
test('preview coalesces typing and invalid day clears output without a request', async () => {
  let calls = 0;
  const preview = createLunarPreview({ occurrence: async () => { calls++; return {}; }, convert: async () => ({}) }, 0);
  preview.update({ day: 1, month: 1, year: null, isLeapMonth: false });
  preview.update({ day: 2, month: 1, year: null, isLeapMonth: false }); await timerTick(); assert.equal(calls, 1);
  preview.update({ day: 31, month: 1, year: 2024, isLeapMonth: false }); await timerTick();
  assert.equal(calls, 1); assert.equal(preview.getSnapshot().occurrence, undefined); preview.cancel();
});
function fakeApi() {
  let rows = [item()];
  const writes = [];
  return {
    writes, setRows: values => { rows = values; }, list: async () => rows,
    get: async id => { const row = rows.find(value => value.id === id); if (!row) throw { status: 404 }; return row; },
    create: async input => { writes.push('POST'); const row = item({ ...input, id: 2 }); rows = [...rows, row]; return row; },
    update: async (id, input) => { writes.push('PUT'); const row = item({ ...input, id }); rows = rows.map(value => value.id === id ? row : value); return row; },
    remove: async id => { writes.push('DELETE'); rows = rows.filter(value => value.id !== id); },
    convert: async () => ({ solarDate: '2024-02-10' }),
  };
}
test('actual mutation layer reconciles create/update/delete canonical fields', async () => {
  const api = fakeApi(), actions = createAnniversaryMutations(api); actions.setActive(true);
  const values = { ...data.anniversaryWrite(item()), title: 'Updated' };
  await actions.save(null, values, signal());
  await actions.save(item(), values, signal());
  await actions.remove((await api.get(1)), signal());
  assert.deepEqual(api.writes, ['POST', 'PUT', 'DELETE']); assert.equal(actions.getSnapshot().needsReconcile, false);
});
for (const kind of ['save', 'remove']) test('stale ' + kind + ' does not dispatch a write', async () => {
  const api = fakeApi(), actions = createAnniversaryMutations(api); actions.setActive(true);
  api.setRows([item({ notes: 'Changed elsewhere' })]);
  const task = kind === 'save' ? actions.save(item(), data.anniversaryWrite(item()), signal()) : actions.remove(item(), signal());
  await assert.rejects(task, /STALE/); assert.equal(api.writes.length, 0);
});
test('updatedAt conflict detected even if write fields match', async () => {
  const api = fakeApi(), actions = createAnniversaryMutations(api); actions.setActive(true);
  api.setRows([item({ updatedAt: '2026-11-12T11:00:00Z' })]);
  await assert.rejects(actions.remove(item(), signal()), /STALE/); assert.equal(api.writes.length, 0);
});
test('already deleted source is safe and emits no DELETE', async () => {
  const api = fakeApi(), actions = createAnniversaryMutations(api); actions.setActive(true); api.setRows([]);
  assert.equal((await actions.remove(item(), signal())).length, 0); assert.equal(api.writes.length, 0);
});
test('uncertain dispatched create locks new writes until reconciliation', async () => {
  const api = fakeApi(), actions = createAnniversaryMutations(api); actions.setActive(true);
  api.create = async () => { throw Error('Disconnected after dispatch'); };
  await assert.rejects(actions.save(null, data.anniversaryWrite(item()), signal()));
  assert.equal(actions.getSnapshot().needsReconcile, true);
  await assert.rejects(actions.remove(item(), signal()), /RECONCILE/);
  await actions.reconcile(signal()); assert.equal(actions.getSnapshot().needsReconcile, false);
});
test('post-save missing record cannot report success', async () => {
  const api = fakeApi(), actions = createAnniversaryMutations(api); actions.setActive(true);
  api.create = async values => item({ ...values, id: 2 });
  await assert.rejects(actions.save(null, data.anniversaryWrite(item()), signal()), /RECONCILE/);
  assert.equal(actions.getSnapshot().needsReconcile, true);
});
test('definitive Backend400 rejection preserves localized validation without uncertain-write lock', async () => {
  const api = fakeApi(), actions = createAnniversaryMutations(api); actions.setActive(true);
  const rejection = { status: 400, code: 'FAMILY_ANNIVERSARY_DEATH_DATE_MISMATCH' };
  api.create = async () => { throw rejection; };
  await assert.rejects(actions.save(null, data.anniversaryWrite(item()), signal()), error => error === rejection);
  assert.equal(actions.getSnapshot().needsReconcile, false);
  assert.equal(strings.anniversaryError(rejection, strings.anniversaryStrings.vi), strings.anniversaryStrings.vi.deathMismatch);
});
test('failed reconciliation after acknowledged write remains uncertain even with a definitive read error', async () => {
  const api = fakeApi(), actions = createAnniversaryMutations(api); actions.setActive(true);
  api.list = async () => { throw { status: 403 }; };
  await assert.rejects(actions.save(null, data.anniversaryWrite(item()), signal()), error => error.status === 403);
  assert.equal(api.writes.length, 1); assert.equal(actions.getSnapshot().needsReconcile, true);
});
test('serialized mutations reject duplicate submission', async () => {
  const api = fakeApi(); let release;
  api.create = async values => { await new Promise(resolve => { release = resolve; }); const saved = item({ ...values, id: 2 }); api.setRows([saved]); return saved; };
  const actions = createAnniversaryMutations(api); actions.setActive(true);
  const first = actions.save(null, data.anniversaryWrite(item()), signal());
  await assert.rejects(actions.save(null, data.anniversaryWrite(item()), signal()), /RECONCILE/);
  release(); await first;
});
test('blur/account change blocks writes and late mutation completion', async () => {
  const api = fakeApi(), actions = createAnniversaryMutations(api);
  await assert.rejects(actions.remove(item(), signal()), /ACCOUNT_CHANGED/);
  actions.setActive(true); let release;
  api.create = async values => { await new Promise(resolve => { release = resolve; }); return item({ ...values, id: 2 }); };
  const task = actions.save(null, data.anniversaryWrite(item()), signal()); actions.setActive(false); release();
  await assert.rejects(task, /ACCOUNT_CHANGED/); assert.equal(actions.getSnapshot().needsReconcile, true);
});
test('death mismatch is blocked by fresh conversion before POST', async () => {
  const api = fakeApi(), actions = createAnniversaryMutations(api); actions.setActive(true);
  api.convert = async () => ({ solarDate: '2024-02-11' });
  await assert.rejects(actions.save(null, data.anniversaryWrite(death()), signal()), /DATE_MISMATCH/);
  assert.equal(api.writes.length, 0); assert.equal(actions.getSnapshot().needsReconcile, false);
});
test('VI/EN copy keys and Backend validation messages are complete/localized', () => {
  assert.deepEqual(Object.keys(strings.anniversaryStrings.en).sort(), Object.keys(strings.anniversaryStrings.vi).sort());
  for (const language of ['vi', 'en']) {
    const copy = strings.anniversaryStrings[language];
    assert.equal(strings.anniversaryError({ code: 'FAMILY_ANNIVERSARY_MEMBER_DEATH_DATE_REQUIRED' }, copy), copy.missingDeath);
    assert.equal(strings.anniversaryError({ code: 'FAMILY_ANNIVERSARY_DATE_MISMATCH' }, copy), copy.mismatch);
    assert.equal(strings.anniversaryError({ status: 403, message: 'raw private text' }, copy), copy.forbidden);
  }
});

test('actual API uses all seven paths, strict envelopes and local invalid-ID/year guards', async () => {
  const calls = [];
  const adapter = createLoader({ '@/api/apiClient': { apiRequest: async (path, options) => {
    calls.push({ path, ...options });
    if (options?.method === 'DELETE') return undefined;
    if (path.includes('lunar-to-solar')) return { success: true, data: { lunarDay: 1, lunarMonth: 1, lunarYear: 2024, isLeapMonth: false, solarDate: '2024-02-10' } };
    if (path.includes('next-occurrence')) return { success: true, data: { lunarDay: 1, lunarMonth: 1, isLeapMonth: false, nextLunarYear: 2027, nextSolarDate: '2027-02-06', daysUntil: 86, solarYear: 2027, isCurrentYearPassed: true } };
    return { success: true, data: options?.method || /\/1$/.test(path) ? item() : [item()] };
  } } });
  const api = adapter('src/features/anniversaries/anniversary-api.ts').anniversaryApi;
  await api.list(); await api.get(1); await api.create(data.anniversaryWrite(item()));
  await api.update(1, data.anniversaryWrite(item())); await api.remove(1);
  await api.convert({ day: 1, month: 1, year: 2024, isLeapMonth: false });
  await api.occurrence({ day: 1, month: 1, isLeapMonth: false });
  assert.equal(calls.length, 7); assert.match(calls[5].path, /year=2024/);
  assert.match(calls[6].path, /next-occurrence/);
  for (const id of [-1, 0, NaN]) await assert.rejects(api.get(id));
  await assert.rejects(api.convert({ day: 1, month: 1, year: undefined, isLeapMonth: false }));
  assert.equal(calls.length, 7);
  const broken = createLoader({ '@/api/apiClient': { apiRequest: async () => ({ success: false, data: [item()] }) } })('src/features/anniversaries/anniversary-api.ts').anniversaryApi;
  await assert.rejects(broken.list(), /INVALID_DATA/);
});

function componentRuntime(extra = {}) {
  const hooks = hookRuntime();
  const mocks = {
    react: { ...hooks.hooks, useSyncExternalStore: (_subscribe, snapshot) => snapshot(), useRef: initial => {
      const [reference] = hooks.hooks.useState(() => ({ current: initial })); return reference;
    } },
    'react/jsx-runtime': { jsx: hooks.jsx, jsxs: hooks.jsx },
    'react-native': { View: 'View', Modal: 'Modal', ScrollView: 'Scroll', KeyboardAvoidingView: 'KeyboardView',
      FlatList: 'List', Pressable: 'Pressable', Platform: { OS: 'android' }, Keyboard: { dismiss() {} },
      Alert: { alert(...args) { mocks.alert = args; } },
      AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) }, RefreshControl: 'Refresh' },
    'react-native-safe-area-context': { SafeAreaView: 'Safe' },
    '@/design-system/components/app-text': { AppText: 'Text' },
    '@/design-system/components/fields': { MyLifeTextField: 'Field', MyLifeSearchField: 'Search' },
    '@/design-system/components/buttons': { PrimaryButton: 'Primary', SecondaryButton: 'Secondary', TextButton: 'Button', DestructiveButton: 'Delete' },
    '@/theme/theme-provider': { useAppTheme: () => ({ colors: {}, language: 'en', reducedMotion: true }) },
    '@/api/apiClient': { apiRequest: async () => { throw Error('Unexpected component network'); } },
    'expo-router': { router: { push() {} } }, ...extra,
  };
  function flat(tree) { return Array.isArray(tree) ? tree.flatMap(flat) : !tree || typeof tree !== 'object' ? [] : [tree, ...flat(tree.props?.children)]; }
  return { hooks, mocks, load: createLoader(mocks), flat };
}
test('actual anniversary editor preserves optional fields and warns before discarding edits', async () => {
  const runtime = componentRuntime();
  const Editor = runtime.load('src/features/anniversaries/AnniversaryEditor.tsx').AnniversaryEditor;
  let saved, cancelled = 0;
  const original = item({ place: 'Original place', host: 'Original host', notes: 'Original notes' });
  const props = { original, initial: data.blankAnniversary(), members: [], copy: strings.anniversaryStrings.en, busy: false, needsReconcile: false,
    onCancel: () => cancelled++, onSave: async values => { saved = values; } };
  let nodes = runtime.flat(runtime.hooks.render(Editor, props));
  nodes.find(node => node.type === 'Field' && node.props.label === props.copy.titleField).props.onChangeText('Updated synthetic title');
  nodes = runtime.flat(runtime.hooks.render(Editor, props));
  nodes.find(node => node.type === 'Button' && node.props.title === props.copy.cancel).props.onPress();
  assert.equal(cancelled, 0); assert.equal(runtime.mocks.alert[0], props.copy.discardTitle);
  nodes.find(node => node.type === 'Primary').props.onPress(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(saved.place, 'Original place'); assert.equal(saved.host, 'Original host'); assert.equal(saved.notes, 'Original notes');
  assert.equal(saved.originalSolarDate, '2000-02-29'); assert.equal(saved.title, 'Updated synthetic title');
});
test('actual death editor blocks Save until current authoritative conversion preview is ready', async () => {
  const runtime = componentRuntime(), Editor = runtime.load('src/features/anniversaries/AnniversaryEditor.tsx').AnniversaryEditor;
  let saves = 0;
  const props = { original: death(), initial: data.blankAnniversary(), members: [], copy: strings.anniversaryStrings.en,
    busy: false, needsReconcile: false, onCancel() {}, onSave: async () => saves++ };
  runtime.flat(runtime.hooks.render(Editor, props)).find(node => node.type === 'Primary').props.onPress();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(saves, 0);
  assert.ok(runtime.flat(runtime.hooks.render(Editor, props)).some(node => node.type === 'Text' && node.props.children === props.copy.previewPending));
});
test('actual screen distinguishes a filtered-out date event from a date without provided occurrences', () => {
  const runtime = componentRuntime({
    '@/features/auth/context/auth-provider': { useAuth: () => ({ user: { id: 1, role: 'USER' }, isUser: true }) },
    '@/features/home/use-home': { useDeviceClock: () => new Date('2026-11-12T05:00:00Z') },
    '@/components/layout/app-screen': { AppScreen: 'Screen', AppHeader: 'Header' },
    '@/components/feedback/states': { LoadingState: 'Loading' },
    '@/design-system/components/surfaces': { AppCard: 'Card' },
    '@/design-system/components/controls': { Badge: 'Badge' },
    'expo-router': { router: { push() {} }, useFocusEffect() {} },
    './use-anniversaries': { useAnniversaries: () => ({ status: 'ready', data: { items: [item()], members: [] }, reload: async () => {} }) },
    './AnniversaryCalendar': { AnniversaryCalendar: 'Calendar' },
    './AnniversaryEditor': { AnniversaryEditor: 'Editor' },
    './AnniversaryDetails': { AnniversaryDetails: 'Details', AnniversaryDeleteDialog: 'DeleteDialog' },
  });
  const Screen = runtime.load('src/features/anniversaries/AnniversaryScreen.tsx').AnniversaryScreen;
  const explorer = runtime.hooks.render(Screen);
  const render = () => runtime.hooks.render(explorer.type, explorer.props);
  let list = runtime.flat(render()).find(node => node.type === 'List');
  let header = runtime.flat(list.props.ListHeaderComponent);
  header.find(node => node.type === 'Calendar').props.onSelect('2027-02-28');
  header.find(node => node.type === 'Search').props.onChangeText('No such title');
  list = runtime.flat(render()).find(node => node.type === 'List');
  assert.equal(list.props.data.length, 0);
  assert.ok(runtime.flat(list.props.ListEmptyComponent).some(node => node.props.children === strings.anniversaryStrings.en.noResults));
  header = runtime.flat(list.props.ListHeaderComponent);
  header.find(node => node.type === 'Calendar').props.onSelect('2027-03-01');
  list = runtime.flat(render()).find(node => node.type === 'List');
  assert.ok(runtime.flat(list.props.ListEmptyComponent).some(node => node.props.children === strings.anniversaryStrings.en.noDayEvents));
});
test('account-keyed anniversary hook cancels background work and ignores old-account completion', async () => {
  const hooks = hookRuntime(); let focus, background;
  const waiting = [];
  const memo = (factory, deps) => {
    const [slot] = hooks.hooks.useState(() => ({ deps: null, value: null }));
    if (!slot.deps || deps.some((dependency, index) => !Object.is(dependency, slot.deps[index]))) { slot.deps = deps; slot.value = factory(); }
    return slot.value;
  };
  const adapter = createLoader({ react: { ...hooks.hooks, useMemo: memo, useCallback: (callback, deps) => memo(() => callback, deps), useSyncExternalStore: (_subscribe, snapshot) => snapshot() },
    'react-native': { AppState: { currentState: 'active', addEventListener: (_event, callback) => { background = callback; return { remove() {} }; } } },
    'expo-router': { useFocusEffect: callback => { focus = callback; } },
    '@/features/family/api/familyDataApi': { familyDataApi: { list: async () => [] } },
    './anniversary-api': { anniversaryApi: { list: () => new Promise(resolve => waiting.push(resolve)) } },
  });
  const hook = adapter('src/features/anniversaries/use-anniversaries.ts').useAnniversaries;
  hooks.render(() => hook(1, '2026-11-12')); const blur = focus(); await new Promise(resolve => setImmediate(resolve));
  background('background'); waiting.shift()([item()]); await new Promise(resolve => setImmediate(resolve));
  assert.equal(hooks.render(() => hook(1, '2026-11-12')).data, undefined);
  background('active'); await new Promise(resolve => setImmediate(resolve)); waiting.shift()([item()]); await new Promise(resolve => setImmediate(resolve));
  assert.equal(hooks.render(() => hook(1, '2026-11-12')).data.items[0].id, 1);
  blur(); assert.equal(hooks.render(() => hook(2, '2026-11-12')).data, undefined);
  assert.equal(hooks.render(() => hook(2, '2026-11-13')).data, undefined);
});
