const fs = require('node:fs'), cp = require('node:child_process');
const adb = 'C:/Users/admin/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const run = (...args) => cp.execFileSync(adb, ['-P', '5041', '-s', 'emulator-5590', ...args], { encoding: 'utf8', timeout: 30000, maxBuffer: 32 * 1024 * 1024, windowsHide: true });
const redact = text => text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email redacted]').replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP redacted]').replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[token redacted]');
function nodes(xml) { return [...xml.matchAll(/<node\s+([^>]+)>?/g)].map(match => Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(a => [a[1], a[2].replaceAll('&amp;', '&')]))); }
function dump() { run('shell', 'uiautomator', 'dump', '/sdcard/m8-ui.xml'); const xml = run('shell', 'cat', '/sdcard/m8-ui.xml'); if (!xml.includes('<hierarchy')) throw Error('No fresh hierarchy'); return xml; }
function tap(node) { const b = node.bounds.match(/-?\d+/g).map(Number); if (b[0] < 0 || b[1] < 0 || b[2] <= b[0] || b[3] <= b[1]) throw Error('Target outside viewport'); run('shell', 'input', 'tap', String(Math.round((b[0] + b[2]) / 2)), String(Math.round((b[1] + b[3]) / 2))); }
async function main() {
  if (run('shell', 'getprop', 'ro.boot.qemu.avd_name').trim() !== 'MyLife_M8') throw Error('Dedicated M8 AVD required');
  const [action, arg, value, evidence] = process.argv.slice(2);
  if (action === 'tap' || action === 'reach') {
    let clicked = false;
    for (let attempt = 0; attempt < 6; attempt++) {
      const found = nodes(dump()).filter(n => n.text === arg || n['content-desc'] === arg);
      const clickable = found.filter(n => n.clickable === 'true');
      const choices = clickable;
      if (choices.length > 1) throw Error('Ambiguous target');
      if (choices.length === 1 && choices[0].enabled !== 'false') { tap(choices[0]); clicked = true; break; }
      if (action === 'tap') throw Error('Target missing or disabled');
      run('shell', 'input', 'swipe', '360', '1000', '360', '400', '450');
    }
    if (!clicked) throw Error('Target outside reachable viewport');
  }
  else if (action === 'fill') {
    const fields = nodes(dump()).filter(n => n.class === 'android.widget.EditText');
    const field = /^\d+$/.test(arg) ? fields[Number(arg)] : fields.find(n => n['content-desc'] === arg);
    if (!field) throw Error('Field missing'); tap(field);
    await new Promise(resolve => setTimeout(resolve, 250)); const focused = nodes(dump()).find(n => n.class === 'android.widget.EditText' && n.focused === 'true'); if (!focused || focused['content-desc'] !== field['content-desc']) throw Error('Field focus changed; inspect before typing');
    run('shell', 'input', 'keycombination', '113', '29');
    run('shell', 'input', 'keyevent', '67');
    const credentials = JSON.parse(fs.readFileSync('.tmp/m8-native-user.json', 'utf8')); const entered = credentials[value] ?? value;
    for (const chunk of entered.match(/[^rR]*[rR]|[^rR]+$/g) ?? []) { run('shell', 'input', 'text', chunk.replaceAll(' ', '%s')); if (/[rR]$/.test(chunk)) await new Promise(resolve => setTimeout(resolve, 300)); }
  } else if (action === 'back') run('shell', 'input', 'keyevent', '4');
  else if (action === 'hide-keyboard') { if (/mInputShown=true|mIsInputViewShown=true/.test(run('shell', 'dumpsys', 'input_method'))) run('shell', 'input', 'keyevent', '4'); }
  else if (action === 'scroll') run('shell', 'input', 'swipe', '360', '1050', '360', '400', '450');
  else if (action === 'scroll-up') run('shell', 'input', 'swipe', '360', '400', '360', '1050', '450');
  else if (action === 'pick') { const photo = nodes(dump()).find(n => n.clickable === 'true' && n['content-desc']?.startsWith('Photo taken on')); if (!photo) throw Error('Synthetic photo missing'); tap(photo); }
  else if (action !== 'snapshot') throw Error('Unknown action');
  await new Promise(resolve => setTimeout(resolve, 600));
  const raw = dump(); const safe = redact(raw.replace(/<node\s+[^>]*password="true"[^>]*>/g, tag => tag.replace(/text="[^"]*"/, 'text="[password redacted]"')));
  const name = (evidence || value || arg || 'snapshot').replace(/[^a-zA-Z0-9_-]/g, '_');
  const output = 'docs/review-m8/test-results/native'; fs.mkdirSync(output, { recursive: true }); fs.writeFileSync(`${output}/${name}.xml`, safe);
  const png = cp.execFileSync(adb, ['-P', '5041', '-s', 'emulator-5590', 'exec-out', 'screencap', '-p'], { maxBuffer: 16 * 1024 * 1024, windowsHide: true }); fs.writeFileSync('.tmp/m8-current.png', png);
  if (!/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\b(?:\d{1,3}\.){3}\d{1,3}\b/i.test(raw) && !nodes(raw).some(n => n.class === 'android.widget.EditText' && n.text)) fs.writeFileSync(`${output}/${name}.png`, png);
  console.log(JSON.stringify([...new Set(nodes(safe).filter(n => n.text || n['content-desc']).map(n => n['content-desc'] || n.text))]));
}
main().catch(() => { console.error('M8 native action failed. Inspect the current device state before retrying.'); process.exitCode = 1; });
