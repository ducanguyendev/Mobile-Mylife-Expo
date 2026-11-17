// Reversible local QA cache relocation. No source/dependency contents are edited.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict');
assert.equal(process.platform, 'win32'); assert.equal(process.env.MYLIFE_NATIVE_QA, '1');
const root = path.resolve(__dirname, '..'), temporary = path.resolve(os.tmpdir(), 'mylife-m9-build-space');
const recordFile = path.join(root, '.tmp/m9-build-space.json');
const records = fs.existsSync(recordFile) ? JSON.parse(fs.readFileSync(recordFile)) : [];
const packages = ['react-native-reanimated','react-native-worklets','expo-modules-core','react-native-screens','@vietmap/vietmap-gl-react-native','react-native-svg','react-native-gesture-handler','react-native-safe-area-context'];
function total(dir) { let bytes = 0; for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const file = path.join(dir, entry.name); if (entry.isDirectory()) bytes += total(file); else if (entry.isFile()) bytes += fs.statSync(file).size; } return bytes; }
for (const [index, relative] of [...packages.map(name => `node_modules/${name}/android/build`), 'android/app/build'].entries()) {
  const source = path.resolve(root, relative), destination = path.resolve(temporary, String(index));
  assert.ok(source.startsWith(root + path.sep)); assert.equal(path.basename(source), 'build'); assert.ok(destination.startsWith(temporary + path.sep));
  if (fs.existsSync(source) && fs.lstatSync(source).isSymbolicLink()) {
    assert.equal(fs.realpathSync(source), destination); continue;
  }
  if (fs.existsSync(destination)) throw Error('Unknown existing temporary output; inspect before retrying.');
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  if (fs.existsSync(source)) {
    fs.cpSync(source, destination, { recursive: true }); assert.equal(total(source), total(destination));
    fs.rmSync(source, { recursive: true, force: true });
  } else fs.mkdirSync(destination);
  fs.mkdirSync(path.dirname(source), { recursive: true }); fs.symlinkSync(destination, source, 'junction');
  records.push({ source, destination, generatedCacheOnly: true }); fs.writeFileSync(recordFile, JSON.stringify(records, null, 2));
}
console.log(JSON.stringify({ generatedDirectoriesRelocated: records.length, temporaryRoot: temporary }));
