// Use the proven fresh-hierarchy helper against only our own QA AVD/runtime.
const fs=require('node:fs'),Module=require('node:module'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'m4-native-ui.cjs'),'utf8').replaceAll('docs/review-m4/test-results/native','docs/review-m5/test-results/native').replaceAll('.tmp/m4-native-user.json','.tmp/m5-native-user.json').replaceAll('rows.slice(0,50)','rows.slice(0,12)');
const compiled=new Module(__filename,module);compiled.filename=__filename;compiled.paths=module.paths;compiled._compile(source,__filename);
