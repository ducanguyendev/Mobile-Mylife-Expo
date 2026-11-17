const cp = require('node:child_process'), fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..');
const files = [...new Set(cp.execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8', windowsHide: true }).split('\0').filter(Boolean))];
const rules = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['github-token', /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,})/],
  ['aws-access-key', /(?:AKIA|ASIA)[A-Z0-9]{16}/],
  ['jwt-literal', /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{16,}/],
  ['provider-deployment', /https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{40,}\/exec/],
];
const findings = []; let scanned = 0;
for (const file of files) {
  if (!/\.(?:[cm]?js|jsx|ts|tsx|json|ya?ml|md|xml|log|txt|trx|cs|gradle|properties)$/.test(file)) continue;
  const target = path.resolve(root, file); if (!target.startsWith(root + path.sep) || !fs.existsSync(target)) continue;
  const buffer = fs.readFileSync(target); if (buffer.length > 20 * 1024 * 1024) continue;
  const text = buffer.toString(buffer[0] === 255 && buffer[1] === 254 ? 'utf16le' : 'utf8'); scanned++;
  for (const [index, line] of text.split(/\r?\n/).entries()) for (const [rule, pattern] of rules) if (pattern.test(line)) findings.push({ file, line: index + 1, rule });
}
const report = { scannedTextFiles: scanned, findings, scope: 'Current tracked and nonignored worktree text. Patterns do not establish absence of all secrets or inspect image pixels.', testFixtures: 'Existing deterministic synthetic passwords and test-only signing constants require human context; no production credentials authorized.' };
if (process.argv.includes('--evidence')) {
  fs.mkdirSync(path.join(root, 'docs/review-m9/test-results'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs/review-m9/test-results/source-secret-scan.json'), JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report)); if (findings.length) process.exitCode = 1;
