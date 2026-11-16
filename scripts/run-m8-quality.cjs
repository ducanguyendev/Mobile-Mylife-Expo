const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'docs/review-m8/test-results');
fs.mkdirSync(output, { recursive: true });
const baseline = process.argv.includes('--baseline');
const scripts = ['lint', 'typecheck', 'test:auth', 'test:foundation', 'test:m2', 'test:m3', 'test:m4', 'test:m5', 'test:m6', 'test:m7', ...(baseline ? [] : ['test:m8']), 'audit:contrast:m2'];
const results = [];
for (const script of scripts) {
  const log = path.join(output, `${baseline ? 'baseline' : 'final'}-${script.replaceAll(':', '-')}.log`);
  const fd = fs.openSync(log, 'w');
  const result = cp.spawnSync(process.execPath, [path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'), 'run', script], { cwd: root, windowsHide: true, stdio: ['ignore', fd, fd] });
  fs.closeSync(fd);
  results.push({ command: 'npm run ' + script, exitCode: result.status ?? 1, log: path.relative(root, log) });
  console.log(script + ' ' + result.status);
}
fs.writeFileSync(path.join(output, `${baseline ? 'baseline' : 'final'}-quality.json`), JSON.stringify(results, null, 2));
if (results.some(r => r.exitCode)) process.exitCode = 1;
