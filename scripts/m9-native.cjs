// Reuse the bounded M8 ADB helpers on a distinct disposable M9 device/runtime.
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const mode = process.argv.splice(2, 1)[0];
const sourceFiles = { ui: 'm8-native-ui.cjs', login: 'm8-native-login.cjs', seed: 'seed-isolated-m8-native.cjs', uncertainty: 'verify-m8-native-uncertainty.cjs' };
if (!sourceFiles[mode]) throw Error('Choose ui, login, seed or uncertainty.');
let source = fs.readFileSync(path.join(__dirname, sourceFiles[mode]), 'utf8')
  .replaceAll('m8', 'm9').replaceAll('M8', 'M9').replaceAll('5041', '5042').replaceAll('5590', '5592')
  .replaceAll('.tmp/m3-runtime.json', '.tmp/m9-runtime.json')
  .replaceAll("'scripts/m9-native-ui.cjs',", "'scripts/m9-native.cjs', 'ui',");
if (mode === 'login') source = source.replace("USER: ['email', 'newPassword']", "USER: ['email', 'password'], PERF: ['perfEmail', 'perfPassword']").replace("SWITCH: ['switchEmail', 'password']", "SWITCH: ['switchEmail', 'switchPassword']").replace("step('tap', 'Sign in')", "step('reach', 'Sign in')");
if (mode === 'ui') source = source.replaceAll("'swipe', '360'", "'swipe', '650'").replaceAll("'1050', '360'", "'1050', '650'").replaceAll("'1000', '360'", "'1000', '650'").replaceAll("'400', '360'", "'400', '650'")
  .replaceAll('/sdcard/m9-ui.xml', '/data/local/tmp/m9-ui.xml')
  .replace("n.clickable === 'true');", "n.clickable === 'true' && (() => { const b = n.bounds.match(/-?\\d+/g).map(Number); return b[3] - b[1] >= 48; })());");
if (mode === 'seed') source = source.replace('switchEmail, api:', 'switchEmail, switchPassword: password, api:');
if (mode === 'uncertainty') source = source.replace('user.newPassword', 'user.password').replace('Rebuilt development APK with explicit OkHttp retry policy', 'Release-variant internal QA APK with one-shot POST policy');
const compiled = new Module(__filename, module); compiled.filename = __filename; compiled.paths = module.paths; compiled._compile(source, __filename);
