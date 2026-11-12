const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const source=fs.readFileSync(path.join(__dirname,'revoke-isolated-m4-native.cjs'),'utf8').replaceAll('m4','m5').replaceAll('M4','M5');
const compiled=new Module(__filename,module);compiled.filename=__filename;compiled.paths=module.paths;compiled._compile(source,__filename);
