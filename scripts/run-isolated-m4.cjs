// Replay the unchanged M1–M3 suites using disposable infrastructure and new output paths.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const root = path.resolve(__dirname, '..');
const baseline = process.argv.includes('--baseline');
fs.mkdirSync(path.join(root, '.tmp'), { recursive: true });
const output = `docs/review-m4/test-results/${baseline ? 'baseline' : 'final'}-backend`;
fs.mkdirSync(path.join(root, output), { recursive: true });
let suite = fs.readFileSync(path.join(root, 'tests/real-backend.m3.cjs'), 'utf8').replaceAll('\r\n', '\n');
suite = suite.replaceAll('docs/review-m3/test-results/final-backend', output)
  .replace("require('./helpers/load-m3.cjs')", `require(${JSON.stringify(path.join(root, 'tests/helpers/load-m3.cjs'))})`)
  .replace("require('./helpers/load-foundation.cjs')", `require(${JSON.stringify(path.join(root, 'tests/helpers/load-foundation.cjs'))})`);
fs.writeFileSync(path.join(root, '.tmp/m4-replay-m3.cjs'), suite);
let harness = fs.readFileSync(path.join(__dirname, 'run-isolated-m3.cjs'), 'utf8').replaceAll('\r\n', '\n')
  .replaceAll('docs/review-m3/test-results/', 'docs/review-m4/test-results/')
  .replaceAll('tests/real-backend.m3.cjs', '.tmp/m4-replay-m3.cjs')
  .replaceAll('tests/fixtures/avatar-host/AvatarContractHost.csproj', 'tests/fixtures/map-host/MapContractHost.csproj');
for (const name of ['enable', 'enabled', 'started', 'release', 'returned']) fs.rmSync(path.join(root, '.tmp', 'm4-geocoder-' + name), { force: true });
if (!baseline) harness = harness.replace("'m3-integration', root);", `'m3-integration', root);
      command(process.execPath, ['tests/real-backend.m4.cjs'], { ...env, MYLIFE_M1_ISOLATED: database,
        MYLIFE_M1_API_URL: api, MYLIFE_M3_PG_BIN: pgBin, MYLIFE_M3_PG_PORT: String(pgPort),
        MYLIFE_M3_ADMIN_PASSWORD: runtimeEnv.SeedAdmin__Password, MYLIFE_M3_WEB_ORIGIN: ui,
        MYLIFE_M3_PROVIDER_CONTROL: runtimeEnv.MYLIFE_M3_PROVIDER_CONTROL }, 'm4-integration', root);`);
if (/docs\/review-m3\/test-results/.test(harness) || (!baseline && !harness.includes("['tests/real-backend.m4.cjs']"))) throw new Error('M4 evidence isolation failed');
const compiled = new Module(__filename, module);
compiled.filename = __filename; compiled.paths = module.paths;
compiled._compile(harness, __filename);
