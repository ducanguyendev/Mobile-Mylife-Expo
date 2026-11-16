const fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
let source = fs.readFileSync(path.join(__dirname, 'run-backend-suite-m5.cjs'), 'utf8').replaceAll('review-m5', 'review-m8');
// A held Kestrel process locks its DLL on Windows. Keep the independent unit
// suite's outputs separate from the native test host's running binaries.
const outputArgument = '-p:OutDir=' + path.resolve(__dirname, '../.tmp/m8-backend-unit-output').replaceAll('\\', '/') + '/';
source = source.replace("'--no-restore','-p:UseAppHost=false'", "'--no-restore','-p:UseAppHost=false'," + JSON.stringify(outputArgument));
if (process.argv.includes('--anniversary')) source = source.replace("'test','Tests/Backend-MyLife.Tests.csproj'", "'test','Tests/Backend-MyLife.Tests.csproj','--filter','FullyQualifiedName~AnniversaryDateIntegrityTests'").replaceAll('review-m8/test-results/', 'review-m8/test-results/anniversary-targeted/');
const compiled = new Module(__filename, module); compiled.filename = __filename; compiled.paths = module.paths; compiled._compile(source, __filename);
