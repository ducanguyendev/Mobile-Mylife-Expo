const fs = require('node:fs'), crypto = require('node:crypto'), cp = require('node:child_process'), path = require('node:path');
const { createM3Runtime } = require('../tests/helpers/load-m3.cjs');
const runtime = JSON.parse(fs.readFileSync('.tmp/m3-runtime.json', 'utf8'));
if (!/^mylife_m1_[a-f0-9]{12}$/.test(runtime.database) || new URL(runtime.api).hostname !== '127.0.0.1') throw Error('Disposable native runtime required');
async function main() {
  // Restore the seed admin only in the isolated random database after the last-admin race.
  cp.execFileSync(path.join(runtime.pgBin, 'psql.exe'), ['-h', '127.0.0.1', '-p', String(runtime.pgPort), '-U', 'mylife_m1', '-d', runtime.database, '-v', 'ON_ERROR_STOP=1', '-c', "UPDATE user_roles SET role_id=(SELECT id FROM roles WHERE name='ADMIN') WHERE user_id=(SELECT id FROM users WHERE email='m1.admin@gmail.com')"], { stdio: 'ignore', windowsHide: true });
  const rt = createM3Runtime(runtime.api), email = `m8.native.${Date.now()}@gmail.com`, password = 'M8_Qa!' + crypto.randomBytes(12).toString('hex');
  await rt.auth.registerRequest({ fullName: 'Synthetic Native Tester', phoneNumber: '0912345678', gender: 'Nam', dateOfBirth: '1995-05-20', email, password, confirmPassword: password });
  await rt.context().login(email, password, false);
  const members = [];
  for (let index = 0; index < 5; index++) members.push(await rt.family.create({ fullName: 'Synthetic Member ' + index, generation: index < 2 ? 1 : 2, gender: 'Nam', lifeStatus: 'LIVING', dateOfBirth: '1990-05-20', ...(index >= 2 ? { fatherId: members[0].id } : {}) }));
  await rt.load('src/features/family/map/map-api.ts').familyMapApi.update(members[0].id, { latitude: 10.5, longitude: 106.5, displayName: 'Synthetic location' });
  await rt.load('src/features/anniversaries/anniversary-api.ts').anniversaryApi.create({ eventType: 'FAMILY_EVENT', title: 'Synthetic Anniversary', originalSolarDate: '2000-05-20', relatedMemberId: null, lunarDay: null, lunarMonth: null, lunarYear: null, isLeapMonth: false, place: null, host: null, notes: null });
  const library = rt.load('src/features/library/library-api.ts').libraryApi;
  const album = await library.createAlbum('Synthetic M8 Gallery', 'Disposable native regression');
  const body = new FormData(); body.append('files', new Blob([fs.readFileSync('tests/fixtures/library-sage.png')], { type: 'image/png' }), 'synthetic.png'); await library.upload(album.id, body);
  const foreign = createM3Runtime(runtime.api), switchEmail = `m8.switch.${Date.now()}@gmail.com`;
  await foreign.auth.registerRequest({ fullName: 'Synthetic Switch Tester', phoneNumber: '0912345678', gender: 'Nam', dateOfBirth: '1995-05-20', email: switchEmail, password, confirmPassword: password });
  fs.writeFileSync('.tmp/m8-native-user.json', JSON.stringify({ email, password, newPassword: 'M8_New!' + crypto.randomBytes(12).toString('hex'), adminEmail: runtime.adminEmail, adminPassword: runtime.adminPassword, switchEmail, api: runtime.api, accountId: rt.context().user.id, albumId: album.id, photoId: (await library.album(album.id)).photos[0].id, memberIds: members.map(x => x.id) }));
  fs.mkdirSync('docs/review-m8/test-results/native', { recursive: true });
  fs.writeFileSync('docs/review-m8/test-results/native/seed.json', JSON.stringify({ syntheticOnly: true, members: members.length, anniversaries: 1, albums: 1, photos: 1, provider: 'HTTP ADAPTER ONLY' }, null, 2));
  console.log('M8 synthetic native accounts and regression data ready. Credentials kept in ignored temporary files.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
