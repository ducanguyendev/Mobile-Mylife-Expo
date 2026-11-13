const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const source = fs.readFileSync(path.join(__dirname, 'revoke-isolated-m4-native.cjs'), 'utf8')
  .replaceAll('m4', 'm6').replaceAll('M4', 'M6');
const compiled = new Module(__filename, module);
compiled.filename = __filename;
compiled.paths = module.paths;
compiled._compile(source, __filename);
