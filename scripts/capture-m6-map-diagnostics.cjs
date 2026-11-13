const fs = require('node:fs');
const cp = require('node:child_process');
const runtime = JSON.parse(fs.readFileSync('.tmp/m3-runtime.json', 'utf8'));
if (!/^mylife_m1_[a-f0-9]{12}$/.test(runtime.database) || new URL(runtime.api).hostname !== '127.0.0.1') throw Error('Disposable runtime required');
const adb = 'C:/Users/admin/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const run = (...args) => cp.execFileSync(adb, ['-P', '5038', '-s', '127.0.0.1:5585', ...args], { encoding: 'utf8', timeout: 30000, maxBuffer: 24 * 1024 * 1024 });
if (!run('shell', 'getprop', 'ro.boot.qemu.avd_name').includes('MyLife_M4')) throw Error('QA AVD required');
const phase = process.argv[2];
if (!/^[a-z0-9-]+$/.test(phase || '')) throw Error('Diagnostic phase required');
const keyLine = fs.readFileSync('../Frontend-MyLife/.env.local', 'utf8').split(/\r?\n/).find(line => line.startsWith('VITE_VIETMAP_TILE_KEY='));
const key = keyLine?.slice(keyLine.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '');
if (!key) throw Error('Authorized QA public key required for redaction');
const redact = text => text.replaceAll(key, '[redacted public key]').replaceAll(encodeURIComponent(key), '[redacted public key]')
  .replace(/Bearer\s+[^\s"']+/gi, 'Bearer [redacted]').replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[redacted token]')
  .replace(/https?:\/\/\S+/g, '[redacted URL]');
const pid = run('shell', 'pidof', 'com.anonymous.mylifemobile').trim();
const log = run('logcat', '-d', '-v', 'threadtime');
const lines = log.split(/\r?\n/).filter(line => line.trim().split(/\s+/)[2] === pid
  || /ReactHost|ReactInstance|Bridgeless|VietMap|MapLibre|MLRN|ReactNativeJS|Expo|MainActivity|AndroidRuntime|DevLauncher|DevServer|SoLoader/.test(line));
const output = 'docs/review-m6/test-results/native';
fs.writeFileSync(`${output}/map-${phase}-logcat-redacted.log`, redact(lines.join('\n')));
const metroLog = ['native-metro-final.log', 'native-metro-compact.log', 'native-metro.log']
  .map(name => 'docs/review-m6/test-results/' + name).find(file => fs.existsSync(file));
const metroBytes = fs.readFileSync(metroLog);
const metro = metroBytes[0] === 255 ? metroBytes.subarray(2).toString('utf16le') : metroBytes.toString('utf8');
fs.writeFileSync(`${output}/map-${phase}-metro-redacted.log`, redact(metro));
const summary = { phase, pid, retainedLogcatLines: lines.length, reactHostReloadLines: lines.filter(line => /ReactHost.*(?:reload|Reload)/.test(line)).length,
  fatalExceptionLines: lines.filter(line => /FATAL EXCEPTION/.test(line)).length, apkRebuilt: false, keyRedacted: true };
fs.writeFileSync(`${output}/map-${phase}-diagnostic.json`, JSON.stringify(summary, null, 2));
console.log(summary);
