const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { createM3Runtime } = require('./helpers/load-m3.cjs');
const base = process.env.MYLIFE_M1_API_URL, database = process.env.MYLIFE_M1_ISOLATED, control = process.env.MYLIFE_M3_PROVIDER_CONTROL;
if (!/^mylife_m1_[a-f0-9]{12}$/.test(database ?? '') || !base || new URL(base).hostname !== '127.0.0.1' || !control || !path.resolve(control).startsWith(path.resolve('.tmp') + path.sep)) throw Error('Disposable M7 loopback required');
const output = 'docs/review-m7/test-results/final-backend'; const checks = [], requests = [];
const record = name => { checks.push({ name, status: 'PASS' }); fs.writeFileSync(path.join(output, 'm7-integration.json'), JSON.stringify({ checks, requests, storage: 'IN-PROCESS HTTP ADAPTER; NOT REAL GOOGLE DRIVE', database: 'Disposable PostgreSQL', transport: 'Real Kestrel native Bearer and Web cookie HTTP; no browser UI' }, null, 2)); console.log('PASS ' + name); };
const png = fs.readFileSync('tests/fixtures/library-sage.png');
const password = 'M7_Qa!' + crypto.randomBytes(16).toString('hex');
async function account(label) {
  const rt = createM3Runtime(base, async (url, init) => { assert.equal(init.credentials, 'omit'); assert.equal(init.headers.get('X-Client-Platform'), 'mobile'); const response = await fetch(url, init); assert.equal(response.headers.getSetCookie().length, 0); requests.push({ path: new URL(url).pathname, method: init.method ?? 'GET', status: response.status, transport: 'Native Bearer' }); return response; });
  const email = `m7.${label}.${crypto.randomBytes(8).toString('hex')}@gmail.com`;
  await rt.auth.registerRequest({ fullName: 'Synthetic Library ' + label, phoneNumber: '0912345678', gender: 'Nam', dateOfBirth: '1995-05-20', email, password, confirmPassword: password }); await rt.context().login(email, password, false); return { rt, email };
}
async function main() {
  const { rt, email } = await account('owner'), { rt: foreign } = await account('foreign');
  const api = rt.load('src/features/library/library-api.ts').libraryApi, other = foreign.load('src/features/library/library-api.ts').libraryApi;
  const metadata = rt.load('src/features/library/library-data.ts');
  const cookies = new Map();
  async function web(endpoint, init = {}) {
    const headers = new Headers(init.headers); headers.set('Origin', process.env.MYLIFE_M3_WEB_ORIGIN); headers.set('X-Requested-With', 'MyLife');
    if (cookies.size) headers.set('Cookie', [...cookies].map(([k, v]) => k + '=' + v).join('; ')); if (init.body) headers.set('Content-Type', 'application/json');
    const response = await fetch(base + endpoint, { ...init, headers }); for (const c of response.headers.getSetCookie()) { const p = c.split(';')[0], at = p.indexOf('='); cookies.set(p.slice(0, at), p.slice(at + 1)); }
    requests.push({ path: endpoint, method: init.method ?? 'GET', status: response.status, transport: 'Web cookie' }); return response;
  }
  assert.equal((await api.albums()).length, 0); assert.equal((await api.overview()).albums.length, 0); record('Empty native account uses raw albums/overview');
  assert.equal((await web('/api/login', { method: 'POST', body: JSON.stringify({ email, password, rememberMe: false }) })).status, 200);
  let category = await api.createCategory('Synthetic Ngày gia đình'); const slug = category.slug;
  assert.ok((await (await web('/api/library/categories')).json()).some(c => c.id === category.id && c.slug === slug)); record('Expo creates category and Web cookie reads same generated slug');
  const rename = await web(`/api/library/categories/${category.id}`, { method: 'PUT', body: JSON.stringify({ name: 'Synthetic Web rename' }) }); assert.equal(rename.status, 200); category = (await api.categories()).find(c => c.id === category.id); assert.equal(category.slug, slug); assert.equal(category.name, 'Synthetic Web rename'); record('Web category rename refetch preserves slug');
  const created = await api.createAlbum('Synthetic M7 album', 'Description'); let album = await api.album(created.id);
  assert.equal(album.photoCount, 0); assert.equal(album.coverPhotoId, null); assert.equal((await (await web(`/api/library/albums/${album.id}`)).json()).description, 'Description'); record('Expo creates album; Web reads identical metadata and no invented cover');
  await api.updateAlbum(album.id, 'Synthetic renamed album', 'Preserved description'); album = await api.album(album.id); assert.equal(album.name, 'Synthetic renamed album'); record('Album edit authoritative reload');
  const body = new FormData(); body.append('files', new Blob([png], { type: 'image/png' }), 'synthetic-one.png'); body.append('files', new Blob([png], { type: 'image/png' }), 'synthetic-two.png');
  const fields = { title: 'Synthetic Nguyễn Đặng', category: slug, displayDate: '29/02/2024', description: 'Batch description', author: 'Synthetic author' }; for (const [k, v] of Object.entries(fields)) body.append(k, v);
  const photos = await api.upload(album.id, body); assert.equal(photos.length, 2); assert.equal(photos[0].caption, fields.description); assert.equal(photos[1].category, slug); record('Native Bearer multipart two synthetic images with all metadata persists');
  album = await api.album(album.id); assert.equal(album.photoCount, 2); assert.equal((await rt.load('src/features/home/home-api.ts').homeLoaders.albums(new AbortController().signal))[0].photoCount, 2); record('Home authoritative photo count reflects upload');
  const p = photos[0]; const image = await rt.api.apiRequest(`/api/library/photos/${p.id}/image`, { responseType: 'blob', redirect: 'error', headers: { Accept: 'image/png' } }); assert.deepEqual(Buffer.from(await image.arrayBuffer()), png);
  const webImage = await web(`/api/library/photos/${p.id}/image`); assert.equal(webImage.status, 200); assert.match(webImage.headers.get('Cache-Control'), /private/); assert.equal(webImage.headers.get('X-Content-Type-Options'), 'nosniff'); assert.deepEqual(Buffer.from(await webImage.arrayBuffer()), png);
  assert.equal((await web(`/api/library/photos/${p.id}/image`, { headers: { 'If-None-Match': webImage.headers.get('ETag') } })).status, 304); record('Private bytes match via native/Web; private cache, ETag304 and nosniff');
  const nativeValues = { ...metadata.photoMetadata(p), title: 'Synthetic Expo edited', author: 'Preserved author' }; await api.updatePhoto(p.id, nativeValues, await api.categories());
  let webAlbum = await (await web(`/api/library/albums/${album.id}`)).json(); assert.equal(webAlbum.photos.find(x => x.id === p.id).title, nativeValues.title); record('Expo metadata edit reads identically through Web');
  const webValues = { ...nativeValues, title: 'Synthetic Web edited', description: 'Web description' }; assert.equal((await web(`/api/library/photos/${p.id}`, { method: 'PUT', body: JSON.stringify(webValues) })).status, 200);
  const after = (await api.album(album.id)).photos.find(x => x.id === p.id); assert.deepEqual(JSON.parse(JSON.stringify(metadata.photoMetadata(after))), webValues); record('Web metadata update refreshes identically in Expo preserving category/date');
  await assert.rejects(api.deleteCategory(category.id), e => e.status === 409); record('In-use category deletion is409');
  await assert.rejects(other.album(album.id), e => e.status === 404); await assert.rejects(other.updateAlbum(album.id, 'Forbidden', null), e => e.status === 404); await assert.rejects(other.deletePhoto(p.id), e => e.status === 404); await assert.rejects(other.deleteCategory(category.id), e => e.status === 404);
  await assert.rejects(foreign.api.apiRequest(`/api/library/photos/${p.id}/image`, { responseType: 'blob' }), e => e.status === 404); assert.equal((await fetch(base + `/api/library/photos/${p.id}/image`)).status, 401); record('Foreign album/category/photo read/write404 and anonymous private image401');
  for (const date of ['31/02/2024', '2024-01-01', '01/01/2999']) assert.equal((await web(`/api/library/photos/${p.id}`, { method: 'PUT', body: JSON.stringify({ ...webValues, displayDate: date }) })).status, 400); record('Backend rejects invalid, ISO and future display dates');
  for (const [count, mime, filename, bytes] of [[21, 'image/png', 'synthetic.png', png], [1, 'image/heic', 'synthetic.heic', png], [1, 'image/png', 'renamed.png', Buffer.from('HEIC bytes')], [1, 'image/png', 'wrong.jpg', png], [1, 'image/png', 'large.png', Buffer.alloc(5242881)]]) {
    const f = new FormData(); for (let i = 0; i < count; i++) f.append('files', new Blob([bytes], { type: mime }), filename); await assert.rejects(api.upload(album.id, f), e => e.status === 400);
  } record('Real Backend rejects21 files, HEIC, false signatures, mismatched extensions and >5MiB');
  fs.writeFileSync(control, JSON.stringify({ libraryBadChecksum: true })); const failed = new FormData(); failed.append('files', new Blob([png], { type: 'image/png' }), 'bad-checksum.png');
  await assert.rejects(api.upload(album.id, failed), e => e.status === 502); fs.writeFileSync(control, '{}'); assert.equal((await api.album(album.id)).photoCount, 2); record('Adapter checksum failure502 compensates and DB retains two existing photos');
  fs.writeFileSync(control, JSON.stringify({ libraryFailDelete: true })); await assert.rejects(api.deletePhoto(p.id), e => e.status === 502); await assert.rejects(api.deleteAlbum(album.id), e => e.status === 502); fs.writeFileSync(control, '{}'); assert.equal((await api.album(album.id)).photoCount, 2); record('Adapter delete failures502 retain authoritative album/photo DB records');
  await api.deletePhoto(p.id); assert.equal((await (await web(`/api/library/albums/${album.id}`)).json()).photoCount, 1); assert.equal((await web(`/api/library/photos/${p.id}/image`)).status, 404); record('Photo delete204 reflected through Web and private image404');
  await api.deleteAlbum(album.id); assert.equal((await (await web('/api/library/albums')).json()).length, 0); assert.equal((await rt.load('src/features/home/home-api.ts').homeLoaders.albums(new AbortController().signal)).length, 0); await api.deleteCategory(category.id); assert.ok(!(await api.categories()).some(c => c.id === category.id)); record('Album/category delete204 and Home/Web authoritative empty state');
  const { libraryMutationsForAccount: gateFor } = rt.load('src/features/library/library-api.ts');
  const ownerId = rt.context().user.id, foreignId = foreign.context().user.id;
  const gate = gateFor(ownerId); gate.setActive(true); let uncertainAlbum;
  await assert.rejects(gate.run(async signal => async () => { uncertainAlbum = await api.createAlbum('Synthetic uncertainty gate album', null, signal); throw Error('Simulated lost acknowledgement after real POST'); }, new AbortController().signal));
  gate.setActive(false); const reopened = gateFor(ownerId); assert.equal(reopened, gate); reopened.setActive(true); assert.equal(reopened.getSnapshot().needsReconcile, true);
  await assert.rejects(reopened.run(async () => async () => api.createAlbum('Forbidden duplicate retry', null), new AbortController().signal));
  const reconciled = await reopened.reconcile(new AbortController().signal); assert.equal(reconciled.albums.length, 1); assert.equal(reconciled.albums[0].id, uncertainAlbum.id);
  await reopened.run(async signal => async () => api.deleteAlbum(uncertainAlbum.id, signal), new AbortController().signal); assert.equal((await api.albums()).length, 0);
  record('Shared overview/detail uncertainty gate blocks duplicate retry and reconciles a simulated lost acknowledgement after real POST');
  let release; const preparation = new Promise(resolve => release = resolve); let lateWrites = 0;
  const stale = reopened.run(async signal => { await api.overview(signal); await preparation; return async () => { lateWrites++; return api.createAlbum('Forbidden stale account write', null, signal); }; }, new AbortController().signal);
  const otherGate = gateFor(foreignId); otherGate.setActive(true); assert.notEqual(otherGate, reopened); release(); await assert.rejects(stale); reopened.setActive(true);
  await assert.rejects(reopened.run(async () => async () => { lateWrites++; }, new AbortController().signal)); assert.equal(lateWrites, 0); assert.equal((await api.albums()).length, 0);
  gateFor(ownerId).setActive(false);
  record('Account transition fences late real-HTTP preparation and even stale focus activation before any POST');
  await rt.api.logoutNativeSession(); await assert.rejects(rt.api.apiRequest(`/api/library/photos/${photos[1].id}/image`, { responseType: 'blob' }), e => e.status === 401); record('Logged-out native session cannot retrieve private photo');
  fs.writeFileSync(control, '{}'); console.log('M7 HTTP groups: ' + checks.length);
}
main().catch(error => { fs.writeFileSync(control, '{}'); console.error(error); process.exitCode = 1; });
