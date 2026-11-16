const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), review = path.join(root, 'docs/review-m7'), output = path.join(review, 'test-results');
const json = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8').replace(/^\uFEFF/, ''));
const write = (name, value) => fs.writeFileSync(path.join(output, name), JSON.stringify(value, null, 2) + '\n');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]);
const secrets = [];
for (const file of ['.tmp/m3-runtime.json', '.tmp/m7-native-user.json', '.tmp/m7-owner-user.json', '.tmp/m7-switch-user.json']) if (fs.existsSync(path.join(root, file))) { const value = json(file); for (const field of ['password', 'adminPassword']) if (value[field]) secrets.push(value[field]); }
if (secrets.length) {
  const files = walk(review).filter(f => /\.(json|md|xml|log|txt|trx)$/.test(f)); const hits = [];
  for (const file of files) { const text = fs.readFileSync(file, 'utf8'); if (secrets.some(s => text.includes(s) || text.includes(encodeURIComponent(s)))) hits.push(path.relative(root, file)); }
  write('secret-scan.json', { scannedFiles: files.length, literalOrEncodedQaPasswordHits: hits.length, files: hits }); assert.equal(hits.length, 0);
}
if (process.argv.includes('--scan-secrets')) { console.log('M7 evidence credential scan passed.'); process.exit(0); }
const tokenScanFiles = walk(review).filter(f => /\.(json|md|xml|log|txt|trx)$/.test(f));
const tokenHits = tokenScanFiles.filter(file => /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/.test(fs.readFileSync(file, 'utf8'))).map(file => path.relative(root, file));
write('token-pattern-scan.json', { scannedFiles: tokenScanFiles.length, jwtPatternHits: tokenHits.length, files: tokenHits }); assert.equal(tokenHits.length, 0);
const required = ['REPORT', 'INITIAL_AUDIT', 'LIBRARY_API_CONTRACT', 'FEATURE_PARITY', 'PRIVATE_IMAGE_SECURITY', 'UPLOAD_AND_MEDIA_QA', 'GOOGLE_DRIVE_PROVIDER_QA', 'ALBUM_CATEGORY_INTEGRITY', 'WEB_EXPO_PARITY', 'DESIGN_UX_REVIEW', 'NATIVE_SMOKE_RESULTS', 'TEST_RESULTS', 'DEPENDENCY_AUDIT', 'BACKEND_M6_TEST_SYNC', 'CARRY_FORWARD_RISKS', 'M8_HANDOFF'];
for (const name of required) assert.ok(fs.statSync(path.join(review, name + '.md')).size > 300, 'Missing report ' + name);
const quality = json('docs/review-m7/test-results/quality-summary.json'); assert.equal(quality.length, 11); assert.ok(quality.every(q => q.exitCode === 0));
const unit = {};
for (const suite of ['foundation', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7']) { const text = fs.readFileSync(path.join(output, `final-test-${suite}.log`), 'utf8'); unit[suite] = Number(text.match(/tests (\d+)/)?.[1]); assert.ok(unit[suite] > 0); }
const http = json('docs/review-m7/test-results/final-backend/m7-integration.json'); assert.equal(http.checks.length, 21); assert.ok(http.checks.every(c => c.status === 'PASS'));
const lifecycle = json('docs/review-m7/test-results/final-backend/final-lifecycle.json'); assert.equal(lifecycle.databaseDropped, true); assert.equal(lifecycle.postgresStopped, true); assert.ok(lifecycle.results.every(r => r.exitCode === 0));
const native = path.join(output, 'native'); const excludedEmpty = [];
for (const file of fs.readdirSync(native).filter(f => f.endsWith('.png'))) if (fs.statSync(path.join(native, file)).size === 0) { fs.renameSync(path.join(native, file), path.join(native, file + '.failed-empty')); excludedEmpty.push(file); }
if (excludedEmpty.length) write('excluded-empty-captures.json', { excludedEmpty, reason: 'Interrupted capture; never successful visual evidence.' });
assert.equal(json('docs/review-m7/test-results/secret-scan.json').literalOrEncodedQaPasswordHits, 0);
const tracked = cp.execFileSync('git', ['ls-files', 'tests', 'scripts/run-isolated-m1.cjs', 'scripts/run-isolated-m3.cjs', 'scripts/run-isolated-m4.cjs', 'scripts/run-isolated-m6.cjs', 'package-lock.json', 'app.json', 'metro.config.js'], { cwd: root, encoding: 'utf8' }).trim().split(/\r?\n/);
const modifiedInherited = tracked.filter(file => !cp.execFileSync('git', ['show', 'HEAD:' + file], { cwd: root }).equals(fs.readFileSync(path.join(root, file))));
write('inherited-integrity.json', { trackedFilesChecked: tracked.length, modified: modifiedInherited }); assert.equal(modifiedInherited.length, 0);
const changed = new Set([...cp.execFileSync('git', ['diff', '--name-only'], { cwd: root, encoding: 'utf8' }).trim().split(/\r?\n/), ...cp.execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).trim().split(/\r?\n/), 'docs/review-m7/FILES_CHANGED.md', 'docs/review-m7/test-results/changed-files.json', 'docs/review-m7/test-results/final-summary.json'].filter(Boolean));
const inventory = [...changed].sort().map(file => ({ file, bytes: fs.existsSync(path.join(root, file)) ? fs.statSync(path.join(root, file)).size : null })); write('changed-files.json', inventory);
const source = inventory.filter(i => i.file.startsWith('src/')).map(i => i.file), supporting = inventory.filter(i => !i.file.startsWith('src/') && !i.file.startsWith('docs/')).map(i => i.file);
fs.writeFileSync(path.join(review, 'FILES_CHANGED.md'), '# Exact changed files\n\nStarting Expo HEAD: `62f72653c3bd4da66592686890957e8577a03814`. No commit/push.\n\nApplication source (' + source.length + ' paths):\n\n```text\n' + source.join('\n') + '\n```\n\nSupporting config/tests/scripts:\n\n```text\n' + supporting.join('\n') + '\n```\n\nAll required reports and every individual evidence artifact are enumerated in [changed-files.json](test-results/changed-files.json). Backend retains only its preexisting untracked AnniversaryDateIntegrityTests.cs; Web/Flutter source is unchanged by M7.\n');
const hashes = Object.fromEntries(source.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')])); write('source-hashes.json', hashes);
write('final-summary.json', { reviewDate: '2026-11-14', development: 'PARTIAL PASS', release: 'NOT READY', quality, unitCases: unit, uniqueExpoCases: Object.values(unit).reduce((n, v) => n + v, 0), contrast: 14, appsScriptLibrary: 12, backendFull: 203, backendM6Targeted: 9, httpGroups: { inherited: 84, m7: http.checks.length, total: 105 }, storage: 'ADAPTER ONLY; REAL GOOGLE DRIVE BLOCKED', native: 'PARTIAL PASS; executed matrix predates final pure-JS shared coordinator hardening', physicalAndroid: 'NOT TESTED', ios: 'NOT TESTED', githubM7CI: 'NOT RUN', requiredReports: required.length, applicationSourcePaths: source.length, inheritedTrackedFilesUnchanged: tracked.length, sourceHashes: hashes });
console.log(JSON.stringify({ reports: required.length, sourcePaths: source.length, uniqueExpoCases: Object.values(unit).reduce((n, v) => n + v, 0), httpGroups: 105, inheritedUnchanged: tracked.length, evidenceFiles: walk(output).length }));
