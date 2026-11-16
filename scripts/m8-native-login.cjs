const fs = require('node:fs'), cp = require('node:child_process'), assert = require('node:assert/strict');
const mode = process.argv[2];
const keys = { USER: ['email', 'newPassword'], ADMIN: ['adminEmail', 'adminPassword'], SWITCH: ['switchEmail', 'password'], DEMOTED: ['adminEmail', 'adminPassword'] }[mode];
if (!keys) throw Error('Choose a synthetic M8 account role');
let index = Number(process.argv[3] ?? 300);
function step(action, arg = '', value = '') {
  const evidence = `${index++}-${mode.toLowerCase()}-login`;
  const result = cp.execFileSync(process.execPath, ['scripts/m8-native-ui.cjs', action, arg, value, evidence], { encoding: 'utf8', windowsHide: true, timeout: 45000 });
  return JSON.parse(result.trim().split(/\r?\n/).at(-1));
}
function waitFor(accept) { for (let attempt = 0; attempt < 12; attempt++) { const labels = step('snapshot'); if (accept(labels)) return labels; } throw Error('Synthetic native login did not reach the expected screen'); }
try {
  waitFor(labels => labels.includes('Sign in'));
  step('fill', 'Email', keys[0]); step('hide-keyboard');
  step('fill', 'Password', keys[1]); step('hide-keyboard'); step('tap', 'Sign in');
  const labels = waitFor(labels => mode === 'ADMIN' ? labels.includes('Admin Console') : labels.some(label => label.startsWith('Good morning') || label.startsWith('Good afternoon') || label.startsWith('Good evening')));
  if (mode === 'ADMIN') assert.ok(!labels.includes('Family') && !labels.includes('Memories'));
  if (mode === 'DEMOTED') assert.ok(labels.includes('Family') && labels.includes('Memories') && !labels.includes('Admin Console'));
  const result = { mode, status: 'PASS', normalNativeLogin: true, evidenceThrough: index - 1 };
  fs.writeFileSync(`docs/review-m8/test-results/native/login-${mode.toLowerCase()}.json`, JSON.stringify(result, null, 2)); console.log(JSON.stringify(result));
} catch { console.error('Synthetic native login verification failed. Inspect the latest redacted hierarchy.'); process.exitCode = 1; }
