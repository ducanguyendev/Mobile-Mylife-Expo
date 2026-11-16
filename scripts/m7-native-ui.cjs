// Android-only UI automation against the explicitly disposable QA AVD.
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
let source = fs.readFileSync(path.join(__dirname, 'm6-native-ui.cjs'), 'utf8');
source = source.replaceAll('review-m6', 'review-m7').replaceAll('.tmp/m6-native-user.json', '.tmp/m7-native-user.json').replaceAll('127.0.0.1:5585', '127.0.0.1:5587').replaceAll("'5038'", "'5039'");
// m6 composes m4 source; update its AVD guard after that composition.
const scroll = "else if(action==='scroll')run('shell','input','swipe','640','1000','640','400','450'); else if(action==='pick'){const photo=nodes(dump()).filter(n=>n.clickable==='true'&&n['content-desc'].startsWith('Photo taken on'))[Number(arg)];if(!photo)throw Error('Photo not visible');tap(photo);} else if(action!=='snapshot')";
source = source.replace('const compiled = new Module', `const checked = source.replace("includes('MyLife_M4')", "includes('MyLife_M7')").replace(${JSON.stringify("else if(action!=='snapshot')")}, ${JSON.stringify(scroll)});\nconst compiled = new Module`).replace('compiled._compile(source, __filename)', 'compiled._compile(checked, __filename)');
const compiled = new Module(__filename, module); compiled.filename = __filename; compiled.paths = module.paths; compiled._compile(source, __filename);
