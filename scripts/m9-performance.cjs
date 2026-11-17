const fs = require('node:fs'), assert = require('node:assert/strict'), crypto = require('node:crypto'), zlib = require('node:zlib');
const { createM3Runtime } = require('../tests/helpers/load-m3.cjs');
const runtime = JSON.parse(fs.readFileSync('.tmp/m9-runtime.json'));
if (!/^mylife_m1_[a-f0-9]{12}$/.test(runtime.database) || new URL(runtime.api).hostname !== '127.0.0.1') throw Error('Disposable held M9 runtime required.');
const output = 'docs/review-m9/test-results/performance'; fs.mkdirSync(output, { recursive: true });
function crc32(data) { let crc = -1; for (const byte of data) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = crc >>> 1 ^ (crc & 1 ? 0xedb88320 : 0); } return (crc ^ -1) >>> 0; }
function chunk(type, data) { const name = Buffer.from(type), size = Buffer.alloc(4), crc = Buffer.alloc(4); size.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([name, data]))); return Buffer.concat([size, name, data, crc]); }
function syntheticPng() {
  const width = 1536, height = 2048, header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 2;
  const scan = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) { const at = y * (width * 3 + 1) + 1 + x * 3; scan[at] = (x + y) % 256; scan[at + 1] = Math.floor(x / 32) * 7 % 256; scan[at + 2] = Math.floor(y / 32) * 11 % 256; }
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(scan)), chunk('IEND', Buffer.alloc(0))]);
}
const imageFile = '.tmp/m9-performance-pattern.png';
function image() { if (!fs.existsSync(imageFile)) fs.writeFileSync(imageFile, syntheticPng()); return fs.readFileSync(imageFile); }
function alpha(index) { return String.fromCharCode(65 + Math.floor(index / 26)) + String.fromCharCode(65 + index % 26); }
async function seed() {
  if (fs.existsSync('.tmp/m9-performance-user.json')) throw Error('Performance seed already exists.');
  const rt = createM3Runtime(runtime.api), email = `m9.perf.${crypto.randomBytes(6).toString('hex')}@gmail.com`, password = 'M9_Perf!' + crypto.randomBytes(16).toString('hex');
  await rt.auth.registerRequest({ fullName: 'Synthetic Performance Account', phoneNumber: '0912345678', gender: 'Nam', dateOfBirth: '1995-05-20', email, password, confirmPassword: password }); await rt.context().login(email, password, false);
  const credentials = { email, password, accountId: rt.context().user.id }; fs.writeFileSync('.tmp/m9-performance-user.json', JSON.stringify(credentials));
  const members = [];
  for (let index = 0; index < 100; index++) {
    const generation = Math.floor(index / 20) + 1;
    members.push(await rt.family.create({ fullName: 'Synthetic Performance Member ' + alpha(index), generation, gender: index % 2 === 0 ? 'Nam' : 'Nữ', lifeStatus: 'LIVING', dateOfBirth: `${1940 + generation * 10}-05-20`, ...(generation > 1 ? { fatherId: members[(generation - 2) * 20 + index % 10 * 2].id } : {}) }));
  }
  const map = rt.load('src/features/family/map/map-api.ts').familyMapApi;
  for (let index = 0; index < 100; index += 5) await map.update(members[index].id, { latitude: 10 + index / 100, longitude: 106, displayName: 'Synthetic Performance Place ' + alpha(index) });
  console.log('Synthetic100-member five-generation family seeded.');
  const timeline = rt.load('src/features/timeline/timeline-api.ts').timelineApi, td = rt.load('src/features/timeline/timeline-data.ts');
  for (let index = 0; index < 500; index++) await timeline.create({ ...td.blankWrite(members[index % 100].id), title: `Synthetic Performance Event ${index}`, eventDate: '2024-05-20', eventYear: 2024 });
  console.log('Synthetic500 custom Timeline events seeded.');
  const anniversaries = rt.load('src/features/anniversaries/anniversary-api.ts').anniversaryApi, ad = rt.load('src/features/anniversaries/anniversary-data.ts');
  for (let index = 0; index < 100; index++) await anniversaries.create({ ...ad.blankAnniversary(members[index].id), title: `Synthetic Performance Recurrence ${index}`, originalSolarDate: '2000-05-20' });
  const library = rt.load('src/features/library/library-api.ts').libraryApi, album = await library.createAlbum('Synthetic Large Gallery', 'Synthetic full-dimension patterns only');
  const bytes = image(); assert.ok(bytes.length < 5 * 1024 * 1024);
  for (let batch = 0; batch < 5; batch++) {
    const body = new FormData(); for (let index = 0; index < 20; index++) body.append('files', new Blob([bytes], { type: 'image/png' }), `synthetic-pattern-${batch * 20 + index}.png`);
    assert.equal((await library.upload(album.id, body)).length, 20);
  }
  credentials.albumId = album.id; fs.writeFileSync('.tmp/m9-performance-user.json', JSON.stringify(credentials));
  const native = JSON.parse(fs.readFileSync('.tmp/m9-native-user.json')); Object.assign(native, { perfEmail: email, perfPassword: password, perfAlbumId: album.id }); fs.writeFileSync('.tmp/m9-native-user.json', JSON.stringify(native));
  fs.writeFileSync(`${output}/dataset.json`, JSON.stringify({ syntheticOnly: true, seededThroughRealEndpoints: true, members: 100, generations: 5, manuallyLocated: 20, customTimeline: 500, anniversaries: 100, photos: 100, photoWidth: 1536, photoHeight: 2048, photoBytes: bytes.length, storage: 'HTTP ADAPTER ONLY', nativeApiBuild: 'Kestrel Release .NET10' }, null, 2));
  console.log('Synthetic large-data fixture ready; credentials remain in ignored temporary files.');
}
const summary = values => { const sorted = [...values].sort((a,b) => a-b); return { samples: values.length, minMs: +sorted[0].toFixed(2), p50Ms: +sorted[Math.ceil(values.length * .5) - 1].toFixed(2), p95Ms: +sorted[Math.ceil(values.length * .95) - 1].toFixed(2), maxMs: +sorted.at(-1).toFixed(2) }; };
async function measure() {
  const credential = JSON.parse(fs.readFileSync('.tmp/m9-performance-user.json')), rt = createM3Runtime(runtime.api); await rt.context().login(credential.email, credential.password, false);
  const measurements = [];
  for (const endpoint of ['/api/family-tree','/api/family-tree/map','/api/family-tree/timeline','/api/family-tree/anniversaries','/api/library/overview']) {
    await rt.api.apiRequest(endpoint); const samples = []; let bytes = 0;
    for (let sample = 0; sample < 20; sample++) { const start = performance.now(), data = await rt.api.apiRequest(endpoint); samples.push(performance.now() - start); bytes = Buffer.byteLength(JSON.stringify(data)); }
    const result = { endpoint, ...summary(samples), jsonBytes: bytes, budgetP95Ms: 2000, includesNativeApiClientRefresh: true }; result.withinBudget = result.p95Ms <= result.budgetP95Ms; measurements.push(result);
  }
  const members = await rt.family.list(); assert.equal(members.length, 100); const build = rt.load('src/features/family/graph/family-graph.ts').buildFamilyGraph;
  for (let warm = 0; warm < 5; warm++) build(members); const layout = [];
  for (let sample = 0; sample < 30; sample++) { const start = performance.now(); assert.equal(build(members, 1.3).nodes.length, 100); layout.push(performance.now() - start); }
  const graph = { runtime: 'Host Node24 JS source; not Android FPS', members: 100, fontScale: 1.3, ...summary(layout), budgetP95Ms: 50 }; graph.withinBudget = graph.p95Ms <= 50;
  const library = rt.load('src/features/library/library-api.ts').libraryApi, bytes = image(), body = new FormData();
  for (let index = 0; index < 20; index++) body.append('files', new Blob([bytes], { type: 'image/png' }), `synthetic-measured-batch-${index}.png`);
  const started = performance.now(), added = await library.upload(credential.albumId, body); assert.equal(added.length, 20);
  const upload = { files: 20, bytes: bytes.length * 20, durationMs: +(performance.now() - started).toFixed(2), acknowledged: 20, samples: 1, storage: 'HTTP ADAPTER ONLY' };
  const photos = (await library.album(credential.albumId)).photoCount; assert.equal(photos, 120);
  const dataset = JSON.parse(fs.readFileSync(`${output}/dataset.json`)); dataset.photos = photos; fs.writeFileSync(`${output}/dataset.json`, JSON.stringify(dataset, null, 2));
  fs.writeFileSync(`${output}/members-synthetic.json`, JSON.stringify(members));
  fs.writeFileSync(`${output}/api-and-layout.json`, JSON.stringify({ conditions: 'Run after native compilation; loopback Kestrel/PG, host Node. Native bridge adapted. No Google latency.', endpoints: measurements, graph, upload, physicalDeviceExtrapolation: false }, null, 2));
  console.log(JSON.stringify({ endpoints: measurements.map(m => ({ path: m.endpoint, p95Ms: m.p95Ms, withinBudget: m.withinBudget })), graph, upload }));
}
(process.argv[2] === 'seed' ? seed() : process.argv[2] === 'measure' ? measure() : Promise.reject(Error('Choose seed or measure.'))).catch(error => { console.error(error.message); process.exitCode = 1; });
