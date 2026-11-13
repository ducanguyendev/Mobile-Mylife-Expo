// Reuse fresh-hierarchy capture and secure-field redaction against the QA AVD.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const source = fs.readFileSync(path.join(__dirname, 'm4-native-ui.cjs'), 'utf8')
  .replaceAll('docs/review-m4/test-results/native', 'docs/review-m6/test-results/native')
  .replaceAll('.tmp/m4-native-user.json', '.tmp/m6-native-user.json')
  .replace("const serial='emulator-5584';", "const serial='127.0.0.1:5585';")
  .replace("['-s',serial,...args]", "['-P','5038','-s',serial,...args]")
  .replace("run('emu','avd','name')", "run('shell','getprop','ro.boot.qemu.avd_name')")
  .replace("const values=node.bounds.match(/\\d+/g).map(Number);", `const values=node.bounds.match(/-?\\d+/g).map(Number);
  if (values[0] < 0 || values[1] < 0 || values[2] <= values[0] || values[3] <= values[1]) throw Error('Scroll the target into view before tapping');`)
  .replace('tap(field);', `tap(field);
  await new Promise(resolve => setTimeout(resolve, 250));
  const focused = nodes(dump()).find(node => node.class === 'android.widget.EditText' && node.focused === 'true');
  if (!focused || focused['content-desc'] !== field['content-desc']) throw Error('Requested text field did not gain focus');`)
  .replace("run('shell','input','text',credential.replaceAll(' ','%s'));", `
  // Physical-key injection in a Modal can reach ReactDelegate's dev-only RR
  // shortcut via Activity.currentFocus. Separate R keys beyond its 200ms window.
  for (const chunk of credential.match(/[^rR]*[rR]|[^rR]+$/g) ?? []) {
    run('shell','input','text',chunk.replaceAll(' ','%s'));
    if (/[rR]$/.test(chunk)) await new Promise(resolve => setTimeout(resolve, 300));
  }`)
  .replaceAll('rows.slice(0,50)', 'rows.slice(0,12)');
const compiled = new Module(__filename, module);
compiled.filename = __filename;
compiled.paths = module.paths;
compiled._compile(source, __filename);
