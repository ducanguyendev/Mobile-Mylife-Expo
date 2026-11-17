const fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
let source = fs.readFileSync(path.join(__dirname, 'run-backend-suite-m8.cjs'), 'utf8')
  .replaceAll('review-m8', 'review-m9').replaceAll('m8-backend-unit-output', 'm9-backend-unit-output');
if (process.argv.includes('--profile-admin')) source = source.replace("if (process.argv.includes('--anniversary'))", "source = source.replace(\"'test','Tests/Backend-MyLife.Tests.csproj'\", \"'test','Tests/Backend-MyLife.Tests.csproj','--filter','FullyQualifiedName~ProfileUpdateContractTests|FullyQualifiedName~Admin|FullyQualifiedName~DatabaseConflict'\").replaceAll('review-m9/test-results/', 'review-m9/test-results/targeted/');\nif (process.argv.includes('--anniversary'))");
const compiled = new Module(__filename, module); compiled.filename = __filename; compiled.paths = module.paths; compiled._compile(source, __filename);
