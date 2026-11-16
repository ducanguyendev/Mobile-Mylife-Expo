// Extend the inherited disposable HTTP harness. Previous suites remain unchanged.
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const root = path.resolve(__dirname, '..');
const output = 'docs/review-m8/test-results/final-backend';
fs.mkdirSync(output, { recursive: true });
fs.mkdirSync('.tmp', { recursive: true });
for (const phase of ['m6', 'm7']) {
  const suite = fs.readFileSync(`tests/real-backend.${phase}.cjs`, 'utf8')
    .replaceAll(`docs/review-${phase}/test-results/final-backend`, output)
    .replaceAll("require('./helpers/", `require('${root.replaceAll('\\', '/')}/tests/helpers/`);
  fs.writeFileSync(`.tmp/m8-replay-${phase}.cjs`, suite);
}
let source = fs.readFileSync(path.join(__dirname, 'run-isolated-m6.cjs'), 'utf8').replaceAll('review-m6', 'review-m8');
const m8Command = "      command(process.execPath, ['tests/real-backend.m8.cjs'], {...env, MYLIFE_M1_ISOLATED: database, MYLIFE_M1_API_URL: api, MYLIFE_M3_PG_BIN: pgBin, MYLIFE_M3_PG_PORT: String(pgPort), MYLIFE_M3_ADMIN_PASSWORD: runtimeEnv.SeedAdmin__Password, MYLIFE_M3_WEB_ORIGIN: ui, MYLIFE_M3_PROVIDER_CONTROL: runtimeEnv.MYLIFE_M3_PROVIDER_CONTROL}, 'm8-integration', root);";
const m7Command = "      command(process.execPath, ['.tmp/m8-replay-m7.cjs'], {...env, MYLIFE_M1_ISOLATED: database, MYLIFE_M1_API_URL: api, MYLIFE_M3_WEB_ORIGIN: ui, MYLIFE_M3_PROVIDER_CONTROL: runtimeEnv.MYLIFE_M3_PROVIDER_CONTROL}, 'm7-integration', root);";
const marker = 'const compiled = new Module(__filename, module);';
const nestedAddition = `harness = harness.replace("'m6-integration', root);", ${JSON.stringify("'m6-integration', root);\n" + m7Command + '\n' + m8Command)});\n`;
if (!source.includes(marker)) throw Error('Review inherited harness composition');
source = source.replace(marker, `wrapper = wrapper.replace(${JSON.stringify(marker)}, ${JSON.stringify(nestedAddition)} + ${JSON.stringify(marker)});\n${marker}`)
  .replaceAll('tests/fixtures/anniversary-host/AnniversaryContractHost.csproj', 'tests/fixtures/account-host/AccountContractHost.csproj')
  .replaceAll('tests/real-backend.m6.cjs', '.tmp/m8-replay-m6.cjs');
const compiled = new Module(__filename, module); compiled.filename = __filename; compiled.paths = module.paths; compiled._compile(source, __filename);
