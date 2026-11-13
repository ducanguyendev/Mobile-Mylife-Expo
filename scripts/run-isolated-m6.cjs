// Replay unchanged M1–M5 assertions in disposable infrastructure, then run M6.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const root = path.resolve(__dirname, '..');
const output = 'docs/review-m6/test-results/final-backend';
fs.mkdirSync(path.join(root, output), { recursive: true });
fs.mkdirSync(path.join(root, '.tmp'), { recursive: true });
for (const version of ['m4', 'm5']) {
  const source = fs.readFileSync(path.join(root, `tests/real-backend.${version}.cjs`), 'utf8')
    .replaceAll('\r\n', '\n')
    .replaceAll(`docs/review-${version}/test-results/final-backend`, output)
    .replace("require('./helpers/load-m3.cjs')", `require(${JSON.stringify(path.join(root, 'tests/helpers/load-m3.cjs'))})`);
  fs.writeFileSync(path.join(root, `.tmp/m6-replay-${version}.cjs`), source);
}
const clockFile = path.join(root, '.tmp/m6-calendar-clock.json').replaceAll('\\', '/');
fs.writeFileSync(clockFile, '{}');
let wrapper = fs.readFileSync(path.join(__dirname, 'run-isolated-m4.cjs'), 'utf8')
  .replaceAll('\r\n', '\n')
  .replaceAll('docs/review-m4/test-results/', 'docs/review-m6/test-results/')
  .replaceAll('tests/real-backend.m4.cjs', '.tmp/m6-replay-m4.cjs');
// M4 builds its runtime by transforming the M3 wrapper. Extend that transformation.
const addition = `
harness = harness.replaceAll('tests/fixtures/map-host/MapContractHost.csproj', 'tests/fixtures/anniversary-host/AnniversaryContractHost.csproj');
harness = harness.replace("MYLIFE_M3_CONTRACT_PROVIDER: '1',", "MYLIFE_M3_CONTRACT_PROVIDER: '1', MYLIFE_M6_CLOCK_FILE: " + JSON.stringify(${JSON.stringify(clockFile)}) + ",");
harness = harness.replace("'m4-integration', root);", "'m4-integration', root);\\n" +
  "      command(process.execPath, ['.tmp/m6-replay-m5.cjs'], {...env, MYLIFE_M1_ISOLATED: database, MYLIFE_M1_API_URL: api, MYLIFE_M3_ADMIN_PASSWORD: runtimeEnv.SeedAdmin__Password, MYLIFE_M3_WEB_ORIGIN: ui}, 'm5-integration', root);\\n" +
  "      command(process.execPath, ['tests/real-backend.m6.cjs'], {...env, MYLIFE_M1_ISOLATED: database, MYLIFE_M1_API_URL: api, MYLIFE_M3_PG_BIN: pgBin, MYLIFE_M3_PG_PORT: String(pgPort), MYLIFE_M3_ADMIN_PASSWORD: runtimeEnv.SeedAdmin__Password, MYLIFE_M3_WEB_ORIGIN: ui, MYLIFE_M6_CLOCK_FILE: " + JSON.stringify(${JSON.stringify(clockFile)}) + "}, 'm6-integration', root);");
`;
if (!wrapper.includes('const compiled = new Module')) throw Error('Review inherited wrapper before replay');
wrapper = wrapper.replace('const compiled = new Module', addition + 'const compiled = new Module');
const compiled = new Module(__filename, module);
compiled.filename = __filename;
compiled.paths = module.paths;
compiled._compile(wrapper, __filename);
