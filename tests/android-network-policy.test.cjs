const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const policy = require('../plugins/with-release-network-policy.cjs');

test('development HTTP exceptions cover only emulator host and numeric loopback', () => {
  const xml = policy.developmentPolicy();
  assert.match(xml, /<base-config cleartextTrafficPermitted="false"/);
  assert.deepEqual([...xml.matchAll(/<domain includeSubdomains="false">([^<]+)<\/domain>/g)].map(match => match[1]), ['127.0.0.1', '10.0.2.2']);
  const release = { application: [{ $: {} }] };
  policy.configureManifest(release, false);
  assert.equal(release.application[0].$['android:usesCleartextTraffic'], 'false');
  assert.equal(release.application[0].$['android:networkSecurityConfig'], undefined);
  assert.doesNotMatch(policy.qaPolicy(), /10\.0\.2\.2/);
});

test('debug manifest preserves existing overrides and rejects unrelated network policy', () => {
  const manifest = { application: [{ $: { 'tools:replace': 'android:usesCleartextTraffic', 'android:usesCleartextTraffic': 'true' } }] };
  policy.configureDebugManifest(manifest);
  policy.configureDebugManifest(manifest);
  assert.equal(manifest.application[0].$['tools:replace'], 'android:usesCleartextTraffic,android:networkSecurityConfig');
  assert.equal(manifest.application[0].$['android:usesCleartextTraffic'], 'false');
  assert.equal(manifest.application[0].$['android:networkSecurityConfig'], '@xml/mylife_dev_network_security');
  assert.throws(() => policy.configureDebugManifest({ application: [{ $: { 'android:networkSecurityConfig': '@xml/custom' } }] }), /Review/);
});

test('plugin writes only debug variants and leaves main/release bytes unchanged', async t => {
  const temporaryParent = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(temporaryParent, 'mylife-network-'));
  t.after(() => {
    assert.equal(path.dirname(fs.realpathSync(root)), temporaryParent);
    fs.rmSync(root, { recursive: true, force: true });
  });
  const source = '<manifest xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools"><application android:usesCleartextTraffic="false" android:allowBackup="false" /></manifest>';
  for (const variant of ['main', 'release', 'debug', 'debugOptimized']) {
    const directory = path.join(root, 'app/src', variant);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'AndroidManifest.xml'), source);
  }
  await policy.configureDevelopmentAndroid(root);
  const first = fs.readFileSync(path.join(root, 'app/src/debug/AndroidManifest.xml'), 'utf8');
  await policy.configureDevelopmentAndroid(root);
  assert.equal(fs.readFileSync(path.join(root, 'app/src/debug/AndroidManifest.xml'), 'utf8'), first);
  for (const variant of ['main', 'release']) {
    assert.equal(fs.readFileSync(path.join(root, 'app/src', variant, 'AndroidManifest.xml'), 'utf8'), source);
    assert.equal(fs.existsSync(path.join(root, 'app/src', variant, 'res/xml/mylife_dev_network_security.xml')), false);
  }
  for (const variant of ['debug', 'debugOptimized']) {
    assert.match(fs.readFileSync(path.join(root, 'app/src', variant, 'AndroidManifest.xml'), 'utf8'), /android:networkSecurityConfig="@xml\/mylife_dev_network_security"/);
    assert.equal(fs.readFileSync(path.join(root, 'app/src', variant, 'res/xml/mylife_dev_network_security.xml'), 'utf8'), policy.developmentPolicy());
  }
});
