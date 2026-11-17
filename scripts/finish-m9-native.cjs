// Close only the current disposable M9 dataset; private emulator/proxy stop is a
// separately verified host step. No default ADB/device or application DB access.
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), net = require('node:net'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), output = path.join(root, 'docs/review-m9/test-results');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file)));
const runtime = read('.tmp/m9-runtime.json'); assert.match(runtime.database, /^mylife_m1_[a-f0-9]{12}$/); assert.equal(new URL(runtime.api).hostname, '127.0.0.1');
const adb = (...args) => cp.execFileSync('C:/Users/admin/AppData/Local/Android/Sdk/platform-tools/adb.exe', ['-P', '5042', '-s', 'emulator-5592', ...args], { encoding: 'utf8', windowsHide: true, timeout: 30000 });
function closed(port) { return new Promise(resolve => { const socket = net.connect({ host: '127.0.0.1', port: Number(port) }); socket.setTimeout(800); socket.once('connect', () => { socket.destroy(); resolve(false); }); socket.once('error', () => resolve(true)); socket.once('timeout', () => { socket.destroy(); resolve(false); }); }); }
async function main() {
  const needles = new Set();
  for (const object of [runtime, read('.tmp/m9-native-user.json'), read('.tmp/m9-performance-user.json')]) for (const [key, value] of Object.entries(object)) if (/password|token|secret/i.test(key) && typeof value === 'string' && value.length >= 8) needles.add(value);
  const findings = []; let scanned = 0;
  for (const repo of [root, path.resolve(root, '../Backend-MyLife')]) {
    const files = [...new Set(cp.execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: repo, windowsHide: true, encoding: 'utf8' }).split('\0').filter(Boolean))];
    for (const file of files) {
      const target = path.resolve(repo, file); if (!target.startsWith(repo + path.sep) || !fs.existsSync(target) || !fs.statSync(target).isFile()) continue;
      const buffer = fs.readFileSync(target); if (buffer.length > 20 * 1024 * 1024) continue; scanned++;
      const text = buffer.toString(buffer[0] === 255 && buffer[1] === 254 ? 'utf16le' : 'latin1');
      if ([...needles].some(value => text.includes(value))) findings.push({ repository: path.basename(repo), file, rule: 'actual-temporary-credential' });
      if (/eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{16,}/.test(text)) findings.push({ repository: path.basename(repo), file, rule: 'jwt-literal' });
    }
  }
  fs.writeFileSync(path.join(output, 'actual-credential-scan.json'), JSON.stringify({ scannedFiles: scanned, uniqueTemporaryCredentialValues: needles.size, findings, scope: 'Current nonignored Expo/Backend files including binary trace and PNG bytes. No OCR or secure-erasure claim.' }, null, 2));
  assert.equal(findings.length, 0, 'Evidence credential scan failed; inspect paths without printing values');
  assert.equal(adb('shell', 'getprop', 'ro.boot.qemu.avd_name').trim(), 'MyLife_M9');
  assert.equal(adb('shell', 'pm', 'clear', 'com.anonymous.mylifemobile').trim(), 'Success');
  fs.writeFileSync(path.join(root, '.tmp/m9-native-done'), 'M9 final QA complete17 November2026');
  let lifecycle;
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    try { const value = read('docs/review-m9/test-results/native-backend/final-lifecycle.json'); if (value.database === runtime.database && value.databaseDropped && value.postgresStopped && !fs.existsSync(path.join(root, '.tmp/m9-runtime.json'))) { lifecycle = value; break; } } catch { /* Wait for owned harness cleanup. */ }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.ok(lifecycle, 'Held runtime cleanup not confirmed');
  const apiPort = Number(new URL(runtime.api).port), pgPort = runtime.pgPort;
  assert.ok(await closed(apiPort)); assert.ok(await closed(pgPort));
  const removed = [];
  for (const name of ['m9-native-user.json', 'm9-performance-user.json']) {
    const target = path.resolve(root, '.tmp', name); assert.ok(target.startsWith(path.join(root, '.tmp') + path.sep)); fs.rmSync(target, { force: true }); removed.push(name);
  }
  fs.writeFileSync(path.join(output, 'cleanup.json'), JSON.stringify({ date: '2026-11-17', command: 'node scripts/finish-m9-native.cjs', exitCode: 0, database: runtime.database, databaseDropped: true, postgresStopped: true, apiPort, pgPort, apiPortClosed: true, pgPortClosed: true, qaAppDataCleared: true, credentialFilesRemoved: removed, runtimeCredentialsRemovedByHarness: true, evidenceCredentialScanFindings: 0, remainingHostStep: 'Verify and stop owned proxy5091/emulator5592/private ADB5042; leave default5037 alone', noCommitPushPrDeployPublish: true }, null, 2));
  console.log('QA app data cleared; disposable DB dropped; API/PostgreSQL stopped; temporary credentials removed.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
