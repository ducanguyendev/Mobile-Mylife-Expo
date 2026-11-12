// Replay unchanged M1–M4 suites into M5 evidence, then add real Timeline cases.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=path.resolve(__dirname,'..');const out='docs/review-m5/test-results/final-backend';fs.mkdirSync(path.join(root,out),{recursive:true});
let m4=fs.readFileSync(path.join(root,'tests/real-backend.m4.cjs'),'utf8').replaceAll('\r\n','\n')
 .replaceAll('docs/review-m4/test-results/final-backend',out)
 .replace("require('./helpers/load-m3.cjs')",`require(${JSON.stringify(path.join(root,'tests/helpers/load-m3.cjs'))})`);
fs.writeFileSync(path.join(root,'.tmp/m5-replay-m4.cjs'),m4);
let wrapper=fs.readFileSync(path.join(__dirname,'run-isolated-m4.cjs'),'utf8').replaceAll('\r\n','\n')
 .replaceAll('docs/review-m4/test-results/', 'docs/review-m5/test-results/')
 .replaceAll('tests/real-backend.m4.cjs','.tmp/m5-replay-m4.cjs');
const addition=`harness = harness.replace("'m4-integration', root);", "'m4-integration', root);\\n      command(process.execPath, ['tests/real-backend.m5.cjs'], {...env, MYLIFE_M1_ISOLATED: database, MYLIFE_M1_API_URL: api, MYLIFE_M3_ADMIN_PASSWORD: runtimeEnv.SeedAdmin__Password, MYLIFE_M3_WEB_ORIGIN: ui}, 'm5-integration', root);");\n`;
if(!wrapper.includes('const compiled = new Module'))throw Error('Review M4 harness before replay');
wrapper=wrapper.replace('const compiled = new Module',addition+'const compiled = new Module');
const compiled=new Module(__filename,module);compiled.filename=__filename;compiled.paths=module.paths;compiled._compile(wrapper,__filename);
