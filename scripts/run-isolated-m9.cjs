// Reuse M1's cluster/process lifecycle; copy assertions only to isolate evidence.
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const runId = require('node:crypto').randomBytes(6).toString('hex');
const root = path.resolve(__dirname, '..'), output = `docs/review-m9/test-results/${process.argv.includes('--native-only') ? 'native-backend' : process.argv.includes('--m9-only') ? 'targeted-http' : 'final-http'}`;
const runRoot = path.join(root, '.tmp', `m9-run-${runId}`); fs.mkdirSync(runRoot, { recursive: true });
const clockRelative = `.tmp/m9-${runId}-calendar-clock.json`;
fs.mkdirSync(output, { recursive: true }); fs.mkdirSync('.tmp', { recursive: true });
const versions = process.argv.includes('--native-only') ? [] : process.argv.includes('--m9-only') ? [9] : [1,2,3,4,5,6,7,9,8];
for (const version of versions) {
  const suite = fs.readFileSync(`tests/real-backend.m${version}.cjs`, 'utf8')
    .replace(/docs\/review-m\d+\/test-results(?:\/(?:final-backend|final-http))?/g, output)
    .replaceAll('.tmp/m6-calendar-clock.json', clockRelative)
    .replaceAll("require('./helpers/", `require('${root.replaceAll('\\', '/')}/tests/helpers/`);
  fs.writeFileSync(`.tmp/m9-replay-m${version}.cjs`, suite);
}
for (const name of ['enable', 'enabled', 'started', 'release', 'returned']) fs.rmSync(path.join(runRoot, `m4-geocoder-${name}`), { force: true });
const clock = path.join(root, clockRelative); fs.writeFileSync(clock, '{}');
const control = path.join(runRoot, 'provider-control.json'), trace = path.join(runRoot, 'provider.ndjson');
fs.writeFileSync(control, '{}'); fs.writeFileSync(trace, ''); fs.rmSync('.tmp/m9-native-done', { force: true });
let harness = fs.readFileSync(path.join(__dirname, 'run-isolated-m1.cjs'), 'utf8').replaceAll('\r\n', '\n')
  .replaceAll('docs/review-m1/test-results', output)
  .replace("    apiServer = await start('dotnet',", `
    const hostOutput = path.join(root, '.tmp', database + '-contract-host');
    command('dotnet', ['build', path.join(root, 'tests/fixtures/account-host/AccountContractHost.csproj'), '-c', 'Release', '-o', hostOutput], env, 'adapter-host-build', root);
    Object.assign(runtimeEnv, { DOTNET_STARTUP_HOOKS: path.join(hostOutput, 'M3AvatarContractHost.dll'), ASPNETCORE_HOSTINGSTARTUPASSEMBLIES: 'M3AvatarContractHost',
      MYLIFE_M3_CONTRACT_PROVIDER: '1', MYLIFE_M3_PROVIDER_CONTROL: ${JSON.stringify(control)}, MYLIFE_M3_PROVIDER_TRACE: ${JSON.stringify(trace)}, MYLIFE_M6_CLOCK_FILE: ${JSON.stringify(clock)},
      GoogleDrive__WebAppUrl: 'http://m3-avatar-contract.invalid/provider', RateLimits__Upload__PermitLimit: '10000' });
    apiServer = await start('dotnet',`);
const begin = harness.indexOf("    command(process.execPath, ['tests/real-backend.m1.cjs'");
const end = harness.indexOf('  } finally {', begin);
if (begin < 0 || end < 0) throw Error('Review inherited isolation harness.');
const commands = versions.map(version => `    command(process.execPath, ['.tmp/m9-replay-m${version}.cjs'], { ...env, MYLIFE_M1_ISOLATED: database, MYLIFE_M1_API_URL: api,
      MYLIFE_M1_ADMIN_PASSWORD: runtimeEnv.SeedAdmin__Password, MYLIFE_M2_ADMIN_PASSWORD: runtimeEnv.SeedAdmin__Password, MYLIFE_M3_ADMIN_PASSWORD: runtimeEnv.SeedAdmin__Password,
      MYLIFE_M2_PG_BIN: pgBin, MYLIFE_M2_PG_PORT: String(pgPort), MYLIFE_M3_PG_BIN: pgBin, MYLIFE_M3_PG_PORT: String(pgPort), MYLIFE_M3_WEB_ORIGIN: ui,
      MYLIFE_M3_PROVIDER_CONTROL: runtimeEnv.MYLIFE_M3_PROVIDER_CONTROL, MYLIFE_M3_PROVIDER_TRACE: runtimeEnv.MYLIFE_M3_PROVIDER_TRACE, MYLIFE_M6_CLOCK_FILE: ${JSON.stringify(clock)} }, 'm${version}-integration', root);`).join('\n');
harness = harness.slice(0, begin) + commands + `
    fs.copyFileSync(${JSON.stringify(trace)}, path.join(output, 'provider-events.ndjson'));
    if (process.env.MYLIFE_M9_NATIVE_HOLD === '1') {
      const runtimeFile = path.join(root, '.tmp/m9-runtime.json');
      fs.writeFileSync(runtimeFile, JSON.stringify({ api, pgPort, database, pgBin, adminEmail: 'm1.admin@gmail.com', adminPassword: runtimeEnv.SeedAdmin__Password,
        providerControl: runtimeEnv.MYLIFE_M3_PROVIDER_CONTROL, providerTrace: runtimeEnv.MYLIFE_M3_PROVIDER_TRACE }));
      console.log('M9 disposable native runtime ready. Create .tmp/m9-native-done to stop.');
      const deadline = Date.now() + 4 * 60 * 60 * 1000;
      while (!fs.existsSync(path.join(root, '.tmp/m9-native-done')) && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 1000));
      fs.rmSync(runtimeFile, { force: true });
    }
` + harness.slice(end);
const compiled = new Module(__filename, module); compiled.filename = __filename; compiled.paths = module.paths; compiled._compile(harness, __filename);
