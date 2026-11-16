const fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
let source = fs.readFileSync(path.join(__dirname, 'run-backend-suite-m5.cjs'), 'utf8').replaceAll('review-m5', 'review-m7');
if (process.argv.includes('--anniversary')) source = source.replace("'test','Tests/Backend-MyLife.Tests.csproj'", "'test','Tests/Backend-MyLife.Tests.csproj','--filter','FullyQualifiedName~AnniversaryDateIntegrityTests'").replaceAll('review-m7/test-results/', 'review-m7/test-results/anniversary-targeted/');
const compiled = new Module(__filename, module); compiled.filename = __filename; compiled.paths = module.paths; compiled._compile(source, __filename);
