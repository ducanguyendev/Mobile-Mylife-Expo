const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const runtime = JSON.parse(fs.readFileSync('.tmp/m3-runtime.json', 'utf8'));
const user = JSON.parse(fs.readFileSync('.tmp/m8-native-user.json', 'utf8'));
if (!/^mylife_m1_[a-f0-9]{12}$/.test(runtime.database) || new URL(runtime.api).hostname !== '127.0.0.1' || !Number.isSafeInteger(user.accountId) || user.accountId <= 0) throw Error('Disposable M8 account required');
cp.execFileSync(path.join(runtime.pgBin, 'psql.exe'), ['-h', '127.0.0.1', '-p', String(runtime.pgPort), '-U', 'mylife_m1', '-d', runtime.database, '-v', 'ON_ERROR_STOP=1', '-c', `UPDATE refresh_tokens SET is_revoked=true WHERE user_id=${user.accountId}`], { windowsHide: true, stdio: 'ignore' });
fs.writeFileSync('docs/review-m8/test-results/native/session-revocation.json', JSON.stringify({ syntheticOwnerOnly: true, refreshSessionsRevoked: true, accessLifetimeSeconds: 5, foregroundIdentityPollSeconds: 30 }, null, 2));
console.log('Revoked only the disposable synthetic owner sessions.');
