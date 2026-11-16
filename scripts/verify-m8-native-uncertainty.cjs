const fs = require('node:fs'), cp = require('node:child_process'), assert = require('node:assert/strict');
const { createM3Runtime } = require('../tests/helpers/load-m3.cjs');
const output = 'docs/review-m8/test-results/native';
const adb = (...args) => cp.execFileSync('C:/Users/admin/AppData/Local/Android/Sdk/platform-tools/adb.exe', ['-P', '5041', '-s', 'emulator-5590', ...args], { encoding: 'utf8', windowsHide: true });
let evidence = 200;
function step(action, arg = '', value = '') {
  const name = `${evidence++}-fixed-uncertainty`;
  const result = cp.execFileSync(process.execPath, ['scripts/m8-native-ui.cjs', action, arg, value, name], { encoding: 'utf8', windowsHide: true, timeout: 45000 });
  const labels = JSON.parse(result.trim().split(/\r?\n/).at(-1));
  return { labels, xml: fs.readFileSync(`${output}/${name}.xml`, 'utf8'), evidence: name };
}
function waitFor(label, ready = false) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const state = step('snapshot');
    if (state.labels.includes(label) && (!ready || state.labels.some(text => /^Albums: \d+/.test(text)))) return state;
    if (ready && state.labels.includes('The request failed. Refresh to read the server state before trying again.')) step('tap', 'Refresh / retry');
  }
  throw Error('Native state did not settle at expected label');
}
const uncertain = 'The write outcome is uncertain. Refresh to reconcile first. Check for existing photos before choosing and uploading again.';
async function main() {
  assert.equal(adb('shell', 'getprop', 'ro.boot.qemu.avd_name').trim(), 'MyLife_M8');
  const user = JSON.parse(fs.readFileSync('.tmp/m8-native-user.json', 'utf8'));
  const rt = createM3Runtime(user.api); await rt.context().login(user.email, user.newPassword, false);
  const library = rt.load('src/features/library/library-api.ts').libraryApi;
  const name = 'Synthetic Fixed Lost Ack'; assert.equal((await library.albums()).filter(a => a.name === name).length, 0);
  adb('shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', 'mobilemylifeexpo://library', 'com.anonymous.mylifemobile');
  waitFor('Create album', true); step('tap', 'Create album'); waitFor('Name'); step('fill', 'Name', name); step('hide-keyboard');
  fs.writeFileSync('.tmp/m8-proxy-control.json', JSON.stringify({ dropAlbumAcknowledgement: true }));
  step('tap', 'Save'); waitFor(uncertain);
  step('tap', 'Cancel'); step('tap', 'DISCARD'); step('back');
  adb('shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', 'mobilemylifeexpo://library', 'com.anonymous.mylifemobile');
  const reopened = waitFor(uncertain);
  const create = [...reopened.xml.matchAll(/<node\s+([^>]+)>?/g)].map(m => Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(a => [a[1], a[2]]))).find(n => n['content-desc'] === 'Create album');
  assert.equal(create.enabled, 'false');
  assert.equal((await library.albums()).filter(a => a.name === name).length, 1);
  const events = JSON.parse(fs.readFileSync(`${output}/proxy-events.json`, 'utf8')); assert.equal(events.at(-1).backendStatus, 201);
  step('tap', 'Refresh / retry'); const reconciled = waitFor('Create album'); assert.ok(!reconciled.labels.includes(uncertain));
  const result = { status: 'PASS', build: 'Rebuilt development APK with explicit OkHttp retry policy', backendPostStatus: 201, acknowledgementDropped: true, matchingAlbums: 1, reopenedRouteRetainsBarrier: true, createDisabledBeforeReconcile: true, explicitReconciliation: true, evidenceThrough: evidence - 1 };
  fs.writeFileSync(`${output}/fixed-uncertainty.json`, JSON.stringify(result, null, 2)); console.log(JSON.stringify(result));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
