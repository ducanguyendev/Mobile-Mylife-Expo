// Reuse the M1 isolation/cleanup harness without changing its tests or evidence.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const root = path.resolve(__dirname, '..');
const output = process.argv.includes('--baseline') ? 'docs/review-m2/test-results/baseline-backend' : 'docs/review-m2/test-results/final-backend';
fs.mkdirSync(path.join(root, '.tmp'), { recursive: true });
fs.mkdirSync(path.join(root, output), { recursive: true });
if (process.env.MYLIFE_M2_NATIVE_HOLD === '1') fs.rmSync(path.join(root, '.tmp/m2-native-done'), { force: true });
const replay = path.join(root, '.tmp/m2-m1-replay.cjs');
let suite = fs.readFileSync(path.join(root, 'tests/real-backend.m1.cjs'), 'utf8').replaceAll('\r\n', '\n');
suite = suite.replace("require('./helpers/load-foundation.cjs')", `require(${JSON.stringify(path.join(root, 'tests/helpers/load-foundation.cjs'))})`)
  .replace("const baselineCommit = '7fa3124';", "const baselineCommit = '4cfc4c941eebbbfce8ed2b16671b136aabadd313';")
  .replace('if (baseline) {', "if (process.env.MYLIFE_M2_BASELINE === '1') {")
  .replaceAll('docs/review-m1/test-results', output);
if (suite.includes('docs/review-m1/test-results')) throw new Error('M2 must not overwrite M1 evidence');
fs.writeFileSync(replay, suite);
let harness = fs.readFileSync(path.join(__dirname, 'run-isolated-m1.cjs'), 'utf8').replaceAll('\r\n', '\n');
harness = harness.replaceAll('docs/review-m1/test-results', output).replace("'tests/real-backend.m1.cjs'", "'.tmp/m2-m1-replay.cjs'");
harness = harness.replace("...(baseline ? ['--baseline'] : [])", "...[]")
  .replace('MYLIFE_M1_ISOLATED: database,', "MYLIFE_M2_BASELINE: baseline ? '1' : '0', MYLIFE_M1_ISOLATED: database,");
harness = harness.replace('  } finally {\n    await stop(uiServer);', `
    if (!baseline) {
      command(process.execPath, ['tests/real-backend.m2.cjs'], { ...env, MYLIFE_M1_ISOLATED: database,
        MYLIFE_M1_API_URL: api, MYLIFE_M2_PG_BIN: pgBin, MYLIFE_M2_PG_PORT: String(pgPort),
        MYLIFE_M2_ADMIN_PASSWORD: runtimeEnv.SeedAdmin__Password }, 'm2-home-integration', root);
      if (process.env.MYLIFE_M2_NATIVE_HOLD === '1') {
        const runtimePath = path.join(root, '.tmp/m2-runtime.json');
        fs.writeFileSync(runtimePath, JSON.stringify({ api, pgPort, database, pgBin, adminPassword: runtimeEnv.SeedAdmin__Password }));
        console.log('Disposable native runtime ready; create .tmp/m2-native-done to stop.');
        const deadline = Date.now() + 2 * 60 * 60 * 1000;
        while (!fs.existsSync(path.join(root, '.tmp/m2-native-done')) && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 1000));
        fs.unlinkSync(runtimePath);
      }
    }
  } finally {
    await stop(uiServer);`);
const compiled = new Module(__filename, module);
if (!harness.includes("['tests/real-backend.m2.cjs']") || harness.includes('docs/review-m1/test-results')) throw new Error('M1 harness changed; review M2 replay before running');
compiled.filename = __filename;
compiled.paths = module.paths;
compiled._compile(harness, __filename);
