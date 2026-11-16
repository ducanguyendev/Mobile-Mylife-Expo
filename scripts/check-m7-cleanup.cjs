const fs = require('node:fs'), net = require('node:net'), assert = require('node:assert/strict');
const owned = JSON.parse(fs.readFileSync('.tmp/m7-owned-lifecycle.json', 'utf8'));
const native = JSON.parse(fs.readFileSync('docs/review-m7/test-results/native/backend-cleanup.json', 'utf8'));
const final = JSON.parse(fs.readFileSync('docs/review-m7/test-results/final-backend/final-lifecycle.json', 'utf8'));
async function listening(port) { return new Promise(resolve => { const socket = net.connect({ host: '127.0.0.1', port }); const finish = value => { socket.destroy(); resolve(value); }; socket.setTimeout(500, () => finish(false)); socket.once('connect', () => finish(true)); socket.once('error', () => finish(false)); }); }
(async () => {
  const ports = [...new Set([owned.apiPort, owned.pgPort, owned.metroPort, owned.privateAdbPort, 5586, 5587, final.pgPort])]; const openPorts = [];
  for (const port of ports) if (await listening(port)) openPorts.push(port);
  const remainingCredentials = ['.tmp/m3-runtime.json', '.tmp/m7-native-user.json', '.tmp/m7-owner-user.json', '.tmp/m7-switch-user.json'].filter(f => fs.existsSync(f));
  const result = { status: openPorts.length || remainingCredentials.length || fs.existsSync(owned.avdRoot) ? 'FAIL' : 'PASS', nativeDatabaseDropped: native.databaseDropped, nativePostgresStopped: native.postgresStopped, finalHttpDatabaseDropped: final.databaseDropped, finalHttpPostgresStopped: final.postgresStopped, checkedLoopbackPorts: ports, openPorts, remainingCredentials, taskAvdRootRemoved: !fs.existsSync(owned.avdRoot), storage: 'In-memory test adapter exited with Kestrel; no real Drive storage used', note: 'Initial graceful emulator shutdown left qemu alive; verified task-only PIDs were stopped, then the first snapshot-file delete lock cleared on retry.' };
  fs.writeFileSync('docs/review-m7/test-results/cleanup.json', JSON.stringify(result, null, 2));
  assert.equal(result.status, 'PASS'); assert.ok(native.databaseDropped && native.postgresStopped && final.databaseDropped && final.postgresStopped); console.log('M7 cleanup PASS: database/server/Metro/emulator/private ADB ports closed; task AVD and credential files removed.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
