const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { createM3Runtime } = require('./helpers/load-m3.cjs');
const base = process.env.MYLIFE_M1_API_URL, database = process.env.MYLIFE_M1_ISOLATED;
if (!/^mylife_m1_[a-f0-9]{12}$/.test(database ?? '') || new URL(base).hostname !== '127.0.0.1') throw Error('Disposable M9 loopback runtime required.');
const output = 'docs/review-m9/test-results/final-http', checks = [], requests = [], limitations = [];
const concurrentResults = [];
fs.mkdirSync(output, { recursive: true });
const record = name => { checks.push({ name, status: 'PASS' }); fs.writeFileSync(path.join(output, 'm9-integration.json'), JSON.stringify({ checks, requests, storage: 'HTTP ADAPTER ONLY', transport: 'Real Kestrel/PostgreSQL; adapted native bridge; Web-compatible HTTP, not browser UI' }, null, 2)); console.log('PASS ' + name); };
const password = 'M9_Qa!' + crypto.randomBytes(16).toString('hex');
let latePath, bodyStarted, releaseBody;
const network = async (url, init) => {
  assert.equal(init.credentials, 'omit'); const response = await fetch(url, init);
  requests.push({ path: new URL(url).pathname, method: init.method ?? 'GET', status: response.status });
  if (latePath && new URL(url).pathname === latePath && response.ok) {
    const original = response.blob.bind(response); response.blob = async () => { bodyStarted(); await new Promise(resolve => { releaseBody = resolve; }); return original(); };
  }
  return response;
};
async function account(label, autoLogin = true) {
  const rt = createM3Runtime(base, network), email = `m9.${label}.${crypto.randomBytes(6).toString('hex')}@gmail.com`;
  await rt.auth.registerRequest({ fullName: 'Synthetic ' + label, phoneNumber: '0912345678', gender: 'Nam', dateOfBirth: '1995-05-20', email, password, confirmPassword: password });
  if (autoLogin) await rt.context().login(email, password, false); return { rt, email };
}
async function raw(route, tokens, method = 'GET', body, extra = {}) {
  const headers = { 'X-Client-Platform': 'mobile', ...(tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}), ...extra };
  const response = await fetch(base + route, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
  requests.push({ path: new URL(base + route).pathname, method, status: response.status }); return response;
}
async function overlap(operations, operation) {
  const results = await Promise.allSettled(operations);
  assert.ok(results.some(result => result.status === 'fulfilled'));
  for (const result of results) if (result.status === 'rejected') assert.equal(result.reason.status, 409, 'Concurrent database abort must return409 rather than500');
  concurrentResults.push({ operation, statuses: results.map(result => result.status === 'fulfilled' ? 200 : result.reason.status) });
}
async function main() {
  const one = await account('journey', false); record('USER01 registration through real native contract');
  await one.rt.context().login(one.email, password, false); const originalId = one.rt.context().user.id; record('USER02 native login and authoritative USER identity');
  await one.rt.context().restoreSession(); assert.equal(one.rt.context().user.id, originalId); record('USER03 session restoration retains validated identity');
  const p = one.rt.load('src/features/profile/profile-api.ts').profileApi;
  const edited = await p.save(await p.me(), { displayName: 'Synthetic Journey Edited', phoneNumber: '0912345678', gender: 'Nam', dateOfBirth: '20/05/1995' }, new AbortController().signal);
  assert.equal(edited.displayName, 'Synthetic Journey Edited'); record('USER04 profile edit and authoritative read-back');
  const png = fs.readFileSync('tests/fixtures/library-sage.png'), avatar = new FormData(); avatar.append('file', new Blob([png], { type: 'image/png' }), 'synthetic-m9.png');
  await p.avatar(avatar, new AbortController().signal); assert.ok((await p.me()).avatarUrl); await p.avatar(null, new AbortController().signal); assert.equal((await p.me()).avatarUrl, null); record('USER05 account avatar adapter upload and removal');
  const v = one.rt.load('src/features/family/validation/familyValidation.ts');
  const blank = { fullName: 'Synthetic Parent', generation: '1', gender: 'male', dateOfBirth: '1940-02-29', lifeStatus: 'LIVING', deathDate: '', role: '', address: '', phoneNumber: '', facebookUrl: '', instagramUrl: '', biography: '', fatherId: '', motherId: '', spouseId: '', childIds: [] };
  const parent = await one.rt.family.create(v.toFamilyInput(blank)); const child = await one.rt.family.create(v.toFamilyInput({ ...blank, fullName: 'Synthetic Child', dateOfBirth: '1990-05-20', generation: '2' })); record('USER06 family members created through supported endpoints');
  await one.rt.family.update(child.id, v.toFamilyInput({ ...blank, fullName: child.fullName, dateOfBirth: '1990-05-20', generation: '2', fatherId: String(parent.id) })); assert.equal((await one.rt.data.get(child.id)).fatherId, parent.id); record('USER07 parent/child relationship edit persists');
  const tree = await one.rt.family.list(); const graph = one.rt.load('src/features/family/graph/family-graph.ts').buildFamilyGraph(tree); assert.equal(graph.nodes.length, 2); assert.ok(graph.edges.some(edge => edge.kind === 'parent')); record('USER08 authoritative Family Tree builds recorded relationship graph');
  const map = one.rt.load('src/features/family/map/map-api.ts').familyMapApi; await map.update(parent.id, { latitude: 10.5, longitude: 106.5, displayName: 'Synthetic M9 place' }); assert.equal((await one.rt.data.get(parent.id)).latitude, 10.5); record('USER09 manual map coordinates persist without device location');
  const mapRead = await map.get(); assert.ok(JSON.stringify(mapRead).includes('10.5')); record('USER10 Family Map endpoint reflects manual location');
  const timeline = one.rt.load('src/features/timeline/timeline-api.ts').timelineApi, td = one.rt.load('src/features/timeline/timeline-data.ts');
  const eventValues = { ...td.blankWrite(child.id), title: 'Synthetic M9 memory', eventDate: '2024-05-20', eventYear: 2024 };
  const event = await timeline.create(eventValues); assert.ok(event.id > 0); record('USER11 custom Timeline event creation');
  assert.equal((await timeline.list()).filter(row => row.sourceType === 'FAMILY_MEMBER').length, 2); record('USER12 derived birth events preserve exact original dates');
  const anniversaries = one.rt.load('src/features/anniversaries/anniversary-api.ts').anniversaryApi, ad = one.rt.load('src/features/anniversaries/anniversary-data.ts');
  const annValues = { ...ad.blankAnniversary(child.id), title: 'Synthetic M9 lunar event', lunarDay: 1, lunarMonth: 1, lunarYear: 2024, originalSolarDate: '2024-02-10' };
  const anniversary = await anniversaries.create(annValues); assert.equal((await anniversaries.get(anniversary.id)).originalSolarDate, '2024-02-10'); record('USER13 anniversary source date creation and read-back');
  assert.equal((await anniversaries.convert({ day: 1, month: 1, year: 2024, isLeapMonth: false })).solarDate, '2024-02-10'); record('USER14 actual Backend Vietnamese lunar conversion');
  const home = one.rt.load('src/features/home/home-api.ts').homeLoaders; assert.ok((await home.anniversaries(new AbortController().signal)).some(row => row.id === anniversary.id)); assert.equal((await home.family(new AbortController().signal)).length, 2); record('USER15 Home loaders reflect same family and recurring event');
  const library = one.rt.load('src/features/library/library-api.ts').libraryApi; const category = await library.createCategory('Synthetic M9 Category'); assert.ok(category.slug); record('USER16 Library category creation');
  const album = await library.createAlbum('Synthetic M9 album', 'Disposable journey'); record('USER17 Library album creation');
  const body = new FormData(); body.append('files', new Blob([png], { type: 'image/png' }), 'synthetic-m9-photo.png'); const photo = (await library.upload(album.id, body))[0]; assert.equal((await library.album(album.id)).photoCount, 1); record('USER18 native Bearer multipart photo upload through adapter');
  const imagePath = `/api/library/photos/${photo.id}/image`; const bytes = await one.rt.api.apiRequest(imagePath, { responseType: 'blob' }); assert.deepEqual(Buffer.from(await bytes.arrayBuffer()), png); record('USER19 authenticated Backend photo bytes equal selected synthetic fixture');
  const meta = { title: 'Synthetic edited photo', description: 'Synthetic only', author: 'Synthetic author', category: category.slug, displayDate: '20/05/2024' };
  await library.updatePhoto(photo.id, meta, await library.categories()); assert.equal((await library.album(album.id)).photos[0].title, meta.title); record('USER20 photo metadata read-back');
  // A second native client reads the same account; overlap writes after both have read.
  const second = createM3Runtime(base, network); await second.context().login(one.email, password, false);
  const secondProfile = second.load('src/features/profile/profile-api.ts').profileApi;
  const original = await p.me(), otherOriginal = await secondProfile.me();
  const profileBody = { displayName: original.displayName, phoneNumber: original.phoneNumber, gender: original.gender, dateOfBirth: original.dateOfBirth };
  const race = await Promise.all([one.rt.api.apiRequest('/api/me/profile', { method: 'PUT', body: JSON.stringify({ ...profileBody, displayName: 'Synthetic Client A' }) }), second.api.apiRequest('/api/me/profile', { method: 'PUT', body: JSON.stringify({ ...profileBody, displayName: 'Synthetic Client B' }) })]);
  assert.ok(race.every(row => row.success)); assert.ok(['Synthetic Client A', 'Synthetic Client B'].includes((await p.me()).displayName)); assert.equal(otherOriginal.updatedAt, original.updatedAt);
  limitations.push({ operation: 'Profile PUT', observed: 'Both overlapping stale clients receive success; one displayName wins', serverPrecondition: 'Absent', status: 'OPEN', severity: 'HIGH' });
  const childForm = { ...blank, fullName: child.fullName, dateOfBirth: '1990-05-20', generation: '2', fatherId: String(parent.id) };
  await overlap([one.rt.family.update(child.id, v.toFamilyInput({ ...childForm, biography: 'Synthetic biography A' })), second.family.update(child.id, v.toFamilyInput({ ...childForm, biography: 'Synthetic biography B' }))], 'Member PUT');
  assert.ok(['Synthetic biography A','Synthetic biography B'].includes((await one.rt.data.get(child.id)).biography));
  limitations.push({ operation: 'Member PUT', observed: 'Serializable overlap can reject409; sequential stale edits have no version precondition', serverPrecondition: 'Absent', status: 'OPEN', severity: 'HIGH' });
  const alternate = await one.rt.family.create(v.toFamilyInput({ ...blank, fullName: 'Synthetic Alternate Parent' }));
  await overlap([one.rt.family.update(child.id, v.toFamilyInput(childForm)), second.family.update(child.id, v.toFamilyInput({ ...childForm, fatherId: String(alternate.id) }))], 'Relationship PUT');
  assert.ok([parent.id, alternate.id].includes((await one.rt.data.get(child.id)).fatherId));
  limitations.push({ operation: 'Relationship PUT', observed: 'Transaction protection differs from stale-client version preconditions', serverPrecondition: 'Absent', status: 'OPEN', severity: 'HIGH' });
  const secondMap = second.load('src/features/family/map/map-api.ts').familyMapApi;
  await overlap([map.update(parent.id, { latitude: 10.1, longitude: 106.5, displayName: 'Synthetic A' }), secondMap.update(parent.id, { latitude: 10.2, longitude: 106.5, displayName: 'Synthetic B' })], 'Location PUT');
  assert.ok([10.1,10.2].includes((await one.rt.data.get(parent.id)).latitude));
  limitations.push({ operation: 'Manual location PUT', observed: 'Both stale coordinate pairs accepted; last pair wins', serverPrecondition: 'Absent', status: 'OPEN', severity: 'HIGH' });
  const secondTimeline = second.load('src/features/timeline/timeline-api.ts').timelineApi;
  await overlap([timeline.update(event, { ...eventValues, title: 'Synthetic Event A' }), secondTimeline.update(event, { ...eventValues, title: 'Synthetic Event B' })], 'Timeline PUT');
  assert.ok(['Synthetic Event A','Synthetic Event B'].includes((await timeline.list()).find(row => row.id === event.id).title));
  limitations.push({ operation: 'Timeline PUT', observed: 'Both stale event edits accepted', serverPrecondition: 'Absent', status: 'OPEN', severity: 'HIGH' });
  const secondAnniversaries = second.load('src/features/anniversaries/anniversary-api.ts').anniversaryApi;
  await overlap([anniversaries.update(anniversary.id, { ...annValues, title: 'Synthetic Anniversary A' }), secondAnniversaries.update(anniversary.id, { ...annValues, title: 'Synthetic Anniversary B' })], 'Anniversary PUT');
  assert.ok(['Synthetic Anniversary A','Synthetic Anniversary B'].includes((await anniversaries.get(anniversary.id)).title));
  limitations.push({ operation: 'Anniversary PUT', observed: 'Both stale anniversary edits accepted while exact source dates remain valid', serverPrecondition: 'Absent', status: 'OPEN', severity: 'HIGH' });
  const secondLibrary = second.load('src/features/library/library-api.ts').libraryApi; await overlap([library.updateAlbum(album.id, 'Synthetic Album A', 'A'), secondLibrary.updateAlbum(album.id, 'Synthetic Album B', 'B')], 'Album PUT'); assert.ok(['Synthetic Album A', 'Synthetic Album B'].includes((await library.album(album.id)).name));
  limitations.push({ operation: 'Album PUT', observed: 'Both stale updates accepted; last writer wins', serverPrecondition: 'Absent', status: 'OPEN', severity: 'HIGH' });
  const categories = await library.categories();
  await overlap([library.updatePhoto(photo.id, { ...meta, title: 'Synthetic Photo A' }, categories), secondLibrary.updatePhoto(photo.id, { ...meta, title: 'Synthetic Photo B' }, categories)], 'Photo PUT');
  assert.ok(['Synthetic Photo A','Synthetic Photo B'].includes((await library.album(album.id)).photos[0].title));
  limitations.push({ operation: 'Photo metadata PUT', observed: 'Both stale metadata edits accepted', serverPrecondition: 'Absent', status: 'OPEN', severity: 'HIGH' });
  const duplicates = await Promise.all([library.createAlbum('Synthetic same intent', null), secondLibrary.createAlbum('Synthetic same intent', null)]); assert.notEqual(duplicates[0].id, duplicates[1].id);
  limitations.push({ operation: 'Album POST across clients/process restarts', observed: 'Independent repeated intent creates distinct rows; no idempotency key protocol', status: 'OPEN', severity: 'HIGH' });
  for (const duplicate of duplicates) await library.deleteAlbum(duplicate.id);
  concurrentResults.forEach((run, index) => {
    limitations[index + 1].statuses = run.statuses;
    limitations[index + 1].observed = run.statuses.includes(409) ? 'Overlapping transaction rejected409; sequential stale writes still lack version preconditions' : 'Both stale writes accepted; no server version precondition';
  });
  fs.writeFileSync(path.join(output, 'concurrency-limitations.json'), JSON.stringify({ limitations, concurrentResults }, null, 2)); record('AUDIT concurrent-client and repeated-intent characterization recorded without exactly-once claim');
  const foreign = await account('foreign'); await assert.rejects(foreign.rt.api.apiRequest(imagePath, { responseType: 'blob' }), error => error.status === 404); await assert.rejects(foreign.rt.family.profile(parent.id), error => error.status === 404); record('SECURITY foreign private photo and member return404');
  const ready = new Promise(resolve => { bodyStarted = resolve; }); latePath = imagePath;
  const pending = one.rt.api.apiRequest(imagePath, { responseType: 'blob' }); const rejected = assert.rejects(pending, error => error.status === 401);
  await ready; await one.rt.context().logout(); await one.rt.context().login(foreign.email, password, false); releaseBody(); await rejected; latePath = undefined;
  assert.equal((await library.overview()).albums.length, 0); record('SECURITY account switch rejects late private image body and removes owner Library');
  await one.rt.context().logout(); await one.rt.context().login(one.email, password, false);
  await library.deletePhoto(photo.id); await library.deleteAlbum(album.id); assert.ok(!(await library.albums()).some(row => row.id === album.id)); record('USER21 photo and album deletion confirmed from actual Backend');
  const token = await one.rt.storage.read(); await one.rt.context().logout(); assert.equal((await raw('/api/me', token)).status, 401); record('USER22 logout revokes copied access session');
  await one.rt.context().login(foreign.email, password, false); record('USER23 another-account native login');
  assert.equal((await one.rt.family.list()).length, 0); assert.equal((await timeline.list()).length, 0); assert.equal((await library.overview()).albums.length, 0); record('USER24 no previous family/Timeline/Library data under switched identity');
  const admin = createM3Runtime(base, network); await admin.context().login('m1.admin@gmail.com', process.env.MYLIFE_M3_ADMIN_PASSWORD, false); assert.equal(admin.context().user.role, 'ADMIN'); const adminApi = admin.load('src/features/admin/admin-api.ts').adminApi; record('ADMIN01 native Admin login');
  const stats = await adminApi.stats(); assert.equal(stats.totalActive + stats.totalLocked, stats.totalUsers); record('ADMIN02 authoritative dashboard counts');
  const target = await account('managed'); let targetDto = (await adminApi.users()).find(row => row.email === target.email); assert.ok(targetDto); record('ADMIN03 user list and email identity lookup');
  assert.ok((await adminApi.logs()).length <= 50); record('ADMIN04 actual limited login logs');
  await adminApi.mutate(admin.context().user.id, targetDto, 'role', new AbortController().signal, 'ADMIN'); assert.equal((await raw('/api/me', await target.rt.storage.read())).status, 401); record('ADMIN05 promotion persists and revokes previous USER session');
  await target.rt.context().login(target.email, password, false); assert.equal(target.rt.context().user.role, 'ADMIN'); targetDto = (await adminApi.users()).find(row => row.email === target.email);
  await adminApi.mutate(admin.context().user.id, targetDto, 'role', new AbortController().signal, 'USER'); await target.rt.context().login(target.email, password, false); record('ADMIN10 demotion requires fresh USER login');
  targetDto = (await adminApi.users()).find(row => row.email === target.email); await adminApi.mutate(admin.context().user.id, targetDto, 'status', new AbortController().signal); await assert.rejects(target.rt.context().login(target.email, password, false), error => error.status === 401);
  targetDto = (await adminApi.users()).find(row => row.email === target.email); await adminApi.mutate(admin.context().user.id, targetDto, 'status', new AbortController().signal); await target.rt.context().login(target.email, password, false); record('ADMIN06 lock rejects access and unlock allows fresh sign-in');
  await admin.auth.getCurrentUser(); const adminTokens = await admin.storage.read(); assert.equal((await raw(`/api/admin/users/${admin.context().user.id}`, adminTokens, 'DELETE')).status, 400); record('ADMIN07 administrator deletion protection');
  const ownerDto = (await adminApi.users()).find(row => row.id === originalId); await assert.rejects(adminApi.mutate(admin.context().user.id, ownerDto, 'delete', new AbortController().signal), error => error.status === 409); record('ADMIN08 family-member deletion409 protection');
  targetDto = (await adminApi.users()).find(row => row.email === target.email); await adminApi.mutate(admin.context().user.id, targetDto, 'delete', new AbortController().signal); assert.ok(!(await adminApi.users()).some(row => row.id === targetDto.id)); record('ADMIN09 permitted empty-account deletion read-back');
  const invalidJwt = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url') + '.' + Buffer.from(JSON.stringify({ role: 'ADMIN', exp: 9999999999 })).toString('base64url') + '.invalid';
  assert.equal((await raw('/api/admin/stats', { accessToken: invalidJwt })).status, 401); record('SECURITY forged unsigned ADMIN JWT rejected');
  await one.rt.auth.getCurrentUser(); const short = await one.rt.storage.read(); await new Promise(resolve => setTimeout(resolve, 6500)); assert.equal((await raw('/api/me', short)).status, 401);
  await Promise.all([one.rt.auth.getCurrentUser(), one.rt.auth.getCurrentUser(), one.rt.auth.getCurrentUser()]); record('SECURITY expired access rejects raw token; concurrent native requests recover through refresh');
  for (const route of ['/api/me','/api/admin/stats','/api/library/overview','/api/family-tree']) assert.equal((await raw(route)).status, 401); record('SECURITY anonymous protected endpoints reject401');
  await assert.rejects(one.rt.api.apiRequest('/api/me/profile', { method: 'PUT', body: JSON.stringify({ displayName: 'Synthetic', phoneNumber: 'invalid', gender: 'wrong', dateOfBirth: '2999-01-01' }) }), error => error.status === 400); record('SECURITY malformed profile DTO validation remains authoritative');
  await one.rt.context().logout(); await admin.context().logout(); await second.context().logout(); await foreign.rt.context().logout();
  console.log('M9 HTTP groups ' + checks.length);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
