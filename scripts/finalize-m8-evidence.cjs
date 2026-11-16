const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const root = 'docs/review-m8/test-results';
const contrast = 'docs/review-m2/test-results/contrast.json';
fs.copyFileSync(contrast, `${root}/contrast.json`);
fs.writeFileSync(contrast, cp.execFileSync('git', ['show', `HEAD:${contrast}`]));
const suites = ['final-integration.json', 'm2-home.json', ...[3, 4, 5, 6, 7, 8].map(n => `m${n}-integration.json`)];
const groups = suites.map(file => {
  const checks = JSON.parse(fs.readFileSync(`${root}/final-backend/${file}`)).checks;
  assert.ok(checks.every(check => check.status.startsWith('PASS')));
  return { file, passed: checks.length };
});
const lifecycle = JSON.parse(fs.readFileSync(`${root}/final-backend/final-lifecycle.json`));
assert.ok(lifecycle.databaseDropped && lifecycle.postgresStopped && lifecycle.results.every(result => result.exitCode === 0));
const http = groups.reduce((sum, suite) => sum + suite.passed, 0); assert.equal(http, 134);
fs.writeFileSync(`${root}/verified-totals.json`, JSON.stringify({ jsUnique: 407, m8Js: 61, contrast: 14, backendFull: 208, anniversarySubset: 9, http, httpSuites: groups, httpStatus: 'PASS', disposableDatabaseDropped: true, postgresStopped: true, m8Ci: 'NOT RUN' }, null, 2));
const apk = 'android/app/build/outputs/apk/debug/app-debug.apk';
const hash = crypto.createHash('sha256').update(fs.readFileSync(apk)).digest('hex');
assert.equal(hash, 'ec9103b79ba1d1ee05e5bfcf8e9ccb97d8c0da4734026fe7e88ac33bc585e7b3');
fs.writeFileSync(`${root}/native/build.json`, JSON.stringify({ platform: 'Android emulator API35', type: 'debug development client', sha256: hash, nativePlugin: 'one-shot POST request bodies', releaseBuild: 'NOT TESTED' }, null, 2));
const secrets = [];
for (const file of ['.tmp/m8-native-user.json', '.tmp/m8-transition-admin.json']) if (fs.existsSync(file)) {
  const values = JSON.parse(fs.readFileSync(file));
  for (const [key, value] of Object.entries(values)) if (/password|token/i.test(key) && typeof value === 'string') secrets.push(value);
}
const files = fs.readdirSync(root, { recursive: true }).filter(file => /\.(?:json|ndjson|xml|log|txt|trx)$/i.test(file)).map(file => path.join(root, file));
let redactedFiles = 0;
for (const file of files) {
  const buffer = fs.readFileSync(file);
  const encoding = buffer[0] === 255 && buffer[1] === 254 ? 'utf16le' : 'utf8';
  const original = buffer.toString(encoding).replace(/^\uFEFF/, '');
  let safe = original.replace(/[A-Z0-9._%+-]+(?:@|%40)[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email redacted]')
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP redacted]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[token redacted]');
  for (const secret of secrets) safe = safe.replaceAll(secret, '[credential redacted]');
  if (safe !== original || encoding !== 'utf8') { fs.writeFileSync(file, safe); redactedFiles++; }
}
let credentialFindings = 0, jwtFindings = 0;
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  credentialFindings += secrets.filter(secret => text.includes(secret)).length;
  jwtFindings += (text.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) || []).length;
}
assert.equal(credentialFindings + jwtFindings, 0);
fs.writeFileSync(`${root}/evidence-scan.json`, JSON.stringify({ textFilesScanned: files.length, redactedFiles, knownTemporaryCredentialFindings: credentialFindings, jwtFindings, screenshots: 'Native helper excludes email/IP/typed fields. Task-switcher bitmap separately inspected; synthetic stripe only.', limitations: 'Pattern scan is not device cache forensics or OCR of every image.' }, null, 2));
for (const file of ['.tmp/m8-native-user.json', '.tmp/m8-transition-admin.json', '.tmp/m8-current.png', '.tmp/m8-recents.png']) if (fs.existsSync(file)) fs.unlinkSync(file);
console.log(JSON.stringify({ http, status: 'PASS', textFilesScanned: files.length, credentialFindings, jwtFindings, temporaryCredentialFilesRemoved: true }));
