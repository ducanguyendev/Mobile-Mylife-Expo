// Compose the established M1–M6 disposable harness without editing inherited suites.
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const root = path.resolve(__dirname, '..');
let source = fs.readFileSync(path.join(__dirname, 'run-isolated-m6.cjs'), 'utf8').replaceAll('review-m6', 'review-m7');
const marker = 'const compiled = new Module(__filename, module);';
if (!source.includes(marker)) throw Error('Inherited harness changed; review composition');
const command = "      command(process.execPath, ['tests/real-backend.m7.cjs'], {...env, MYLIFE_M1_ISOLATED: database, MYLIFE_M1_API_URL: api, MYLIFE_M3_WEB_ORIGIN: ui, MYLIFE_M3_PROVIDER_CONTROL: runtimeEnv.MYLIFE_M3_PROVIDER_CONTROL}, 'm7-integration', root);";
const nestedAddition = `harness = harness.replace("'m6-integration', root);", ${JSON.stringify("'m6-integration', root);\n" + command)});\n`;
source = source.replace(marker, `wrapper = wrapper.replace(${JSON.stringify(marker)}, ${JSON.stringify(nestedAddition)} + ${JSON.stringify(marker)});\n${marker}`);
// The project replacement lives inside an escaped generated string in M6.
source = source.replaceAll('tests/fixtures/anniversary-host/AnniversaryContractHost.csproj', 'tests/fixtures/library-host/LibraryContractHost.csproj');
const compiled = new Module(__filename, module); compiled.filename = __filename; compiled.paths = module.paths; compiled._compile(source, __filename);
