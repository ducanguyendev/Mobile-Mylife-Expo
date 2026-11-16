const fs = require('node:fs'), cp = require('node:child_process');
const adb = 'C:/Users/admin/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const output = 'docs/review-m8/test-results/native';
const run = (...args) => cp.execFileSync(adb, ['-P', '5041', '-s', 'emulator-5590', ...args], { encoding: 'utf8', windowsHide: true, timeout: 30000, maxBuffer: 64 * 1024 * 1024 });
const user = JSON.parse(fs.readFileSync('.tmp/m8-native-user.json', 'utf8'));
const secrets = [user.password, user.newPassword, user.adminPassword].filter(Boolean);
function readLog(file) {
  const bytes = fs.readFileSync(file);
  return bytes[0] === 255 && bytes[1] === 254 ? bytes.subarray(2).toString('utf16le') : bytes.toString('utf8');
}
function redact(text) {
  for (const secret of secrets) text = text.split(secret).join('[password redacted]').split(encodeURIComponent(secret)).join('[password redacted]');
  return text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email redacted]').replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP redacted]').replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[token redacted]');
}
async function measure(mode) {
  if (mode === 'cold') run('shell', 'am', 'force-stop', 'com.anonymous.mylifemobile');
  else run('shell', 'input', 'keyevent', '3');
  const started = Date.now();
  const activity = run('shell', 'am', 'start', '-W', '-a', 'android.intent.action.VIEW', '-d', 'mobilemylifeexpo://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8092', 'com.anonymous.mylifemobile');
  while (Date.now() - started < 60000) {
    try {
      run('shell', 'uiautomator', 'dump', '/sdcard/m8-readiness.xml');
      const xml = run('shell', 'cat', '/sdcard/m8-readiness.xml');
      const homeReady = /Good morning|Good afternoon|Good evening|Chào buổi/.test(xml) && /\d+ members|\d+ thành viên/.test(xml);
      const adminReady = /Admin Console|Bảng quản trị/.test(xml) && /Total users|Tổng người dùng/.test(xml);
      const ready = homeReady || adminReady || xml.includes('content-desc="Email"') && xml.includes('content-desc="Password"') && xml.includes('Sign in');
      if (ready) return { mode, observedScreen: adminReady ? 'admin' : homeReady ? 'home' : 'login', firstScreenReadyMs: Date.now() - started, activity: redact(activity), pollingIncludesHierarchyDumpCost: true };
    } catch { /* A transient null hierarchy does not establish screen readiness. */ }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return { mode, firstScreenReadyMs: null, timedOut: true, activity: redact(activity) };
}
async function main() {
  if (run('shell', 'getprop', 'ro.boot.qemu.avd_name').trim() !== 'MyLife_M8') throw Error('Dedicated M8 AVD required');
  fs.writeFileSync(`${output}/logcat-before-measurement.log`, redact(run('logcat', '-d', '-v', 'threadtime')));
  fs.writeFileSync(`${output}/last-anr-redacted.txt`, redact(run('shell', 'dumpsys', 'activity', 'lastanr')));
  fs.writeFileSync(`${output}/metro-redacted.log`, redact(['.tmp/m8-metro-native.log', '.tmp/m8-metro-final2.log', '.tmp/m8-metro-oneshot.log'].map(readLog).join('\n')));
  fs.writeFileSync(`${output}/android-build.log`, redact(readLog('.tmp/m8-android-build-final.log')));
  const results = [await measure('cold'), await measure('warm')];
  fs.writeFileSync(`${output}/readiness.json`, JSON.stringify({ device: 'MyLife_M8 API35 x86_64', build: 'Development client; cached Metro bundle', results }, null, 2));
  fs.writeFileSync(`${output}/logcat-measurement.log`, redact(run('logcat', '-d', '-v', 'threadtime')));
  fs.writeFileSync(`${output}/memory-emulator.txt`, redact(run('shell', 'dumpsys', 'meminfo', 'com.anonymous.mylifemobile')));
  console.log(JSON.stringify(results.map(({ mode, firstScreenReadyMs, timedOut }) => ({ mode, firstScreenReadyMs, timedOut }))));
}
main().catch(error => { console.error(redact(error.message)); process.exitCode = 1; });
