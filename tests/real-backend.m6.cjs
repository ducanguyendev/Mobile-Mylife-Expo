const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const { createM3Runtime } = require('./helpers/load-m3.cjs');
const base = process.env.MYLIFE_M1_API_URL;
const database = process.env.MYLIFE_M1_ISOLATED;
const clockFile = process.env.MYLIFE_M6_CLOCK_FILE;
const output = 'docs/review-m6/test-results/final-backend';
if (!/^mylife_m1_[a-f0-9]{12}$/.test(database || '') || !base || new URL(base).hostname !== '127.0.0.1'
  || path.resolve(clockFile || '') !== path.resolve('.tmp/m6-calendar-clock.json')) throw Error('Disposable M6 loopback runtime required');
const checks = [], requests = [];
const record = name => {
  checks.push({ name, status: 'PASS' });
  fs.writeFileSync(path.join(output, 'm6-integration.json'), JSON.stringify({ checks, requests, frozenTime: true, transport: 'Real Kestrel/PostgreSQL with native bridge adapters and Web cookie HTTP' }, null, 2));
  console.log('PASS ' + name);
};
const network = async (url, init) => {
  assert.equal(init.credentials, 'omit');
  assert.equal(init.headers.get('X-Client-Platform'), 'mobile');
  const response = await fetch(url, init);
  assert.equal(response.headers.getSetCookie().length, 0);
  requests.push({ method: init.method || 'GET', path: new URL(url).pathname, status: response.status, transport: 'Native Bearer' });
  return response;
};
const password = 'M6_Qa!' + crypto.randomBytes(16).toString('hex');
const signal = () => new AbortController().signal;
const plain = value => JSON.parse(JSON.stringify(value));
const freeze = utcNow => fs.writeFileSync(clockFile, JSON.stringify({ utcNow }));
async function account(label) {
  const runtime = createM3Runtime(base, network);
  const email = `m6.${label}.${Date.now()}.${crypto.randomBytes(4).toString('hex')}@gmail.com`;
  await runtime.auth.registerRequest({ fullName: 'Synthetic Calendar ' + label, phoneNumber: '0912345678', gender: 'Nam', dateOfBirth: '1995-05-20', email, password, confirmPassword: password });
  await runtime.context().login(email, password, false);
  return { runtime, email };
}
async function main() {
  const { runtime: owner, email } = await account('owner');
  const { runtime: other } = await account('other');
  const { anniversaryApi: api, createAnniversaryMutations } = owner.load('src/features/anniversaries/anniversary-api.ts');
  const otherApi = other.load('src/features/anniversaries/anniversary-api.ts').anniversaryApi;
  const data = owner.load('src/features/anniversaries/anniversary-data.ts');
  const timeline = owner.load('src/features/timeline/timeline-api.ts').timelineApi;
  const timelineData = owner.load('src/features/timeline/timeline-data.ts');
  const { toFamilyInput } = owner.load('src/features/family/validation/familyValidation.ts');
  const memberForm = { fullName: 'Synthetic Calendar Member', generation: '1', gender: 'male', dateOfBirth: '', lifeStatus: 'LIVING', deathDate: '', role: '', address: '', phoneNumber: '', facebookUrl: '', instagramUrl: '', biography: '', fatherId: '', motherId: '', spouseId: '', childIds: [] };
  const deceased = await owner.family.create(toFamilyInput({ ...memberForm, fullName: 'Synthetic Deceased', lifeStatus: 'DECEASED', deathDate: '2024-02-10' }));
  const living = await owner.family.create(toFamilyInput({ ...memberForm, fullName: 'Synthetic Living', generation: '2', fatherId: String(deceased.id) }));
  const foreign = await other.family.create(toFamilyInput(memberForm));
  await owner.api.apiRequest(`/api/family-tree/${deceased.id}/location`, { method: 'PUT', body: JSON.stringify({ latitude: 0, longitude: 0, displayName: 'Synthetic manual location' }) });
  const beforeMember = await owner.data.get(deceased.id);
  freeze('2024-02-09T17:00:00Z');
  assert.equal((await api.list()).length, 0);
  record('New USER anniversary collection is empty and scoped');

  const cookies = new Map();
  const origin = process.env.MYLIFE_M3_WEB_ORIGIN || 'http://localhost:7000';
  async function web(endpoint, init = {}, retry = true) {
    const headers = new Headers(init.headers);
    headers.set('Origin', origin); headers.set('X-Requested-With', 'MyLife');
    if (cookies.size) headers.set('Cookie', [...cookies].map(([key, value]) => key + '=' + value).join('; '));
    if (init.body) headers.set('Content-Type', 'application/json');
    const response = await fetch(base + endpoint, { ...init, headers });
    for (const value of response.headers.getSetCookie()) {
      const pair = value.split(';')[0], at = pair.indexOf('='); cookies.set(pair.slice(0, at), pair.slice(at + 1));
    }
    requests.push({ method: init.method || 'GET', path: endpoint, status: response.status, transport: 'Web cookie' });
    if (response.status === 401 && retry && endpoint !== '/api/login' && endpoint !== '/api/refresh-token') {
      assert.equal((await web('/api/refresh-token', { method: 'POST' }, false)).status, 200);
      return web(endpoint, init, false);
    }
    return response;
  }
  const login = await web('/api/login', { method: 'POST', body: JSON.stringify({ email, password, rememberMe: false }) });
  assert.equal(login.status, 200); assert.equal('accessToken' in await login.json(), false);
  record('Web cookie login stays separate from native Bearer and returns no token JSON');
  const actions = createAnniversaryMutations(); actions.setActive(true);
  const familyValues = { ...data.blankAnniversary(living.id), title: 'Synthetic Nguyễn Đặng family day', originalSolarDate: '2000-02-10', place: 'Synthetic place', host: 'Synthetic host', notes: 'Synthetic notes' };
  await actions.save(null, familyValues, signal());
  let family = (await api.list())[0];
  assert.equal(family.nextLunarYear, null); assert.equal(family.nextSolarDate, '2024-02-10'); assert.equal(family.daysUntil, 0);
  const webFamily = (await (await web(`/api/family-tree/anniversaries/${family.id}`)).json()).data;
  assert.deepEqual(webFamily, plain(family));
  record('Expo creates solar FAMILY_EVENT and Web reads identical20 fields with today countdown0 and nullable nextLunarYear');
  const originalFamilyId = family.id;
  const modified = { ...data.anniversaryWrite(family), title: 'Synthetic Web edited family day', originalSolarDate: '2000-02-29', notes: 'Synthetic Web edit' };
  const update = await web(`/api/family-tree/anniversaries/${family.id}`, { method: 'PUT', body: JSON.stringify(modified) });
  assert.equal(update.status, 200); family = await api.get(family.id);
  assert.deepEqual(plain(data.anniversaryWrite(family)), plain(modified));
  record('Web update refetches identically through Expo and preserves optional member/place/host fields');
  for (const [now, next, days] of [
    ['2024-02-28T17:00:00Z', '2024-02-29', 0],
    ['2025-02-26T17:00:00Z', '2025-02-28', 1],
    ['2025-02-28T17:00:00Z', '2026-02-28', 364],
    ['2026-12-30T17:00:00Z', '2027-02-28', 59],
  ]) {
    freeze(now); const row = await api.get(family.id);
    assert.equal(row.nextSolarDate, next); assert.equal(row.daysUntil, days); assert.equal(row.originalSolarDate, '2000-02-29');
  }
  record('Frozen-time solar February29 policy clamps to February28 and crosses Gregorian year without changing original date');
  freeze('2024-02-09T17:00:00Z');
  for (const [day, month, year, isLeapMonth, expected] of [
    [1, 1, 2024, false, '2024-02-10'], [1, 1, 2025, false, '2025-01-29'],
    [1, 2, 2023, true, '2023-03-22'], [30, 2, 2024, false, '2024-04-08'],
  ]) assert.equal((await api.convert({ day, month, year, isLeapMonth })).solarDate, expected);
  for (const year of [1800, 2200]) assert.equal((await api.convert({ day: 1, month: 1, year, isLeapMonth: false })).lunarYear, year);
  record('Real lunar conversion endpoints match all four established Backend fixtures and1800/2200 boundaries');
  for (const input of [{ day: 30, month: 1, year: 2024, isLeapMonth: false }, { day: 1, month: 2, year: 2024, isLeapMonth: true }, { day: 1, month: 1, year: 1799, isLeapMonth: false }, { day: 1, month: 1, year: 2201, isLeapMonth: false }]) {
    const response = await web(`/api/family-tree/anniversaries/lunar-to-solar?day=${input.day}&month=${input.month}&year=${input.year}&isLeapMonth=${input.isLeapMonth}`);
    assert.equal(response.status, 400);
    assert.equal((await response.json()).code, 'FAMILY_ANNIVERSARY_INVALID_LUNAR_DATE');
    await assert.rejects(api.convert(input), error => error.code === 'FAMILY_ANNIVERSARY_INVALID_LUNAR_DATE' || error.message === 'FAMILY_ANNIVERSARY_INVALID_LUNAR_DATE');
  }
  record('Invalid day30 of29-day month, absent leap month and outside supported years return400');
  const todayOccurrence = await api.occurrence({ day: 1, month: 1, isLeapMonth: false });
  assert.equal(todayOccurrence.daysUntil, 0); assert.equal(todayOccurrence.nextSolarDate, '2024-02-10'); assert.equal(todayOccurrence.isCurrentYearPassed, false);
  freeze('2024-02-10T17:00:00Z');
  const passed = await api.occurrence({ day: 1, month: 1, isLeapMonth: false });
  assert.equal(passed.nextSolarDate, '2025-01-29'); assert.equal(passed.daysUntil, 353); assert.equal(passed.isCurrentYearPassed, true);
  const leap = await api.occurrence({ day: 1, month: 2, isLeapMonth: true });
  assert.ok(leap.nextLunarYear > 2024);
  assert.equal((await api.convert({ day: 1, month: 2, year: leap.nextLunarYear, isLeapMonth: true })).solarDate, leap.nextSolarDate);
  record('Frozen lunar today/next-year countdown and leap recurrence skip absent leap years using authoritative responses');
  freeze('2026-12-19T17:00:00Z');
  assert.equal((await api.occurrence({ day: 1, month: 1, isLeapMonth: false })).nextSolarDate, '2027-02-06');
  record('Lunar next occurrence selects nearest solar date across Gregorian year boundary');
  freeze('2024-02-09T17:00:00Z');
  const deathValues = { ...data.blankAnniversary(deceased.id), eventType: 'DEATH_ANNIVERSARY', title: 'Synthetic linked memorial', lunarDay: 1, lunarMonth: 1, lunarYear: 2024, originalSolarDate: '2024-02-10', notes: 'Synthetic memorial notes' };
  await actions.save(null, deathValues, signal());
  const memorial = (await api.list()).find(row => row.title === deathValues.title);
  assert.equal(memorial.relatedMemberId, deceased.id); assert.equal(memorial.daysUntil, 0);
  record('Linked deceased member with matching recorded death date creates valid lunar anniversary');
  for (const [patch, code] of [
    [{ originalSolarDate: '2024-02-11' }, 'FAMILY_ANNIVERSARY_DATE_MISMATCH'],
    [{ relatedMemberId: living.id }, 'FAMILY_ANNIVERSARY_MEMBER_NOT_DECEASED'],
    [{ lunarDay: 2, originalSolarDate: '2024-02-11' }, 'FAMILY_ANNIVERSARY_DEATH_DATE_MISMATCH'],
  ]) {
    const response = await web('/api/family-tree/anniversaries', { method: 'POST', body: JSON.stringify({ ...deathValues, ...patch }) });
    assert.equal(response.status, 400); assert.equal((await response.json()).code, code);
  }
  record('Original lunar/solar mismatch, living member and recorded death-date mismatch return distinct400 codes');
  const psql = sql => cp.execFileSync(path.join(process.env.MYLIFE_M3_PG_BIN, 'psql.exe'), ['-h', '127.0.0.1', '-p', process.env.MYLIFE_M3_PG_PORT, '-U', 'mylife_m1', '-d', database, '-v', 'ON_ERROR_STOP=1', '-c', sql], { encoding: 'utf8' });
  psql(`UPDATE family_members SET death_date=NULL WHERE id=${deceased.id};`);
  const missingDate = await web('/api/family-tree/anniversaries', { method: 'POST', body: JSON.stringify(deathValues) });
  assert.equal(missingDate.status, 400); assert.equal((await missingDate.json()).code, 'FAMILY_ANNIVERSARY_MEMBER_DEATH_DATE_REQUIRED');
  psql(`UPDATE family_members SET death_date='2024-02-10' WHERE id=${deceased.id};`);
  record('Synthetic legacy deceased member without death date returns required-date400 and is restored');
  const profile = await owner.data.profile(deceased.id);
  assert.ok(profile.anniversaries.some(row => row.id === memorial.id));
  const historical = (await timeline.list()).find(row => row.sourceType === 'ANNIVERSARY' && row.sourceId === memorial.id);
  assert.equal(historical.eventDate, '2024-02-10'); assert.equal(historical.id, -memorial.id); assert.equal(timelineData.writable(historical), false);
  const home = owner.load('src/features/home/home-api.ts').homeLoaders;
  assert.ok((await home.anniversaries(signal())).some(row => row.id === memorial.id && row.nextSolarDate === memorial.nextSolarDate));
  record('Authoritative Home/Profile include source while Timeline uses original date with negative source-qualified read-only identity');
  const freshFamily = await api.get(originalFamilyId);
  await api.update(freshFamily.id, { ...data.anniversaryWrite(freshFamily), notes: 'Concurrent synthetic edit' });
  const writesBefore = requests.filter(row => row.method === 'PUT' || row.method === 'DELETE').length;
  await assert.rejects(actions.save(freshFamily, modified, signal()), /STALE/);
  await assert.rejects(actions.remove(freshFamily, signal()), /STALE/);
  assert.equal(requests.filter(row => row.method === 'PUT' || row.method === 'DELETE').length, writesBefore);
  record('Actual Expo stale edit/delete checks block writes after concurrent Web-compatible changes');
  for (const patch of [{ title: 'x' }, { eventType: 'INVALID' }, { originalSolarDate: null }, { lunarDay: 31 }, { lunarYear: 1799 }, { lunarYear: 2201 }, { place: 'x'.repeat(501) }, { host: 'x'.repeat(301) }, { notes: 'x'.repeat(2001) }]) {
    const response = await web('/api/family-tree/anniversaries', { method: 'POST', body: JSON.stringify({ ...deathValues, ...patch }) });
    assert.equal(response.status, 400);
  }
  record('Invalid anniversary types/title/original date/lunar range/text return400');
  for (const method of ['GET', 'PUT', 'DELETE']) {
    await assert.rejects(other.api.apiRequest(`/api/family-tree/anniversaries/${memorial.id}`, { method, ...(method === 'PUT' ? { body: JSON.stringify(deathValues) } : {}) }), error => error.status === 404);
  }
  const foreignMember = await web('/api/family-tree/anniversaries', { method: 'POST', body: JSON.stringify({ ...familyValues, relatedMemberId: foreign.id }) });
  assert.equal(foreignMember.status, 404); assert.equal((await otherApi.list()).length, 0);
  record('Foreign record GET/PUT/DELETE and foreign related-member assignment return404 with empty other-account collection');
  const protectedEndpoints = [['GET', '/api/family-tree/anniversaries'], ['GET', `/api/family-tree/anniversaries/${memorial.id}`], ['POST', '/api/family-tree/anniversaries'], ['PUT', `/api/family-tree/anniversaries/${memorial.id}`], ['DELETE', `/api/family-tree/anniversaries/${memorial.id}`], ['GET', '/api/family-tree/anniversaries/lunar-to-solar?day=1&month=1&year=2024'], ['GET', '/api/family-tree/anniversaries/next-occurrence?day=1&month=1']];
  const admin = createM3Runtime(base, network);
  await admin.context().login('m1.admin@gmail.com', process.env.MYLIFE_M3_ADMIN_PASSWORD, false);
  for (const [method, endpoint] of protectedEndpoints) {
    const body = method === 'POST' || method === 'PUT' ? JSON.stringify(deathValues) : undefined;
    await assert.rejects(admin.api.apiRequest(endpoint, { method, body }), error => error.status === 403);
    const anonymous = await fetch(base + endpoint, { method, headers: { 'Content-Type': 'application/json' }, body });
    assert.equal(anonymous.status, 401);
  }
  record('All seven anniversary endpoints enforce ADMIN403 and anonymous401');
  const unsafe = await fetch(base + '/api/family-tree/anniversaries', { method: 'POST', headers: { Cookie: [...cookies].map(([key, value]) => key + '=' + value).join('; '), 'Content-Type': 'application/json' }, body: JSON.stringify(familyValues) });
  assert.equal(unsafe.status, 403);
  record('Cookie mutation without trusted Origin/CSRF-related header rejected403');
  const afterMember = await owner.data.get(deceased.id);
  for (const field of ['childIds', 'horizontalRelations', 'avatarUrl', 'hasManagedAvatar', 'latitude', 'longitude', 'locationSource']) assert.deepEqual(plain(afterMember[field]), plain(beforeMember[field]));
  const malformedLocation = await web(`/api/family-tree/${deceased.id}/location`, { method: 'PUT', body: '{"latitude":"NaN","longitude":0}' });
  assert.equal(malformedLocation.status, 400);
  record('Anniversary writes preserve relationships/avatar/manual location and committed M4 nonfinite validation returns400');
  await actions.remove(await api.get(memorial.id), signal());
  assert.equal((await web(`/api/family-tree/anniversaries/${memorial.id}`)).status, 404);
  assert.equal((await timeline.list()).some(row => row.sourceType === 'ANNIVERSARY' && row.sourceId === memorial.id), false);
  assert.equal((await owner.data.profile(deceased.id)).anniversaries.some(row => row.id === memorial.id), false);
  assert.equal((await home.anniversaries(signal())).some(row => row.id === memorial.id), false);
  assert.ok((await api.list()).some(row => row.id === family.id));
  await actions.remove(memorial, signal());
  record('Expo delete removes source and derived Timeline/Home/Profile data, preserves other anniversary and tolerates already-deleted source');
  actions.setActive(false);
  const requestCount = requests.length;
  await assert.rejects(actions.save(null, familyValues, signal()), /ACCOUNT_CHANGED/); assert.equal(requests.length, requestCount);
  await owner.context().logout(); assert.equal(await owner.storage.read(), null);
  await assert.rejects(api.list(), error => error.status === 401);
  assert.equal((await otherApi.list()).length, 0);
  record('Logout clears native session and stale account mutations cannot expose or overwrite another account');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => fs.writeFileSync(clockFile, '{}'));
