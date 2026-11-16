const fs = require('node:fs'); const { createM3Runtime } = require('../tests/helpers/load-m3.cjs');
const runtime = JSON.parse(fs.readFileSync('.tmp/m3-runtime.json', 'utf8')), user = JSON.parse(fs.readFileSync('.tmp/m7-native-user.json', 'utf8'));
if (!/^mylife_m1_[a-f0-9]{12}$/.test(runtime.database) || new URL(runtime.api).hostname !== '127.0.0.1' || user.api !== runtime.api || !Number.isSafeInteger(user.albumId)) throw Error('Disposable gallery required');
(async () => {
  const client = createM3Runtime(runtime.api); await client.context().login(user.email, user.password, false); const api = client.load('src/features/library/library-api.ts').libraryApi;
  const old = await api.album(user.albumId); if (old.name !== 'Synthetic Library Gallery') throw Error('Synthetic gallery only');
  await api.deleteAlbum(old.id); const album = await api.createAlbum(old.name, 'Valid generated PNG fixtures for private gallery virtualization QA.');
  const categories = await api.categories(); const category = categories.find(c => c.id === user.categoryId); if (!category) throw Error('Synthetic category missing');
  const bytes = fs.readFileSync('tests/fixtures/library-sage.png');
  for (let start = 0; start < 125; start += 20) { const body = new FormData(); for (let i = start; i < Math.min(start + 20, 125); i++) body.append('files', new Blob([bytes], { type: 'image/png' }), `synthetic-${String(i + 1).padStart(3, '0')}.png`); body.append('title', 'Synthetic photo ' + start); body.append('category', category.slug); await api.upload(album.id, body); }
  user.albumId = album.id; fs.writeFileSync('.tmp/m7-native-user.json', JSON.stringify(user));
  fs.writeFileSync('docs/review-m7/test-results/native/gallery-fixture-correction.json', JSON.stringify({ initialFixture: 'IDAT CRC mismatch; decoder correctly displayed image-unavailable states', correctedFixture: 'tests/fixtures/library-sage.png; valid code-generated striped PNG', syntheticOnly: true, photos: (await api.album(album.id)).photoCount, realDrive: false }, null, 2)); console.log('Replaced only the disposable125-photo gallery with valid generated PNG fixtures.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
