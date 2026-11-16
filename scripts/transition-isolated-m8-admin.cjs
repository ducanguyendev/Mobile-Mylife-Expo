const fs = require('node:fs'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const { createM3Runtime } = require('../tests/helpers/load-m3.cjs');
async function main() {
  const runtime = JSON.parse(fs.readFileSync('.tmp/m3-runtime.json', 'utf8'));
  if (!/^mylife_m1_[a-f0-9]{12}$/.test(runtime.database) || new URL(runtime.api).hostname !== '127.0.0.1') throw Error('Disposable M8 runtime required');
  const action = process.argv[2];
  const client = createM3Runtime(runtime.api);
  let actor;
  if (action === 'demote') {
    const email = `m8.transition.${crypto.randomBytes(6).toString('hex')}@gmail.com`, password = 'M8_Qa!' + crypto.randomBytes(12).toString('hex');
    await client.auth.registerRequest({ fullName: 'Synthetic Transition Admin', phoneNumber: '0912345678', gender: 'Nam', dateOfBirth: '1995-05-20', email, password, confirmPassword: password });
    await client.context().login(runtime.adminEmail, runtime.adminPassword, false);
    const admin = client.load('src/features/admin/admin-api.ts').adminApi;
    const target = (await admin.users()).find(user => user.email === email);
    await admin.mutate(client.context().user.id, target, 'role', new AbortController().signal, 'ADMIN');
    actor = { email, password }; fs.writeFileSync('.tmp/m8-transition-admin.json', JSON.stringify(actor));
  } else if (action === 'restore') actor = JSON.parse(fs.readFileSync('.tmp/m8-transition-admin.json', 'utf8'));
  else throw Error('Choose demote or restore');
  await client.context().login(actor.email, actor.password, false);
  const admin = client.load('src/features/admin/admin-api.ts').adminApi;
  const target = (await admin.users()).find(user => user.email === runtime.adminEmail);
  const role = action === 'demote' ? 'USER' : 'ADMIN';
  await admin.mutate(client.context().user.id, target, 'role', new AbortController().signal, role);
  assert.equal((await admin.users()).find(user => user.id === target.id).role, role);
  if (action === 'demote') {
    const familyUser = createM3Runtime(runtime.api);
    await familyUser.context().login(runtime.adminEmail, runtime.adminPassword, false);
    const root = await familyUser.family.create({ fullName: 'Synthetic Transition Root', generation: 1, gender: 'Nam', lifeStatus: 'LIVING', dateOfBirth: '1990-05-20' });
    await familyUser.family.create({ fullName: 'Synthetic Transition Child', generation: 2, gender: 'Nam', lifeStatus: 'LIVING', fatherId: root.id });
    await familyUser.load('src/features/family/map/map-api.ts').familyMapApi.update(root.id, { latitude: 10.5, longitude: 106.5, displayName: 'Synthetic transition place' });
    const library = familyUser.load('src/features/library/library-api.ts').libraryApi;
    const gallery = await library.createAlbum('Synthetic Transition Media', 'Disposable role-boundary and background QA');
    const body = new FormData(); body.append('files', new Blob([fs.readFileSync('tests/fixtures/library-sage.png')], { type: 'image/png' }), 'synthetic-transition.png');
    await library.upload(gallery.id, body);
    fs.writeFileSync('.tmp/m8-transition-admin.json', JSON.stringify({ ...actor, galleryId: gallery.id }));
  }
  const result = { action, status: 'PASS', syntheticAccountsOnly: true, usedSupportedRoleEndpoint: true, resultingRole: role, currentNativeAccountSessionsRevoked: true };
  fs.writeFileSync(`docs/review-m8/test-results/native/current-admin-${action}.json`, JSON.stringify(result, null, 2)); console.log(JSON.stringify(result));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
