const fs = require('node:fs'), assert = require('node:assert/strict');
const { createM3Runtime } = require('../tests/helpers/load-m3.cjs');
async function main() {
  const runtime = JSON.parse(fs.readFileSync('.tmp/m3-runtime.json', 'utf8'));
  const user = JSON.parse(fs.readFileSync('.tmp/m8-native-user.json', 'utf8'));
  if (!/^mylife_m1_[a-f0-9]{12}$/.test(runtime.database) || new URL(runtime.api).hostname !== '127.0.0.1') throw Error('Disposable M8 runtime required');
  const operation = process.argv[2];
  if (!['role-admin', 'role-user', 'locked', 'unlocked', 'deleted', 'protected-delete'].includes(operation)) throw Error('Unknown verification');
  const rt = createM3Runtime(runtime.api); await rt.context().login(user.adminEmail, user.adminPassword, false);
  const api = rt.load('src/features/admin/admin-api.ts').adminApi;
  const target = (await api.users()).find(item => item.email === (operation === 'protected-delete' ? user.email : user.switchEmail));
  if (operation === 'deleted') assert.equal(target, undefined);
  else {
    assert.ok(target, 'Synthetic target must remain present');
    assert.equal(target.role, operation === 'role-admin' ? 'ADMIN' : 'USER');
    assert.equal(target.isActive, operation !== 'locked');
  }
  const stats = await api.stats();
  const result = { operation, status: 'PASS', authoritativeReadBack: true, targetPresent: !!target, role: target?.role, isActive: target?.isActive, totalUsers: stats.totalUsers, totalActive: stats.totalActive, totalLocked: stats.totalLocked };
  fs.writeFileSync(`docs/review-m8/test-results/native/admin-${operation}-api.json`, JSON.stringify(result, null, 2)); console.log(JSON.stringify(result));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
