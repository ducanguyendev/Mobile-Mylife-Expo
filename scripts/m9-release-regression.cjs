// Explicitly disposable Android release QA. Never prints credentials or bodies.
const fs = require('node:fs'), cp = require('node:child_process'), assert = require('node:assert/strict');
const { createM3Runtime } = require('../tests/helpers/load-m3.cjs');
const runtime = JSON.parse(fs.readFileSync('.tmp/m9-runtime.json'));
assert.match(runtime.database, /^mylife_m1_[a-f0-9]{12}$/);
assert.equal(new URL(runtime.api).hostname, '127.0.0.1');
const user = JSON.parse(fs.readFileSync('.tmp/m9-native-user.json'));
const output = 'docs/review-m9/test-results/native';
const adb = (...args) => cp.execFileSync('C:/Users/admin/AppData/Local/Android/Sdk/platform-tools/adb.exe', ['-P', '5042', '-s', 'emulator-5592', ...args], { encoding: 'utf8', windowsHide: true, timeout: 45000, maxBuffer: 16 * 1024 * 1024 });
let index = Number(process.argv[3] || 500);
function step(action, arg = '', value = '') {
  const name = `${index++}-release-${process.argv[2]}`;
  const raw = cp.execFileSync(process.execPath, ['scripts/m9-native.cjs', 'ui', action, arg, value, name], { encoding: 'utf8', windowsHide: true, timeout: 60000 });
  return { labels: JSON.parse(raw.trim().split(/\r?\n/).at(-1)), name, xml: fs.readFileSync(`${output}/${name}.xml`, 'utf8') };
}
function wait(label) {
  for (let attempt = 0; attempt < 8; attempt++) { const state = step('snapshot'); if (state.labels.some(value => value === label || value.startsWith(label))) return state; }
  throw Error(`Expected QA screen absent: ${label}`);
}
function route(path) { adb('shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', `mobilemylifeexpo://${path}`, 'com.anonymous.mylifemobile'); }
const checks = [];
const passed = (name, detail = {}) => { const status = ['performance', 'startup'].includes(process.argv[2]) ? 'COLLECTED' : 'PASS'; checks.push({ name, status, ...detail }); fs.writeFileSync(`${output}/release-${process.argv[2]}.json`, JSON.stringify({ date: '2026-11-17', buildSha256: JSON.parse(fs.readFileSync(`${output}/build-resume.json`)).sha256, checks, evidenceThrough: index - 1 }, null, 2)); console.log(`${status}: ${name}`); };
async function profile() {
  const rt = createM3Runtime(runtime.api); await rt.context().login(user.email, user.password, false);
  for (let iteration = 0; iteration < 3; iteration++) {
    route('account/edit'); wait('Display name');
    const name = `Synthetic Release Save ${iteration}`;
    step('fill', 'Display name', name); step('hide-keyboard'); step('reach', 'Save changes'); wait('Changes saved.');
    assert.equal((await rt.auth.getCurrentUser()).displayName, name);
    step('back');
    passed(`Profile save/Back cycle ${iteration + 1}`, { authoritativeReadBack: true });
  }
  route('account/security'); wait('Current password');
  step('fill', 'Current password', 'password'); step('hide-keyboard'); step('fill', 'New password', 'newPassword'); step('hide-keyboard');
  step('scroll'); step('fill', 'Confirm new password', 'newPassword'); step('hide-keyboard'); step('reach', 'Change password');
  step('scroll-up'); step('scroll-up'); wait('Password changed.');
  step('snapshot');
  const raw = adb('shell', 'cat', '/data/local/tmp/m9-ui.xml');
  const fields = [...raw.matchAll(/<node\s+[^>]*class="android.widget.EditText"[^>]*>/g)].map(match => match[0]);
  assert.ok(fields.length > 0 && fields.every(tag => /text=""/.test(tag)), 'Visible password fields must be empty after success');
  await rt.context().login(user.email, user.newPassword, false);
  user.password = user.newPassword; fs.writeFileSync('.tmp/m9-native-user.json', JSON.stringify(user));
  passed('Password changed through native form and new password authenticates', { existingSessionsIntentionallyRetained: true });
  step('reach', 'Sign out'); wait('Sign in'); passed('Native sign-out returns to public login');
}
async function admin() {
  wait('Admin Console');
  const rt = createM3Runtime(runtime.api); await rt.context().login(user.adminEmail, user.adminPassword, false);
  const api = rt.load('src/features/admin/admin-api.ts').adminApi;
  const statistics = await api.stats(); assert.ok(statistics); passed('Release ADMIN Overview and authoritative stats');
  route('admin/users'); wait('Users'); step('snapshot'); passed('Release ADMIN users screen');
  route('admin/logs'); wait('Login logs'); step('snapshot'); passed('Release ADMIN login logs screen');
  route('family'); const denied = wait('Admin Console'); assert.ok(!denied.labels.includes('Family')); passed('ADMIN family deep link denied');
  route('admin/users'); wait('Users');
  fs.writeFileSync('.tmp/m9-proxy-control.json', JSON.stringify({ path: '/api/admin/stats', method: 'GET', failStatus: 503 }));
  route('admin'); const outage = wait('The outcome could not be confirmed.');
  assert.ok(!outage.labels.some(label => label.startsWith('Total users')));
  fs.writeFileSync('.tmp/m9-proxy-control.json', '{}');
  step('tap', 'Reload'); wait('Total users'); passed('Admin failed read hides counts; explicit retry restores authoritative stats', { outageEvidence: outage.name });
  route('admin/users'); wait('Users'); step('fill', 'Search email', 'switchEmail'); step('hide-keyboard'); step('reach', 'User details');
  const target = (await api.users()).find(row => row.email === user.switchEmail); assert.ok(target?.isActive);
  step('reach', 'Lock account');
  const before = JSON.parse(fs.readFileSync(`${output}/proxy-events.json`)).length;
  fs.writeFileSync('.tmp/m9-proxy-control.json', JSON.stringify({ path: `/api/admin/users/${target.id}/status`, method: 'PUT', dropAcknowledgement: true }));
  step('tap', 'CONFIRM');
  const locked = (await api.users()).find(row => row.id === target.id); assert.equal(locked.isActive, false);
  const events = JSON.parse(fs.readFileSync(`${output}/proxy-events.json`)).slice(before).filter(e => e.path === `/api/admin/users/${target.id}/status`);
  assert.ok(events.some(event => event.acknowledgementDropped));
  passed('Native confirmed Admin lock survives dropped acknowledgment', { lockedOnServer: true, nativePutEvents: events, semantics: 'Fixed target-state PUT; no exactly-once claim' });
  await api.mutate(rt.context().user.id, locked, 'status', new AbortController().signal);
  passed('Synthetic lock target restored through supported Admin API');
}
async function performanceRun() {
  const rt = createM3Runtime(runtime.api); await rt.context().login(user.perfEmail, user.perfPassword, false);
  const credential = JSON.parse(fs.readFileSync('.tmp/m9-performance-user.json'));
  assert.equal((await rt.family.list()).length, 100);
  const memories = [];
  for (const [screen, path, label] of [['home', '', '100 members'], ['graph', 'family', 'Family'], ['map-fallback', 'family/map', 'Family map'], ['timeline', 'family/timeline', 'Family timeline'], ['calendar', 'family/anniversaries', 'Family calendar'], ['gallery', `library/${credential.albumId}`, 'Synthetic Large Gallery']]) {
    if (path) route(path); const state = wait(label);
    if (screen === 'graph') { step('tap', 'Tree'); wait('Family'); }
    const memory = adb('shell', 'dumpsys', 'meminfo', 'com.anonymous.mylifemobile');
    fs.writeFileSync(`${output}/memory-${screen}.txt`, memory);
    const match = memory.match(/TOTAL PSS:\s*(\d+)/) || memory.match(/TOTAL\s+(\d+)/);
    memories.push({ screen, totalPssMiB: match ? +(Number(match[1]) / 1024).toFixed(2) : null, evidence: state.name });
    adb('shell', 'dumpsys', 'gfxinfo', 'com.anonymous.mylifemobile', 'reset');
    for (let repeat = 0; repeat < 5; repeat++) { adb('shell', 'input', 'swipe', '650', '1000', '650', '350', '450'); adb('shell', 'input', 'swipe', '650', '350', '650', '1000', '450'); }
    const frames = adb('shell', 'dumpsys', 'gfxinfo', 'com.anonymous.mylifemobile', 'framestats');
    fs.writeFileSync(`${output}/frames-${screen}.txt`, frames);
    const durations = [];
    for (const section of frames.split('---PROFILEDATA---')) {
      const lines = section.trim().split(/\r?\n/); if (!lines[0]?.startsWith('Flags,')) continue;
      const headers = lines[0].split(','), start = headers.indexOf('IntendedVsync'), end = headers.indexOf('FrameCompleted');
      for (const line of lines.slice(1)) { const cols = line.split(','); const ms = (Number(cols[end]) - Number(cols[start])) / 1e6; if (cols[0] === '0' && ms > 0 && ms < 60000) durations.push(ms); }
    }
    const within32ms = durations.length ? +(durations.filter(ms => ms <= 32).length / durations.length * 100).toFixed(2) : null;
    memories.at(-1).frames = { measured: durations.length, within32msPercent: within32ms, budgetPercent: 90, passes: within32ms === null ? null : within32ms >= 90 };
    passed(`Large-data ${screen} loaded and profiled`, memories.at(-1));
  }
  const album = await rt.load('src/features/library/library-api.ts').libraryApi.album(credential.albumId);
  const photo = album.photos[0]; step('reach', photo.title || photo.fileName); wait('Zoom in');
  let lightbox;
  for (let attempt = 0; attempt < 8; attempt++) { lightbox = step('snapshot'); if (lightbox.xml.includes('class="android.widget.ImageView"') && !lightbox.labels.includes('Private photo unavailable')) break; }
  const decodedImageObserved = lightbox.xml.includes('class="android.widget.ImageView"') && !lightbox.labels.includes('Private photo unavailable');
  const photoMemory = adb('shell', 'dumpsys', 'meminfo', 'com.anonymous.mylifemobile'); fs.writeFileSync(`${output}/memory-lightbox.txt`, photoMemory);
  const photoPss = photoMemory.match(/TOTAL PSS:\s*(\d+)/) || photoMemory.match(/TOTAL\s+(\d+)/);
  memories.push({ screen: 'lightbox', totalPssMiB: photoPss ? +(Number(photoPss[1]) / 1024).toFixed(2) : null, decodedImageObserved, evidence: lightbox.name });
  passed('Large-data private lightbox memory observation', memories.at(-1));
  fs.writeFileSync('docs/review-m9/test-results/performance/native-memory-frames.json', JSON.stringify({ build: JSON.parse(fs.readFileSync(`${output}/build-resume.json`)), device: 'API35 x86_64 emulator/WHPX/SwiftShader/360dp/font1.3; not physical FPS', measurements: memories, budgetsMiB: { normal: 400, large: 600, growth: 150 }, gesturesPerScreen: 10, graphicsScope: 'Android HWUI framestats; does not measure every GL/map or JS frame' }, null, 2));
}
async function startup() {
  const samples = [];
  for (const kind of ['cold', 'cold', 'cold', 'warm', 'warm', 'warm']) {
    if (kind === 'cold') adb('shell', 'am', 'force-stop', 'com.anonymous.mylifemobile');
    else adb('shell', 'input', 'keyevent', '3');
    const started = Date.now(); adb('shell', 'am', 'start', '-n', 'com.anonymous.mylifemobile/.MainActivity');
    const state = wait('Good '); const measuredMs = Date.now() - started;
    samples.push({ kind, measuredMs, budgetMs: kind === 'cold' ? 10000 : 3000, evidence: state.name, includesHierarchyObservationOverhead: true });
    passed(`${kind} meaningful Home observation`, samples.at(-1));
  }
  fs.writeFileSync('docs/review-m9/test-results/performance/startup.json', JSON.stringify({ samples, deviceBootExcluded: true, metric: 'Upper bound with am start and uiautomator observation; not Time to Initial Display', buildSha256: JSON.parse(fs.readFileSync(`${output}/build-resume.json`)).sha256 }, null, 2));
}
async function faults() {
  const rt = createM3Runtime(runtime.api); await rt.context().login(user.email, user.password, false);
  const library = rt.load('src/features/library/library-api.ts').libraryApi;
  const control = flags => fs.writeFileSync('.tmp/m9-proxy-control.json', JSON.stringify(flags));
  const cases = [
    ['before-backend', { failBeforeBackend: true }], ['body-disconnect', { cutBody: true }],
    ['rate-limit', { failStatus: 429 }], ['bad-gateway', { failStatus: 502 }], ['unavailable', { failStatus: 503 }],
  ];
  for (const [name, flags] of cases) {
    control({});
    adb('shell', 'am', 'force-stop', 'com.anonymous.mylifemobile');
    adb('shell', 'am', 'start', '-n', 'com.anonymous.mylifemobile/.MainActivity'); wait('Good ');
    route('library'); wait('Create album');
    const state = step('snapshot');
    if (state.labels.some(s => s.includes('uncertain') || s.includes('Refresh to read'))) { step('tap', 'Refresh / retry'); wait('Create album'); }
    step('tap', 'Create album'); wait('Name');
    const albumName = `QA${cases.findIndex(item => item[0] === name)}${Date.now()}`;
    step('fill', 'Name', albumName); step('hide-keyboard');
    assert.ok(adb('shell', 'cat', '/data/local/tmp/m9-ui.xml').includes(`text="${albumName}"`));
    const beforeEvents = JSON.parse(fs.readFileSync(`${output}/proxy-events.json`)).length;
    control({ path: '/api/library/albums', method: 'POST', ...flags });
    step('reach', 'Save');
    let result;
    for (let attempt = 0; attempt < 6; attempt++) { result = step('snapshot'); if (result.labels.some(s => /uncertain|Too many requests|Storage is unavailable|request failed/i.test(s))) break; }
    assert.ok(result.labels.some(s => /uncertain|Too many requests|Storage is unavailable|request failed/i.test(s)));
    assert.equal((await library.albums()).filter(a => a.name === albumName).length, 0);
    const events = JSON.parse(fs.readFileSync(`${output}/proxy-events.json`));
    const event = events.slice(beforeEvents).filter(e => e.path === '/api/library/albums' && e.method === 'POST').at(-1);
    assert.ok(event && event.forwarded === false);
    if (flags.failStatus) assert.equal(event.status, flags.failStatus);
    if (flags.cutBody) { assert.equal(event.fault, 'body-disconnect'); assert.ok(event.receivedBodyBytes > 0); }
    if (flags.failBeforeBackend) assert.equal(event.fault, 'before-backend');
    passed(`Native album ${name}: explicit failure, no Backend row`, { event, evidence: result.name });
    control({});
  }
}
async function roleTransitions() {
  const actor = createM3Runtime(runtime.api); await actor.context().login(user.adminEmail, user.adminPassword, false);
  const api = actor.load('src/features/admin/admin-api.ts').adminApi;
  async function change(role) {
    const target = (await api.users()).find(row => row.id === user.accountId); assert.ok(target);
    await api.mutate(actor.context().user.id, target, 'role', new AbortController().signal, role);
    adb('shell', 'input', 'keyevent', '3'); adb('shell', 'am', 'start', '-n', 'com.anonymous.mylifemobile/.MainActivity');
    wait('Sign in'); passed(`Current native account changed to ${role}; old session expires on resume`);
    step('fill', 'Email', 'email'); step('hide-keyboard'); step('fill', 'Password', 'password'); step('hide-keyboard'); step('reach', 'Sign in');
    const state = wait(role === 'ADMIN' ? 'Admin Console' : 'Good ');
    assert.equal(state.labels.includes('Family'), role === 'USER');
    passed(`Fresh ${role} login has the correct native tabs`, { familyTab: state.labels.includes('Family') });
  }
  await change('ADMIN'); await change('USER');
}
async function writeLifecycle() {
  const rt = createM3Runtime(runtime.api); await rt.context().login(user.email, user.password, false);
  const library = rt.load('src/features/library/library-api.ts').libraryApi;
  for (const kind of ['background', 'process-death', 'double-tap']) {
    fs.writeFileSync('.tmp/m9-proxy-control.json', '{}');
    adb('shell', 'am', 'force-stop', 'com.anonymous.mylifemobile'); adb('shell', 'am', 'start', '-n', 'com.anonymous.mylifemobile/.MainActivity'); wait('Good ');
    route('library'); wait('Create album'); step('tap', 'Create album'); wait('Name');
    const name = `QAL${Date.now()}`; step('fill', 'Name', name); step('hide-keyboard');
    const xml = adb('shell', 'cat', '/data/local/tmp/m9-ui.xml'); assert.ok(xml.includes(`text="${name}"`));
    const beforeEvents = JSON.parse(fs.readFileSync(`${output}/proxy-events.json`)).length;
    const holdMs = kind === 'double-tap' ? 5000 : 15000;
    fs.writeFileSync('.tmp/m9-proxy-control.json', JSON.stringify({ path: '/api/library/albums', method: 'POST', holdAcknowledgementMs: holdMs }));
    if (kind === 'double-tap') {
      const tag = [...xml.matchAll(/<node\s+[^>]*>/g)].map(m => m[0]).find(t => t.includes('content-desc="Save"') && t.includes('clickable="true"') && t.includes('enabled="true"'));
      assert.ok(tag); const bounds = tag.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/).slice(1).map(Number); assert.ok(bounds[3] - bounds[1] >= 48);
      const x = String(Math.round((bounds[0] + bounds[2]) / 2)), y = String(Math.round((bounds[1] + bounds[3]) / 2));
      adb('shell', 'input', 'tap', x, y); adb('shell', 'input', 'tap', x, y);
      await new Promise(resolve => setTimeout(resolve, 6500)); step('snapshot');
    } else {
      step('reach', 'Save');
      if (kind === 'process-death') adb('shell', 'am', 'force-stop', 'com.anonymous.mylifemobile'); else adb('shell', 'input', 'keyevent', '3');
      adb('shell', 'am', 'start', '-n', 'com.anonymous.mylifemobile/.MainActivity'); step('snapshot');
      await new Promise(resolve => setTimeout(resolve, 16000));
      if (kind === 'process-death') wait('Good ');
    }
    const matches = (await library.albums()).filter(album => album.name === name); assert.equal(matches.length, 1);
    const events = JSON.parse(fs.readFileSync(`${output}/proxy-events.json`)).slice(beforeEvents).filter(e => e.path === '/api/library/albums' && e.backendStatus === 201);
    assert.equal(events.length, 1); assert.equal(events[0].acknowledgementHeldMs, holdMs);
    passed(`Album ${kind} while committed acknowledgement held`, { matchingAlbums: matches.length, committedRequests: events.length, holdMs, processBarrierDurability: 'In-memory only; no exactly-once protocol' });
  }
}
async function main() {
  assert.equal(adb('shell', 'getprop', 'ro.boot.qemu.avd_name').trim(), 'MyLife_M9');
  if (process.argv[2] === 'profile') await profile();
  else if (process.argv[2] === 'admin') await admin();
  else if (process.argv[2] === 'performance') await performanceRun();
  else if (process.argv[2] === 'startup') await startup();
  else if (process.argv[2] === 'faults') await faults();
  else if (process.argv[2] === 'roles') await roleTransitions();
  else if (process.argv[2] === 'write-lifecycle') await writeLifecycle();
  else throw Error('Choose profile, admin, performance, startup, faults, roles or write-lifecycle');
}
main().catch(error => { fs.writeFileSync(`${output}/release-${process.argv[2]}-failure.json`, JSON.stringify({ error: error.message, evidenceThrough: index - 1, checks }, null, 2)); console.error(error.message); process.exitCode = 1; });
