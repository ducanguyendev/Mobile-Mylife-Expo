const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs');
const { createLoader } = require('./helpers/load-foundation.cjs');
const { hookRuntime } = require('./helpers/load-foundation.cjs');
const { createScreenPrivacy } = createLoader()('src/features/privacy/screen-privacy.ts');
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
function adapter(patch = {}) { const calls = []; return { calls, prevent: async key => { calls.push(['prevent', key]); }, allow: async key => { calls.push(['allow', key]); }, ...patch }; }
test('private preparation waits for native protection acknowledgment', async () => {
  const ready = deferred(), native = adapter({ prevent: () => ready.promise }); let displayed = false;
  const privacy = createScreenPrivacy(native); const operation = privacy.protect().then(() => { displayed = true; });
  await Promise.resolve(); assert.equal(displayed, false); ready.resolve(); await operation; assert.equal(displayed, true);
});
test('a delayed old logout cannot clear a new login protection', async () => {
  const release = deferred(), native = adapter(); const privacy = createScreenPrivacy(native);
  await privacy.protect(); native.allow = async key => { native.calls.push(['allow', key]); await release.promise; };
  const old = privacy.release(), next = privacy.protect(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(native.calls.filter(c => c[0] === 'prevent').length, 1); release.resolve(); await Promise.all([old, next]);
  assert.equal(native.calls.at(-1)[0], 'prevent'); assert.notEqual(native.calls.at(-1)[1], native.calls[0][1]);
});
test('window reassertion installs a fresh tag before removing the old tag', async () => {
  const native = adapter(), privacy = createScreenPrivacy(native); await privacy.protect(); await privacy.protect();
  assert.deepEqual(native.calls.map(c => c[0]), ['prevent', 'prevent', 'allow']); assert.equal(native.calls[2][1], native.calls[0][1]);
});
test('native failure rejects preparation and allows a later controlled retry', async () => {
  let attempt = 0; const native = adapter({ prevent: async () => { if (++attempt === 1) throw Error('unavailable'); } });
  const privacy = createScreenPrivacy(native); await assert.rejects(privacy.protect(), /unavailable/); await privacy.protect(); assert.equal(attempt, 2);
});
test('iOS overlay is enabled before private readiness and disabled before public capture', async () => {
  const native = adapter(); native.enableOverlay = async () => native.calls.push(['overlay-on']); native.disableOverlay = async () => native.calls.push(['overlay-off']);
  const privacy = createScreenPrivacy(native); await privacy.protect(); await privacy.protect(); await privacy.release();
  assert.deepEqual(native.calls.map(c => c[0]), ['prevent','overlay-on','prevent','allow','overlay-off','allow']);
});
test('overlay failure keeps capture protection and rejects private readiness', async () => {
  const native = adapter({ enableOverlay: async () => { throw Error('overlay'); } }); const privacy = createScreenPrivacy(native);
  await assert.rejects(privacy.protect(), /overlay/); assert.equal(native.calls.some(c => c[0] === 'allow'), false);
});
test('public bootstrap releases native startup protection without an existing JS tag', async () => {
  const native = adapter(); await createScreenPrivacy(native).release(); assert.deepEqual(native.calls, [['allow','mylife-startup']]);
});
test('clean MainActivity receives exactly one startup FLAG_SECURE call', () => {
  const { configureMainActivity } = require('../plugins/with-private-window.cjs'); const initial = 'override fun onCreate(savedInstanceState: Bundle?) {\n super.onCreate(null)\n}';
  const once = configureMainActivity(initial); assert.equal(configureMainActivity(once), once); assert.equal((once.match(/window.addFlags/g) || []).length, 1);
  assert.ok(once.indexOf('FLAG_SECURE') < once.indexOf('super.onCreate(null)')); assert.throws(() => configureMainActivity('changed template'), /Review/);
});
test('one-shot POST plugin preserves GET recovery and installs only once', () => {
  const { configureMainApplication } = require('../plugins/with-network-retry-policy.cjs');
  const source = configureMainApplication('import android.app.Application\nfun onCreate() { super.onCreate() }');
  assert.equal(configureMainApplication(source), source); assert.equal((source.match(/addInterceptor/g) || []).length, 1);
  assert.match(source, /request.method != "POST"/); assert.match(source, /isOneShot\(\) = true/); assert.doesNotMatch(source, /retryOnConnectionFailure\(false\)/);
});
test('release manifest rejects cleartext and backup without a QA exception', () => {
  const { configureManifest } = require('../plugins/with-release-network-policy.cjs'); const manifest = { application: [{ $: {} }] };
  configureManifest(manifest, false); assert.equal(manifest.application[0].$['android:usesCleartextTraffic'], 'false'); assert.equal(manifest.application[0].$['android:allowBackup'], 'false');
  assert.equal(manifest.application[0].$['android:networkSecurityConfig'], undefined);
});
test('QA cleartext policy scopes its exception to numeric loopback only and can be removed', () => {
  const { configureManifest, qaPolicy } = require('../plugins/with-release-network-policy.cjs'); const manifest = { application: [{ $: {} }] };
  configureManifest(manifest, true); assert.match(qaPolicy(), /base-config cleartextTrafficPermitted="false"/); assert.match(qaPolicy(), /includeSubdomains="false">127.0.0.1/);
  assert.equal((qaPolicy().match(/<domain /g) || []).length, 1); configureManifest(manifest, false); assert.equal(manifest.application[0].$['android:networkSecurityConfig'], undefined);
  assert.throws(() => configureManifest({ application: [{ $: { 'android:networkSecurityConfig': '@xml/custom' } }] }, true), /Review/);
});
test('API configuration rejects credentials, queries, fragments and nested origins', () => {
  const { normalizeBaseUrl } = createLoader({}, { process: { env: {} }, URL })('src/config/env.ts');
  for (const url of ['https://user:secret@example.invalid','https://example.invalid?token=hidden','https://example.invalid/#private','https://example.invalid/api','file:///private']) assert.equal(normalizeBaseUrl(url), null);
  assert.equal(normalizeBaseUrl('https://example.invalid/'), 'https://example.invalid'); assert.equal(normalizeBaseUrl('http://127.0.0.1:5088'), 'http://127.0.0.1:5088');
});

function authWithPrivacy(prepare) {
  const h = hookRuntime(); let tokens = { accessToken: 'synthetic-access', refreshToken: 'synthetic-refresh', accessTokenExpiresIn: 5, refreshTokenExpiresIn: 600 }, revocations = 0;
  const user = { id: 1, email: 'synthetic@example.invalid', fullName: 'Synthetic', role: 'USER' };
  const load = createLoader({
    react: h.hooks, 'react/jsx-runtime': { jsx: h.jsx, jsxs: h.jsx }, 'react-native': {},
    '@/api/apiClient': { getSessionVersion: () => 0, clearSessionExpiredNotice() {}, logoutNativeSession: async () => { tokens = null; return true; } },
    '@/features/auth/context/authEvents': { onSessionExpired: () => () => undefined },
    '@/features/auth/api/authApi': { getCurrentUser: async () => user, loginRequest: async () => ({ accessToken: 'synthetic-access', refreshToken: 'synthetic-refresh', accessTokenExpiresIn: 5, refreshTokenExpiresIn: 600 }), logoutRequest: async () => { revocations++; } },
    '@/features/auth/storage/authTokenStorage': { authTokenStorage: { read: async () => tokens, clear: async () => { tokens = null; }, writeIfCurrent: async (pair, current) => { if (!current()) return false; tokens = pair; return true; } } },
    '@/features/auth/storage/rememberedEmailStorage': { rememberedEmailStorage: { read: async () => ({ rememberMe: false, email: null }), clear: async () => undefined } },
  });
  const { AuthProvider } = load('src/features/auth/context/auth-provider.tsx');
  return { context: () => h.render(AuthProvider, { beforeAuthenticated: prepare }).props.value, tokens: () => tokens, revocations: () => revocations };
}
test('AuthProvider never publishes authenticated identity before native privacy is ready', async () => {
  const ready = deferred(), entered = deferred(), auth = authWithPrivacy(async () => { entered.resolve(); await ready.promise; });
  const login = auth.context().login('synthetic@example.invalid', 'Synthetic_Value!123', false); await entered.promise;
  assert.equal(auth.context().user, null); assert.equal(auth.context().status, 'checking'); ready.resolve(); await login; assert.equal(auth.context().status, 'authenticated');
});
test('failed native privacy preparation clears and revokes the newly minted session', async () => {
  const auth = authWithPrivacy(async () => { throw Error('privacy unavailable'); });
  await assert.rejects(auth.context().login('synthetic@example.invalid', 'Synthetic_Value!123', false), /privacy unavailable/);
  assert.equal(auth.tokens(), null); assert.equal(auth.context().user, null); assert.equal(auth.revocations(), 1);
});
test('privacy failure during restore cannot publish the previously read user', async () => {
  const auth = authWithPrivacy(async () => { throw Error('privacy unavailable'); }); await auth.context().restoreSession();
  assert.equal(auth.context().status, 'unauthenticated'); assert.equal(auth.context().user, null); assert.equal(auth.tokens(), null);
});
test('logout while native privacy is pending cannot resurrect a stale login', async () => {
  const ready = deferred(), entered = deferred(), auth = authWithPrivacy(async () => { entered.resolve(); await ready.promise; });
  const login = auth.context().login('synthetic@example.invalid', 'Synthetic_Value!123', false); const rejection = assert.rejects(login, error => error.status === 401);
  await entered.promise; await auth.context().logout(); ready.resolve(); await rejection; assert.equal(auth.context().status, 'unauthenticated'); assert.equal(auth.context().user, null);
});
test('web Map surface renders a truthful fallback without importing native codegen', () => {
  const load = createLoader({ '@/design-system/components/app-text': { AppText: 'AppText' }, 'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) } });
  const view = load('src/features/family/map/VietMapSurface.web.tsx').VietMapSurface({ copy: { unavailable: 'Unavailable' } });
  assert.equal(view.type, 'AppText'); assert.equal(view.props.children, 'Unavailable');
});
test('database conflict409 is displayed as a localized member conflict', () => {
  const load = createLoader(); const { getFamilyStrings } = load('src/features/family/i18n/familyStrings.ts');
  const error = load('src/features/family/data/family-errors.ts').familyError;
  for (const language of ['en', 'vi']) { const copy = getFamilyStrings(language); assert.equal(error({ status: 409 }, copy), copy.conflict); }
});
function buttonView(props) {
  const load = createLoader({
    'react-native': { Pressable: 'Pressable', ActivityIndicator: 'Spinner', View: 'View', StyleSheet: { create: value => value } },
    '@/theme/theme-provider': { useAppTheme: () => ({ colors: {} }) }, '@/design-system/components/app-text': { AppText: 'AppText' },
    'react/jsx-runtime': { jsx: (type, properties) => ({ type, props: properties }), jsxs: (type, properties) => ({ type, props: properties }) },
  });
  const wrapped = load('src/design-system/components/buttons.tsx').PrimaryButton(props); return wrapped.type(wrapped.props);
}
test('button keeps a meaningful accessible name through loading and failed-request recovery', () => {
  const loading = buttonView({ title: 'Sign in', loading: true }); assert.equal(loading.props.accessibilityLabel, 'Sign in'); assert.equal(loading.props.accessibilityState.busy, true);
  const idle = buttonView({ title: 'Sign in', loading: false }); assert.equal(idle.props.accessibilityLabel, 'Sign in'); assert.equal(idle.props.accessibilityState.busy, false); assert.equal(idle.props.accessibilityState.disabled, false);
});
test('explicit contextual action labels override the default button title', () => {
  const button = buttonView({ title: 'Delete', accessibilityLabel: 'Delete synthetic account' }); assert.equal(button.props.accessibilityLabel, 'Delete synthetic account');
});
