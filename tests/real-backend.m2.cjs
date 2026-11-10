const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createNativeRuntime, createLoader } = require('./helpers/load-foundation.cjs');
const base = process.env.MYLIFE_M1_API_URL;
const database = process.env.MYLIFE_M1_ISOLATED;
if (!/^mylife_m1_[a-f0-9]{12}$/.test(database || '') || !base || new URL(base).hostname !== '127.0.0.1') throw Error('Disposable M2 harness required');
const requests = []; const checks = [];
const record = name => { checks.push({ name, status: 'PASS — real Backend/PostgreSQL; native bridge adapted' }); console.log('PASS: ' + name); };
const network = async (url, init) => {
  assert.equal(init.credentials, 'omit'); assert.equal(init.headers.get('X-Client-Platform'), 'mobile');
  const response = await fetch(url, init); assert.equal(response.headers.getSetCookie().length, 0);
  requests.push({ path: new URL(url).pathname, method: init.method || 'GET', status: response.status });
  return response;
};
const pure = createLoader(); const { createHomeResource } = pure('src/features/home/home-resource.ts');
const transforms = pure('src/features/home/home-data.ts');
const password = 'M2_Synthetic!23456';
async function account(suffix) {
  const runtime = createNativeRuntime(base, network);
  const email = `m2.${suffix}.${Date.now()}@gmail.com`;
  await runtime.auth.registerRequest({ fullName: `Mobile ${suffix}`, phoneNumber: '0912345678', gender: 'Nam', dateOfBirth: '1995-05-20', email, password, confirmPassword: password });
  await runtime.context().login(email, password, false);
  return runtime;
}
async function main() {
  const one = await account('owner'); const two = await account('other');
  const loaders = one.load('src/features/home/home-api.ts').homeLoaders;
  const resource = createHomeResource(loaders); await resource.refresh();
  for (const section of Object.values(resource.getSnapshot())) { assert.equal(section.status, 'ready'); assert.equal(section.data.length, 0); }
  record('Three real Home endpoints return authentic empty state for a new USER');
  const { toFamilyInput } = pure('src/features/family/validation/familyValidation.ts');
  const form = { fullName: 'M2 Family One', generation: '1', gender: 'Nam', dateOfBirth: '', lifeStatus: 'LIVING', deathDate: '', role: '', address: '', phoneNumber: '', facebookUrl: '', instagramUrl: '', biography: '', fatherId: '', motherId: '', spouseId: '', childIds: [] };
  const first = await one.family.create(toFamilyInput(form));
  await one.family.create(toFamilyInput({ ...form, fullName: 'M2 Family Two', generation: '2', fatherId: String(first.id) }));
  const today = transforms.vietnamDateKey(new Date());
  const created = await one.api.apiRequest('/api/family-tree/anniversaries', { method: 'POST', body: JSON.stringify({ eventType: 'FAMILY_EVENT', title: 'M2 Synthetic Gathering', originalSolarDate: today }) });
  const ownerId = one.context().user.id;
  assert.ok(Number.isSafeInteger(ownerId) && ownerId > 0);
  // Drive is deliberately disabled. Seed metadata ONLY inside the just-created
  // disposable database; reads below still traverse the actual authenticated API.
  const sql = `INSERT INTO library_albums (name, created_by_user_id, created_at, updated_at) VALUES ('M2 Synthetic Empty Album', ${ownerId}, NOW(), NOW());`;
  const seeded = spawnSync(path.join(process.env.MYLIFE_M2_PG_BIN, 'psql.exe'), ['-h', '127.0.0.1', '-p', process.env.MYLIFE_M2_PG_PORT, '-U', 'mylife_m1', '-d', database, '-v', 'ON_ERROR_STOP=1', '-c', sql], { encoding: 'utf8', windowsHide: true });
  assert.equal(seeded.status, 0, seeded.stderr);
  await resource.refresh(); const snapshot = resource.getSnapshot();
  assert.equal(transforms.familySummary(snapshot.family.data).count, 2); assert.equal(transforms.familySummary(snapshot.family.data).generations, 2);
  assert.equal(snapshot.anniversaries.data[0].nextSolarDate, created.data.nextSolarDate);
  assert.equal(snapshot.anniversaries.data[0].daysUntil, created.data.daysUntil);
  assert.equal(snapshot.albums.data.length, 1); assert.equal(snapshot.albums.data[0].name, 'M2 Synthetic Empty Album'); assert.equal(snapshot.albums.data[0].photoCount, 0);
  record('Real family counts/generations, server next occurrence and empty album metadata renderable without Drive/photo requests');
  const other = createHomeResource(two.load('src/features/home/home-api.ts').homeLoaders); await other.refresh();
  assert.ok(Object.values(other.getSnapshot()).every(section => section.status === 'ready' && section.data.length === 0));
  record('Second USER receives none of the first USER family, anniversary or album records');
  let offline = true;
  const failing = createHomeResource({ ...loaders, albums: signal => offline ? Promise.reject(Error('simulated connection loss')) : loaders.albums(signal) });
  await failing.refresh(); assert.equal(failing.getSnapshot().albums.status, 'error'); assert.equal(failing.getSnapshot().family.status, 'ready');
  offline = false; await failing.retry('albums'); assert.equal(failing.getSnapshot().albums.data[0].photoCount, 0);
  record('Injected connection loss remains section-local and retry recovers through real HTTP');
  const admin = createNativeRuntime(base, network); await admin.context().login('m1.admin@gmail.com', process.env.MYLIFE_M2_ADMIN_PASSWORD, false);
  for (const loader of Object.values(admin.load('src/features/home/home-api.ts').homeLoaders)) await assert.rejects(loader(new AbortController().signal), error => error.status === 403);
  record('All three Home endpoints enforce USER authorization against ADMIN');
  const tokens = await one.storage.read(); await one.context().logout();
  await assert.rejects(one.api.apiRequest('/api/family-tree'), error => error.status === 401);
  const revoked = await fetch(base + '/api/me', { headers: { 'X-Client-Platform': 'mobile', Authorization: 'Bearer ' + tokens.accessToken } }); assert.equal(revoked.status, 401);
  record('Logout leaves no usable Home session; copied access token is revoked by Backend');
  assert.equal(requests.some(request => /photos|image|drive|overview/.test(request.path)), false);
  fs.writeFileSync('docs/review-m2/test-results/final-backend/m2-home.json', JSON.stringify({ checks, requests, albumFixture: 'Direct SQL metadata in disposable DB only; no Drive creation/upload claimed' }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
