const fs = require('node:fs');
const assert = require('node:assert/strict');
const { createM3Runtime } = require('../tests/helpers/load-m3.cjs');
const runtime = JSON.parse(fs.readFileSync('.tmp/m3-runtime.json', 'utf8'));
const user = JSON.parse(fs.readFileSync('.tmp/m6-native-user.json', 'utf8'));
if (!/^mylife_m1_[a-f0-9]{12}$/.test(runtime.database) || new URL(runtime.api).hostname !== '127.0.0.1'
  || user.api !== runtime.api || !/^m6\.native\.\d+@gmail\.com$/.test(user.email)) throw Error('Synthetic M6 native runtime required');
const phase = process.argv[2];
async function main() {
  const client = createM3Runtime(runtime.api);
  await client.context().login(user.email, user.password, false);
  const api = client.load('src/features/anniversaries/anniversary-api.ts').anniversaryApi;
  const rows = await api.list();
  const cookies = new Map();
  const login = await fetch(runtime.api + '/api/login', { method: 'POST', headers: { Origin: 'http://localhost:7000', 'X-Requested-With': 'MyLife', 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, password: user.password, rememberMe: false }) });
  assert.equal(login.status, 200);
  assert.equal('accessToken' in await login.json(), false);
  for (const cookie of login.headers.getSetCookie()) { const pair = cookie.split(';')[0], at = pair.indexOf('='); cookies.set(pair.slice(0, at), pair.slice(at + 1)); }
  const web = await fetch(runtime.api + '/api/family-tree/anniversaries', { headers: { Origin: 'http://localhost:7000', 'X-Requested-With': 'MyLife', Cookie: [...cookies].map(([key, value]) => key + '=' + value).join('; ') } });
  assert.equal(web.status, 200);
  assert.deepEqual((await web.json()).data, JSON.parse(JSON.stringify(rows)));
  const family = rows.find(row => row.title === 'Native M6 Family Event');
  const edited = rows.find(row => row.title === 'Native M6 Edited Family Event');
  const memorial = rows.find(row => row.title === 'Native M6 Death Anniversary');
  const totals = { 'family-created': 131, 'death-created': 132, 'family-today': 132, edited: 132, 'death-deleted': 131, 'all-deleted': 130, discarded: 130 };
  assert(Object.hasOwn(totals, phase), 'Expected native CRUD phase');
  assert.equal(rows.length, totals[phase]);
  if (phase === 'family-created' || phase === 'death-created') {
    assert(family); assert.equal(family.eventType, 'FAMILY_EVENT'); assert.equal(family.originalSolarDate, '1996-02-29');
    assert.equal(family.lunarDay, null); assert.equal(family.nextLunarYear, null); assert.equal(family.relatedMemberId, user.members[124]);
    assert.equal(family.place, 'Synthetic native place'); assert.equal(family.host, 'Synthetic native host'); assert.equal(family.notes, 'Synthetic native notes');
  }
  if (phase === 'death-created' || phase === 'edited') {
    assert(memorial); assert.equal(memorial.eventType, 'DEATH_ANNIVERSARY'); assert.equal(memorial.originalSolarDate, '2023-03-22');
    assert.equal(memorial.lunarDay, 1); assert.equal(memorial.lunarMonth, 2); assert.equal(memorial.lunarYear, 2023);
    assert.equal(memorial.relatedMemberId, user.members[0]); assert.equal(memorial.isLeapMonth, true);
  }
  if (phase === 'family-today') {
    assert(family); assert.equal(family.originalSolarDate, '1996-' + user.today.slice(5)); assert.equal(family.daysUntil, 0);
    assert.equal(family.relatedMemberId, user.members[124]); assert.equal(family.notes, 'Synthetic native notes');
  }
  if (phase === 'edited' || phase === 'death-deleted') {
    assert(edited); assert.equal(edited.originalSolarDate, '1996-03-01'); assert.equal(edited.relatedMemberId, user.members[124]); assert.equal(family, undefined);
    assert.equal(edited.place, 'Synthetic native place'); assert.equal(edited.host, 'Synthetic native host'); assert.equal(edited.notes, 'Synthetic native notes');
  }
  if (phase === 'death-deleted' || phase === 'all-deleted' || phase === 'discarded') assert.equal(memorial, undefined);
  if (phase === 'all-deleted' || phase === 'discarded') assert.equal(edited, undefined);
  assert.equal(rows.some(row => row.title === 'Discarded Native M6 Event'), false);
  const timeline = await client.load('src/features/timeline/timeline-api.ts').timelineApi.list();
  for (const row of [family, edited, memorial].filter(Boolean)) {
    const source = timeline.filter(event => event.sourceType === 'ANNIVERSARY' && event.sourceId === row.id);
    assert.equal(source.length, 1); assert.equal(source[0].eventDate, row.originalSolarDate); assert.equal(source[0].isDerived, true); assert.equal(source[0].id, -row.id);
    const profile = await client.data.profile(row.relatedMemberId);
    assert(profile.anniversaries.some(event => event.id === row.id));
  }
  const home = await client.load('src/features/home/home-api.ts').homeLoaders.anniversaries(new AbortController().signal);
  assert.equal(home.length, rows.length);
  fs.writeFileSync(`docs/review-m6/test-results/native/native-crud-${phase}.json`, JSON.stringify({ phase, status: 'PASS', syntheticOnly: true, totalAnniversaries: rows.length, webHttpParity: true, timelineHistoricalSourcesVerified: true, profileLinksVerified: true, homeCollectionCount: home.length, events: [family, edited, memorial].filter(Boolean) }, null, 2));
  console.log('PASS native anniversary ' + phase + ', Web HTTP and Timeline/Home/Profile parity');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
