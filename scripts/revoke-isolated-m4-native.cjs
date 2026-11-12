// Revoke only the disposable native QA user's sessions to exercise real expiry.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const runtime = JSON.parse(fs.readFileSync('.tmp/m3-runtime.json', 'utf8'));
const user = JSON.parse(fs.readFileSync('.tmp/m4-native-user.json', 'utf8'));
if (!/^mylife_m1_[a-f0-9]{12}$/.test(runtime.database)
  || new URL(runtime.api).hostname !== '127.0.0.1'
  || user.api !== runtime.api || !/^m4\.native\.\d+@gmail\.com$/.test(user.email)) {
  throw Error('Disposable M4 native runtime required');
}
const sql = `UPDATE refresh_tokens SET is_revoked=true WHERE user_id=(SELECT id FROM users WHERE email='${user.email}');`;
const result = cp.execFileSync(path.join(runtime.pgBin, 'psql.exe'), [
  '-h', '127.0.0.1', '-p', String(runtime.pgPort), '-U', 'mylife_m1',
  '-d', runtime.database, '-v', 'ON_ERROR_STOP=1', '-c', sql,
], { encoding: 'utf8', timeout: 30000 });
fs.writeFileSync('docs/review-m4/test-results/native/session-revocation.json', JSON.stringify({
  disposableOnly: true, action: 'Revoked refresh sessions for the synthetic native QA user',
  updateApplied: /^UPDATE [1-9]\d*/m.test(result),
  accessTokenLifetimeSeconds: 5,
}, null, 2));
console.log('Revoked isolated native QA sessions; no credentials recorded.');
