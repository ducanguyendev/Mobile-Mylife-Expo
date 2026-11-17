const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const root = path.resolve(__dirname, '..'), output = path.join(root, 'docs/review-m9/test-results');
fs.mkdirSync(output, { recursive: true });
const baseline = process.argv.includes('--baseline');
const scripts = ['lint', 'typecheck', 'test:auth', 'test:foundation', ...[2,3,4,5,6,7,8, ...(baseline ? [] : [9])].map(n => `test:m${n}`), 'audit:contrast:m2'];
const results = [];
for (const script of scripts) {
  const log = path.join(output, `${baseline ? 'baseline' : 'final'}-${script.replaceAll(':', '-')}.log`);
  const fd = fs.openSync(log, 'w');
  const result = cp.spawnSync(process.execPath, [path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'), 'run', script], { cwd: root, windowsHide: true, stdio: ['ignore', fd, fd] });
  fs.closeSync(fd); results.push({ command: 'npm run ' + script, exitCode: result.status ?? 1, log: path.relative(root, log) });
  console.log(`${script} ${result.status}`);
}
fs.copyFileSync(path.join(root, 'docs/review-m2/test-results/contrast.json'), path.join(output, `${baseline ? 'baseline' : 'final'}-contrast.json`));
fs.writeFileSync(path.join(root, 'docs/review-m2/test-results/contrast.json'), cp.execFileSync('git', ['show', 'HEAD:docs/review-m2/test-results/contrast.json'], { cwd: root }));
fs.writeFileSync(path.join(output, `${baseline ? 'baseline' : 'final'}-quality.json`), JSON.stringify(results, null, 2));
if (results.some(r => r.exitCode)) process.exitCode = 1;
