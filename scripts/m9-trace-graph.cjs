const fs = require('node:fs'), cp = require('node:child_process'), assert = require('node:assert/strict');
const adbPath = 'C:/Users/admin/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const device = ['-P', '5042', '-s', 'emulator-5592'];
const adb = (...args) => cp.execFileSync(adbPath, [...device, ...args], { encoding: 'utf8', windowsHide: true, timeout: 30000 });
const runtime = JSON.parse(fs.readFileSync('.tmp/m9-runtime.json')); assert.match(runtime.database, /^mylife_m1_[a-f0-9]{12}$/);
const output = 'docs/review-m9/test-results/performance', target = `/data/misc/perfetto-traces/mylife-m9-graph-${Date.now()}.pftrace`;
async function main() {
  assert.equal(adb('shell', 'getprop', 'ro.boot.qemu.avd_name').trim(), 'MyLife_M9');
  adb('shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', 'mobilemylifeexpo://family', 'com.anonymous.mylifemobile');
  cp.execFileSync(process.execPath, ['scripts/m9-native.cjs', 'ui', 'snapshot', '', '', '1450-trace-family'], { windowsHide: true });
  cp.execFileSync(process.execPath, ['scripts/m9-native.cjs', 'ui', 'tap', 'Tree', '', '1451-trace-graph'], { windowsHide: true });
  const pid = adb('shell', 'pidof', 'com.anonymous.mylifemobile').trim();
  const args = ['shell', 'perfetto', '-o', target, '-t', '12s', '-b', '16mb', '-a', 'com.anonymous.mylifemobile', 'sched', 'freq', 'idle', 'am', 'wm', 'gfx', 'view', 'binder_driver', 'input'];
  const child = cp.spawn(adbPath, [...device, ...args], { windowsHide: true }); let logs = '';
  child.stdout.on('data', data => { logs += data; }); child.stderr.on('data', data => { logs += data; });
  const done = new Promise((resolve, reject) => { child.on('error', reject); child.on('exit', resolve); });
  await new Promise(resolve => setTimeout(resolve, 1500));
  for (let repeat = 0; repeat < 3; repeat++) { adb('shell', 'input', 'swipe', '650', '1000', '650', '350', '450'); adb('shell', 'input', 'swipe', '650', '350', '650', '1000', '450'); }
  const exitCode = await done; fs.writeFileSync('.tmp/m9-graph-trace-command.log', logs); assert.equal(exitCode, 0);
  const trace = cp.execFileSync(adbPath, [...device, 'exec-out', 'cat', target], { windowsHide: true, maxBuffer: 32 * 1024 * 1024 }); assert.ok(trace.length > 1000);
  const text = trace.toString('latin1'); const values = [runtime, JSON.parse(fs.readFileSync('.tmp/m9-native-user.json')), JSON.parse(fs.readFileSync('.tmp/m9-performance-user.json'))];
  for (const object of values) for (const [key, value] of Object.entries(object)) if (/password|token|secret/i.test(key) && typeof value === 'string' && value.length >= 8) assert.ok(!text.includes(value), 'Trace contains a credential; quarantine instead of retaining');
  assert.ok(!/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(text), 'Trace contains JWT');
  fs.writeFileSync(`${output}/graph-release.perfetto-trace`, trace);
  fs.writeFileSync(`${output}/graph-trace.json`, JSON.stringify({ date: '2026-11-17', command: 'node scripts/m9-trace-graph.cjs', perfettoArgs: args, exitCode, bytes: trace.length, processId: pid, processIdAfter: adb('shell', 'pidof', 'com.anonymous.mylifemobile').trim(), buildSha256: JSON.parse(fs.readFileSync('docs/review-m9/test-results/native/build-resume.json')).sha256, gestures: 6, actualTemporaryCredentialAndJwtScan: 'No matches', status: 'COLLECTED; root-cause analysis pending; emulator only', evidence: '1450–1451-trace-*.xml' }, null, 2));
  adb('shell', 'rm', target); console.log(`Collected12s graph trace (${trace.length}bytes), PID${pid}. No root-cause closure claimed.`);
}
main().catch(error => { fs.writeFileSync(`${output}/graph-trace-failure.json`, JSON.stringify({ message: error.message, status: 'NOT PROVEN' }, null, 2)); console.error(error.message); process.exitCode = 1; });
