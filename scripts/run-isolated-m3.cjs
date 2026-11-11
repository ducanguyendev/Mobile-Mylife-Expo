// M1 isolation/cleanup, unchanged M1/M2 assertions, separate M3 evidence.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const root = path.resolve(__dirname, '..');
const baseline = process.argv.includes('--baseline');
const output = `docs/review-m3/test-results/${baseline ? 'baseline' : 'final'}-backend`;
fs.mkdirSync(path.join(root, output), { recursive: true });
fs.mkdirSync(path.join(root, '.tmp'), { recursive: true });
if (process.env.MYLIFE_M3_NATIVE_HOLD === '1') fs.rmSync(path.join(root, '.tmp/m3-native-done'), { force: true });
const helper = JSON.stringify(path.join(root, 'tests/helpers/load-foundation.cjs'));
for (const version of ['m1', 'm2']) {
  let suite = fs.readFileSync(path.join(root, `tests/real-backend.${version}.cjs`), 'utf8').replaceAll('\r\n', '\n');
  suite = suite.replace("require('./helpers/load-foundation.cjs')", `require(${helper})`)
    .replaceAll('docs/review-m1/test-results', output).replaceAll('docs/review-m2/test-results/final-backend', output);
  if (/docs\/review-m[12]\/test-results/.test(suite)) throw new Error('Do not overwrite existing evidence');
  fs.writeFileSync(path.join(root, `.tmp/m3-replay-${version}.cjs`), suite);
}
let harness = fs.readFileSync(path.join(__dirname, 'run-isolated-m1.cjs'), 'utf8').replaceAll('\r\n', '\n');
harness = harness.replaceAll('docs/review-m1/test-results', output)
  .replace("'tests/real-backend.m1.cjs'", "'.tmp/m3-replay-m1.cjs'")
  .replace("...(baseline ? ['--baseline'] : [])", '...[]');
harness = harness.replace("    apiServer = await start('dotnet',", `
    if (!baseline) {
      const hostOutput = path.join(root, '.tmp/m3-avatar-host');
      const control = path.join(root, '.tmp/m3-avatar-provider-control.json');
      const trace = path.join(root, '.tmp/m3-avatar-provider.ndjson');
      fs.writeFileSync(control, '{}'); fs.writeFileSync(trace, '');
      command('dotnet', ['build', path.join(root, 'tests/fixtures/avatar-host/AvatarContractHost.csproj'), '-c', 'Release', '-o', hostOutput,
        '-p:BaseIntermediateOutputPath=' + path.join(root, '.tmp/m3-avatar-host-obj/').replaceAll('\\\\', '/')], env, 'avatar-contract-host-build', root);
      Object.assign(runtimeEnv, { DOTNET_STARTUP_HOOKS: path.join(hostOutput, 'M3AvatarContractHost.dll'),
        ASPNETCORE_HOSTINGSTARTUPASSEMBLIES: 'M3AvatarContractHost', MYLIFE_M3_CONTRACT_PROVIDER: '1',
        MYLIFE_M3_PROVIDER_CONTROL: control, MYLIFE_M3_PROVIDER_TRACE: trace,
        GoogleDrive__WebAppUrl: 'http://m3-avatar-contract.invalid/provider', RateLimits__Upload__PermitLimit: '1000' });
    }
    apiServer = await start('dotnet',`);
harness = harness.replace('  } finally {\n    await stop(uiServer);', `
    command(process.execPath, ['.tmp/m3-replay-m2.cjs'], { ...env, MYLIFE_M1_ISOLATED: database,
      MYLIFE_M1_API_URL: api, MYLIFE_M2_PG_BIN: pgBin, MYLIFE_M2_PG_PORT: String(pgPort),
      MYLIFE_M2_ADMIN_PASSWORD: runtimeEnv.SeedAdmin__Password }, 'm2-integration', root);
    if (!baseline) {
      command(process.execPath, ['tests/real-backend.m3.cjs'], { ...env, MYLIFE_M1_ISOLATED: database,
        MYLIFE_M1_API_URL: api, MYLIFE_M3_PG_BIN: pgBin, MYLIFE_M3_PG_PORT: String(pgPort),
        MYLIFE_M3_ADMIN_PASSWORD: runtimeEnv.SeedAdmin__Password, MYLIFE_M3_WEB_ORIGIN: ui,
        MYLIFE_M3_PROVIDER_CONTROL: runtimeEnv.MYLIFE_M3_PROVIDER_CONTROL, MYLIFE_M3_PROVIDER_TRACE: runtimeEnv.MYLIFE_M3_PROVIDER_TRACE }, 'm3-integration', root);
      if (process.env.MYLIFE_M3_NATIVE_HOLD === '1') {
        const runtimeFile = path.join(root, '.tmp/m3-runtime.json');
        fs.writeFileSync(runtimeFile, JSON.stringify({ api, pgPort, database, pgBin, adminEmail: 'm1.admin@gmail.com', adminPassword: runtimeEnv.SeedAdmin__Password,
          providerControl: runtimeEnv.MYLIFE_M3_PROVIDER_CONTROL, providerTrace: runtimeEnv.MYLIFE_M3_PROVIDER_TRACE }));
        console.log('M3 disposable native runtime ready. Create .tmp/m3-native-done to stop.');
        const deadline = Date.now() + 3 * 60 * 60 * 1000;
        while (!fs.existsSync(path.join(root, '.tmp/m3-native-done')) && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 1000));
        fs.rmSync(runtimeFile, { force: true });
      }
    }
  } finally {
    await stop(uiServer);`);
if (!harness.includes("['tests/real-backend.m3.cjs']") || !harness.includes('M3AvatarContractHost.dll') || /docs\/review-m[12]\/test-results/.test(harness)) throw new Error('Review changed M1 harness before replay');
const compiled = new Module(__filename, module);
compiled.filename = __filename;
compiled.paths = module.paths;
compiled._compile(harness, __filename);
