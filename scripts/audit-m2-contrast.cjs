const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const { createLoader } = require('../tests/helpers/load-foundation.cjs');
const original = spawnSync('git', ['show', '4cfc4c941eebbbfce8ed2b16671b136aabadd313:src/design-system/tokens.ts'], { encoding: 'utf8' });
if (original.status !== 0) throw Error('M1 baseline required');
const before = createLoader({}, {}, { 'src/design-system/tokens.ts': original.stdout })('src/design-system/tokens.ts').palettes;
const after = createLoader()('src/design-system/tokens.ts').palettes;
function luminance(hex) {
  const values = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return .2126 * values[0] + .7152 * values[1] + .0722 * values[2];
}
function ratio(a, b) { const values = [luminance(a), luminance(b)].sort((a, b) => b - a); return (values[0] + .05) / (values[1] + .05); }
const pairs = [['textPrimary', 'surface', 4.5], ['textSecondary', 'surface', 4.5], ['textTertiary', 'surface', 4.5], ['onAccent', 'accentFamily', 4.5], ['onAccentMuted', 'accentFamily', 4.5], ['error', 'surface', 4.5], ['controlBorder', 'surfaceElevated', 3]];
const results = Object.keys(after).flatMap(mode => pairs.map(([fg, bg, threshold]) => ({ mode, foreground: fg, background: bg, threshold, before: +ratio(before[mode][fg === 'controlBorder' ? 'border' : fg], before[mode][bg]).toFixed(3), after: +ratio(after[mode][fg], after[mode][bg]).toFixed(3), pass: ratio(after[mode][fg], after[mode][bg]) >= threshold })));
fs.writeFileSync('docs/review-m2/test-results/contrast.json', JSON.stringify({ method: 'WCAG sRGB relative luminance; essential control boundary replaces decorative border in relevant usages', results, decorativeBorders: Object.keys(after).map(mode => ({ mode, ratio: +ratio(after[mode].border, after[mode].surfaceElevated).toFixed(3), threshold: null, reason: 'Cards/dividers are decorative; not the control identification mechanism' })) }, null, 2));
console.log(results); if (results.some(result => !result.pass)) process.exitCode = 1;
