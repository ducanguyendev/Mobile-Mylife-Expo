const fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
let source = fs.readFileSync(path.join(__dirname, 'seed-isolated-m6-native.cjs'), 'utf8').replaceAll('review-m6', 'review-m7').replaceAll('.tmp/m6-native-user.json', '.tmp/m7-native-user.json');
const addition = `
  const { libraryApi } = client.load('src/features/library/library-api.ts');
  const category = await libraryApi.createCategory('Synthetic Library QA');
  const album = await libraryApi.createAlbum('Synthetic Library Gallery', 'Synthetic photos only, for native virtualization and private image QA.');
  const bytes = fs.readFileSync('tests/fixtures/library-sage.png');
  for (let start = 0; start < 125; start += 20) {
    const body = new FormData(); for (let i = start; i < Math.min(start + 20, 125); i++) body.append('files', new Blob([bytes], { type: 'image/png' }), 'synthetic-' + String(i + 1).padStart(3, '0') + '.png');
    body.append('title', 'Synthetic photo ' + start); body.append('category', category.slug); body.append('displayDate', '29/02/2024'); body.append('author', 'Synthetic tester'); body.append('description', 'Synthetic family media QA. '.repeat(25));
    await libraryApi.upload(album.id, body);
  }
  await libraryApi.createAlbum('Album thử nghiệm với tên tiếng Việt rất dài để kiểm tra màn hình nhỏ và chữ lớn', 'Synthetic empty album.');
  const userFile = '.tmp/m7-native-user.json'; const info = JSON.parse(fs.readFileSync(userFile, 'utf8')); info.albumId = album.id; info.categoryId = category.id; fs.writeFileSync(userFile, JSON.stringify(info));
  fs.writeFileSync('docs/review-m7/test-results/native/library-seed.json', JSON.stringify({ syntheticOnly: true, familyMembers: members.length, photos: (await libraryApi.album(album.id)).photoCount, albums: (await libraryApi.albums()).length }, null, 2));
  console.log('Seeded125 synthetic Library photos and two albums. No real Drive access.');
`;
const marker = "  console.log('Seeded125 synthetic members";
if (!source.includes(marker)) throw Error('Review inherited seed before reuse'); source = source.replace(marker, addition + marker);
const compiled = new Module(__filename, module); compiled.filename = __filename; compiled.paths = module.paths; compiled._compile(source, __filename);
