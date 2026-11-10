const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createNativeRuntime, createLoader } = require('./helpers/load-foundation.cjs');
const base = process.env.MYLIFE_M1_API_URL;
const baseline = process.argv.includes('--baseline');
const baselineCommit = '7fa3124';
const sourceOverrides = {};
if (baseline) {
  for (const file of ['src/api/apiClient.ts', 'src/features/auth/context/auth-provider.tsx', 'src/features/family/validation/familyValidation.ts']) {
    const result = spawnSync('git', ['show', `${baselineCommit}:${file}`], { encoding: 'utf8' });
    if (result.status !== 0) throw new Error('The pinned M1 baseline commit must be present for baseline replay.');
    sourceOverrides[file] = result.stdout;
  }
}
if (!/^mylife_m1_[a-f0-9]{12}$/.test(process.env.MYLIFE_M1_ISOLATED || '') || !base || new URL(base).hostname !== '127.0.0.1') {
  throw new Error('Run scripts/run-isolated-m1.cjs against its disposable cluster.');
}
const output = path.resolve('docs/review-m1/test-results');
const checks = []; const requests = [];
const record = (name, status = 'PASS') => { checks.push({ name, status }); console.log(status + ': ' + name); };
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const password = 'M1_User!23456789';
let holdRefresh = null;
let heldTokens = null;
async function network(url, init) {
  const headers = new Headers(init.headers);
  assert.equal(init.credentials, 'omit', 'Native transport must omit cookies');
  assert.equal(headers.get('X-Client-Platform'), 'mobile');
  assert.equal(headers.has('Cookie'), false);
  const response = await fetch(url, init);
  assert.equal(response.headers.getSetCookie().length, 0, 'Native responses must not set browser cookies');
  requests.push({ method: init.method || 'GET', path: new URL(url).pathname, status: response.status, bearer: headers.has('Authorization') });
  if (holdRefresh && url.endsWith('/api/refresh-token')) {
    if (response.ok) heldTokens = await response.clone().json();
    holdRefresh.started.resolve();
    await holdRefresh.release.promise;
  }
  return response;
}
const runtime = () => createNativeRuntime(base, network, sourceOverrides);
const one = runtime();
async function register(runtime, email) {
  await runtime.auth.registerRequest({ fullName: 'Foundation Test', phoneNumber: '0912345678', gender: 'Nam', dateOfBirth: '1995-05-20', email, password, confirmPassword: password });
  await runtime.context().login(email, password, false);
  assert.equal(runtime.context().status, 'authenticated');
}
function formValues(member) {
  return { fullName: member.fullName, generation: String(member.generation), gender: member.gender ?? '', dateOfBirth: member.dateOfBirth ?? '',
    lifeStatus: member.lifeStatus, deathDate: member.deathDate ?? '', role: member.role ?? '', address: member.address ?? '',
    phoneNumber: member.phoneNumber ?? '', facebookUrl: member.facebookUrl ?? '', instagramUrl: member.instagramUrl ?? '', biography: member.biography ?? '',
    fatherId: member.fatherId ? String(member.fatherId) : '', motherId: member.motherId ? String(member.motherId) : '', spouseId: member.spouseId ? String(member.spouseId) : '', childIds: member.childIds.map(String) };
}
async function main() {
  const email = `m1.owner.${Date.now()}@gmail.com`;
  await register(one, email);
  const restored = runtime();
  await restored.storage.write(await one.storage.read());
  await restored.context().restoreSession();
  assert.equal(restored.context().isUser, true);
  record('Native registration/login, serialized SecureStore adapter and session restoration');
  const { toFamilyInput } = createLoader({}, {}, sourceOverrides)('src/features/family/validation/familyValidation.ts');
  const empty = { fullName: 'M1 First', generation: '1', gender: 'Nam', dateOfBirth: '', lifeStatus: 'LIVING', deathDate: '', role: '', address: '', phoneNumber: '', facebookUrl: '', instagramUrl: '', biography: '', fatherId: '', motherId: '', spouseId: '', childIds: [] };
  const first = await one.family.create(toFamilyInput(empty));
  const second = await one.family.create(toFamilyInput({ ...empty, fullName: 'M1 Second' }));
  const generations = await one.family.generations();
  assert.ok(generations.every(generation => Number.isInteger(generation.id) && typeof generation.name === 'string'));
  const anonymous = runtime();
  await assert.rejects(anonymous.family.get(first.id), error => error.status === 401);
  await one.family.update(first.id, { ...toFamilyInput(formValues(first)), horizontalRelations: [{ memberId: second.id, relationType: 'sibling' }] });
  const related = await one.family.get(first.id);
  assert.ok(related.horizontalRelations.some(relation => relation.memberId === second.id));
  const input = toFamilyInput({ ...formValues(related), phoneNumber: '0901234567' });
  await one.family.update(first.id, input);
  const updated = await one.family.get(first.id);
  const reverse = await one.family.get(second.id);
  assert.equal(updated.phoneNumber, '0901234567');
  const relationSurvives = updated.horizontalRelations.some(relation => relation.memberId === second.id)
    && reverse.horizontalRelations.some(relation => relation.memberId === first.id);
  assert.equal(relationSurvives, !baseline, 'Unrelated Expo edit must preserve both directions of the horizontal relation');
  record(baseline ? 'Original Expo payload erases an existing explicit horizontal relation' : 'Unrelated Expo phone edit preserves existing horizontal relation in both directions', baseline ? 'REPRODUCED' : 'PASS');
  const other = runtime();
  await register(other, `m1.other.${Date.now()}@gmail.com`);
  await assert.rejects(other.family.get(first.id), error => error.status === 404);
  const admin = runtime();
  await admin.context().login('m1.admin@gmail.com', process.env.MYLIFE_M1_ADMIN_PASSWORD, false);
  assert.equal(admin.context().isAdmin, true); assert.equal(admin.context().isUser, false);
  await assert.rejects(admin.family.list(), error => error.status === 403);
  await assert.rejects(one.api.apiRequest('/api/admin/stats'), error => error.status === 403);
  record('USER/ADMIN Backend restrictions and foreign member IDs remain authoritative');
  await one.context().login(email, password, false);
  const oldTokens = await one.storage.read();
  await new Promise(resolve => setTimeout(resolve, 5500));
  const before = requests.filter(request => request.path === '/api/refresh-token').length;
  const users = await Promise.all(Array.from({ length: 6 }, () => one.api.apiRequest('/api/me')));
  assert.ok(users.every(user => user.role === 'USER'));
  assert.equal(requests.filter(request => request.path === '/api/refresh-token').length - before, 1);
  const rotated = await one.storage.read();
  assert.ok(rotated.refreshToken !== oldTokens.refreshToken, 'SecureStore pair rotates');
  const oldSession = await fetch(base + '/api/me', { headers: { 'X-Client-Platform': 'mobile', Authorization: `Bearer ${oldTokens.accessToken}` } });
  assert.equal(oldSession.status, 401);
  // Rotate once more while this access JWT is still unexpired, isolating sid revocation from expiry.
  const secondRotation = await one.api.apiRequest('/api/refresh-token', {
    method: 'POST', authenticated: false, retryOnUnauthorized: false, body: JSON.stringify(rotated),
  });
  await one.storage.replaceRotated(secondRotation);
  const expiry = JSON.parse(Buffer.from(rotated.accessToken.split('.')[1], 'base64url').toString('utf8')).exp;
  assert.ok(expiry * 1000 > Date.now(), 'The rotation test access token must still be unexpired');
  const retired = await fetch(base + '/api/me', { headers: { 'X-Client-Platform': 'mobile', Authorization: `Bearer ${rotated.accessToken}` } });
  assert.equal(retired.status, 401);
  record('Six expired-access calls share one refresh; pair persists and rotation rejects an unexpired old sid');
  const copied = await one.storage.read();
  assert.equal(await one.context().logout(), true);
  assert.ok(await one.storage.read() === null, 'Logout clears stored tokens');
  const revoked = await fetch(base + '/api/me', { headers: { 'X-Client-Platform': 'mobile', Authorization: `Bearer ${copied.accessToken}` } });
  assert.equal(revoked.status, 401);
  const replay = await fetch(base + '/api/refresh-token', { method: 'POST', headers: { 'X-Client-Platform': 'mobile', 'Content-Type': 'application/json' }, body: JSON.stringify(copied) });
  assert.equal(replay.status, 401);
  record('Native logout clears local storage and immediately revokes copied access/refresh tokens');
  await one.context().login(email, password, false);
  await new Promise(resolve => setTimeout(resolve, 5500));
  holdRefresh = { started: deferred(), release: deferred() };
  const pending = one.api.apiRequest('/api/me').then(() => true, () => false);
  await holdRefresh.started.promise;
  const logout = one.context().logout();
  // Current UI clears locally and returns promptly; the refresh's real response is delayed.
  await new Promise(resolve => setTimeout(resolve, 25));
  holdRefresh.release.resolve();
  await Promise.all([pending, logout]);
  holdRefresh = null;
  const resurrected = await one.storage.read();
  if (baseline) {
    assert.ok(resurrected, 'Baseline must reproduce refresh persisting after logout');
    const response = await fetch(base + '/api/me', { headers: { 'X-Client-Platform': 'mobile', Authorization: `Bearer ${resurrected.accessToken}` } });
    assert.equal(response.status, 200);
    record('Original late refresh resurrects a usable stored session after logout', 'REPRODUCED');
  } else {
    assert.ok(resurrected === null, 'Logout must not be undone by a late refresh');
    assert.equal(one.context().status, 'unauthenticated');
    const response = await fetch(base + '/api/me', { headers: { 'X-Client-Platform': 'mobile', Authorization: `Bearer ${heldTokens.accessToken}` } });
    assert.equal(response.status, 401, 'The late rotated sid is revoked on the real Backend');
    record('Logout racing with a delayed real refresh cannot resurrect SecureStore');
  }
  const invalid = runtime();
  await invalid.storage.write({ accessToken: 'invalid-test-access', refreshToken: 'invalid-test-refresh', accessTokenExpiresIn: 5, refreshTokenExpiresIn: 600 });
  await assert.rejects(invalid.family.list(), error => error.status === 401);
  assert.ok(await invalid.storage.read() === null, 'Invalid tokens are removed');
  record('Invalid native session is rejected and cleared; anonymous family access is denied');
  const result = { mode: baseline ? 'baseline' : 'final', baselineCommit: baseline ? baselineCommit : undefined, checks, requests,
    boundary: 'Actual Expo TS API/auth/family source + real HTTP/Kestrel/PostgreSQL. Platform and SecureStore native bridge adapted in Node; no fetched API response is fabricated.',
    nativeDeviceSecureStore: 'NOT TESTED' };
  fs.writeFileSync(path.join(output, `${baseline ? 'baseline' : 'final'}-integration.json`), JSON.stringify(result, null, 2));
}
main().catch(error => { fs.writeFileSync(path.join(output, `${baseline ? 'baseline' : 'final'}-integration.json`), JSON.stringify({ checks, failure: error.message }, null, 2)); console.error(error.message); process.exitCode = 1; });
