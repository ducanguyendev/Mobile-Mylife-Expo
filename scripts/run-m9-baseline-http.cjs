const fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const root = path.resolve(__dirname, '..'); fs.mkdirSync('.tmp', { recursive: true });
fs.writeFileSync('.tmp/m9-baseline-m8.cjs', fs.readFileSync('tests/real-backend.m8.cjs', 'utf8')
  .replaceAll('docs/review-m8/test-results/final-backend', 'docs/review-m9/test-results/baseline-http')
  .replaceAll("require('./helpers/", `require('${root.replaceAll('\\', '/')}/tests/helpers/`));
const source = fs.readFileSync(path.join(__dirname, 'run-isolated-m8.cjs'), 'utf8')
  .replaceAll('review-m8/test-results/final-backend', 'review-m9/test-results/baseline-http')
  .replace(".replaceAll('review-m6', 'review-m8')", ".replaceAll('review-m6/test-results/final-backend', 'review-m9/test-results/baseline-http').replaceAll('review-m6/test-results', 'review-m9/test-results/baseline-http')")
  .replace("['tests/real-backend.m8.cjs']", "['.tmp/m9-baseline-m8.cjs']");
const compiled = new Module(__filename, module); compiled.filename = __filename; compiled.paths = module.paths; compiled._compile(source, __filename);
