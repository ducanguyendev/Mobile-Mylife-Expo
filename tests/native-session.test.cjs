const test = require('node:test');
const assert = require('node:assert/strict');
const { createNativeRuntime } = require('./helpers/load-foundation.cjs');
const pair = suffix => ({ accessToken: `access-${suffix}`, refreshToken: `refresh-${suffix}`, accessTokenExpiresIn: 5, refreshTokenExpiresIn: 600 });
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
async function signedIn(fetcher) {
  const runtime = createNativeRuntime('http://127.0.0.1:1', fetcher);
  await runtime.storage.write(pair('old'));
  runtime.api.clearSessionExpiredNotice();
  return runtime;
}
test('native requests use bearer tokens, mobile header and omit browser cookies', async () => {
  const runtime = await signedIn(async (_url, init) => {
    assert.equal(init.credentials, 'omit');
    assert.equal(init.headers.get('X-Client-Platform'), 'mobile');
    assert.equal(init.headers.get('Authorization'), 'Bearer access-old');
    assert.equal(init.headers.has('Cookie'), false);
    return json({ role: 'USER' });
  });
  assert.equal((await runtime.api.apiRequest('/api/me')).role, 'USER');
});
test('actual API client coalesces six refreshes and persists the rotated pair', async () => {
  let refreshes = 0;
  const runtime = await signedIn(async (url, init) => {
    if (url.endsWith('/api/refresh-token')) { refreshes++; return json(pair('new')); }
    return init.headers.get('Authorization') === 'Bearer access-new' ? json({ role: 'USER' }) : json({}, 401);
  });
  const users = await Promise.all(Array.from({ length: 6 }, () => runtime.api.apiRequest('/api/me')));
  assert.ok(users.every(user => user.role === 'USER'));
  assert.equal(refreshes, 1);
  assert.equal((await runtime.storage.read()).refreshToken, 'refresh-new');
});
test('a late old-access rejection reuses the already rotated pair', async () => {
  const gate = deferred(); const lateStarted = deferred(); let refreshes = 0;
  const runtime = await signedIn(async (url, init) => {
    if (url.endsWith('/api/refresh-token')) { refreshes++; return json(pair('new')); }
    if (url.endsWith('/late') && init.headers.get('Authorization') === 'Bearer access-old') { lateStarted.resolve(); await gate.promise; return json({}, 401); }
    return init.headers.get('Authorization') === 'Bearer access-new' ? json({ ok: true }) : json({}, 401);
  });
  const late = runtime.api.apiRequest('/late'); await lateStarted.promise;
  await runtime.api.apiRequest('/first'); gate.resolve(); await late;
  assert.equal(refreshes, 1);
});
test('revoked refresh clears storage and emits one expiry notice for concurrent callers', async () => {
  const runtime = await signedIn(async () => json({}, 401));
  let expired = 0; runtime.load('src/features/auth/context/authEvents.ts').onSessionExpired(() => expired++);
  const results = await Promise.allSettled(Array.from({ length: 4 }, () => runtime.api.apiRequest('/api/me')));
  assert.ok(results.every(result => result.status === 'rejected'));
  assert.equal(await runtime.storage.read(), null); assert.equal(expired, 1);
});
test('a rejected retry invalidates an unusable rotated session', async () => {
  const runtime = await signedIn(async url => url.endsWith('/api/refresh-token') ? json(pair('new')) : json({}, 401));
  let expired = 0; runtime.load('src/features/auth/context/authEvents.ts').onSessionExpired(() => expired++);
  await assert.rejects(runtime.api.apiRequest('/api/me'));
  assert.equal(await runtime.storage.read(), null); assert.equal(expired, 1);
});
test('logout retires a late rotated session without writing it back or emitting expiry', async () => {
  const gate = deferred(); const started = deferred(); const retired = [];
  const runtime = await signedIn(async (url, init) => {
    if (url.endsWith('/api/refresh-token')) { started.resolve(); await gate.promise; return json(pair('rotated')); }
    if (url.endsWith('/api/logout')) { retired.push(JSON.parse(init.body).refreshToken); return json({ success: true }); }
    return json({}, 401);
  });
  let expired = 0; runtime.load('src/features/auth/context/authEvents.ts').onSessionExpired(() => expired++);
  const pending = runtime.api.apiRequest('/api/me').then(() => false, () => true); await started.promise;
  const logout = runtime.api.logoutNativeSession();
  await new Promise(resolve => setImmediate(resolve));
  gate.resolve(); assert.equal(await logout, true); assert.equal(await pending, true);
  assert.equal(await runtime.storage.read(), null);
  assert.deepEqual(retired.sort(), ['refresh-old', 'refresh-rotated']); assert.equal(expired, 0);
});
test('an older refresh and logout cannot erase a newer successful login', async () => {
  const gate = deferred(); const started = deferred();
  const runtime = await signedIn(async url => {
    if (url.endsWith('/api/refresh-token')) { started.resolve(); await gate.promise; return json(pair('late')); }
    return url.endsWith('/api/logout') ? json({ success: true }) : json({}, 401);
  });
  const pending = runtime.api.apiRequest('/api/me').catch(() => null); await started.promise;
  const logout = runtime.api.logoutNativeSession(); await new Promise(resolve => setImmediate(resolve));
  await runtime.storage.write(pair('new-login')); runtime.api.clearSessionExpiredNotice();
  gate.resolve(); await logout; await pending;
  assert.equal((await runtime.storage.read()).accessToken, 'access-new-login');
});
test('SecureStore clear failure still attempts server revocation and reports failure', async () => {
  let revoked = 0;
  const runtime = await signedIn(async url => { assert.ok(url.endsWith('/api/logout')); revoked++; return json({ success: true }); });
  runtime.storage.clear = async () => { throw new Error('Synthetic native bridge failure'); };
  assert.equal(await runtime.api.logoutNativeSession(), false); assert.equal(revoked, 1);
  await assert.rejects(runtime.api.apiRequest('/api/me'));
});
test('a new login can log out while an older session logout is still pending', async () => {
  const gate = deferred(); const started = deferred(); const retired = [];
  const runtime = await signedIn(async (url, init) => {
    if (url.endsWith('/api/refresh-token')) { started.resolve(); await gate.promise; return json(pair('late')); }
    if (url.endsWith('/api/logout')) { retired.push(JSON.parse(init.body).refreshToken); return json({ success: true }); }
    return json({}, 401);
  });
  const pending = runtime.api.apiRequest('/api/me').catch(() => null); await started.promise;
  const olderLogout = runtime.api.logoutNativeSession(); await new Promise(resolve => setImmediate(resolve));
  await runtime.storage.write(pair('new-login')); runtime.api.clearSessionExpiredNotice();
  const newerLogout = runtime.api.logoutNativeSession(); await new Promise(resolve => setImmediate(resolve));
  gate.resolve(); await Promise.all([pending, olderLogout, newerLogout]);
  assert.equal(await runtime.storage.read(), null);
  assert.ok(retired.includes('refresh-new-login'));
});
test('server logout failure still clears the native session and reports failure', async () => {
  const runtime = await signedIn(async () => json({}, 503));
  assert.equal(await runtime.api.logoutNativeSession(), false);
  assert.equal(await runtime.storage.read(), null);
});
test('SecureStore serializes one complete pair and treats malformed persisted data as absent', async () => {
  const runtime = createNativeRuntime('http://127.0.0.1:1');
  await runtime.storage.write(pair('one')); await runtime.storage.replaceRotated(pair('two'));
  assert.equal((await runtime.storage.read()).accessToken, 'access-two');
  await runtime.storage.write({ accessToken: 'incomplete' });
  assert.equal(await runtime.storage.read(), null);
});
