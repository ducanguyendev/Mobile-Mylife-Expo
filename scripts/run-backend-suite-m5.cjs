// Full existing Backend tests in a new isolated PostgreSQL cluster/database.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const original=fs.readFileSync(path.join(__dirname,'run-isolated-m1.cjs'),'utf8').replaceAll('\r\n','\n');
const begin=original.indexOf("    command('dotnet', ['build'");const end=original.indexOf('  } finally {',begin);
if(begin<0||end<0)throw Error('Review original isolated harness');
// Existing MyLifeFactory replaces the geocoder with TestGeocodingService. Keep
// its queue enabled so the unchanged integration cases can exercise that stub.
let source=original.slice(0,begin)+`    command('dotnet', ['test','Tests/Backend-MyLife.Tests.csproj','-c','Release','--no-restore','-p:UseAppHost=false','--logger','trx;LogFileName=backend-full-isolated.trx','--results-directory',path.join(root,'docs/review-m5/test-results/backend-unit')], {...env,Geocoding__Enabled:'true',Geocoding__VietMapEnabled:'false',VietMap__ApiKey:'',VIETMAP_API_KEY:''},'full-backend-tests');\n`+original.slice(end);
source=source.replaceAll('docs/review-m1/test-results','docs/review-m5/test-results/backend-suite');
fs.mkdirSync(path.join(__dirname,'../docs/review-m5/test-results/backend-suite'),{recursive:true});
const compiled=new Module(__filename,module);compiled.filename=__filename;compiled.paths=module.paths;compiled._compile(source,__filename);
