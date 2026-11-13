// Run the established disposable full-suite wrapper with M6 evidence destinations.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const source = fs.readFileSync(path.join(__dirname, 'run-backend-suite-m5.cjs'), 'utf8')
  .replaceAll('docs/review-m5/', 'docs/review-m6/');
const compiled = new Module(__filename, module);
compiled.filename = __filename;
compiled.paths = module.paths;
compiled._compile(source, __filename);
